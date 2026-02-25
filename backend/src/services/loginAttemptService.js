const { getRedisClient } = require('../utils/cache');

const inMemoryAttempts = new Map();

const MAX_ATTEMPTS = Number(process.env.AUTH_MAX_ATTEMPTS || 5);
const LOCK_DURATION_MS = Number(process.env.AUTH_LOCK_DURATION_MS || 15 * 60 * 1000);

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

function getCacheKey(email) {
    return `auth:login-attempts:${normalizeEmail(email)}`;
}

async function readAttempt(email) {
    const client = getRedisClient();
    const normalized = normalizeEmail(email);

    if (!normalized) return null;

    if (client) {
        const raw = await client.get(getCacheKey(normalized));
        if (!raw) return null;

        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }

    return inMemoryAttempts.get(normalized) || null;
}

async function writeAttempt(email, attempt, ttlMs = LOCK_DURATION_MS) {
    const client = getRedisClient();
    const normalized = normalizeEmail(email);

    if (!normalized) return;

    if (client) {
        const ttlSeconds = Math.max(1, Math.ceil(ttlMs / 1000));
        await client.setEx(getCacheKey(normalized), ttlSeconds, JSON.stringify(attempt));
        return;
    }

    inMemoryAttempts.set(normalized, attempt);
}

async function clearAttempt(email) {
    const client = getRedisClient();
    const normalized = normalizeEmail(email);

    if (!normalized) return;

    if (client) {
        await client.del(getCacheKey(normalized));
        return;
    }

    inMemoryAttempts.delete(normalized);
}

async function isAccountLocked(email) {
    const attempt = await readAttempt(email);

    if (!attempt || !attempt.lockedUntil) {
        return false;
    }

    if (Date.now() < attempt.lockedUntil) {
        return true;
    }

    await clearAttempt(email);
    return false;
}

async function recordFailedAttempt(email) {
    const attempt = (await readAttempt(email)) || { count: 0, lockedUntil: null };
    attempt.count += 1;

    if (attempt.count >= MAX_ATTEMPTS) {
        attempt.lockedUntil = Date.now() + LOCK_DURATION_MS;
    }

    await writeAttempt(email, attempt, LOCK_DURATION_MS);

    return {
        ...attempt,
        attemptsRemaining: Math.max(0, MAX_ATTEMPTS - attempt.count)
    };
}

async function resetAttempts(email) {
    await clearAttempt(email);
}

async function getLockTimeRemaining(email) {
    const attempt = await readAttempt(email);

    if (!attempt || !attempt.lockedUntil) return 0;

    const remaining = Math.ceil((attempt.lockedUntil - Date.now()) / 1000 / 60);
    return remaining > 0 ? remaining : 0;
}

module.exports = {
    MAX_ATTEMPTS,
    LOCK_DURATION_MS,
    isAccountLocked,
    recordFailedAttempt,
    resetAttempts,
    getLockTimeRemaining
};