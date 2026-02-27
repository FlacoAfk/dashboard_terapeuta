/**
 * ========================================
 * SCRIPT: Seed Database con Datos Realistas
 * ========================================
 * 
 * Crea datos realistas de prueba para el sistema
 * "Cerebro al Fuego" — Videojuego VR de cocina colombiana
 * 
 * Contenido:
 * - 1 Superadmin (desde .env)
 * - 3 Terapeutas activos de prueba
 * - 12 Pacientes adultos mayores con datos demográficos colombianos
 * - ~40-70 Sesiones VR del videojuego con sets, errores y observaciones
 * - Eventos de auditoría realistas en formato JSON
 * 
 * Compatible con schema actual (bd_schema.sql v1.8.1)
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const { VALID_RECIPE_IDS } = require('../src/constants/recipes');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ========================================
// DATOS REALISTAS COLOMBIANOS
// ========================================

const NOMBRES_MASCULINOS = ['Carlos', 'José', 'Luis', 'Andrés', 'Jorge', 'Miguel', 'Rafael', 'Pedro', 'Fernando', 'Ricardo'];
const NOMBRES_FEMENINOS = ['María', 'Ana', 'Luz', 'Carmen', 'Rosa', 'Patricia', 'Claudia', 'Gloria', 'Sandra', 'Martha'];
const APELLIDOS = ['García', 'Rodríguez', 'Martínez', 'López', 'González', 'Hernández', 'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Díaz', 'Moreno', 'Vargas', 'Castro', 'Ortiz', 'Restrepo', 'Mejía', 'Ospina'];

const DIAGNOSTICOS = [
    'Deterioro Cognitivo Leve (DCL amnésico)',
    'Alzheimer etapa temprana — seguimiento neuropsicológico',
    'Demencia vascular leve — programa de estimulación',
    'Deterioro cognitivo asociado a la edad',
    'DCL multidominio — estimulación cognitiva integral',
    'Enfermedad de Parkinson con deterioro cognitivo leve',
    'Traumatismo craneoencefálico — rehabilitación cognitiva',
    'ACV isquémico — rehabilitación de funciones ejecutivas',
    'Deterioro cognitivo post-COVID — seguimiento',
    'DCL amnésico de dominio múltiple'
];

// Actividades del videojuego VR — cocina colombiana
const ACTIVIDADES_VR = [
    { id: 'tinto_easy_01', nombre: 'Preparar Tinto - Fácil' },
    { id: 'tinto_medium_01', nombre: 'Preparar Tinto - Medio' },
    { id: 'tinto_hard_01', nombre: 'Preparar Tinto - Difícil' },
    { id: 'huevos_easy_01', nombre: 'Preparar Huevos Pericos - Fácil' },
    { id: 'huevos_medium_01', nombre: 'Preparar Huevos Pericos - Medio' },
    { id: 'arepa_easy_01', nombre: 'Preparar Arepa con Queso - Fácil' },
    { id: 'arepa_medium_01', nombre: 'Preparar Arepa con Queso - Medio' }
];

// Códigos de error del videojuego
const ERROR_CODES = [
    { code: 'WRONG_INGREDIENT', message: 'Ingrediente incorrecto seleccionado', contextos: ['Sal', 'Azúcar', 'Harina', 'Aceite'] },
    { code: 'WRONG_ORDER', message: 'Orden de pasos incorrecto', contextos: ['Estufa', 'Olla', 'Sartén', 'Taza'] },
    { code: 'STOVE_ON_NO_POT', message: 'Estufa encendida sin recipiente', contextos: ['Estufa'] },
    { code: 'SPILL', message: 'Líquido derramado', contextos: ['Café', 'Agua', 'Aceite'] },
    { code: 'BURNT_FOOD', message: 'Alimento quemado por tiempo excesivo', contextos: ['Huevos', 'Arepa', 'Café'] },
    { code: 'FORGOT_STEP', message: 'Paso omitido en la secuencia', contextos: ['Cuchara', 'Taza', 'Plato'] },
    { code: 'WRONG_UTENSIL', message: 'Utensilio incorrecto utilizado', contextos: ['Tenedor', 'Cuchillo', 'Espátula'] }
];

// Observaciones clínicas realistas para sesiones revisadas
const OBSERVACIONES_CLINICAS = [
    'Paciente completó la actividad sin dificultades significativas. Buena orientación espacial y secuenciación de pasos. Se recomienda avanzar a nivel medio.',
    'Se observó lentitud en la identificación de utensilios. La memoria de trabajo parece afectada — confunde ingredientes similares. Mantener nivel fácil por 2 semanas más.',
    'Mejoría notable respecto a sesión anterior. Redujo errores de secuenciación. La estimulación cognitiva muestra efecto positivo en funciones ejecutivas.',
    'Paciente mostró frustración al no recordar la lista de ingredientes. Se sugiere mayor acompañamiento del terapeuta durante las primeras sesiones.',
    'Desempeño estable. Tiempo de reacción adecuado. Aciertos en selección de ingredientes. Continuar con frecuencia actual de sesiones.',
    'Dificultad en la planificación de pasos. El paciente tiende a manipular objetos sin seguir la secuencia lógica. Trabajar flexibilidad cognitiva.',
    'Excelente sesión. El paciente demostró buena memoria prospectiva y completó todos los pasos en orden. Se recomienda probar nivel intermedio.',
    'Se evidencia deterioro respecto a la línea base. Aumentaron los errores de omisión. Evaluar posible ajuste farmacológico con neurología.',
    'Primera sesión del paciente. Se observa buena disposición pero dificultad con los controles VR. Adaptar próxima sesión para familiarización.',
    'Paciente completó la actividad pero con múltiples errores de secuencia. La atención sostenida se ve comprometida después del minuto 3.',
    'Sesión interrumpida por fatiga del paciente (alerta de descanso activada). Lo completado muestra rendimiento dentro de lo esperado.',
    'Buen manejo de objetos y reconocimiento de utensilios. Errores mínimos. El paciente reporta sentirse cómodo con el entorno virtual.'
];

// Sets/etapas del videojuego
const SET_NAMES = ['Reconocimiento', 'Recolección', 'Preparación', 'Organización'];

// Recetas disponibles (Match con constraint de BD)
const RECIPE_IDS = VALID_RECIPE_IDS;

const RETURNABLE_OBJECTS = [
    'Cuchara', 'Taza', 'Plato', 'Sartén', 'Olla', 'Espátula', 'Vaso medidor'
];

// ========================================
// FUNCIONES UTILITARIAS
// ========================================

function generarCedula() {
    const prefijo = Math.floor(Math.random() * 90) + 10;
    const resto = Math.floor(Math.random() * 9000000) + 1000000;
    return `${prefijo}${resto}`;
}

function generarEdad(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function random(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generarTelefonoColombia() {
    const prefijos = ['300', '301', '302', '310', '311', '312', '313', '314', '315', '316', '317', '318', '319', '320', '321', '322', '323', '350'];
    return `${random(prefijos)}${Math.floor(Math.random() * 9000000 + 1000000)}`;
}

// Genera fecha aleatoria en los últimos N días, con opción de forzar "hoy" o "esta semana"
function randomDate(daysBack) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
    date.setHours(Math.floor(Math.random() * 8) + 8, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
    return date;
}

function todayDate() {
    const date = new Date();
    date.setHours(Math.floor(Math.random() * 4) + 8, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
    return date;
}

function thisWeekDate() {
    const date = new Date();
    const dayOfWeek = date.getDay();
    const daysBack = Math.floor(Math.random() * Math.max(dayOfWeek, 1));
    date.setDate(date.getDate() - daysBack);
    date.setHours(Math.floor(Math.random() * 8) + 8, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
    return date;
}

function buildErrorText(errorOrMessage = '') {
    if (!errorOrMessage) return '';
    if (typeof errorOrMessage === 'string') return errorOrMessage;

    return [
        errorOrMessage.message,
        errorOrMessage.details,
        errorOrMessage.hint
    ]
        .filter(Boolean)
        .join(' ');
}

function isMissingTableError(errorOrMessage = '') {
    const code = String(errorOrMessage?.code || '');
    const message = buildErrorText(errorOrMessage).toLowerCase();

    return (
        code === 'PGRST205' ||
        (message.includes('relation') && message.includes('does not exist')) ||
        message.includes('could not find the table')
    );
}

function isMissingColumnError(errorOrMessage = '') {
    const message = buildErrorText(errorOrMessage).toLowerCase();
    return message.includes('column') && message.includes('does not exist');
}

function buildDeleteQuery(table, strategy) {
    let query = supabase.from(table).delete();

    if (strategy.type === 'notnull') {
        return query.not(strategy.column, 'is', null);
    }

    if (strategy.type === 'gte') {
        return query.gte(strategy.column, strategy.value);
    }

    if (strategy.type === 'neq') {
        return query.neq(strategy.column, strategy.value);
    }

    return query.gte('id', 0);
}

async function deleteWithFallbackStrategies(table, strategies) {
    const fallbackStrategies = Array.isArray(strategies) ? strategies : [strategies];
    let lastError = null;

    for (const strategy of fallbackStrategies) {
        const result = await buildDeleteQuery(table, strategy);

        if (!result.error) {
            return { ok: true };
        }

        if (isMissingTableError(result.error)) {
            return { ok: true, skippedMissingTable: true };
        }

        // Permite compatibilidad entre variantes de esquema usando columnas alternativas.
        if (isMissingColumnError(result.error)) {
            lastError = result.error;
            continue;
        }

        return { ok: false, error: result.error };
    }

    return { ok: false, error: lastError || new Error(`No se pudo limpiar ${table}`) };
}

function generarCedulaUnica(usedCedulas) {
    let candidate = generarCedula();
    let attempts = 0;
    while (usedCedulas.has(candidate) && attempts < 200) {
        candidate = generarCedula();
        attempts++;
    }
    usedCedulas.add(candidate);
    return candidate;
}

function generarCodigoRecuperacionUnico(usedCodes) {
    let code = Math.floor(100000 + Math.random() * 900000).toString();
    let attempts = 0;
    while (usedCodes.has(code) && attempts < 200) {
        code = Math.floor(100000 + Math.random() * 900000).toString();
        attempts++;
    }
    usedCodes.add(code);
    return code;
}

function generarStartTokenUnico(usedTokens) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let token = '';
    let attempts = 0;

    while ((token.length === 0 || usedTokens.has(token)) && attempts < 200) {
        token = '';
        for (let i = 0; i < 6; i++) {
            token += chars[Math.floor(Math.random() * chars.length)];
        }
        attempts++;
    }

    usedTokens.add(token);
    return token;
}

// Crear evento de auditoría en formato JSON correcto
function crearEventoAuditoria(idUsuario, tipo, actorEmail, detalle = {}, fecha = null) {
    const descripcionCompleta = {
        ...detalle,
        _actor_email: actorEmail || 'sistema',
        _ip_origen: '192.168.1.' + Math.floor(Math.random() * 254 + 1),
        _tipo_label: AUDIT_LABELS[tipo] || tipo
    };

    return {
        id_usuario: idUsuario,
        tipo_accion: tipo,
        descripcion: JSON.stringify(descripcionCompleta),
        fecha: (fecha || new Date()).toISOString()
    };
}

const AUDIT_LABELS = {
    LOGIN_SUCCESS: 'Login exitoso',
    LOGIN_FAILED: 'Login fallido',
    SUPERADMIN_CREATED: 'Superadmin creado',
    TERAPEUTA_CREATED: 'Terapeuta creado',
    PATIENT_CREATED: 'Paciente creado',
    PATIENT_UPDATED: 'Paciente actualizado',
    PATIENT_ASSIGNED: 'Paciente asignado',
    SESSION_REVIEWED: 'Sesión VR revisada',
    PASSWORD_CHANGE: 'Cambio de contraseña',
    USER_ACTIVATED: 'Usuario activado',
    DATA_EXPORTED: 'Datos exportados'
};

// ========================================
// GENERADOR DE SESIONES VR
// ========================================

function generarSesionVR(participantId, fecha) {
    const actividad = random(ACTIVIDADES_VR);
    const startTime = new Date(fecha);
    const totalSeconds = Math.floor(Math.random() * 300) + 180; // 3-8 minutos
    const endTime = new Date(startTime.getTime() + totalSeconds * 1000);

    const sets = [];
    let currentTime = new Date(startTime);
    const setDurationBase = Math.floor(totalSeconds / SET_NAMES.length);

    for (let i = 0; i < SET_NAMES.length; i++) {
        const setName = SET_NAMES[i];
        const setDuration = setDurationBase + Math.floor(Math.random() * 30) - 15;
        const setEnd = new Date(currentTime.getTime() + Math.max(setDuration, 10) * 1000);

        const numErrors = Math.random() > 0.6 ? Math.floor(Math.random() * 3) + 1 : 0;
        const errors = [];
        for (let j = 0; j < numErrors; j++) {
            const err = random(ERROR_CODES);
            const eventIso = new Date(currentTime.getTime() + Math.random() * setDuration * 1000).toISOString();
            errors.push({
                code: err.code,
                message: err.message,
                timestampIso: eventIso,
                timeIso: eventIso,
                context: random(err.contextos)
            });
        }

        const completion = setName === 'Preparación'
            ? {
                coffeeAdded: Math.random() > 0.15,
                sugarAdded: Math.random() > 0.2,
                cupCoffeeAmount01: Number((Math.random() * 0.45 + 0.5).toFixed(2))
            }
            : undefined;

        const returnedObjects = setName === 'Organización'
            ? RETURNABLE_OBJECTS.filter(() => Math.random() > 0.62)
            : [];

        sets.push({
            setName,
            setIndex: i,
            startedAtIso: currentTime.toISOString(),
            endedAtIso: setEnd.toISOString(),
            durationSeconds: Math.max(setDuration, 10),
            blockedCount: Math.floor(Math.random() * 3),
            dropsCount: Math.floor(Math.random() * 2),
            releasesCount: Math.floor(Math.random() * 5) + 1,
            errorsCount: numErrors,
            completion,
            returnedObjects,
            errors
        });

        currentTime = setEnd;
    }

    const totalErrors = sets.reduce((sum, s) => sum + s.errorsCount, 0);
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
            setsCompleted: SET_NAMES.length
        },
        sets
    };
}

// ========================================
// SEED PRINCIPAL
// ========================================

async function seed() {
    console.log('🌱 Iniciando seed de base de datos...');
    console.log('⚠️  Se eliminarán todos los datos existentes.\n');

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas para ejecutar el seed.');
    }

    if (String(process.env.SUPABASE_SERVICE_ROLE_KEY).includes('sb_publishable_')) {
        console.warn('⚠️  Se detectó una key publishable en SUPABASE_SERVICE_ROLE_KEY.');
        console.warn('    Si hay RLS activa, el seed puede fallar. Se recomienda usar la service_role key.\n');
    }

    // ────────────────────────────────────
    // 0. LIMPIAR BD (orden por dependencias FK)
    // ────────────────────────────────────
    console.log('🧹 Limpiando base de datos...');
    const tablesToClean = [
        'vr_set_errors',
        'vr_set_returned_objects',
        'vr_set_results',
        'vr_session_results',
        'sessions',
        'auditoria',
        'password_reset_tokens',
        'terapeuta_paciente',
        'pacientes',
        'terapeutas',
        'usuarios'
    ];

    const cleanupStrategies = {
        vr_set_errors: [
            { type: 'notnull', column: 'set_id' },
            { type: 'notnull', column: 'code' }
        ],
        vr_set_returned_objects: [
            { type: 'notnull', column: 'set_id' },
            { type: 'notnull', column: 'object_name' }
        ],
        vr_set_results: [
            { type: 'notnull', column: 'session_id' },
            { type: 'notnull', column: 'set_name' }
        ],
        vr_session_results: [
            { type: 'notnull', column: 'participant_id' },
            { type: 'notnull', column: 'activity_id' }
        ],
        sessions: [
            { type: 'notnull', column: 'start_token' },
            { type: 'notnull', column: 'participant_code' }
        ],
        auditoria: [
            { type: 'gte', column: 'id', value: 0 },
            { type: 'notnull', column: 'tipo_accion' }
        ],
        password_reset_tokens: [
            { type: 'gte', column: 'id', value: 0 },
            { type: 'notnull', column: 'token' }
        ],
        terapeuta_paciente: [
            { type: 'notnull', column: 'id_terapeuta' },
            { type: 'notnull', column: 'id_paciente' }
        ],
        pacientes: [
            { type: 'gte', column: 'id', value: 0 },
            { type: 'notnull', column: 'nombre' }
        ],
        terapeutas: [
            { type: 'gte', column: 'id', value: 0 },
            { type: 'notnull', column: 'id_usuario' }
        ],
        usuarios: [
            { type: 'gte', column: 'id', value: 0 },
            { type: 'notnull', column: 'email' }
        ]
    };

    for (const table of tablesToClean) {
        const strategy = cleanupStrategies[table] || [{ type: 'gte', column: 'id', value: 0 }];
        const cleanupResult = await deleteWithFallbackStrategies(table, strategy);

        if (!cleanupResult.ok) {
            const details = buildErrorText(cleanupResult.error);
            throw new Error(`Error limpiando ${table}: ${details}`);
        }

        if (cleanupResult.skippedMissingTable) {
            console.log(`   ℹ️  ${table} no existe en este esquema, se omite.`);
        } else {
            console.log(`   ✅ ${table} limpiada`);
        }
    }

    // ────────────────────────────────────
    // 1. SUPERADMIN
    // ────────────────────────────────────
    console.log('\n👤 Creando Superadministrador...');
    const superadminEmail = process.env.SUPERADMIN_EMAIL || 'superadmin@example.com';
    const superadminPassword = process.env.SUPERADMIN_PASSWORD || 'ChangeThisDefaultPassword123!';

    const adminPasswordHash = await bcrypt.hash(superadminPassword, 10);
    const { data: admin, error: adminError } = await supabase
        .from('usuarios')
        .insert({
            email: superadminEmail,
            password_hash: adminPasswordHash,
            rol: 'SUPERADMIN',
            activo: true
        })
        .select()
        .single();

    if (adminError) {
        console.error('❌ Error creando admin:', adminError.message);
        return;
    }
    console.log(`   ✅ Superadmin: ${admin.email} (ID: ${admin.id})`);

    // ────────────────────────────────────
    // 2. TERAPEUTAS
    // ────────────────────────────────────
    console.log('\n👨‍⚕️ Creando Terapeutas...');
    const seedTherapistPassword = process.env.SEED_THERAPIST_PASSWORD || 'TherapistSeed123!';
    const terapeutasData = [
        {
            nombre: 'Dra. Laura Rivera',
            email: 'terapeuta1@example.com',
            password: seedTherapistPassword,
            especialidad: 'Neuropsicología',
            telefono: generarTelefonoColombia()
        },
        {
            nombre: 'Dr. Mateo Salazar',
            email: 'terapeuta2@example.com',
            password: seedTherapistPassword,
            especialidad: 'Geriatría Cognitiva',
            telefono: generarTelefonoColombia()
        },
        {
            nombre: 'Dra. Valentina Ocampo',
            email: 'terapeuta3@example.com',
            password: seedTherapistPassword,
            especialidad: 'Terapia Ocupacional',
            telefono: generarTelefonoColombia()
        }
    ];

    const terapeutas = [];

    for (const t of terapeutasData) {
        const passwordHash = await bcrypt.hash(t.password, 10);

        const { data: usuario, error: userError } = await supabase
            .from('usuarios')
            .insert({
                email: t.email,
                password_hash: passwordHash,
                rol: 'TERAPEUTA',
                activo: true,
                creado_por: admin.id
            })
            .select()
            .single();

        if (userError) {
            console.error(`   ❌ Error creando usuario ${t.email}:`, userError.message);
            continue;
        }

        const { data: terapeuta, error: terapError } = await supabase
            .from('terapeutas')
            .insert({
                id_usuario: usuario.id,
                nombre: t.nombre,
                especialidad: t.especialidad,
                correo: t.email,
                telefono: t.telefono
            })
            .select()
            .single();

        if (terapError) {
            console.error(`   ❌ Error creando terapeuta:`, terapError.message);
            continue;
        }

        terapeutas.push({ ...terapeuta, nombre: t.nombre, email: t.email, userId: usuario.id });
        console.log(`   ✅ ${t.nombre} — ${t.especialidad} (${t.email})`);
    }

    if (terapeutas.length === 0) {
        console.error('❌ No se crearon terapeutas. Abortando.');
        return;
    }

    // ────────────────────────────────────
    // 3. PACIENTES
    // ────────────────────────────────────
    console.log('\n🧑‍🦳 Creando Pacientes...');
    const pacientes = [];
    const usedCedulas = new Set();

    const { data: existingCedulas, error: existingCedulasError } = await supabase
        .from('pacientes')
        .select('identificacion');

    if (!existingCedulasError && Array.isArray(existingCedulas)) {
        existingCedulas
            .map(p => p.identificacion)
            .filter(Boolean)
            .forEach(id => usedCedulas.add(String(id)));
    }

    // Distribución: 5 para el primer terapeuta, 4 para el segundo, 3 para el tercero
    const distribucion = [5, 4, 3];

    let pacienteIndex = 0;
    for (let tIdx = 0; tIdx < terapeutas.length; tIdx++) {
        const terapeuta = terapeutas[tIdx];
        const numPacientes = distribucion[tIdx] || 3;

        for (let i = 0; i < numPacientes; i++) {
            const esMujer = Math.random() > 0.5;
            const nombre = esMujer ? random(NOMBRES_FEMENINOS) : random(NOMBRES_MASCULINOS);
            const apellido1 = random(APELLIDOS);
            const apellido2 = random(APELLIDOS);
            const nombreCompleto = `${nombre} ${apellido1} ${apellido2}`;
            const edad = generarEdad(60, 85);
            const cedula = generarCedulaUnica(usedCedulas);
            // Todos activos excepto el último paciente (para verificar filtro)
            const activo = pacienteIndex < 11;

            const { data: paciente, error: pacError } = await supabase
                .from('pacientes')
                .insert({
                    nombre: nombreCompleto,
                    identificacion: cedula,
                    edad,
                    diagnostico: random(DIAGNOSTICOS),
                    activo
                })
                .select()
                .single();

            if (pacError) {
                console.error(`   ❌ Error creando paciente:`, pacError.message);
                continue;
            }

            // Vincular paciente con terapeuta
            const { error: vincError } = await supabase.from('terapeuta_paciente').insert({
                id_terapeuta: terapeuta.id,
                id_paciente: paciente.id,
                estado: 'ACTIVO'
            });

            if (vincError) {
                console.error(`   ❌ Error vinculando paciente:`, vincError.message);
            }

            pacientes.push({
                ...paciente,
                cedula,
                id_terapeuta: terapeuta.id,
                terapeuta_nombre: terapeuta.nombre,
                terapeuta_email: terapeuta.email,
                terapeuta_userId: terapeuta.userId
            });
            console.log(`   ✅ ${nombreCompleto} (${edad} años, ${activo ? 'activo' : 'inactivo'}) → ${terapeuta.nombre}`);
            pacienteIndex++;
        }
    }

    // ────────────────────────────────────
    // 4. SESIONES VR
    // ────────────────────────────────────
    console.log('\n🎮 Creando Sesiones VR...');
    let vrSessionCount = 0;
    let vrRevisadas = 0;
    let vrPendientes = 0;
    let returnedObjectsTableAvailable = true;
    const sesionesCreadas = []; // Para auditoría

    const pacientesActivos = pacientes.filter(p => p.activo);

    for (const paciente of pacientesActivos) {
        const numSesiones = Math.floor(Math.random() * 4) + 3; // 3-6 sesiones por paciente

        for (let i = 0; i < numSesiones; i++) {
            let fecha;
            // Asegurar que hay sesiones "hoy" y "esta semana"
            if (i === 0 && vrSessionCount < 4) {
                fecha = todayDate(); // Primeras sesiones son de hoy
            } else if (i === 1 && vrSessionCount < 10) {
                fecha = thisWeekDate(); // Segundas son de esta semana
            } else {
                fecha = randomDate(60); // Resto son de los últimos 60 días
            }

            const sessionData = generarSesionVR(paciente.identificacion, fecha);

            // Insertar sesión principal
            const esRevisada = Math.random() > 0.4; // ~60% revisadas
            const terapeutaRevisorId = esRevisada ? paciente.id_terapeuta : null;
            const observaciones = esRevisada ? random(OBSERVACIONES_CLINICAS) : null;

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
                    raw_payload: sessionData,
                    // Vincular con paciente
                    id_paciente_vinculado: paciente.id,
                    // Estado de revisión
                    id_terapeuta_revisor: terapeutaRevisorId,
                    observaciones_terapeuta: observaciones,
                    estado_revision: esRevisada ? 'REVISADA' : 'PENDIENTE_REVISION'
                })
                .select()
                .single();

            if (sessError) {
                console.error(`   ❌ Error creando sesión VR:`, sessError.message);
                continue;
            }

            // Insertar sets (sin columnas completion_*, con errors_count)
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
                        errors_count: set.errorsCount
                    })
                    .select()
                    .single();

                if (setError) {
                    console.error(`   ❌ Error insertando set:`, setError.message);
                    continue;
                }

                // Insertar errores del set (con objeto_contexto)
                for (const error of set.errors) {
                    await supabase.from('vr_set_errors').insert({
                        set_id: setResult.id,
                        code: error.code,
                        message: error.message,
                        occurred_at: error.timestampIso,
                        objeto_contexto: error.context || null
                    });
                }

                if (returnedObjectsTableAvailable && Array.isArray(set.returnedObjects) && set.returnedObjects.length > 0) {
                    const returnedRows = set.returnedObjects.map(objectName => ({
                        set_id: setResult.id,
                        object_name: objectName
                    }));

                    const { error: returnedObjectsError } = await supabase
                        .from('vr_set_returned_objects')
                        .insert(returnedRows);

                    if (returnedObjectsError) {
                        if (isMissingTableError(returnedObjectsError)) {
                            returnedObjectsTableAvailable = false;
                            console.log('   ℹ️  Tabla vr_set_returned_objects no disponible, se omite su carga.');
                        } else {
                            console.error('   ❌ Error insertando objetos retornados:', buildErrorText(returnedObjectsError));
                        }
                    }
                }
            }

            if (esRevisada) {
                vrRevisadas++;
                sesionesCreadas.push({ sessionId: session.id, paciente, fecha: sessionData.startedAtIso });
            } else {
                vrPendientes++;
            }
            vrSessionCount++;
        }
    }

    console.log(`   ✅ Sesiones VR creadas: ${vrSessionCount} (${vrRevisadas} revisadas, ${vrPendientes} pendientes)`);

    // ────────────────────────────────────
    // 5. SESIONES DE RECETA (HU-01)
    // ────────────────────────────────────
    console.log('\n🥘 Creando Sesiones de Receta (HU-01)...');
    let recipeSessionsCount = 0;
    const recipeSessionStatusCounts = { CREATED: 0, ACTIVE: 0, FINISHED: 0 };
    const usedSessionTokens = new Set();
    const participantsWithInProgressSession = new Set();
    const therapistsWithInProgressSession = new Set();

    const { data: existingSessions, error: existingSessionsError } = await supabase
        .from('sessions')
        .select('start_token, participant_code, status, created_by');

    if (!existingSessionsError && Array.isArray(existingSessions)) {
        existingSessions.forEach(session => {
            if (session.start_token) {
                usedSessionTokens.add(String(session.start_token));
            }
            if (session.status === 'CREATED' || session.status === 'ACTIVE') {
                if (session.participant_code) {
                    participantsWithInProgressSession.add(String(session.participant_code));
                }
                if (session.created_by) {
                    therapistsWithInProgressSession.add(Number(session.created_by));
                }
            }
        });
    }

    // Crear algunas sesiones para cada terapeuta
    for (const terapeuta of terapeutas) {
        const numSessions = Math.floor(Math.random() * 3) + 2; // 2-4 sesiones por terapeuta

        for (let i = 0; i < numSessions; i++) {
            // Usar un código de participante existente o nuevo
            const useExistingPatient = Math.random() > 0.3;
            let participantCode;

            if (useExistingPatient && pacientes.length > 0) {
                // Filtrar pacientes de este terapeuta
                const misPacientes = pacientes.filter(p => p.id_terapeuta === terapeuta.id);
                if (misPacientes.length > 0) {
                    participantCode = random(misPacientes).identificacion;
                } else {
                    participantCode = 'INVITADO-' + Math.floor(Math.random() * 1000);
                }
            } else {
                participantCode = `INVITADO-${terapeuta.id}-${i + 1}-${Math.floor(Math.random() * 900 + 100)}`;
            }

            let status = 'FINISHED';
            const canCreateInProgressSession =
                !participantsWithInProgressSession.has(participantCode) &&
                !therapistsWithInProgressSession.has(terapeuta.id);

            if (canCreateInProgressSession && i === 0) {
                status = Math.random() > 0.5 ? 'CREATED' : 'ACTIVE';
            } else if (canCreateInProgressSession && Math.random() > 0.75) {
                status = Math.random() > 0.5 ? 'CREATED' : 'ACTIVE';
            }

            let createdSession = false;
            let attempts = 0;

            while (!createdSession && attempts < 6) {
                attempts++;
                const token = generarStartTokenUnico(usedSessionTokens);

                if ((status === 'CREATED' || status === 'ACTIVE') && participantsWithInProgressSession.has(participantCode)) {
                    status = 'FINISHED';
                }
                if ((status === 'CREATED' || status === 'ACTIVE') && therapistsWithInProgressSession.has(terapeuta.id)) {
                    status = 'FINISHED';
                }

                const { error: sessionError } = await supabase
                    .from('sessions')
                    .insert({
                        participant_code: participantCode,
                        recipe_id: random(RECIPE_IDS),
                        status,
                        start_token: token,
                        created_by: terapeuta.id,
                        created_at: randomDate(7).toISOString() // Últimos 7 días
                    });

                if (sessionError) {
                    const errorText = buildErrorText(sessionError);
                    const uniqueConflict = String(sessionError.code || '') === '23505';
                    const tokenConflict = uniqueConflict && errorText.includes('start_token');
                    const activeConflict =
                        uniqueConflict && (
                            errorText.includes('ix_sessions_one_active_per_participant') ||
                            errorText.includes('participant_code')
                        );

                    if (tokenConflict) {
                        continue;
                    }

                    if (activeConflict) {
                        participantsWithInProgressSession.add(participantCode);
                        status = 'FINISHED';
                        continue;
                    }

                    console.error('   ❌ Error creando sesión de receta:', errorText);
                    break;
                }

                recipeSessionsCount++;
                recipeSessionStatusCounts[status] = (recipeSessionStatusCounts[status] || 0) + 1;

                if (status === 'CREATED' || status === 'ACTIVE') {
                    participantsWithInProgressSession.add(participantCode);
                    therapistsWithInProgressSession.add(terapeuta.id);
                }

                createdSession = true;
            }

            if (!createdSession) {
                console.error(`   ❌ No se pudo crear sesión de receta para terapeuta ${terapeuta.id} y participante ${participantCode}`);
            }
        }
    }
    console.log(`   ✅ Sesiones de Receta creadas: ${recipeSessionsCount} (CREATED: ${recipeSessionStatusCounts.CREATED}, ACTIVE: ${recipeSessionStatusCounts.ACTIVE}, FINISHED: ${recipeSessionStatusCounts.FINISHED})`);

    // ────────────────────────────────────
    // 6. CÓDIGOS DE RECUPERACIÓN
    // ────────────────────────────────────
    console.log('\n🔐 Creando códigos de recuperación...');
    let resetTokensCount = 0;
    const usedResetCodes = new Set();

    const { data: existingResetTokens, error: existingResetTokensError } = await supabase
        .from('password_reset_tokens')
        .select('token');

    if (!existingResetTokensError && Array.isArray(existingResetTokens)) {
        existingResetTokens
            .map(t => t.token)
            .filter(Boolean)
            .forEach(t => usedResetCodes.add(String(t)));
    }

    const resetTargets = [
        { id_usuario: admin.id, email: superadminEmail, expiresInMinutes: -10, used: true },
        ...terapeutas.slice(0, 2).map(t => ({
            id_usuario: t.userId,
            email: t.email,
            expiresInMinutes: 15,
            used: false
        }))
    ];

    for (const target of resetTargets) {
        const code = generarCodigoRecuperacionUnico(usedResetCodes);
        const expiresAt = new Date(Date.now() + target.expiresInMinutes * 60 * 1000).toISOString();

        const { error: resetError } = await supabase
            .from('password_reset_tokens')
            .insert({
                id_usuario: target.id_usuario,
                token: code,
                expires_at: expiresAt,
                used: target.used
            });

        if (resetError) {
            if (isMissingTableError(resetError)) {
                console.log('   ℹ️  Tabla password_reset_tokens no existe en este esquema, se omite esta sección.');
                resetTokensCount = 0;
                break;
            }
            console.error(`   ❌ Error creando código para ${target.email}:`, buildErrorText(resetError));
            continue;
        }

        resetTokensCount++;
    }
    console.log(`   ✅ Códigos de recuperación creados: ${resetTokensCount}`);

    // ────────────────────────────────────
    // 7. EVENTOS DE AUDITORÍA
    // ────────────────────────────────────
    console.log('\n📋 Creando eventos de auditoría...');
    const eventosAuditoria = [];

    // Evento: Superadmin creado
    eventosAuditoria.push(crearEventoAuditoria(
        admin.id, 'SUPERADMIN_CREATED', superadminEmail,
        { id_usuario: admin.id, rol: 'SUPERADMIN' },
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Hace 30 días
    ));

    // Eventos: Login exitoso del superadmin (varias veces)
    for (let i = 0; i < 3; i++) {
        eventosAuditoria.push(crearEventoAuditoria(
            admin.id, 'LOGIN_SUCCESS', superadminEmail,
            { metodo: 'email+password' },
            randomDate(30)
        ));
    }

    // Eventos: Terapeutas creados
    for (const t of terapeutas) {
        eventosAuditoria.push(crearEventoAuditoria(
            admin.id, 'TERAPEUTA_CREATED', superadminEmail,
            { id_terapeuta: t.id, nombre: t.nombre, correo: t.email },
            new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
        ));
    }

    // Eventos: Login de terapeutas
    for (const t of terapeutas) {
        const numLogins = Math.floor(Math.random() * 3) + 2;
        for (let i = 0; i < numLogins; i++) {
            eventosAuditoria.push(crearEventoAuditoria(
                t.userId, 'LOGIN_SUCCESS', t.email,
                { metodo: 'email+password' },
                randomDate(14)
            ));
        }
    }

    // Eventos: Pacientes creados
    for (const p of pacientes.slice(0, 6)) {
        eventosAuditoria.push(crearEventoAuditoria(
            p.terapeuta_userId, 'PATIENT_CREATED', p.terapeuta_email,
            { id_paciente: p.id, nombre: p.nombre },
            new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)
        ));
    }

    // Eventos: Pacientes asignados
    for (const p of pacientes.slice(0, 4)) {
        eventosAuditoria.push(crearEventoAuditoria(
            admin.id, 'PATIENT_ASSIGNED', superadminEmail,
            { id_paciente: p.id.toString(), terapeuta_nombre: p.terapeuta_nombre },
            new Date(Date.now() - 24 * 24 * 60 * 60 * 1000)
        ));
    }

    // Eventos: Sesiones VR revisadas
    for (const s of sesionesCreadas.slice(0, 5)) {
        eventosAuditoria.push(crearEventoAuditoria(
            s.paciente.terapeuta_userId, 'SESSION_REVIEWED', s.paciente.terapeuta_email,
            { id_sesion: s.sessionId, paciente: s.paciente.nombre },
            randomDate(14)
        ));
    }

    // Evento: Login fallido (para variedad)
    eventosAuditoria.push(crearEventoAuditoria(
        null, 'LOGIN_FAILED', 'desconocido@test.com',
        { motivo: 'Credenciales inválidas' },
        randomDate(7)
    ));

    // Evento: Paciente actualizado
    if (pacientes.length > 0) {
        eventosAuditoria.push(crearEventoAuditoria(
            terapeutas[0].userId, 'PATIENT_UPDATED', terapeutas[0].email,
            { id_paciente: pacientes[0].id, campo: 'diagnostico' },
            randomDate(10)
        ));
    }

    // Insertar todos los eventos
    const { error: auditError } = await supabase.from('auditoria').insert(eventosAuditoria);
    if (auditError) {
        console.error('   ❌ Error creando auditoría:', auditError.message);
    } else {
        console.log(`   ✅ ${eventosAuditoria.length} eventos de auditoría creados`);
    }

    // ────────────────────────────────────
    // 8. RESUMEN FINAL
    // ────────────────────────────────────
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SEED COMPLETADO EXITOSAMENTE');
    console.log('='.repeat(60));
    console.log(`
📊 RESUMEN:
   👤 Superadmin:
      Email: ${superadminEmail}
      Pass:  ${superadminPassword}

   👨‍⚕️ Terapeutas (${terapeutas.length}):
      ${terapeutasData.map(t => `${t.nombre} → ${t.email} / ${t.password}`).join('\n      ')}

   🧑‍🦳 Pacientes: ${pacientes.length} (${pacientes.filter(p => p.activo).length} activos, ${pacientes.filter(p => !p.activo).length} inactivos)
      Distribución: ${terapeutas.map((t, i) => `${t.nombre}: ${distribucion[i]}`).join(' | ')}

   🎮 Sesiones VR: ${vrSessionCount}
      ✅ Revisadas: ${vrRevisadas}
      ⏳ Pendientes: ${vrPendientes}

   🥘 Sesiones de Receta: ${recipeSessionsCount}
      🟡 CREATED: ${recipeSessionStatusCounts.CREATED}
      🟢 ACTIVE: ${recipeSessionStatusCounts.ACTIVE}
      ⚪ FINISHED: ${recipeSessionStatusCounts.FINISHED}

   🔐 Códigos de recuperación: ${resetTokensCount}

   📋 Auditoría: ${eventosAuditoria.length} eventos

   🔑 Para probar como terapeuta:
      Email: ${terapeutasData[0].email}
      Pass:  ${terapeutasData[0].password}
`);
}

seed().catch(err => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
});
