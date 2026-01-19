require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:3001/api';
const ADMIN_EMAIL = process.env.SUPERADMIN_EMAIL || 'admin@cerebroalfuego.local';
const ADMIN_PASS = process.env.SUPERADMIN_PASSWORD || 'admin123';

async function setup() {
    console.log('🚀 Setting up Browser Reassignment Test Data...');

    try {
        // 1. Login Admin
        const adminLogin = await axios.post(`${API_URL}/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASS
        });
        const token = adminLogin.data.data.token || adminLogin.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        // 2. Create Source Therapist
        const tsName = `Dr. Source ${Date.now()}`;
        const sourceRes = await axios.post(`${API_URL}/usuarios/terapeuta`, {
            nombre: tsName,
            correo: `source_${Date.now()}@test.com`,
            password: 'Password123!',
            especialidad: 'General'
        }, { headers });
        const sourceId = sourceRes.data.data.terapeuta.id;
        const sourceUserId = sourceRes.data.data.usuario.id;

        // 3. Create Target Therapists
        const t1Name = `Dr. Target A`;
        await axios.post(`${API_URL}/usuarios/terapeuta`, {
            nombre: t1Name,
            correo: `targetA_${Date.now()}@test.com`,
            password: 'Password123!',
            especialidad: 'A'
        }, { headers });

        const t2Name = `Dr. Target B`;
        await axios.post(`${API_URL}/usuarios/terapeuta`, {
            nombre: t2Name,
            correo: `targetB_${Date.now()}@test.com`,
            password: 'Password123!',
            especialidad: 'B'
        }, { headers });

        // 4. Create Patients for Source
        // Need to login as Source to create patients easily (or use admin seed, but loop is fine)
        // We'll use the hack: Create unassigned patients then assign them?
        // Or just login as Source.
        const sourceLogin = await axios.post(`${API_URL}/auth/login`, {
            email: sourceRes.data.data.usuario.email,
            password: 'Password123!'
        });
        const sourceToken = sourceLogin.data.data.token;

        for (let i = 1; i <= 3; i++) {
            await axios.post(`${API_URL}/patients`, {
                identificacion: `BROWSER-TEST-${Date.now()}-${i}`,
                nombre: `Paciente Browser ${i}`,
                edad: 20 + i,
                diagnostico: 'Test UI'
            }, { headers: { Authorization: `Bearer ${sourceToken}` } });
        }

        console.log('✅ DATA READY:');
        console.log(`- TARGET TO DEACTIVATE: "${tsName}"`);
        console.log(`- HAS 3 PATIENTS`);
        console.log(`- AVAILABLE TARGETS: "${t1Name}", "${t2Name}"`);

    } catch (error) {
        console.error('Setup failed:', error.message);
    }
}

setup();
