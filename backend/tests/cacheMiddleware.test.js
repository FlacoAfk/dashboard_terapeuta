const test = require('node:test');
const assert = require('node:assert/strict');

function loadMiddlewareWithMocks(mockedCacheModule) {
    const cacheModulePath = require.resolve('../src/utils/cache');
    const middlewarePath = require.resolve('../src/middleware/cacheMiddleware');

    delete require.cache[cacheModulePath];
    delete require.cache[middlewarePath];

    require.cache[cacheModulePath] = {
        id: cacheModulePath,
        filename: cacheModulePath,
        loaded: true,
        exports: mockedCacheModule
    };

    return require('../src/middleware/cacheMiddleware');
}

test('cacheGetResponse devuelve HIT cuando existe valor en cache', async () => {
    const { cacheGetResponse } = loadMiddlewareWithMocks({
        buildCacheKey: () => 'test:key',
        getCachedJson: async () => ({ success: true, data: [1] }),
        setCachedJson: async () => true,
        invalidateCacheByPattern: async () => 0
    });

    const middleware = cacheGetResponse({
        prefix: 'x',
        payloadBuilder: () => ({})
    });

    const req = { method: 'GET', query: {} };
    let nextCalled = false;
    let responseBody = null;
    const headers = {};
    const res = {
        statusCode: 200,
        setHeader: (key, value) => {
            headers[key.toLowerCase()] = value;
        },
        json: (body) => {
            responseBody = body;
            return body;
        }
    };

    await middleware(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.deepEqual(responseBody, { success: true, data: [1] });
    assert.equal(headers['x-cache'], 'HIT');
});

test('cacheGetResponse guarda MISS al responder exitosamente', async () => {
    let cachedPayload = null;

    const { cacheGetResponse } = loadMiddlewareWithMocks({
        buildCacheKey: () => 'test:key',
        getCachedJson: async () => null,
        setCachedJson: async (_key, value) => {
            cachedPayload = value;
            return true;
        },
        invalidateCacheByPattern: async () => 0
    });

    const middleware = cacheGetResponse({
        prefix: 'x',
        payloadBuilder: () => ({}),
        ttlSeconds: 10
    });

    const req = { method: 'GET', query: {} };
    const headers = {};
    const res = {
        statusCode: 200,
        setHeader: (key, value) => {
            headers[key.toLowerCase()] = value;
        },
        json: (body) => body
    };

    let handlerReached = false;
    await middleware(req, res, () => {
        handlerReached = true;
    });

    assert.equal(handlerReached, true);
    res.json({ success: true, data: [2] });

    await new Promise((resolve) => setImmediate(resolve));

    assert.deepEqual(cachedPayload, { success: true, data: [2] });
    assert.equal(headers['x-cache'], 'MISS');
});

test('invalidateCacheOnMutation invalida patrones en respuestas 2xx', async () => {
    const invalidated = [];

    const { invalidateCacheOnMutation } = loadMiddlewareWithMocks({
        buildCacheKey: () => 'unused',
        getCachedJson: async () => null,
        setCachedJson: async () => true,
        invalidateCacheByPattern: async (pattern) => {
            invalidated.push(pattern);
            return 1;
        }
    });

    const middleware = invalidateCacheOnMutation(['a:*', 'b:*']);

    const req = { method: 'POST' };
    const res = {
        statusCode: 201,
        json: (body) => body
    };

    let nextCalled = false;
    await middleware(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, true);
    res.json({ success: true });
    await new Promise((resolve) => setImmediate(resolve));

    assert.deepEqual(invalidated, ['a:*', 'b:*']);
});