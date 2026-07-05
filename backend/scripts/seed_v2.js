/**
 * FULL cleanup + seed - maneja TODAS las FKs correctamente
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const { VALID_RECIPE_IDS } = require('../src/constants/recipes');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Helpers
function random(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function generarTelefono() { return '300' + Math.floor(Math.random() * 9000000 + 1000000); }

async function fullCleanup() {
    console.log('🧹 Limpieza FULL (orden FK correcto)...');
    
    // UUID tables (child -> parent order)
    const uuidOrder = ['vr_set_errors', 'vr_set_returned_objects', 'vr_set_results', 'vr_session_results', 'sessions'];
    for (const t of uuidOrder) {
        const { error } = await supabase.from(t).delete().not('id', 'is', null);
        if (error) console.log(`  ⚠️ ${t}: ${error.message}`); else console.log(`  ✅ ${t}`);
    }
    
    // Serial tables (ORDER MATTERS: children before parents)
    const serialOrder = [
        'auditoria',           // FK to usuarios
        'password_reset_tokens', // FK to usuarios
        'terapeuta_paciente',    // FK to terapeutas, pacientes
        'pacientes',
        'terapeutas',           // FK to usuarios
        'usuarios'
    ];
    for (const t of serialOrder) {
        const { error } = await supabase.from(t).delete().gte('id', 0);
        if (error) console.log(`  ⚠️ ${t}: ${error.message}`); else console.log(`  ✅ ${t}`);
    }
    
    console.log('✅ DB completamente limpia\n');
}

async function seed() {
    await fullCleanup();

    // 1. ADMIN
    console.log('👤 Creando Superadmin...');
    const superadminEmail = process.env.SUPERADMIN_EMAIL || 'superadmin@example.com';
    const superadminPassword = process.env.SUPERADMIN_PASSWORD || 'ChangeThisDefaultPassword123!';
    const hash = await bcrypt.hash(superadminPassword, 10);
    const { data: admin, error: aErr } = await supabase
        .from('usuarios')
        .insert({ email: superadminEmail, password_hash: hash, rol: 'SUPERADMIN', activo: true })
        .select()
        .single();
    if (aErr) { console.log('❌ Admin:', aErr.message); return; }
    console.log(`  ✅ ${admin.email} (ID: ${admin.id})\n`);

    // 2. TERAPEUTAS (sin creado_por por ahora)
    console.log('👨‍⚕️ Creando Terapeutas...');
    const terapeutasData = [
        { nombre: 'Dra. Laura Rivera', email: 'terapeuta1@example.com', especialidad: 'Neuropsicología' },
        { nombre: 'Dr. Mateo Salazar', email: 'terapeuta2@example.com', especialidad: 'Geriatría Cognitiva' },
        { nombre: 'Dra. Valentina Ocampo', email: 'terapeuta3@example.com', especialidad: 'Terapia Ocupacional' }
    ];
    
    const seedPassword = process.env.SEED_THERAPIST_PASSWORD || 'TherapistSeed123!';
    const terapeutas = [];
    
    for (const t of terapeutasData) {
        const h = await bcrypt.hash(seedPassword, 10);
        const { data: user, error: ue } = await supabase
            .from('usuarios')
            .insert({ email: t.email, password_hash: h, rol: 'TERAPEUTA', activo: true })
            .select()
            .single();
        if (ue) { console.log(`  ❌ User ${t.email}: ${ue.message}`); continue; }
        
        const { data: terap, error: te } = await supabase
            .from('terapeutas')
            .insert({ id_usuario: user.id, nombre: t.nombre, especialidad: t.especialidad, correo: t.email, telefono: generarTelefono() })
            .select()
            .single();
        if (te) {
            console.log(`  ❌ Terapeuta ${t.nombre}: ${te.message} (userId=${user.id})`);
            continue;
        }
        
        terapeutas.push({ ...terap, userId: user.id, email: t.email, nombre: t.nombre });
        console.log(`  ✅ ${t.nombre} (userId=${user.id}, terapId=${terap.id})`);
    }
    
    if (terapeutas.length === 0) { console.log('❌ Sin terapeutas, abortando.'); return; }

    // 3. PACIENTES
    console.log('\n🧑‍🦳 Creando Pacientes...');
    const nombres = ['Carlos','José','Luis','Andrés','Jorge','Miguel','María','Ana','Luz','Carmen','Rosa','Patricia'];
    const apellidos = ['García','Rodríguez','Martínez','López','González','Hernández','Pérez','Sánchez','Ramírez','Torres'];
    const diagnosticos = ['Deterioro Cognitivo Leve','Alzheimer temprano','Demencia vascular leve','DCL multidominio','ACV rehabilitación'];
    const pacientes = [];
    
    const distribucion = [5, 4, 3]; // 12 total
    let idx = 0;
    
    for (let ti = 0; ti < terapeutas.length; ti++) {
        const ter = terapeutas[ti];
        for (let i = 0; i < distribucion[ti]; i++) {
            const nombre = `${random(nombres)} ${random(apellidos)} ${random(apellidos)}`;
            const iden = 'ID' + (10000 + idx);
            const edad = 60 + Math.floor(Math.random() * 26);
            const activo = idx < 11; // último inactivo
            
            const { data: pac, error: pe } = await supabase
                .from('pacientes')
                .insert({ nombre, identificacion: iden, edad, diagnostico: random(diagnosticos), activo })
                .select()
                .single();
            if (pe) { console.log(`  ❌ ${nombre}: ${pe.message}`); idx++; continue; }
            
            await supabase.from('terapeuta_paciente').insert({ id_terapeuta: ter.id, id_paciente: pac.id, estado: 'ACTIVO' });
            
            pacientes.push({ ...pac, terapeutaId: ter.id, terapeutaNombre: ter.nombre, terapeutaUserId: ter.userId });
            console.log(`  ✅ ${nombre} (${edad}a, ${activo?'activo':'inactivo'}) → ${ter.nombre}`);
            idx++;
        }
    }
    
    // 4. SESIONES VR (simplificado)
    console.log('\n🎮 Creando Sesiones VR...');
    let vrCount = 0;
    
    for (const p of pacientes.filter(p => p.activo)) {
        const num = Math.floor(Math.random() * 3) + 2; // 2-4 sesiones
        for (let i = 0; i < num; i++) {
            const start = new Date(Date.now() - Math.random() * 30 * 86400000);
            const end = new Date(start.getTime() + (180 + Math.random() * 300) * 1000);
            const esRevisada = Math.random() > 0.4;
            
            const { data: sess, error: se } = await supabase
                .from('vr_session_results')
                .insert({
                    schema_version: '1.0',
                    participant_id: p.identificacion,
                    activity_id: 'tinto_easy_01',
                    started_at: start.toISOString(),
                    ended_at: end.toISOString(),
                    total_seconds: (end - start) / 1000,
                    summary_total_errors: Math.floor(Math.random() * 5),
                    summary_total_drops: Math.floor(Math.random() * 3),
                    summary_total_releases: Math.floor(Math.random() * 4) + 1,
                    summary_sets_completed: 4,
                    raw_payload: { test: true },
                    id_paciente_vinculado: p.id,
                    id_terapeuta_revisor: esRevisada ? p.terapeutaId : null,
                    observaciones_terapeuta: esRevisada ? 'Paciente completó la actividad sin dificultades.' : null,
                    estado_revision: esRevisada ? 'REVISADA' : 'PENDIENTE_REVISION'
                })
                .select()
                .single();
            if (se) { console.log(`  ❌ Sess: ${se.message}`); continue; }
            vrCount++;
        }
    }
    console.log(`  ✅ ${vrCount} sesiones VR creadas`);
    
    // 5. SESSIONS (recetas)
    console.log('\n🥘 Creando Sessions de Receta...');
    let recCount = 0;
    for (const t of terapeutas) {
        for (let i = 0; i < 2; i++) {
            const pCode = random(pacientes.filter(p => p.terapeutaId === t.id)).identificacion;
            const token = 'TK' + Math.random().toString(36).substring(2, 8).toUpperCase();
            const { error: rs } = await supabase
                .from('sessions')
                .insert({
                    participant_code: pCode,
                    recipe_id: random(VALID_RECIPE_IDS),
                    status: i === 0 ? 'ACTIVE' : 'FINISHED',
                    start_token: token,
                    created_by: t.id
                });
            if (rs) {
                if (rs.code === '23505') {
                    // Token collision, skip
                    continue;
                }
                console.log(`  ❌ Recipe session: ${rs.message}`);
            } else {
                recCount++;
            }
        }
    }
    console.log(`  ✅ ${recCount} sesiones de receta creadas`);
    
    // SUMMARY
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SEED COMPLETADO');
    console.log('='.repeat(60));
    console.log(`  Admin: ${admin.email} / ${superadminPassword}`);
    console.log(`  Terapeutas: ${terapeutas.length}`);
    console.log(`  Pacientes: ${pacientes.length} (${pacientes.filter(p=>p.activo).length} activos)`);
    console.log(`  Sesiones VR: ${vrCount}`);
    console.log(`  Sesiones Receta: ${recCount}`);
    console.log(`  Login terapeuta: terapeuta1@example.com / ${seedPassword}`);
    console.log('='.repeat(60));
}

seed().catch(e => console.error('FATAL:', e));
