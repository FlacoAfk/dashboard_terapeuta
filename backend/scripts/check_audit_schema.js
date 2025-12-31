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

async function main() {
    const client = await pool.connect();
    try {
        const result = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'auditoria'
        `);
        console.log('Auditoria table columns:');
        result.rows.forEach(r => console.log(`  - ${r.column_name}: ${r.data_type}`));
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}
main();
