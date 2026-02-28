const { buildCacheKey, getCachedJson, setCachedJson, invalidateCacheByPattern } = require('../utils/cache');

function cacheGetResponse(options) {
    const {
        prefix,
        ttlSeconds = 20,
        payloadBuilder,
        shouldBypass
    } = options;

    if (!prefix || typeof payloadBuilder !== 'function') {
        throw new Error('cacheGetResponse requiere prefix y payloadBuilder');
    }

    return async (req, res, next) => {
        if (req.method !== 'GET') {
            return next();
        }

        if (typeof shouldBypass === 'function' && shouldBypass(req)) {
            return next();
        }

        const cachePayload = payloadBuilder(req);
        const cacheKey = buildCacheKey(prefix, cachePayload);
        req.cacheKey = cacheKey;

        const cached = await getCachedJson(cacheKey);
        if (cached) {
            res.setHeader('x-cache', 'HIT');
            return res.json(cached);
        }

        const originalJson = res.json.bind(res);
        res.json = (body) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                setCachedJson(cacheKey, body, ttlSeconds).catch((error) => {
                    console.warn('⚠️ No se pudo persistir respuesta en cache:', error.message);
                });
                res.setHeader('x-cache', 'MISS');
            }
            return originalJson(body);
        };

        return next();
    };
}

function invalidateCacheOnMutation(patterns = []) {
    return async (req, res, next) => {
        const originalJson = res.json.bind(res);

        res.json = (body) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                Promise.all(patterns.map((pattern) => invalidateCacheByPattern(pattern))).catch((error) => {
                    console.warn('⚠️ No se pudo invalidar cache por middleware:', error.message);
                });
            }

            return originalJson(body);
        };

        next();
    };
}

module.exports = {
    cacheGetResponse,
    invalidateCacheOnMutation
};