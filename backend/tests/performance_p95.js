const { performance } = require('node:perf_hooks');

const BASE_URL = process.env.TEST_API_BASE_URL || 'http://localhost:3001';
const ITERATIONS = Number.parseInt(process.env.TEST_PERF_ITERATIONS || '40', 10);

const endpoints = [
    '/health',
    '/health/live',
    '/api/status'
];

function percentile(values, p) {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
}

async function measureEndpoint(path) {
    const timings = [];

    for (let i = 0; i < ITERATIONS; i += 1) {
        const start = performance.now();
        const response = await fetch(`${BASE_URL}${path}`);
        const end = performance.now();

        if (!response.ok) {
            throw new Error(`${path} returned ${response.status}`);
        }

        timings.push(end - start);
    }

    const p50 = percentile(timings, 50);
    const p95 = percentile(timings, 95);
    const avg = timings.reduce((sum, value) => sum + value, 0) / timings.length;

    return {
        path,
        avgMs: Number(avg.toFixed(2)),
        p50Ms: Number(p50.toFixed(2)),
        p95Ms: Number(p95.toFixed(2))
    };
}

async function run() {
    console.log(`Running p95 baseline against ${BASE_URL} (${ITERATIONS} requests per endpoint)`);

    const results = [];
    for (const endpoint of endpoints) {
        results.push(await measureEndpoint(endpoint));
    }

    console.table(results);
}

run().catch((error) => {
    console.error('Performance baseline failed:', error.message);
    process.exit(1);
});
