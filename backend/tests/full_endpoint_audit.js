/**
 * Full Endpoint Audit — Tests every endpoint for:
 *   Security (auth type), Input, Output, Status Codes
 * 
 * Usage: node tests/full_endpoint_audit.js
 */

const http = require('http');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const BASE = 'http://localhost:3001';
const UNITY_KEY = process.env.UNITY_API_KEY || '5f8a9b2c3d4e5f60718293a4b5c6d7e8';

function req(method, path, { body, headers = {} } = {}) {
    return new Promise((resolve) => {
        const url = new URL(path, BASE);
        const opts = {
            hostname: url.hostname, port: url.port,
            path: url.pathname + url.search, method,
            headers: { 'Content-Type': 'application/json', ...headers }
        };
        const r = http.request(opts, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                let json = null;
                try { json = JSON.parse(data); } catch {}
                resolve({ status: res.statusCode, data: json, raw: data, headers: res.headers });
            });
        });
        r.on('error', e => resolve({ status: 0, data: null, raw: e.message }));
        if (body) r.write(JSON.stringify(body));
        r.end();
    });
}

function summarize(label, r, extras = '') {
    const dataKeys = r.data ? Object.keys(r.data) : [];
    const dataPreview = r.data ? JSON.stringify(r.data).substring(0, 300) : r.raw?.substring(0, 200);
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`  ${label}`);
    console.log(`  Status: ${r.status}`);
    console.log(`  Response keys: [${dataKeys.join(', ')}]`);
    console.log(`  Data: ${dataPreview}`);
    if (extras) console.log(`  ${extras}`);
}

