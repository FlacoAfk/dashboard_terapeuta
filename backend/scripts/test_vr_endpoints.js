const axios = require('axios');
const colors = require('colors');

// Configuration
const BASE_URL = 'http://localhost:3001';
const UNITY_API_KEY = '5f8a9b2c3d4e5f60718293a4b5c6d7e8'; // From .env
const THERAPIST_EMAIL = 'julianmonj45@gmail.com';
const THERAPIST_PASSWORD = 'Julianmed45@';

// Helper for colored logs
const log = {
    info: (msg) => console.log(`[INFO] ${msg}`.cyan),
    success: (msg) => console.log(`[SUCCESS] ${msg}`.green),
    error: (msg) => console.log(`[ERROR] ${msg}`.red),
    warn: (msg) => console.log(`[WARN] ${msg}`.yellow),
    data: (msg) => console.log(JSON.stringify(msg, null, 2).gray)
};

async function runTests() {
    log.info('Iniciando Pruebas de Endpoints VR...');

    let token = '';
    let sessionId = '';
    let startToken = '';
    const participantCode = `TEST_${Math.floor(Math.random() * 10000)}`;

    try {
        // -----------------------------------------------------------------------
        // 1. AUTHENTICATION (Login as Therapist)
        // -----------------------------------------------------------------------
        log.info('1. Autenticando Terapeuta...');
        try {
            const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
                email: THERAPIST_EMAIL,
                password: THERAPIST_PASSWORD
            });
            token = loginRes.data.data.token;
            if (!token) throw new Error('No token received');
            log.success('Login exitoso. Token recibido.');
        } catch (error) {
            log.error(`Login falló: ${error.message}`);
            if (error.response) log.error(JSON.stringify(error.response.data));
            process.exit(1);
        }

        const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };

        // -----------------------------------------------------------------------
        // 2. CREATE SESSION (POST /api/sessions)
        // -----------------------------------------------------------------------
        log.info(`2. Creando Sesión VR para participante: ${participantCode}...`);
        try {
            const createRes = await axios.post(`${BASE_URL}/api/sessions`, {
                participant_code: participantCode,
                recipe_id: 'tinto'
            }, authHeaders);

            sessionId = createRes.data.session_id;
            startToken = createRes.data.start_token;

            if (!sessionId || !startToken) throw new Error('Invalid response from create session');

            log.success(`Sesión creada. ID: ${sessionId}, Token: ${startToken}`);
            log.data(createRes.data);
        } catch (error) {
            log.error(`Creación de sesión falló: ${error.message}`);
            if (error.response) log.error(JSON.stringify(error.response.data));
            throw error;
        }

        // -----------------------------------------------------------------------
        // 3. LIST SESSIONS (GET /api/sessions/recipe-sessions)
        // -----------------------------------------------------------------------
        log.info('3. Listando sesiones creadas por el terapeuta...');
        try {
            const listRes = await axios.get(`${BASE_URL}/api/sessions/recipe-sessions?status=ACTIVE`, authHeaders);
            const foundSession = listRes.data.data.find(s => s.id === sessionId);

            if (foundSession) {
                log.success('Sesión encontrada en la lista.');
            } else {
                log.warn('La sesión creada no aparece en la lista (revisar filtros o paginación?).');
            }
            // log.data(listRes.data);
        } catch (error) {
            log.error(`Listado de sesiones falló: ${error.message}`);
        }

        // -----------------------------------------------------------------------
        // 4. FETCH BY TOKEN (GET /api/sessions/by-token/:token) - UNITY SIDE
        // -----------------------------------------------------------------------
        log.info(`4. Consultando sesión por token: ${startToken} (Simulando Unity)...`);
        try {
            const fetchRes = await axios.get(`${BASE_URL}/api/sessions/by-token/${startToken}`, {
                headers: { 'X-API-Key': UNITY_API_KEY }
            });

            if (fetchRes.data.session_id === sessionId && fetchRes.data.recipe_id === 'tinto') {
                log.success('Consulta por token exitosa y datos coinciden.');
            } else {
                log.error('Datos de sesión no coinciden.');
            }
            log.data(fetchRes.data);
        } catch (error) {
            log.error(`Consulta por token falló: ${error.message}`);
            if (error.response) log.error(JSON.stringify(error.response.data));
        }

        // -----------------------------------------------------------------------
        // 5. ATTEMPT DUPLICATE (Edge Case)
        // -----------------------------------------------------------------------
        log.info('5. Intentando crear duplicado (debe fallar)...');
        try {
            await axios.post(`${BASE_URL}/api/sessions`, {
                participant_code: participantCode,
                recipe_id: 'huevos'
            }, authHeaders);
            log.error('¡FALLO! Se permitió crear duplicado para un participante activo.');
        } catch (error) {
            if (error.response && error.response.status === 409) {
                log.success('El sistema bloqueó correctamente el duplicado (409 Conflict).');
            } else {
                log.warn(`Error inesperado al probar duplicado: ${error.message}`);
            }
        }

        // -----------------------------------------------------------------------
        // 6. FINISH SESSION (PUT /api/sessions/:id/finish) - UNITY SIDE
        // -----------------------------------------------------------------------
        log.info(`6. Finalizando sesión: ${sessionId} (Simulando Unity)...`);
        try {
            const finishRes = await axios.put(`${BASE_URL}/api/sessions/${sessionId}/finish`, {}, {
                headers: { 'X-API-Key': UNITY_API_KEY }
            });

            if (finishRes.data.status === 'FINISHED') {
                log.success('Sesión finalizada correctamente.');
            } else {
                log.error('El estado no cambió a FINISHED.');
            }
        } catch (error) {
            log.error(`Finalizar sesión falló: ${error.message}`);
            if (error.response) log.error(JSON.stringify(error.response.data));
        }

        // -----------------------------------------------------------------------
        // 7. VERIFY STATUS AFTER FINISH
        // -----------------------------------------------------------------------
        log.info('7. Verificando estado final...');
        try {
            const listRes = await axios.get(`${BASE_URL}/api/sessions/recipe-sessions?participant_code=${participantCode}`, authHeaders);
            const finishedSession = listRes.data.data.find(s => s.id === sessionId);
            if (finishedSession && finishedSession.status === 'FINISHED') {
                log.success('Estado actualizado correctamente en la lista.');
            } else {
                log.error(`Estado incorrecto: ${finishedSession ? finishedSession.status : 'No encontrada'}`);
            }
        } catch (error) {
            log.error(`Verificación final falló: ${error.message}`);
        }

    } catch (err) {
        log.error(`Error global: ${err.message}`);
    } finally {
        log.info('Pruebas finalizadas.');
    }
}

runTests();
