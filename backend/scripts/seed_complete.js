/**
 * ========================================
 * SCRIPT: Seed Database con Datos Realistas
 * ========================================
 * 
 * Crea datos realistas de prueba para el sistema:
 * - 1 Superadmin
 * - 3 Terapeutas activos
 * - 12 Pacientes con datos demográficos colombianos
 * - Sesiones VR del videojuego
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Datos realistas colombianos
const NOMBRES_MASCULINOS = ['Carlos', 'José', 'Luis', 'Andrés', 'Jorge', 'Miguel', 'Rafael', 'Pedro', 'Fernando', 'Ricardo'];
const NOMBRES_FEMENINOS = ['María', 'Ana', 'Luz', 'Carmen', 'Rosa', 'Patricia', 'Claudia', 'Gloria', 'Sandra', 'Martha'];
const APELLIDOS = ['García', 'Rodríguez', 'Martínez', 'López', 'González', 'Hernández', 'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Díaz', 'Moreno', 'Vargas', 'Castro', 'Ortiz'];

const DIAGNOSTICOS = [
    'Deterioro Cognitivo Leve',
    'Alzheimer etapa temprana',
    'Demencia vascular leve',
    'Deterioro cognitivo asociado a la edad',
    'DCL amnésico',
    'Enfermedad de Parkinson con deterioro cognitivo',
    'Traumatismo craneoencefálico - rehabilitación',
    'ACV - rehabilitación cognitiva'
];

const ACTIVIDADES_VR = [
    { id: 'tinto_easy_01', nombre: 'Preparar Tinto - Fácil' },
    { id: 'tinto_medium_01', nombre: 'Preparar Tinto - Medio' },
    { id: 'tinto_hard_01', nombre: 'Preparar Tinto - Difícil' },
    { id: 'huevos_easy_01', nombre: 'Preparar Huevos - Fácil' },
    { id: 'arepa_easy_01', nombre: 'Preparar Arepa - Fácil' }
];

const ERROR_CODES = [
    { code: 'STOVE_ON_NO_POT', message: 'Estufa encendida sin olla' },
    { code: 'WRONG_INGREDIENT', message: 'Ingrediente incorrecto agregado' },
    { code: 'SPILL_COFFEE', message: 'Café derramado' },
    { code: 'FORGOT_SUGAR', message: 'Olvidó agregar azúcar' },
    { code: 'BURNT_FOOD', message: 'Comida quemada' },
    { code: 'WRONG_ORDER', message: 'Orden de pasos incorrecto' }
];

// Generar número de cédula colombiano realista
function generarCedula() {
    const prefijo = Math.floor(Math.random() * 90) + 10;
    const resto = Math.floor(Math.random() * 9000000) + 1000000;
    return `${prefijo}${resto}`;
}

// Generar edad entre rango
function generarEdad(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Seleccionar aleatorio de array
function random(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Generar fecha aleatoria en los últimos N días
function randomDate(daysBack) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
    date.setHours(Math.floor(Math.random() * 8) + 8, Math.floor(Math.random() * 60), 0);
    return date;
}

// Generar sesión VR realista
function generarSesionVR(participantId, fecha) {
    const actividad = random(ACTIVIDADES_VR);
    const startTime = new Date(fecha);
    const totalSeconds = Math.floor(Math.random() * 300) + 180; // 3-8 minutos
    const endTime = new Date(startTime.getTime() + totalSeconds * 1000);

    const sets = [];
    const setNames = ['Ingredients', 'Utensils', 'Preparation', 'Organization'];
    let currentTime = new Date(startTime);

    for (const setName of setNames) {
        const setDuration = Math.floor(totalSeconds / 4) + Math.floor(Math.random() * 30) - 15;
        const setEnd = new Date(currentTime.getTime() + setDuration * 1000);

        const numErrors = Math.random() > 0.7 ? Math.floor(Math.random() * 3) : 0;
        const errors = [];
        for (let i = 0; i < numErrors; i++) {
            const err = random(ERROR_CODES);
            errors.push({
                code: err.code,
                message: err.message,
                timestampIso: new Date(currentTime.getTime() + Math.random() * setDuration * 1000).toISOString()
            });
        }

        sets.push({
            setName,
            startedAtIso: currentTime.toISOString(),
            endedAtIso: setEnd.toISOString(),
            durationSeconds: setDuration,
            blockedCount: Math.floor(Math.random() * 3),
            dropsCount: Math.floor(Math.random() * 2),
            releasesCount: Math.floor(Math.random() * 5),
            errors,
            completion: {
                coffeeAdded: setName === 'Preparation',
                sugarAdded: setName === 'Preparation' && Math.random() > 0.3,
                cupCoffeeAmount01: setName === 'Preparation' ? Math.random() * 0.3 + 0.7 : 0
            },
            returnedObjects: setName === 'Organization' ? ['Cuchara', 'Taza', 'Azucarera'] : []
        });

        currentTime = setEnd;
    }

    const totalErrors = sets.reduce((sum, s) => sum + s.errors.length, 0);
    const totalDrops = sets.reduce((sum, s) => sum + s.dropsCount, 0);
    const totalReleases = sets.reduce((sum, s) => sum + s.releasesCount, 0);

    return {
        schemaVersion: '1.0',
        participantId,
        activityId: actividad.id,
        startedAtIso: startTime.toISOString(),
        endedAtIso: endTime.toISOString(),
        totalSeconds,
        summary: {
            totalErrors,
            totalDrops,
            totalReleases,
            setsCompleted: 4
        },
        sets
    };
}

async function seed() {
    console.log('🌱 Iniciando seed de base de datos...\n');

    // Obtener credenciales del superadmin desde .env
    const superadminEmail = process.env.SUPERADMIN_EMAIL || 'admin@cerebroalfuego.com';
    const superadminPassword = process.env.SUPERADMIN_PASSWORD || 'Admin@123456';

    // 1. Crear Superadmin (borrar existente primero si hay)
    console.log('👤 Creando Superadministrador...');

    // Intentar borrar si ya existe
    await supabase.from('usuarios').delete().eq('email', superadminEmail);

    const adminPassword = await bcrypt.hash(superadminPassword, 10);
    const { data: admin, error: adminError } = await supabase
        .from('usuarios')
        .insert({
            email: superadminEmail,
            password_hash: adminPassword,
            rol: 'SUPERADMIN',
            activo: true
        })
        .select()
        .single();

    if (adminError) {
        console.error('❌ Error creando admin:', adminError.message);
        return;
    }
    console.log('✅ Superadmin creado:', admin.email);

    // 2. Crear Terapeutas
    console.log('\n👨‍⚕️ Creando Terapeutas...');
    const terapeutasData = [
        { nombre: 'Dra. Carolina Mejía Ospina', email: 'carolina.mejia@cerebroalfuego.com', especialidad: 'Neuropsicología' },
        { nombre: 'Dr. Alejandro Restrepo Gómez', email: 'alejandro.restrepo@cerebroalfuego.com', especialidad: 'Geriatría Cognitiva' },
        { nombre: 'Dra. Valentina Castro Ruiz', email: 'valentina.castro@cerebroalfuego.com', especialidad: 'Terapia Ocupacional' }
    ];

    const terapeutas = [];
    const terapeutaPassword = await bcrypt.hash('Terapeuta@123', 10);

    for (const t of terapeutasData) {
        // Borrar usuario existente si hay
        await supabase.from('usuarios').delete().eq('email', t.email);

        const { data: usuario, error: userError } = await supabase
            .from('usuarios')
            .insert({
                email: t.email,
                password_hash: terapeutaPassword,
                rol: 'TERAPEUTA',
                activo: true
            })
            .select()
            .single();

        if (userError) {
            console.error(`❌ Error creando usuario ${t.email}:`, userError.message);
            continue;
        }

        const { data: terapeuta, error: terapError } = await supabase
            .from('terapeutas')
            .insert({
                id_usuario: usuario.id,
                nombre: t.nombre,
                especialidad: t.especialidad,
                correo: t.email,
                telefono: `3${Math.floor(Math.random() * 100000000 + 100000000)}`
            })
            .select()
            .single();

        if (terapError) {
            console.error(`❌ Error creando terapeuta:`, terapError.message);
            continue;
        }

        terapeutas.push({ ...terapeuta, nombre: t.nombre, email: t.email });
        console.log(`✅ Terapeuta: ${t.nombre}`);
    }

    // 3. Crear Pacientes
    console.log('\n🧑‍🦳 Creando Pacientes...');
    const pacientes = [];

    for (let i = 0; i < 12; i++) {
        const esMujer = Math.random() > 0.5;
        const nombre = esMujer ? random(NOMBRES_FEMENINOS) : random(NOMBRES_MASCULINOS);
        const apellido1 = random(APELLIDOS);
        const apellido2 = random(APELLIDOS);
        const nombreCompleto = `${nombre} ${apellido1} ${apellido2}`;
        const edad = generarEdad(60, 85);
        const cedula = generarCedula();
        const terapeuta = random(terapeutas);

        const { data: paciente, error: pacError } = await supabase
            .from('pacientes')
            .insert({
                nombre: nombreCompleto,
                identificacion: cedula,
                edad: edad,
                diagnostico: random(DIAGNOSTICOS),
                activo: true
            })
            .select()
            .single();

        if (pacError) {
            console.error(`❌ Error creando paciente:`, pacError.message);
            continue;
        }

        // Vincular paciente con terapeuta
        await supabase.from('terapeuta_paciente').insert({
            id_terapeuta: terapeuta.id,
            id_paciente: paciente.id,
            estado: 'ACTIVO'
        });

        pacientes.push({ ...paciente, cedula });
        console.log(`✅ Paciente: ${nombreCompleto} (${edad} años) → ${terapeuta.nombre}`);
    }

    // 4. Crear Sesiones VR
    console.log('\n🎮 Creando Sesiones VR...');
    let vrSessionCount = 0;

    for (const paciente of pacientes) {
        const numSesiones = Math.floor(Math.random() * 5) + 2; // 2-6 sesiones por paciente

        for (let i = 0; i < numSesiones; i++) {
            const fecha = randomDate(60); // Últimos 60 días
            const sessionData = generarSesionVR(paciente.identificacion, fecha);

            // Insertar sesión principal
            const { data: session, error: sessError } = await supabase
                .from('vr_session_results')
                .insert({
                    schema_version: sessionData.schemaVersion,
                    participant_id: sessionData.participantId,
                    activity_id: sessionData.activityId,
                    started_at: sessionData.startedAtIso,
                    ended_at: sessionData.endedAtIso,
                    total_seconds: sessionData.totalSeconds,
                    summary_total_errors: sessionData.summary.totalErrors,
                    summary_total_drops: sessionData.summary.totalDrops,
                    summary_total_releases: sessionData.summary.totalReleases,
                    summary_sets_completed: sessionData.summary.setsCompleted,
                    raw_payload: sessionData
                })
                .select()
                .single();

            if (sessError) {
                console.error(`❌ Error creando sesión VR:`, sessError.message);
                continue;
            }

            // Insertar sets
            for (const set of sessionData.sets) {
                const { data: setResult, error: setError } = await supabase
                    .from('vr_set_results')
                    .insert({
                        session_id: session.id,
                        set_name: set.setName,
                        started_at: set.startedAtIso,
                        ended_at: set.endedAtIso,
                        duration_seconds: set.durationSeconds,
                        blocked_count: set.blockedCount,
                        drops_count: set.dropsCount,
                        releases_count: set.releasesCount,
                        completion_coffee_added: set.completion.coffeeAdded,
                        completion_sugar_added: set.completion.sugarAdded,
                        completion_cup_coffee_amount_01: set.completion.cupCoffeeAmount01
                    })
                    .select()
                    .single();

                if (setError) continue;

                // Insertar errores
                for (const error of set.errors) {
                    await supabase.from('vr_set_errors').insert({
                        set_id: setResult.id,
                        code: error.code,
                        message: error.message,
                        occurred_at: error.timestampIso
                    });
                }

                // Insertar objetos retornados
                for (const obj of set.returnedObjects) {
                    await supabase.from('vr_set_returned_objects').insert({
                        set_id: setResult.id,
                        object_name: obj
                    });
                }
            }

            vrSessionCount++;
        }
    }
    console.log(`✅ Creadas ${vrSessionCount} sesiones VR`);

    // 5. Crear eventos de auditoría
    console.log('\n📋 Creando eventos de auditoría...');
    await supabase.from('auditoria').insert([
        { id_usuario: admin.id, tipo_accion: 'SISTEMA_INICIADO', descripcion: 'Sistema inicializado correctamente' },
        { id_usuario: admin.id, tipo_accion: 'SEED_EJECUTADO', descripcion: `Pacientes: ${pacientes.length}, Terapeutas: ${terapeutas.length}, Sesiones VR: ${vrSessionCount}` }
    ]);
    console.log('✅ Eventos de auditoría creados');

    // Resumen final
    console.log('\n' + '='.repeat(50));
    console.log('🎉 SEED COMPLETADO');
    console.log('='.repeat(50));
    console.log(`
📊 RESUMEN:
   👤 Superadmin: ${superadminEmail} / ${superadminPassword}
   👨‍⚕️ Terapeutas: ${terapeutas.length} (contraseña: Terapeuta@123)
      - carolina.mejia@cerebroalfuego.com
      - alejandro.restrepo@cerebroalfuego.com
      - valentina.castro@cerebroalfuego.com
   🧑‍🦳 Pacientes: ${pacientes.length}
   🎮 Sesiones VR: ${vrSessionCount}
`);
}

seed().catch(console.error);

