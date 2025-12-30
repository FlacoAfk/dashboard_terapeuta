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

    try {
        const result = await client.query(`
            SELECT u.id, u.email, u.rol, u.activo, t.nombre
            FROM usuarios u
            LEFT JOIN terapeutas t ON u.id = t.id_usuario
            ORDER BY u.id
        `);

        fs.writeFileSync('users_result.json', JSON.stringify(result.rows, null, 2));
        console.log('Users found:', result.rows.length);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

main();
