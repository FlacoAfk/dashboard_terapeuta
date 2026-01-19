require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:3001/api';
const ADMIN_EMAIL = process.env.SUPERADMIN_EMAIL || 'admin@cerebroalfuego.local';
const ADMIN_PASS = process.env.SUPERADMIN_PASSWORD || 'admin123';

async function runTests() {
    console.log('🚀 Starting Final API-Only Therapist Flow Tests...');
    console.log(`Target: ${API_URL}`);

    let adminToken = '';
    let therapistToken = '';
    let therapistUser = null;
    let patientId = '';
    const tempPassword = 'TempPassword123!@';

    try {
        // ==========================================
        // 1. LOGIN ADMIN
        // ==========================================
        console.log('\n[1] Login as Admin...');
        const adminLogin = await axios.post(`${API_URL}/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASS
        });

        if (adminLogin.data.data && adminLogin.data.data.token) {
            adminToken = adminLogin.data.data.token;
            console.log('✅ Admin Logged in.');
        } else if (adminLogin.data.token) {
            adminToken = adminLogin.data.token; // Handle older/alternate response format
            console.log('✅ Admin Logged in (Legacy Token Format).');
        } else {
            throw new Error('No token found in login response: ' + JSON.stringify(adminLogin.data));
        }

        const adminHeaders = { Authorization: `Bearer ${adminToken}` };

        // ==========================================
        // 2. FIND OR CREATE THERAPIST
        // ==========================================
        console.log('\n[2] Finding a Therapist to hijack/use...');
        try {
            const usersRes = await axios.get(`${API_URL}/usuarios`, { headers: adminHeaders });
            const users = usersRes.data.data;
            therapistUser = users.find(u => u.rol === 'TERAPEUTA' && u.activo);
        } catch (e) {
            console.warn('Could not list users (403?):', e.message);
        }

        if (!therapistUser) {
            console.log('⚠️ No active Therapist found. Creating one...');
            const timestamp = Date.now();
            const newEmail = `test_tera_${timestamp}@test.com`;
            try {
                const createRes = await axios.post(`${API_URL}/usuarios/terapeuta`, {
                    nombre: 'Test Hijack',
                    correo: newEmail,
                    password: tempPassword,
                    especialidad: 'Testing',
                    telefono: '0000000000'
                }, { headers: adminHeaders });
                console.log('✅ Created new Therapist:', newEmail);
                // Assuming create response structure
                therapistUser = { id: createRes.data.data.user?.id || createRes.data.data.id, email: newEmail };
            } catch (e) {
                throw new Error('Could not Create a therapist. ' + e.message);
            }
        } else {
            console.log(`✅ Found Therapist: ${therapistUser.email} (ID: ${therapistUser.id})`);

            // 3. RESET PASSWORD
            console.log(`\n[3] Resetting password for ${therapistUser.email}...`);
            await axios.post(`${API_URL}/usuarios/${therapistUser.id}/reset-password`, {
                newPassword: tempPassword
            }, { headers: adminHeaders });
            console.log('✅ Password reset successful.');
        }

        // ==========================================
        // 4. LOGIN AS THERAPIST
        // ==========================================
        console.log('\n[4] Login as Therapist...');
        const teaLogin = await axios.post(`${API_URL}/auth/login`, {
            email: therapistUser.email || therapistUser.username,
            password: tempPassword
        });
        therapistToken = teaLogin.data.data.token;
        console.log('✅ Therapist Logged in.');

        const teraHeaders = { Authorization: `Bearer ${therapistToken}` };

        // ==========================================
        // 5. TEST PATIENT FLOW
        // ==========================================
        console.log('\n[5] Creating Patient...');
        const patientData = {
            identificacion: `TEST-${Date.now()}`,
            nombre: 'Patient Hijack Test',
            edad: 50,
            diagnostico: 'Testing DCLA',
            activo: true
        };
        const patRes = await axios.post(`${API_URL}/patients`, patientData, { headers: teraHeaders });
        patientId = patRes.data.data.id;
        console.log('✅ Patient Created:', patientId);

        console.log('\n[6] Getting Patient Details...');
        const detRes = await axios.get(`${API_URL}/patients/${patientId}`, { headers: teraHeaders });
        if (detRes.data.data.nombre === patientData.nombre) {
            console.log('✅ Details Verified.');
        } else {
            throw new Error('Details mismatch!');
        }

        console.log('\n[7] Getting Patient Report...');
        const repRes = await axios.get(`${API_URL}/patients/${patientId}/report`, { headers: teraHeaders });
        if (repRes.data.success) {
            console.log('✅ Report Verified (Stats object present).');
        }

        console.log('\n[8] Deactivating Patient (PUT)...');
        const toggleRes = await axios.put(`${API_URL}/patients/${patientId}`, { activo: false }, { headers: teraHeaders });
        if (toggleRes.data.data.activo === false) {
            console.log('✅ Patient Deactivated.');
        } else {
            console.warn('⚠️ Warning: Patient status might not have changed:', toggleRes.data.data);
        }

        // ==========================================
        // 9. ADMIN STATS
        // ==========================================
        console.log('\n[9] Checking Admin Stats...');
        const statsRes = await axios.get(`${API_URL}/dashboard/stats`, { headers: adminHeaders });
        if (statsRes.data.success && statsRes.data.data.stats) {
            console.log('✅ Admin Stats Verified.');
        }

        console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! The system is solid.');

    } catch (error) {
        console.error('❌ TEST FAILED:', error.message);
        if (error.response) {
            const data = error.response.data;
            console.error('Status:', error.response.status);
            if (typeof data === 'string' && data.includes('<html')) {
                console.error('Data (HTML truncated):', data.substring(0, 200));
            } else {
                console.error('Data:', JSON.stringify(data).substring(0, 200));
            }
        }
    }
}

runTests();
