const test = require('node:test');
const assert = require('node:assert/strict');

const baseUrl = process.env.TEST_API_BASE_URL;
const unityApiKey = process.env.TEST_UNITY_API_KEY;

const integrationDisabledReason = 'Set TEST_API_BASE_URL to run live integration tests';

async function getJson(path, headers = {}) {
    const response = await fetch(`${baseUrl}${path}`, { headers });
    const body = await response.json().catch(() => ({}));

    return { response, body };
}

test(
    'live /health returns ok',
    { skip: !baseUrl ? integrationDisabledReason : undefined },
    async () => {
        const { response, body } = await getJson('/health');
        assert.equal(response.status, 200);
        assert.equal(body.status, 'ok');
    }
);

test(
    'live /health/live returns alive',
    { skip: !baseUrl ? integrationDisabledReason : undefined },
    async () => {
        const { response, body } = await getJson('/health/live');
        assert.equal(response.status, 200);
        assert.equal(body.status, 'alive');
    }
);

test(
    'live /health/ready responds with ready or not_ready',
    { skip: !baseUrl ? integrationDisabledReason : undefined },
    async () => {
        const { response, body } = await getJson('/health/ready');
        assert.ok([200, 503].includes(response.status));
        assert.ok(['ready', 'not_ready'].includes(body.status));
    }
);

test(
    'live /api/status keeps base contract',
    { skip: !baseUrl ? integrationDisabledReason : undefined },
    async () => {
        const { response, body } = await getJson('/api/status');
        assert.equal(response.status, 200);
        assert.equal(body.success, true);
        assert.equal(typeof body.message, 'string');
    }
);

test(
    'live unity lookup requires API key',
    {
        skip: !baseUrl || !unityApiKey
            ? 'Set TEST_API_BASE_URL and TEST_UNITY_API_KEY for Unity contract check'
            : undefined
    },
    async () => {
        const noAuth = await fetch(`${baseUrl}/api/v1/patients/lookup?participant_id=integration_test`);
        assert.equal(noAuth.status, 401);

        const withAuth = await fetch(
            `${baseUrl}/api/v1/patients/lookup?participant_id=integration_test`,
            { headers: { 'X-API-Key': unityApiKey } }
        );
        assert.ok([200, 404].includes(withAuth.status));
    }
);
