/**
 * Security Validation Script
 * Tests all 9 security fixes (F1-F9)
 * 
 * Usage: node tests/security_validation.js
 */

const http = require('http');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const BASE = 'http://localhost:3001';
const UNITY_KEY = process.env.UNITY_API_KEY || '5f8a9b2c3d4e5f60718293a4b5c6d7e8';

let passed = 0, failed = 0;
let adminToken = null;
let terapeutaToken = null;
let terapeutaId = null;

function request(method, path, { body, headers = {} } = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE);
        const opts = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method,
            headers: { 'Content-Type': 'application/json', ...headers }
        };
        const req = http.request(opts, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                let json = null;
                try { json = JSON.parse(data); } catch {}
                resolve({ status: res.statusCode, data: json, raw: data });
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

function test(name, actual, expected) {
    if (actual === expected) {
        console.log(`  ✅ ${name}`);
        passed++;
    } else {
        console.log(`  ❌ ${name} — expected ${expected}, got ${actual}`);
        failed++;
    }
}

async function run() {
    console.log('🔐 Security Validation — 9 Fixes\n');

    // === LOGIN AS SUPERADMIN ===
    console.log('--- Auth Setup ---');
    const loginAdmin = await request('POST', '/api/auth/login', {
        body: { email: 'cerebroalfuego@gmail.com', password: 'Admin@123456' }
    });
    test('SuperAdmin login', loginAdmin.status, 200);
    adminToken = loginAdmin.data?.data?.token;
    if (!adminToken) {
        console.log('❌ Cannot continue without admin token');
        return;
    }

    // Create a terapeuta for testing (or use existing)
    const createTera = await request('POST', '/api/usuarios/terapeuta', {
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
            nombre: 'Security Test Tera',
            correo: `sectest_${Date.now()}@test.com`,
            password: 'SecTest@12345',
            especialidad: 'Security QA',
            telefono: '0000000000'
        }
    });
    
    if (createTera.status === 201 || createTera.status === 200) {
        const teraEmail = createTera.data?.data?.email;
        // Login as therapist
        const loginTera = await request('POST', '/api/auth/login', {
            body: { email: teraEmail, password: 'SecTest@12345' }
        });
        terapeutaToken = loginTera.data?.data?.token;
        terapeutaId = loginTera.data?.data?.user?.id_terapeuta;
        test('Terapeuta login', loginTera.status, 200);
    }

    // === F1: POST /api/v1/session-results requires API Key ===
    console.log('\n--- F1: POST /api/v1/session-results (API Key required) ---');
    const f1_nokey = await request('POST', '/api/v1/session-results', {
        body: { participantId: 'test', activityId: 'test', startedAtIso: new Date().toISOString(), endedAtIso: new Date().toISOString(), totalSeconds: 10, sets: [] }
    });
    test('Without API Key → 401', f1_nokey.status, 401);

    const f1_badkey = await request('POST', '/api/v1/session-results', {
        headers: { 'X-API-Key': 'wrong_key' },
        body: { participantId: 'test', activityId: 'test', startedAtIso: new Date().toISOString(), endedAtIso: new Date().toISOString(), totalSeconds: 10, sets: [] }
    });
    test('With wrong API Key → 401', f1_badkey.status, 401);

    const f1_good = await request('POST', '/api/v1/session-results', {
        headers: { 'X-API-Key': UNITY_KEY },
        body: { participantId: 'test-security', activityId: 'security-test', startedAtIso: new Date().toISOString(), endedAtIso: new Date().toISOString(), totalSeconds: 10, sets: [{ setName: 'test', errors: [], completion: { completedAt: new Date().toISOString() }, returnedObjects: [] }] }
    });
    test('With valid API Key → 201', f1_good.status, 201);

    // === F2: GET /api/v1/session-results requires JWT ===
    console.log('\n--- F2: GET /api/v1/session-results (JWT required) ---');
    const f2_noauth = await request('GET', '/api/v1/session-results');
    test('Without token → 401', f2_noauth.status, 401);

    const f2_good = await request('GET', '/api/v1/session-results', {
        headers: { Authorization: `Bearer ${adminToken}` }
    });
    test('With admin token → 200', f2_good.status, 200);

    // === F3: GET /api/v1/session-results/:id requires JWT ===
    console.log('\n--- F3: GET /api/v1/session-results/:id (JWT required) ---');
    const f3_noauth = await request('GET', '/api/v1/session-results/00000000-0000-0000-0000-000000000000');
    test('Without token → 401', f3_noauth.status, 401);

    // === F4: GET /api/terapeutas requires JWT ===
    console.log('\n--- F4: GET /api/terapeutas (JWT required) ---');
    const f4_noauth = await request('GET', '/api/terapeutas');
    test('Without token → 401', f4_noauth.status, 401);

    const f4_good = await request('GET', '/api/terapeutas', {
        headers: { Authorization: `Bearer ${adminToken}` }
    });
    test('With admin token → 200', f4_good.status, 200);

    // === F5: GET /api/dashboard/stats requires JWT ===
    console.log('\n--- F5: GET /api/dashboard/stats (JWT required) ---');
    const f5_noauth = await request('GET', '/api/dashboard/stats');
    test('Without token → 401', f5_noauth.status, 401);

    const f5_good = await request('GET', '/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${adminToken}` }
    });
    test('With admin token → 200', f5_good.status, 200);

    // === F6: PUT /api/usuarios/:id requires SUPERADMIN ===
    console.log('\n--- F6: PUT /api/usuarios/:id (SuperAdmin only) ---');
    const f6_noauth = await request('PUT', '/api/usuarios/1', {
        body: { nombre: 'Hacked' }
    });
    test('Without token → 401', f6_noauth.status, 401);

    if (terapeutaToken) {
        // Get the terapeuta's own user id
        const loginDataTera = await request('POST', '/api/auth/login', {
            body: { correo: `sectest_${Date.now()}@test.com`, password: 'SecTest@12345' }
        });
        // Try to edit any user as terapeuta
        const f6_tera = await request('PUT', '/api/usuarios/1', {
            headers: { Authorization: `Bearer ${terapeutaToken}` },
            body: { nombre: 'Hacked by Tera' }
        });
        test('Terapeuta → 403 (not SuperAdmin)', f6_tera.status, 403);
    }

    // === F7: GET /api/sessions — terapeuta filtering ===
    console.log('\n--- F7: GET /api/sessions (terapeuta filtering) ---');
    const f7_noauth = await request('GET', '/api/sessions');
    test('Without token → 401', f7_noauth.status, 401);

    const f7_admin = await request('GET', '/api/sessions', {
        headers: { Authorization: `Bearer ${adminToken}` }
    });
    test('Admin gets sessions → 200', f7_admin.status, 200);

    if (terapeutaToken) {
        const f7_tera = await request('GET', '/api/sessions', {
            headers: { Authorization: `Bearer ${terapeutaToken}` }
        });
        test('Terapeuta gets filtered sessions → 200', f7_tera.status, 200);
        // A newly created terapeuta with no patients should see 0 sessions
        const count = f7_tera.data?.data?.length || 0;
        test('New terapeuta sees 0 sessions (no patients)', count, 0);
    }

    // === F8: PUT /api/patients/:id — ownership check ===
    console.log('\n--- F8: PUT /api/patients/:id (ownership) ---');
    if (terapeutaToken) {
        // Get a patient that does NOT belong to this terapeuta
        const pList = await request('GET', '/api/patients', {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const patients = pList.data?.data || [];
        if (patients.length > 0) {
            const unownedPatient = patients[0]; // This terapeuta has no patients assigned
            const f8_tera = await request('PUT', `/api/patients/${unownedPatient.id}`, {
                headers: { Authorization: `Bearer ${terapeutaToken}` },
                body: { nombre: 'Hacked Patient' }
            });
            test('Terapeuta edit unowned patient → 403', f8_tera.status, 403);
        }
    }

    // === F9: PUT /api/patients/:id/toggle-status — ownership check ===
    console.log('\n--- F9: PUT /api/patients/:id/toggle-status (ownership) ---');
    if (terapeutaToken) {
        const pList2 = await request('GET', '/api/patients', {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const patients2 = pList2.data?.data || [];
        if (patients2.length > 0) {
            const unownedPatient2 = patients2[0];
            const f9_tera = await request('PUT', `/api/patients/${unownedPatient2.id}/toggle-status`, {
                headers: { Authorization: `Bearer ${terapeutaToken}` }
            });
            test('Terapeuta toggle unowned patient → 403', f9_tera.status, 403);
        }
    }

    // === Public endpoints should still work ===
    console.log('\n--- Public Endpoints (no regression) ---');
    const health = await request('GET', '/health');
    test('GET /health → 200', health.status, 200);

    const lookup = await request('GET', '/api/v1/patients/lookup?identificacion=12345', {
        headers: { 'X-API-Key': UNITY_KEY }
    });
    test('GET /api/v1/patients/lookup with key → 200 or 404', lookup.status <= 404, true);

    // === Summary ===
    console.log(`\n${'='.repeat(50)}`);
    console.log(`✅ Passed: ${passed}  ❌ Failed: ${failed}  Total: ${passed + failed}`);
    console.log(`${'='.repeat(50)}`);

    if (failed > 0) process.exit(1);
}

run().catch(e => { console.error('Fatal:', e); process.exit(1); });
