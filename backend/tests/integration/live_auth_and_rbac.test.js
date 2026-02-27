const test = require('node:test');
const assert = require('node:assert/strict');

const baseUrl = process.env.TEST_API_BASE_URL;
const adminEmail = process.env.TEST_ADMIN_EMAIL;
const adminPassword = process.env.TEST_ADMIN_PASSWORD;

const disabledReason = 'Set TEST_API_BASE_URL, TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD';

async function postJson(path, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    });

    const payload = await response.json().catch(() => ({}));
    return { response, payload };
}

async function getJson(path, token) {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await fetch(`${baseUrl}${path}`, { headers });
    const payload = await response.json().catch(() => ({}));
    return { response, payload };
}

test(
    'live auth login and /api/auth/me contract',
    { skip: !baseUrl || !adminEmail || !adminPassword ? disabledReason : undefined },
    async () => {
        const { response: loginResponse, payload: loginPayload } = await postJson('/api/auth/login', {
            email: adminEmail,
            password: adminPassword
        });

        assert.equal(loginResponse.status, 200);
        assert.equal(loginPayload.success, true);
        assert.equal(typeof loginPayload?.data?.token, 'string');

        const token = loginPayload.data.token;
        const { response: meResponse, payload: mePayload } = await getJson('/api/auth/me', token);
        assert.equal(meResponse.status, 200);
        assert.equal(mePayload.success, true);
        assert.equal(typeof mePayload?.data?.rol, 'string');
    }
);

test(
    'live protected route denies missing token',
    { skip: !baseUrl ? 'Set TEST_API_BASE_URL' : undefined },
    async () => {
        const { response } = await getJson('/api/patients');
        assert.equal(response.status, 401);
    }
);
