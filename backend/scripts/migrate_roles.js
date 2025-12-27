/**
 * Script de migración para actualizar el constraint de roles
 * Ejecutar con: node scripts/migrate_roles.js
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

async function migrate() {
    const client = await pool.connect();

    try {
        console.log('🔄 Iniciando migración de roles...\n');

        // 1. Ver constraints actuales
        console.log('1. Verificando constraints actuales...');
        const constraints = await client.query(`
            SELECT conname, pg_get_constraintdef(oid) as definition
            FROM pg_constraint
            WHERE conrelid = 'usuarios'::regclass
            AND contype = 'c'
        `);
        console.log('   Constraints encontrados:', constraints.rows);

        // 2. Encontrar y eliminar el constraint de rol
        const rolConstraint = constraints.rows.find(c => c.conname.includes('rol'));
        if (rolConstraint) {
            console.log(`\n2. Eliminando constraint: ${rolConstraint.conname}...`);
            await client.query(`ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS ${rolConstraint.conname}`);
            console.log('   ✅ Constraint eliminado');
        } else {
            console.log('\n2. No se encontró constraint de rol específico');
        }

        // 3. Crear nuevo constraint con SUPERADMIN y TERAPEUTA
        console.log('\n3. Creando nuevo constraint con roles SUPERADMIN y TERAPEUTA...');
        await client.query(`
            ALTER TABLE usuarios 
            ADD CONSTRAINT usuarios_rol_check 
            CHECK (rol IN ('SUPERADMIN', 'TERAPEUTA'))
        `);
        console.log('   ✅ Nuevo constraint creado');

        // 4. Verificar
        console.log('\n4. Verificando nuevo constraint...');
        const newConstraints = await client.query(`
            SELECT conname, pg_get_constraintdef(oid) as definition
            FROM pg_constraint
            WHERE conrelid = 'usuarios'::regclass
            AND contype = 'c'
        `);
        console.log('   Constraints actualizados:', newConstraints.rows);

        // 5. Probar insertando un superadmin de prueba
        console.log('\n5. Probando inserción de SUPERADMIN...');
        try {
            await client.query(`
                INSERT INTO usuarios (username, password_hash, rol, activo)
                VALUES ('test_superadmin', 'test', 'SUPERADMIN', false)
            `);
            console.log('   ✅ Inserción exitosa');

            // Eliminar el usuario de prueba
            await client.query("DELETE FROM usuarios WHERE username = 'test_superadmin'");
            console.log('   ✅ Usuario de prueba eliminado');
        } catch (err) {
            console.log('   ❌ Error al insertar:', err.message);
        }

        console.log('\n✅ Migración completada exitosamente');

    } catch (error) {
        console.error('❌ Error en migración:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

migrate().catch(console.error);
