/**
 * ========================================
 * CONFIGURACIÓN DE SUPABASE
 * ========================================
 * 
 * Cliente de Supabase para acceso a base de datos
 * Este proyecto usa EXCLUSIVAMENTE Supabase SDK
 */

const { createClient } = require('@supabase/supabase-js');

// Validar variables de entorno requeridas
const supabaseUrl = process.env.SUPABASE_URL || 'https://example.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key';

if ((!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) && process.env.NODE_ENV !== 'test') {
    console.error('❌ ERROR: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas en el archivo .env');
    console.error('   Por favor configura las variables de entorno antes de iniciar el servidor.');
    process.exit(1);
}

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

console.log('📦 Modo: Supabase SDK');

/**
 * Helper para probar la conexión
 */
async function testConnection() {
    try {
        const { error } = await supabase
            .from('usuarios')
            .select('id')
            .limit(1);

        if (error) {
            console.error('❌ Error conectando a Supabase:', error.message);
            return false;
        }

        console.log('✅ Conexión a Supabase verificada');
        return true;
    } catch (error) {
        console.error('❌ Error conectando a la base de datos:', error.message);
        return false;
    }
}

module.exports = {
    supabase,
    testConnection
};
