/**
 * ========================================
 * SCRIPT: Limpiar toda la base de datos
 * ========================================
 * 
 * Elimina todos los datos de prueba del sistema.
 * CUIDADO: Este script borra TODOS los datos.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function clearDatabase() {
    console.log('🧹 Iniciando limpieza de base de datos...\n');

    try {
        // 1. Limpiar tablas VR (en orden por dependencias)
        console.log('🎮 Limpiando datos de sesiones VR...');

        await supabase.from('vr_set_returned_objects').delete().gte('created_at', '1900-01-01');
        console.log('   ✅ vr_set_returned_objects');

        await supabase.from('vr_set_errors').delete().gte('created_at', '1900-01-01');
        console.log('   ✅ vr_set_errors');

        await supabase.from('vr_set_results').delete().gte('created_at', '1900-01-01');
        console.log('   ✅ vr_set_results');

        await supabase.from('vr_session_results').delete().gte('created_at', '1900-01-01');
        console.log('   ✅ vr_session_results');

        // 2. Limpiar auditoría
        console.log('\n📋 Limpiando auditoría...');
        await supabase.from('auditoria').delete().gte('id', 0);
        console.log('   ✅ auditoria');

        // 3. Limpiar relaciones terapeuta-paciente
        console.log('\n🔗 Limpiando relaciones...');
        await supabase.from('terapeuta_paciente').delete().gte('created_at', '1900-01-01');
        console.log('   ✅ terapeuta_paciente');

        // 4. Limpiar pacientes
        console.log('\n🧑‍🦳 Limpiando pacientes...');
        await supabase.from('pacientes').delete().gte('id', 0);
        console.log('   ✅ pacientes');

        // 5. Limpiar terapeutas
        console.log('\n👨‍⚕️ Limpiando terapeutas...');
        await supabase.from('terapeutas').delete().gte('id', 0);
        console.log('   ✅ terapeutas');

        // 6. Limpiar tokens de reset
        console.log('\n🔑 Limpiando tokens...');
        await supabase.from('password_reset_tokens').delete().gte('created_at', '1900-01-01');
        console.log('   ✅ password_reset_tokens');

        // 7. Limpiar usuarios
        console.log('\n👤 Limpiando usuarios...');
        await supabase.from('usuarios').delete().gte('created_at', '1900-01-01');
        console.log('   ✅ usuarios');

        console.log('\n' + '='.repeat(50));
        console.log('🎉 BASE DE DATOS LIMPIA');
        console.log('='.repeat(50));
        console.log('\n📝 Ahora puedes volver a ejecutar el setup inicial.\n');

    } catch (error) {
        console.error('❌ Error durante la limpieza:', error.message);
    }
}

clearDatabase().catch(console.error);
