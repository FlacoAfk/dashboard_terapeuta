const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.REDIS_CACHE_ENABLED = 'false';

const { createApp } = require('../src/app');

const app = createApp();

test('GET /health responde ok con requestId', async () => {
    const response = await request(app).get('/health');

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.status, 'ok');
    assert.equal(typeof response.body.requestId, 'string');
    assert.equal(typeof response.headers['x-request-id'], 'string');
});

test('GET /health/live responde alive', async () => {
    const response = await request(app).get('/health/live');

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.status, 'alive');
});

test('GET /api/status mantiene contrato base', async () => {
    const response = await request(app).get('/api/status');

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.message, 'API funcionando correctamente');
});