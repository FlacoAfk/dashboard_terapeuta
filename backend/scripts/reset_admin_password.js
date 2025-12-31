/**
 * Script para resetear la contraseña del admin
 * 
 * USO: Establecer NEW_ADMIN_PASSWORD en .env antes de ejecutar
 * node scripts/reset_admin_password.js
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
});

// La contraseña debe establecerse en .env como NEW_ADMIN_PASSWORD
const NEW_PASSWORD = process.env.NEW_ADMIN_PASSWORD;

if (!NEW_PASSWORD) {
    console.error('ERROR: Debes establecer NEW_ADMIN_PASSWORD en el archivo .env');
    console.log('Ejemplo: NEW_ADMIN_PASSWORD=TuNuevaContraseña123!@');
    process.exit(1);
}

async function resetPassword() {
    const client = await pool.connect();

    try {
        // Generar hash de la nueva contraseña
        const salt = await bcrypt.genSalt(12);
        const password_hash = await bcrypt.hash(NEW_PASSWORD, salt);

        // Actualizar el admin
        const result = await client.query(`
            UPDATE usuarios 
            SET password_hash = $1 
            WHERE email = 'admin' AND rol = 'SUPERADMIN'
            RETURNING id, email, rol
        `, [password_hash]);

        if (result.rows.length > 0) {
            console.log('Password actualizado exitosamente!');
            console.log('Usuario:', result.rows[0]);
            console.log('\nCredenciales:');
            console.log('  Email: admin');
            console.log('  Password:', NEW_PASSWORD);
        } else {
            console.log('No se encontró el usuario admin');
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

resetPassword();
