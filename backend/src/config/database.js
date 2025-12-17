/**
 * ========================================
 * CONFIGURACIÓN DE BASE DE DATOS
 * ========================================
 * 
 * Conexión a PostgreSQL (Supabase)
 */

const { Pool } = require('pg');

// Configuración del pool de conexiones
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: {
        rejectUnauthorized: false
    },
    // Configuración del pool
    max: 10,                 // Máximo de conexiones en el pool
    idleTimeoutMillis: 30000, // Tiempo antes de cerrar conexión inactiva
    connectionTimeoutMillis: 10000 // Timeout para nueva conexión
});

// Verificar conexión al iniciar
pool.on('connect', () => {
    console.log('📊 Conectado a PostgreSQL (Supabase)');
});

pool.on('error', (err) => {
    console.error('❌ Error en conexión PostgreSQL:', err.message);
});

// Función helper para ejecutar queries
const query = async (text, params) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log(`📝 Query ejecutado en ${duration}ms`);
        return result;
    } catch (error) {
        console.error('❌ Error en query:', error.message);
        throw error;
    }
};

// Función para probar la conexión
const testConnection = async () => {
    try {
        const result = await pool.query('SELECT NOW() as current_time');
        console.log('✅ Conexión a DB verificada:', result.rows[0].current_time);
        return true;
    } catch (error) {
        console.error('❌ Error conectando a la base de datos:', error.message);
        return false;
    }
};

module.exports = {
    pool,
    query,
    testConnection
};
