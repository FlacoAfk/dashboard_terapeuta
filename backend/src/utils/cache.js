const { createClient } = require('redis');

let redisClient = null;
let redisReady = false;
let redisErrorLogged = false;

function isRedisCacheEnabled() {
    return process.env.REDIS_CACHE_ENABLED !== 'false';
}

function buildRedisUrl() {
    if (process.env.REDIS_URL) return process.env.REDIS_URL;

    const host = process.env.REDIS_HOST || '127.0.0.1';
    const port = process.env.REDIS_PORT || '6379';
    const db = process.env.REDIS_DB || '0';
    const password = process.env.REDIS_PASSWORD;

    const authSegment = password ? `:${encodeURIComponent(password)}@` : '';
    return `redis://${authSegment}${host}:${port}/${db}`;
}

async function initializeRedis() {
    if (!isRedisCacheEnabled()) {
        console.log('🟡 Redis cache desactivado por configuración (REDIS_CACHE_ENABLED=false)');
        return false;
    }

    if (redisClient && redisReady) {
        return true;
    }

    try {
        redisClient = createClient({
            url: buildRedisUrl(),
            socket: {
                connectTimeout: Number(process.env.REDIS_CONNECT_TIMEOUT_MS || 3000),
                reconnectStrategy: (retries) => {
                    if (retries >= 5) {
                        return false;
                    }

                    return Math.min(retries * 200, 1000);
                }
            }
        });

        redisClient.on('error', (error) => {
            redisReady = false;
            if (!redisErrorLogged) {
                console.warn('⚠️ Redis cache no disponible:', error.message);
                redisErrorLogged = true;
            }
        });

        redisClient.on('ready', () => {
            redisReady = true;
            redisErrorLogged = false;
            console.log('✅ Redis cache conectado');
        });

        redisClient.on('end', () => {
            redisReady = false;
            console.warn('⚠️ Conexión Redis finalizada');
        });

        await redisClient.connect();
        redisReady = true;
        return true;
    } catch (error) {
        redisReady = false;
        console.warn('⚠️ No se pudo conectar a Redis. El backend seguirá sin cache distribuido:', error.message);
        return false;
    }
}

function getRedisClient() {
    if (!redisClient || !redisReady) return null;
    return redisClient;
}

function stableStringify(value) {
    if (value === null || typeof value !== 'object') {
        return JSON.stringify(value);
    }

    if (Array.isArray(value)) {
        return `[${value.map(stableStringify).join(',')}]`;
    }

    const keys = Object.keys(value).sort();
    const keyValues = keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`);
    return `{${keyValues.join(',')}}`;
}

function buildCacheKey(prefix, payload = {}) {
    return `${prefix}:${stableStringify(payload)}`;
}

async function getCachedJson(key) {
    const client = getRedisClient();
    if (!client) return null;

    try {
        const raw = await client.get(key);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (error) {
        console.warn(`⚠️ Error leyendo cache (${key}):`, error.message);
        return null;
    }
}

async function setCachedJson(key, value, ttlSeconds = 30) {
    const client = getRedisClient();
    if (!client) return false;

    try {
        await client.setEx(key, ttlSeconds, JSON.stringify(value));
        return true;
    } catch (error) {
        console.warn(`⚠️ Error guardando cache (${key}):`, error.message);
        return false;
    }
}

async function invalidateCacheByPattern(pattern) {
    const client = getRedisClient();
    if (!client) return 0;

    try {
        let deletedCount = 0;
        let cursor = 0;

        do {
            const result = await client.scan(cursor, {
                MATCH: pattern,
                COUNT: 100
            });

            let nextCursor;
            let keys;

            if (Array.isArray(result)) {
                nextCursor = result[0];
                keys = result[1] || [];
            } else {
                nextCursor = result.cursor;
                keys = result.keys || [];
            }

            cursor = typeof nextCursor === 'string'
                ? Number.parseInt(nextCursor, 10)
                : Number(nextCursor);

            if (keys.length > 0) {
                deletedCount += await client.del(keys);
            }
        } while (cursor !== 0);

        return deletedCount;
    } catch (error) {
        console.warn(`⚠️ Error invalidando cache (${pattern}):`, error.message);
        return 0;
    }
}

module.exports = {
    initializeRedis,
    getRedisClient,
    buildCacheKey,
    getCachedJson,
    setCachedJson,
    invalidateCacheByPattern
};
