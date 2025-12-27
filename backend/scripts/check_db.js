/**
 * Script para verificar el estado de la base de datos
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

async function checkDB() {
    const client = await pool.connect();

    try {
        console.log('🔍 Verificando estructura de la base de datos...\n');

        // 1. Ver columnas de usuarios
        console.log('1. Columnas de tabla usuarios:');
        const columns = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'usuarios'
            ORDER BY ordinal_position
        `);
        console.table(columns.rows);

        // 2. Ver constraints
        console.log('\n2. Constraints de usuarios:');
        const constraints = await client.query(`
            SELECT con.conname, pg_get_constraintdef(con.oid) as definition
            FROM pg_constraint con
            JOIN pg_class rel ON rel.oid = con.conrelid
            WHERE rel.relname = 'usuarios'
        `);
        console.table(constraints.rows);

        // 3. Ver si hay usuarios existentes
        console.log('\n3. Usuarios existentes:');
        const users = await client.query('SELECT id, username, rol, activo FROM usuarios');
        console.table(users.rows);

        // 4. Intentar insertar directamente
        console.log('\n4. Intentando insertar usuario con rol SUPERADMIN...');
        try {
            await client.query(`
                INSERT INTO usuarios (username, password_hash, rol, activo)
                VALUES ('test_super', 'fake_hash', 'SUPERADMIN', false)
            `);
            console.log('   ✅ Inserción SUPERADMIN exitosa');
            await client.query("DELETE FROM usuarios WHERE username = 'test_super'");
        } catch (err) {
            console.log('   ❌ Error:', err.message);

            // Intentar con otros roles
            console.log('\n   Probando otros roles...');
            for (const rol of ['admin', 'ADMIN', 'superadmin', 'superusuario', 'terapeuta', 'TERAPEUTA']) {
                try {
                    await client.query(`
                        INSERT INTO usuarios (username, password_hash, rol, activo)
                        VALUES ('test_${rol}', 'fake_hash', '${rol}', false)
                    `);
                    console.log(`   ✅ Rol "${rol}" FUNCIONA`);
                    await client.query(`DELETE FROM usuarios WHERE username = 'test_${rol}'`);
                } catch (e) {
                    console.log(`   ❌ Rol "${rol}" no permitido`);
                }
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

checkDB();
