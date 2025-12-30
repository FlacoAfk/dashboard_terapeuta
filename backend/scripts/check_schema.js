require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    const client = await pool.connect();
    const result = {};

    try {
        // Tablas
        const tables = await client.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' ORDER BY table_name
        `);
        result.tables = tables.rows.map(t => t.table_name);

        // Columnas de usuarios
        const usuarios = await client.query(`
            SELECT column_name, data_type FROM information_schema.columns
            WHERE table_name = 'usuarios' ORDER BY ordinal_position
        `);
        result.usuarios_columns = usuarios.rows;

        // Columnas de terapeutas
        const terapeutas = await client.query(`
            SELECT column_name, data_type FROM information_schema.columns
            WHERE table_name = 'terapeutas' ORDER BY ordinal_position
        `);
        result.terapeutas_columns = terapeutas.rows;

        fs.writeFileSync('schema_result.json', JSON.stringify(result, null, 2));
        console.log('OK');

    } catch (error) {
        result.error = error.message;
        fs.writeFileSync('schema_result.json', JSON.stringify(result, null, 2));
        console.log('ERROR');
    } finally {
        client.release();
        await pool.end();
    }
}

main();
