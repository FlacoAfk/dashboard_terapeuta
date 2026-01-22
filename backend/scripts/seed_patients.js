
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createPatients() {
    // 1. Get Therapists
    const { data: therapists, error: tError } = await supabase
        .from('terapeutas')
        .select('id, correo, nombre')
        .in('correo', ['julianmonj45@gmail.com']);

    if (tError || !therapists) {
        console.error('Error fetching therapists:', tError);
        return;
    }

    // Data for NEW patient
    const patientsData = [
        {
            email: 'julianmonj45@gmail.com', // Julian Medina
            patient: {
                nombre: 'Pedro Pascal', // Another famous name
                identificacion: '99887766',
                edad: 48,
                diagnostico: 'Traumatismo Craneoencefálico Leve',
                activo: true,
                fecha_registro: new Date()
            }
        }
    ];

    for (const pData of patientsData) {
        const therapist = therapists.find(t => t.correo === pData.email);
        if (!therapist) {
            console.log(`Therapist with email ${pData.email} not found.`);
            continue;
        }

        // Create Patient
        const { data: newPatient, error: pError } = await supabase
            .from('pacientes')
            .insert(pData.patient)
            .select()
            .single();

        if (pError) {
            console.error(`Error creating patient for ${therapist.nombre}:`, pError.message);
            continue;
        }

        // Link to Therapist
        const { error: linkError } = await supabase
            .from('terapeuta_paciente')
            .insert({
                id_terapeuta: therapist.id,
                id_paciente: newPatient.id
            });

        if (linkError) {
            console.error(`Error linking patient to ${therapist.nombre}:`, linkError.message);
        } else {
            console.log(`✅ Created patient "${newPatient.nombre}" for therapist "${therapist.nombre}"`);
        }
    }
}

createPatients();
