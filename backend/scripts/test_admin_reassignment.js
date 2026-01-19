require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:3001/api';
const ADMIN_EMAIL = process.env.SUPERADMIN_EMAIL || 'admin@cerebroalfuego.local';
const ADMIN_PASS = process.env.SUPERADMIN_PASSWORD || 'admin123';

async function runTests() {
    console.log('🚀 Starting Admin Reassignment Flow Tests...');

    let adminToken = '';
    let originTherapist = null;
    let targetTherapist1 = null;
    let targetTherapist2 = null;

    try {
        // 1. LOGIN ADMIN
        console.log('\n[1] Login as Admin...');
        const adminLogin = await axios.post(`${API_URL}/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASS
        });
        adminToken = adminLogin.data.data.token || adminLogin.data.token;
        const headers = { Authorization: `Bearer ${adminToken}` };
        console.log('✅ Admin Logged in.');

        // 2. CREATE THERAPISTS
        console.log('\n[2] Creating 3 Test Therapists...');
        const createTherapist = async (name) => {
            const email = `test_reassign_${Date.now()}_${Math.floor(Math.random() * 1000)}@test.com`;
            const res = await axios.post(`${API_URL}/usuarios/terapeuta`, {
                nombre: name,
                correo: email,
                password: 'TempPassword123!@',
                especialidad: 'Testing'
            }, { headers });
            return { id: res.data.data.terapeuta.id, userId: res.data.data.usuario.id, name, email };
        };

        originTherapist = await createTherapist('Origin Therapist');
        targetTherapist1 = await createTherapist('Target Therapist A');
        targetTherapist2 = await createTherapist('Target Therapist B');
        console.log(`✅ Created: Origin(${originTherapist.id}), TargetA(${targetTherapist1.id}), TargetB(${targetTherapist2.id})`);

        // 3. CREATE PATIENTS FOR ORIGIN
        console.log('\n[3] Creating 5 Patients for Origin Therapist...');
        // We need Origin Therapist Token to create patients initially
        // LOGIN AS ORIGIN
        const originLogin = await axios.post(`${API_URL}/auth/login`, {
            email: originTherapist.email,
            password: 'TempPassword123!@'
        });
        const originToken = originLogin.data.data.token;
        const originHeaders = { Authorization: `Bearer ${originToken}` };

        const patientIds = [];
        for (let i = 0; i < 5; i++) {
            const pRes = await axios.post(`${API_URL}/patients`, {
                identificacion: `PAT-REASSIGN-${Date.now()}-${i}`,
                nombre: `Patient To Move ${i}`,
                edad: 30 + i,
                diagnostico: 'Test'
            }, { headers: originHeaders });
            patientIds.push(pRes.data.data.id);
        }
        console.log(`✅ Created ${patientIds.length} patients assigned to Origin.`);

        // 4. VERIFY COUNTS BEFORE REASSIGNMENT
        console.log('\n[4] Verifying Patient Counts (Admin View)...');
        const getUsers = await axios.get(`${API_URL}/usuarios`, { headers });
        const originUser = getUsers.data.data.find(u => u.id === originTherapist.userId);
        console.log(`Origin Patient Count: ${originUser.pacientes_count}`);
        if (originUser.pacientes_count !== 5) throw new Error('Origin should have 5 patients');

        // 5. REASSIGN PATIENTS (Mocking Frontend Round-Robin Logic)
        console.log('\n[5] Reassigning Patients (Round Robin: A, B, A, B, A)...');
        const targets = [targetTherapist1.id, targetTherapist2.id];

        const assignments = patientIds.map((pid, index) => ({
            patientId: pid,
            therapistId: targets[index % targets.length] // Simulating the frontend logic I fixed
        }));

        for (const assignment of assignments) {
            await axios.post(`${API_URL}/patients/${assignment.patientId}/assign`, {
                id_terapeuta: assignment.therapistId
            }, { headers });
        }
        console.log('✅ Reassigned all patients.');

        // 6. DEACTIVATE ORIGIN THERAPIST
        console.log('\n[6] Deactivating Origin Therapist...');
        await axios.put(`${API_URL}/usuarios/${originTherapist.userId}/toggle-estado`, {}, { headers });
        console.log('✅ Origin Therapist Deactivated.');

        // 7. FINAL VERIFICATION
        console.log('\n[7] Verifying Final State...');
        const finalUsersRes = await axios.get(`${API_URL}/usuarios`, { headers });
        const finalOrigin = finalUsersRes.data.data.find(u => u.id === originTherapist.userId);
        const finalTarget1 = finalUsersRes.data.data.find(u => u.id === targetTherapist1.userId);
        const finalTarget2 = finalUsersRes.data.data.find(u => u.id === targetTherapist2.userId);

        console.log(`Final Origin Status: Active=${finalOrigin.activo}, Patients=${finalOrigin.pacientes_count}`);
        console.log(`Final Target A Patients: ${finalTarget1.pacientes_count}`);
        console.log(`Final Target B Patients: ${finalTarget2.pacientes_count}`);

        if (finalOrigin.activo !== false) throw new Error('Origin should be inactive');
        if (finalOrigin.pacientes_count !== 0) throw new Error('Origin should have 0 patients');
        if (finalTarget1.pacientes_count !== 3) throw new Error('Target A should have 3 patients'); // 0, 2, 4
        if (finalTarget2.pacientes_count !== 2) throw new Error('Target B should have 2 patients'); // 1, 3

        console.log('\n🎉 REASSIGNMENT FLOW VERIFIED SUCCESSFULLY!');

    } catch (error) {
        console.error('❌ TEST FAILED:', error.message);
        if (error.response) {
            console.error('Data:', JSON.stringify(error.response.data).substring(0, 200));
        }
    }
}

runTests();
