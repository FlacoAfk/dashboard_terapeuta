/**
 * Script para agregar columna activo a pacientes si no existe
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
});

async function addActivoColumn() {
    const client = await pool.connect();

    try {
        console.log('🔧 Verificando columna activo en pacientes...\n');

        // Verificar si existe la columna activo
        const checkColumn = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'pacientes' AND column_name = 'activo'
        `);

        if (checkColumn.rows.length === 0) {
            console.log('➕ Agregando columna activo...');
            await client.query(`
                ALTER TABLE pacientes 
                ADD COLUMN activo BOOLEAN DEFAULT true NOT NULL
            `);
            console.log('✅ Columna activo agregada');
        } else {
            console.log('✅ Columna activo ya existe');
        }

        // Verificar columnas actuales
        const columns = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'pacientes'
            ORDER BY ordinal_position
        `);
        console.log('\n📋 Columnas actuales de pacientes:');
        console.table(columns.rows);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

addActivoColumn();