async function run() {
    const results = [];

    // ========================================
    // 1. LOGIN + TOKENS
    // ========================================
    console.log('\n' + '═'.repeat(70));
    console.log(' SECTION: AUTH ENDPOINTS');
    console.log('═'.repeat(70));

    // 1a. GET /health
    const health = await req('GET', '/health');
    summarize('GET /health — Sin auth', health);
    results.push({ endpoint: 'GET /health', security: 'NINGUNA (público)', status: health.status });

    // 1b. GET /api/auth/check-setup
    const checkSetup = await req('GET', '/api/auth/check-setup');
    summarize('GET /api/auth/check-setup — Sin auth', checkSetup);
    results.push({ endpoint: 'GET /api/auth/check-setup', security: 'NINGUNA (público)', status: checkSetup.status });

    // 1c. POST /api/auth/setup (expect 400 — already configured)
    const setup = await req('POST', '/api/auth/setup', {
        body: { nombre: 'Test', correo: 'test@test.com', password: 'Test@123456' }
    });
    summarize('POST /api/auth/setup — Sin auth (ya configurado)', setup);
    const setupNoAuth = await req('POST', '/api/auth/setup');
    results.push({ endpoint: 'POST /api/auth/setup', security: 'NINGUNA (público, solo 1 vez)', status: setup.status });

    // 1d. POST /api/auth/login
    const loginFail = await req('POST', '/api/auth/login', { body: { email: 'bad@bad.com', password: 'wrong' } });
    summarize('POST /api/auth/login — Credenciales inválidas', loginFail);

    const loginOk = await req('POST', '/api/auth/login', {
        body: { email: 'cerebroalfuego@gmail.com', password: 'Admin@123456' }
    });
    summarize('POST /api/auth/login — Credenciales válidas', loginOk);
    const adminToken = loginOk.data?.data?.token;
    results.push({ endpoint: 'POST /api/auth/login', security: 'NINGUNA (público)', status: loginOk.status });

    // Validate we can continue
    if (!adminToken) { console.error('FATAL: No admin token'); return; }

    // 1e. POST /api/auth/login — sin body
    const loginEmpty = await req('POST', '/api/auth/login', { body: {} });
    summarize('POST /api/auth/login — Sin datos (validación)', loginEmpty);

    // 1f. GET /api/auth/me
    const meNoAuth = await req('GET', '/api/auth/me');
    summarize('GET /api/auth/me — Sin token', meNoAuth);

    const meOk = await req('GET', '/api/auth/me', { headers: { Authorization: `Bearer ${adminToken}` } });
    summarize('GET /api/auth/me — Con token admin', meOk);
    results.push({ endpoint: 'GET /api/auth/me', security: 'JWT (Bearer)', status_sin: meNoAuth.status, status_con: meOk.status });

    // 1g. POST /api/auth/change-password
    const cpNoAuth = await req('POST', '/api/auth/change-password', {
        body: { currentPassword: 'old', newPassword: 'new' }
    });
    summarize('POST /api/auth/change-password — Sin token', cpNoAuth);

    const cpBadOld = await req('POST', '/api/auth/change-password', {
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { currentPassword: 'WrongOld@12345', newPassword: 'NewPass@12345' }
    });
    summarize('POST /api/auth/change-password — Password actual incorrecta', cpBadOld);
    results.push({ endpoint: 'POST /api/auth/change-password', security: 'JWT (Bearer)', status_sin: cpNoAuth.status, status_bad: cpBadOld.status });

    // 1h. POST /api/auth/forgot-password
    const forgotNoEmail = await req('POST', '/api/auth/forgot-password', { body: {} });
    summarize('POST /api/auth/forgot-password — Sin email', forgotNoEmail);

    const forgot = await req('POST', '/api/auth/forgot-password', { body: { email: 'nonexistent@test.com' } });
    summarize('POST /api/auth/forgot-password — Email inexistente (respuesta genérica)', forgot);
    results.push({ endpoint: 'POST /api/auth/forgot-password', security: 'NINGUNA (público)', status: forgot.status });

    // 1i. POST /api/auth/reset-password
    const resetBad = await req('POST', '/api/auth/reset-password', {
        body: { token: 'invalid-token', newPassword: 'NewPass@12345' }
    });
    summarize('POST /api/auth/reset-password — Token inválido', resetBad);
    results.push({ endpoint: 'POST /api/auth/reset-password', security: 'NINGUNA (público, requiere token de email)', status: resetBad.status });

    // 1j. POST /api/auth/request-verification-code
    const verCode = await req('POST', '/api/auth/request-verification-code', {
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { correo: 'test@test.com' }
    });
    summarize('POST /api/auth/request-verification-code — Con token', verCode);
    
    const verCodeNoAuth = await req('POST', '/api/auth/request-verification-code', {
        body: { correo: 'test@test.com' }
    });
    summarize('POST /api/auth/request-verification-code — Sin token', verCodeNoAuth);
    results.push({ endpoint: 'POST /api/auth/request-verification-code', security: verCodeNoAuth.status === 401 ? 'JWT (Bearer)' : 'NINGUNA', status_con: verCode.status, status_sin: verCodeNoAuth.status });

    // ========================================
    // 2. USUARIOS
    // ========================================
    console.log('\n' + '═'.repeat(70));
    console.log(' SECTION: USUARIOS ENDPOINTS');
    console.log('═'.repeat(70));

    // 2a. GET /api/usuarios
    const usersNoAuth = await req('GET', '/api/usuarios');
    summarize('GET /api/usuarios — Sin token', usersNoAuth);

    const usersOk = await req('GET', '/api/usuarios', { headers: { Authorization: `Bearer ${adminToken}` } });
    summarize('GET /api/usuarios — Con token admin', usersOk);
    results.push({ endpoint: 'GET /api/usuarios', security: 'JWT + requireSuperAdmin', status_sin: usersNoAuth.status, status_con: usersOk.status });

    // 2b. POST /api/usuarios/terapeuta
    const createTeraNoAuth = await req('POST', '/api/usuarios/terapeuta', {
        body: { nombre: 'Test', correo: 'test@test.com', password: 'Test@123456', especialidad: 'QA' }
    });
    summarize('POST /api/usuarios/terapeuta — Sin token', createTeraNoAuth);

    const ts = Date.now();
    const teraEmail = `audit_tera_${ts}@gmail.com`;
    const createTeraOk = await req('POST', '/api/usuarios/terapeuta', {
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { nombre: `Audit Tera ${ts}`, correo: teraEmail, password: 'AuditTera@12345', especialidad: 'Audit QA', telefono: '3009999999' }
    });
    summarize('POST /api/usuarios/terapeuta — Con token admin', createTeraOk);
    results.push({ endpoint: 'POST /api/usuarios/terapeuta', security: 'JWT + requireSuperAdmin', status_sin: createTeraNoAuth.status, status_con: createTeraOk.status });

    // Login as terapeuta for role tests
    let teraToken = null, teraUserId = null, teraTeraId = null;
    if (createTeraOk.status === 201) {
        const loginTera = await req('POST', '/api/auth/login', {
            body: { email: teraEmail, password: 'AuditTera@12345' }
        });
        teraToken = loginTera.data?.data?.token;
        teraUserId = loginTera.data?.data?.user?.id;
        teraTeraId = loginTera.data?.data?.user?.id_terapeuta;
    }

    // 2c. PUT /api/usuarios/:id
    const editUserNoAuth = await req('PUT', '/api/usuarios/1', { body: { nombre: 'Hack' } });
    summarize('PUT /api/usuarios/:id — Sin token', editUserNoAuth);

    let editUserTera = null;
    if (teraToken) {
        editUserTera = await req('PUT', '/api/usuarios/1', {
            headers: { Authorization: `Bearer ${teraToken}` },
            body: { nombre: 'Hack' }
        });
        summarize('PUT /api/usuarios/:id — Con token TERAPEUTA', editUserTera);
    }

    // Admin edit (don't actually change anything meaningful)
    if (teraUserId) {
        const editUserAdmin = await req('PUT', `/api/usuarios/${teraUserId}`, {
            headers: { Authorization: `Bearer ${adminToken}` },
            body: { nombre: `Audit Tera ${ts}`, especialidad: 'Audit QA Updated' }
        });
        summarize('PUT /api/usuarios/:id — Con token SUPERADMIN', editUserAdmin);
        results.push({ endpoint: 'PUT /api/usuarios/:id', security: 'JWT + requireSuperAdmin', status_sin: editUserNoAuth.status, status_tera: editUserTera?.status, status_admin: editUserAdmin.status });
    }

    // 2d. PUT /api/usuarios/:id/toggle-estado
    const toggleNoAuth = await req('PUT', '/api/usuarios/999/toggle-estado');
    summarize('PUT /api/usuarios/:id/toggle-estado — Sin token', toggleNoAuth);

    if (teraToken) {
        const toggleTera = await req('PUT', `/api/usuarios/${teraUserId}/toggle-estado`, {
            headers: { Authorization: `Bearer ${teraToken}` }
        });
        summarize('PUT /api/usuarios/:id/toggle-estado — TERAPEUTA', toggleTera);
    }
    results.push({ endpoint: 'PUT /api/usuarios/:id/toggle-estado', security: 'JWT + requireSuperAdmin', status_sin: toggleNoAuth.status });

    // 2e. POST /api/usuarios/:id/reset-password
    const resetPwNoAuth = await req('POST', '/api/usuarios/999/reset-password', {
        body: { newPassword: 'New@12345678' }
    });
    summarize('POST /api/usuarios/:id/reset-password — Sin token', resetPwNoAuth);

    if (teraUserId) {
        const resetPwAdmin = await req('POST', `/api/usuarios/${teraUserId}/reset-password`, {
            headers: { Authorization: `Bearer ${adminToken}` },
            body: { newPassword: 'AuditTera@12345' }
        });
        summarize('POST /api/usuarios/:id/reset-password — SUPERADMIN', resetPwAdmin);
        results.push({ endpoint: 'POST /api/usuarios/:id/reset-password', security: 'JWT + requireSuperAdmin', status_sin: resetPwNoAuth.status, status_admin: resetPwAdmin.status });
    }

    // ========================================
    // 3. PATIENTS
    // ========================================
    console.log('\n' + '═'.repeat(70));
    console.log(' SECTION: PATIENTS ENDPOINTS');
    console.log('═'.repeat(70));

    // 3a. GET /api/patients
    const patsNoAuth = await req('GET', '/api/patients');
    summarize('GET /api/patients — Sin token', patsNoAuth);

    const patsAdmin = await req('GET', '/api/patients', { headers: { Authorization: `Bearer ${adminToken}` } });
    summarize('GET /api/patients — SUPERADMIN', patsAdmin);

    if (teraToken) {
        const patsTera = await req('GET', '/api/patients', { headers: { Authorization: `Bearer ${teraToken}` } });
        summarize('GET /api/patients — TERAPEUTA (sin pacientes asignados)', patsTera);
    }
    results.push({ endpoint: 'GET /api/patients', security: 'JWT + requireTerapeuta', status_sin: patsNoAuth.status, status_admin: patsAdmin.status });

    // 3b. POST /api/patients
    const createPatNoAuth = await req('POST', '/api/patients', {
        body: { identificacion: 'AUDIT001', nombre: 'Patient Audit', edad: 25, diagnostico: 'Test' }
    });
    summarize('POST /api/patients — Sin token', createPatNoAuth);

    const createPatAdmin = await req('POST', '/api/patients', {
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { identificacion: `AUDIT_${ts}`, nombre: `Patient Audit ${ts}`, edad: 30, diagnostico: 'Audit test' }
    });
    summarize('POST /api/patients — SUPERADMIN', createPatAdmin);
    const auditPatientId = createPatAdmin.data?.data?.id;
    results.push({ endpoint: 'POST /api/patients', security: 'JWT + requireTerapeuta + validatePatient', status_sin: createPatNoAuth.status, status_admin: createPatAdmin.status });

    // 3c. GET /api/patients/:id
    if (auditPatientId) {
        const getPatNoAuth = await req('GET', `/api/patients/${auditPatientId}`);
        summarize('GET /api/patients/:id — Sin token', getPatNoAuth);

        const getPatAdmin = await req('GET', `/api/patients/${auditPatientId}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        summarize('GET /api/patients/:id — SUPERADMIN', getPatAdmin);

        if (teraToken) {
            const getPatTera = await req('GET', `/api/patients/${auditPatientId}`, {
                headers: { Authorization: `Bearer ${teraToken}` }
            });
            summarize('GET /api/patients/:id — TERAPEUTA (no asignado)', getPatTera);
        }
        results.push({ endpoint: 'GET /api/patients/:id', security: 'JWT + requireTerapeuta + ownership check', status_admin: getPatAdmin.status });
    }

    // 3d. PUT /api/patients/:id
    if (auditPatientId) {
        const editPatNoAuth = await req('PUT', `/api/patients/${auditPatientId}`, {
            body: { nombre: 'Hacked' }
        });
        summarize('PUT /api/patients/:id — Sin token', editPatNoAuth);

        if (teraToken) {
            const editPatTera = await req('PUT', `/api/patients/${auditPatientId}`, {
                headers: { Authorization: `Bearer ${teraToken}` },
                body: { nombre: 'Hacked by Tera' }
            });
            summarize('PUT /api/patients/:id — TERAPEUTA (no es dueño)', editPatTera);
        }

        const editPatAdmin = await req('PUT', `/api/patients/${auditPatientId}`, {
            headers: { Authorization: `Bearer ${adminToken}` },
            body: { nombre: `Patient Audit ${ts}` }
        });
        summarize('PUT /api/patients/:id — SUPERADMIN', editPatAdmin);
        results.push({ endpoint: 'PUT /api/patients/:id', security: 'JWT + requireTerapeuta + validatePatient + ownership', status_sin: editPatNoAuth.status, status_admin: editPatAdmin.status });
    }

    // 3e. PUT /api/patients/:id/toggle-status
    if (auditPatientId) {
        const togglePatNoAuth = await req('PUT', `/api/patients/${auditPatientId}/toggle-status`);
        summarize('PUT /api/patients/:id/toggle-status — Sin token', togglePatNoAuth);

        if (teraToken) {
            const togglePatTera = await req('PUT', `/api/patients/${auditPatientId}/toggle-status`, {
                headers: { Authorization: `Bearer ${teraToken}` }
            });
            summarize('PUT /api/patients/:id/toggle-status — TERAPEUTA (no es dueño)', togglePatTera);
        }

        // Admin toggle (toggle and toggle back)
        const togglePatAdmin = await req('PUT', `/api/patients/${auditPatientId}/toggle-status`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        summarize('PUT /api/patients/:id/toggle-status — SUPERADMIN', togglePatAdmin);
        // Toggle back
        await req('PUT', `/api/patients/${auditPatientId}/toggle-status`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        results.push({ endpoint: 'PUT /api/patients/:id/toggle-status', security: 'JWT + requireTerapeuta + ownership', status_sin: togglePatNoAuth.status, status_admin: togglePatAdmin.status });
    }

    // 3f. POST /api/patients/:id/assign
    if (auditPatientId && teraTeraId) {
        const assignNoAuth = await req('POST', `/api/patients/${auditPatientId}/assign`, {
            body: { id_terapeuta: teraTeraId }
        });
        summarize('POST /api/patients/:id/assign — Sin token', assignNoAuth);

        const assignAdmin = await req('POST', `/api/patients/${auditPatientId}/assign`, {
            headers: { Authorization: `Bearer ${adminToken}` },
            body: { id_terapeuta: teraTeraId }
        });
        summarize('POST /api/patients/:id/assign — SUPERADMIN', assignAdmin);
        results.push({ endpoint: 'POST /api/patients/:id/assign', security: 'JWT + requireSuperAdmin', status_sin: assignNoAuth.status, status_admin: assignAdmin.status });
    }

    // 3g. GET /api/patients/:id/report
    if (auditPatientId) {
        const reportNoAuth = await req('GET', `/api/patients/${auditPatientId}/report`);
        summarize('GET /api/patients/:id/report — Sin token', reportNoAuth);

        const reportAdmin = await req('GET', `/api/patients/${auditPatientId}/report`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        summarize('GET /api/patients/:id/report — SUPERADMIN', reportAdmin);

        // Now terapeuta IS assigned (from step 3f)
        if (teraToken) {
            const reportTera = await req('GET', `/api/patients/${auditPatientId}/report`, {
                headers: { Authorization: `Bearer ${teraToken}` }
            });
            summarize('GET /api/patients/:id/report — TERAPEUTA (asignado)', reportTera);
        }
        results.push({ endpoint: 'GET /api/patients/:id/report', security: 'JWT + requireTerapeuta + ownership', status_sin: reportNoAuth.status, status_admin: reportAdmin.status });
    }

    // ========================================
    // 4. SESSIONS
    // ========================================
    console.log('\n' + '═'.repeat(70));
    console.log(' SECTION: SESSIONS ENDPOINTS');
    console.log('═'.repeat(70));

    // 4a. GET /api/sessions
    const sessNoAuth = await req('GET', '/api/sessions');
    summarize('GET /api/sessions — Sin token', sessNoAuth);

    const sessAdmin = await req('GET', '/api/sessions', { headers: { Authorization: `Bearer ${adminToken}` } });
    summarize('GET /api/sessions — SUPERADMIN', sessAdmin);

    if (teraToken) {
        const sessTera = await req('GET', '/api/sessions', { headers: { Authorization: `Bearer ${teraToken}` } });
        summarize('GET /api/sessions — TERAPEUTA (filtrado)', sessTera);
        results.push({ endpoint: 'GET /api/sessions', security: 'JWT + requireTerapeuta + filtro por terapeuta', status_sin: sessNoAuth.status, status_admin: sessAdmin.status, admin_count: sessAdmin.data?.count, tera_count: sessTera.data?.count });
    }

    // 4b. PUT /api/sessions/:id — need a real session ID
    const sessData = sessAdmin.data?.data;
    if (sessData && sessData.length > 0) {
        const sessId = sessData[0].id;
        const putSessNoAuth = await req('PUT', `/api/sessions/${sessId}`, {
            body: { observaciones: 'Test audit' }
        });
        summarize('PUT /api/sessions/:id — Sin token', putSessNoAuth);

        const putSessAdmin = await req('PUT', `/api/sessions/${sessId}`, {
            headers: { Authorization: `Bearer ${adminToken}` },
            body: { observaciones: sessData[0].observaciones_terapeuta || '' }
        });
        summarize('PUT /api/sessions/:id — SUPERADMIN', putSessAdmin);
        results.push({ endpoint: 'PUT /api/sessions/:id', security: 'JWT + requireTerapeuta', status_sin: putSessNoAuth.status, status_admin: putSessAdmin.status });
    }

    // ========================================
    // 5. VR RESULTS (v1)
    // ========================================
    console.log('\n' + '═'.repeat(70));
    console.log(' SECTION: VR RESULTS (v1) ENDPOINTS');
    console.log('═'.repeat(70));

    // 5a. POST /api/v1/session-results
    const postVrNoAuth = await req('POST', '/api/v1/session-results', {
        body: { schemaVersion: '1.0', participantId: 'audit-test', activityId: 'audit-activity', startedAtIso: new Date().toISOString(), endedAtIso: new Date().toISOString(), totalSeconds: 5, sets: [{ setName: 'set1', errors: [], completion: { completedAt: new Date().toISOString() }, returnedObjects: [] }] }
    });
    summarize('POST /api/v1/session-results — Sin API Key', postVrNoAuth);

    const postVrBadKey = await req('POST', '/api/v1/session-results', {
        headers: { 'X-API-Key': 'wrong_key' },
        body: { schemaVersion: '1.0', participantId: 'audit-test', activityId: 'audit-activity', startedAtIso: new Date().toISOString(), endedAtIso: new Date().toISOString(), totalSeconds: 5, sets: [] }
    });
    summarize('POST /api/v1/session-results — API Key inválida', postVrBadKey);

    const postVrOk = await req('POST', '/api/v1/session-results', {
        headers: { 'X-API-Key': UNITY_KEY },
        body: { schemaVersion: '1.0', participantId: 'audit-test', activityId: 'audit-activity', startedAtIso: new Date().toISOString(), endedAtIso: new Date().toISOString(), totalSeconds: 15, sets: [{ setName: 'audit-set', errors: [{ errorType: 'test_error', timestamp: new Date().toISOString() }], completion: { completedAt: new Date().toISOString() }, returnedObjects: [{ objectName: 'item1', returnedAt: new Date().toISOString() }] }] }
    });
    summarize('POST /api/v1/session-results — API Key válida', postVrOk);
    results.push({ endpoint: 'POST /api/v1/session-results', security: 'API Key (X-API-Key header)', status_sin: postVrNoAuth.status, status_bad: postVrBadKey.status, status_ok: postVrOk.status });

    // 5b. GET /api/v1/session-results
    const getVrNoAuth = await req('GET', '/api/v1/session-results');
    summarize('GET /api/v1/session-results — Sin token', getVrNoAuth);

    const getVrAdmin = await req('GET', '/api/v1/session-results', {
        headers: { Authorization: `Bearer ${adminToken}` }
    });
    summarize('GET /api/v1/session-results — SUPERADMIN', getVrAdmin);
    results.push({ endpoint: 'GET /api/v1/session-results', security: 'JWT + requireTerapeuta', status_sin: getVrNoAuth.status, status_admin: getVrAdmin.status });

    // 5c. GET /api/v1/session-results/:id
    const vrSessions = getVrAdmin.data?.data;
    if (vrSessions && vrSessions.length > 0) {
        const vrId = vrSessions[0].id;
        const getVrIdNoAuth = await req('GET', `/api/v1/session-results/${vrId}`);
        summarize('GET /api/v1/session-results/:id — Sin token', getVrIdNoAuth);

        const getVrIdAdmin = await req('GET', `/api/v1/session-results/${vrId}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        summarize('GET /api/v1/session-results/:id — SUPERADMIN', getVrIdAdmin);
        results.push({ endpoint: 'GET /api/v1/session-results/:id', security: 'JWT + requireTerapeuta', status_sin: getVrIdNoAuth.status, status_admin: getVrIdAdmin.status });
    }

    // 5d. GET /api/v1/patients/lookup
    const lookupNoKey = await req('GET', '/api/v1/patients/lookup?identificacion=12345');
    summarize('GET /api/v1/patients/lookup — Sin API Key', lookupNoKey);

    const lookupBadKey = await req('GET', '/api/v1/patients/lookup?identificacion=12345', {
        headers: { 'X-API-Key': 'wrong' }
    });
    summarize('GET /api/v1/patients/lookup — API Key inválida', lookupBadKey);

    const lookupOk = await req('GET', `/api/v1/patients/lookup?identificacion=AUDIT_${ts}`, {
        headers: { 'X-API-Key': UNITY_KEY }
    });
    summarize('GET /api/v1/patients/lookup — API Key válida', lookupOk);
    results.push({ endpoint: 'GET /api/v1/patients/lookup', security: 'API Key (X-API-Key header)', status_sin: lookupNoKey.status, status_ok: lookupOk.status });

    // ========================================
    // 6. TERAPEUTAS / DASHBOARD / STATUS
    // ========================================
    console.log('\n' + '═'.repeat(70));
    console.log(' SECTION: TERAPEUTAS / DASHBOARD / STATUS');
    console.log('═'.repeat(70));

    // 6a. GET /api/terapeutas
    const terasNoAuth = await req('GET', '/api/terapeutas');
    summarize('GET /api/terapeutas — Sin token', terasNoAuth);

    const terasAdmin = await req('GET', '/api/terapeutas', { headers: { Authorization: `Bearer ${adminToken}` } });
    summarize('GET /api/terapeutas — SUPERADMIN', terasAdmin);
    results.push({ endpoint: 'GET /api/terapeutas', security: 'JWT + requireTerapeuta', status_sin: terasNoAuth.status, status_admin: terasAdmin.status });

    // 6b. GET /api/dashboard/stats
    const statsNoAuth = await req('GET', '/api/dashboard/stats');
    summarize('GET /api/dashboard/stats — Sin token', statsNoAuth);

    const statsAdmin = await req('GET', '/api/dashboard/stats', { headers: { Authorization: `Bearer ${adminToken}` } });
    summarize('GET /api/dashboard/stats — SUPERADMIN', statsAdmin);
    results.push({ endpoint: 'GET /api/dashboard/stats', security: 'JWT + requireTerapeuta', status_sin: statsNoAuth.status, status_admin: statsAdmin.status });

    // 6c. GET /api/status
    const statusNoAuth = await req('GET', '/api/status');
    summarize('GET /api/status — Sin token', statusNoAuth);

    const statusAdmin = await req('GET', '/api/status', { headers: { Authorization: `Bearer ${adminToken}` } });
    summarize('GET /api/status — SUPERADMIN', statusAdmin);
    results.push({ endpoint: 'GET /api/status', security: statusNoAuth.status === 401 ? 'JWT' : 'NINGUNA (público)', status: statusNoAuth.status });

    // 6d. GET /api/db-status
    const dbNoAuth = await req('GET', '/api/db-status');
    summarize('GET /api/db-status — Sin token', dbNoAuth);

    const dbAdmin = await req('GET', '/api/db-status', { headers: { Authorization: `Bearer ${adminToken}` } });
    summarize('GET /api/db-status — SUPERADMIN', dbAdmin);
    results.push({ endpoint: 'GET /api/db-status', security: dbNoAuth.status === 401 ? 'JWT' : 'NINGUNA (público)', status: dbNoAuth.status });

    // ========================================
    // 7. AUDIT
    // ========================================
    console.log('\n' + '═'.repeat(70));
    console.log(' SECTION: AUDIT ENDPOINTS');
    console.log('═'.repeat(70));

    // 7a. GET /api/audit
    const auditNoAuth = await req('GET', '/api/audit');
    summarize('GET /api/audit — Sin token', auditNoAuth);

    const auditAdmin = await req('GET', '/api/audit', { headers: { Authorization: `Bearer ${adminToken}` } });
    summarize('GET /api/audit — SUPERADMIN', auditAdmin);

    if (teraToken) {
        const auditTera = await req('GET', '/api/audit', { headers: { Authorization: `Bearer ${teraToken}` } });
        summarize('GET /api/audit — TERAPEUTA', auditTera);
    }
    results.push({ endpoint: 'GET /api/audit', security: auditNoAuth.status === 401 ? 'JWT + requireSuperAdmin' : 'Verificar', status_sin: auditNoAuth.status, status_admin: auditAdmin.status });

    // 7b. GET /api/audit/types
    const auditTypesNoAuth = await req('GET', '/api/audit/types');
    summarize('GET /api/audit/types — Sin token', auditTypesNoAuth);

    const auditTypesAdmin = await req('GET', '/api/audit/types', { headers: { Authorization: `Bearer ${adminToken}` } });
    summarize('GET /api/audit/types — SUPERADMIN', auditTypesAdmin);
    results.push({ endpoint: 'GET /api/audit/types', security: auditTypesNoAuth.status === 401 ? 'JWT + requireSuperAdmin' : 'Verificar', status_sin: auditTypesNoAuth.status, status_admin: auditTypesAdmin.status });

    // 7c. GET /api/audit/export
    const auditExportNoAuth = await req('GET', '/api/audit/export');
    summarize('GET /api/audit/export — Sin token', auditExportNoAuth);

    const auditExportAdmin = await req('GET', '/api/audit/export', { headers: { Authorization: `Bearer ${adminToken}` } });
    summarize('GET /api/audit/export — SUPERADMIN (CSV)', auditExportAdmin, `Content-Type: ${auditExportAdmin.headers?.['content-type']}`);
    results.push({ endpoint: 'GET /api/audit/export', security: auditExportNoAuth.status === 401 ? 'JWT + requireSuperAdmin' : 'Verificar', status_sin: auditExportNoAuth.status, status_admin: auditExportAdmin.status });

    // 7d. GET /api/audit/user/:id
    const auditUserNoAuth = await req('GET', '/api/audit/user/1');
    summarize('GET /api/audit/user/:id — Sin token', auditUserNoAuth);

    const auditUserAdmin = await req('GET', '/api/audit/user/1', { headers: { Authorization: `Bearer ${adminToken}` } });
    summarize('GET /api/audit/user/:id — SUPERADMIN', auditUserAdmin);
    results.push({ endpoint: 'GET /api/audit/user/:id', security: auditUserNoAuth.status === 401 ? 'JWT + requireSuperAdmin' : 'Verificar', status_sin: auditUserNoAuth.status, status_admin: auditUserAdmin.status });

    // ========================================
    // FINAL SUMMARY TABLE
    // ========================================
    console.log('\n\n' + '═'.repeat(90));
    console.log(' RESUMEN FINAL — TODOS LOS ENDPOINTS');
    console.log('═'.repeat(90));
    console.log('');
    console.log('Endpoint'.padEnd(50) + 'Seguridad'.padEnd(35) + 'Sin Auth  Con Auth');
    console.log('─'.repeat(100));
    results.forEach(r => {
        const sinAuth = r.status_sin !== undefined ? r.status_sin : (r.status || '');
        const conAuth = r.status_con !== undefined ? r.status_con : (r.status_admin || r.status_ok || r.status || '');
        console.log(
            r.endpoint.padEnd(50) +
            (r.security || '').padEnd(35) +
            String(sinAuth).padEnd(10) +
            String(conAuth)
        );
    });
    console.log('─'.repeat(100));
    console.log(`Total endpoints probados: ${results.length}`);
}

run().catch(e => { console.error('Fatal:', e); process.exit(1); });
