const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function createSession() {
    // 1. Get Patient Locked
    const { data: patients, error: pError } = await supabase
        .from('pacientes')
        .select('id')
        .eq('identificacion', '123456789') // Patient Locked
        .single();

    if (pError || !patients) {
        console.error('Patient Locked not found');
        return;
    }

    // 2. Get Therapist Dr. Lock
    const { data: users, error: uError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', 'lock@test.com')
        .single();

    if (uError || !users) {
        console.error('Dr. Lock not found');
        return;
    }

    // 3. Insert Session
    const { data, error } = await supabase
        .from('sesiones')
        .insert({
            id_paciente: patients.id,
            id_usuario: users.id,
            fecha_inicio: new Date(),
            fecha_fin: new Date(),
            actividad: 'Test Activity',
            duracion: 60,
            puntaje: 100,
            metricas: { test: true }
        });

    if (error) {
        console.error('Error creating session:', error);
    } else {
        console.log('Session created successfully for Patient Locked');
    }
}

createSession();
