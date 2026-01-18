/**
 * ========================================
 * CONFIGURACIÓN DE SUPABASE
 * ========================================
 * 
 * Cliente de Supabase para acceso a base de datos
 * Compatible con el esquema existente del proyecto
 * 
 * Soporta dos modos:
 * 1. Supabase SDK (preferido) - requiere SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
 * 2. pg Pool fallback - usa DB_HOST, DB_USER, etc.
 */

const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

// Validar variables de entorno
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Modo de operación
let useSupabaseSDK = !!(supabaseUrl && supabaseKey);

// Crear cliente de Supabase si hay credenciales disponibles
let supabase = null;
if (useSupabaseSDK) {
    supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
    console.log('📦 Modo: Supabase SDK');
} else {
    console.log('📦 Modo: PostgreSQL Pool (legacy)');
    console.log('   Para usar Supabase SDK, agrega SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY a .env');
}

// pg Pool para queries SQL directas (fallback o para queries complejas)
const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
    max: 10
});

/**
 * Proxy para Supabase - si no hay SDK configurado, simula la interfaz con pg Pool
 */
const supabaseProxy = new Proxy({}, {
    get(target, tableName) {
        if (useSupabaseSDK && supabase) {
            return supabase.from(tableName);
        }

        // Retornar objeto que simula la API de Supabase usando pg Pool
        return createPgBridge(tableName);
    }
});

/**
 * Crea un puente que convierte llamadas estilo Supabase a SQL
 */
function createPgBridge(tableName) {
    let selectFields = '*';
    let whereConditions = [];
    let whereParams = [];
    let orderBy = null;
    let limitVal = null;
    let offsetVal = null;
    let isSingle = false;

    const bridge = {
        select(fields = '*') {
            selectFields = fields;
            return bridge;
        },
        eq(column, value) {
            whereConditions.push(`${column} = $${whereParams.length + 1}`);
            whereParams.push(value);
            return bridge;
        },
        in(column, values) {
            const placeholders = values.map((_, i) => `$${whereParams.length + i + 1}`).join(', ');
            whereConditions.push(`${column} IN (${placeholders})`);
            whereParams.push(...values);
            return bridge;
        },
        gte(column, value) {
            whereConditions.push(`${column} >= $${whereParams.length + 1}`);
            whereParams.push(value);
            return bridge;
        },
        lt(column, value) {
            whereConditions.push(`${column} < $${whereParams.length + 1}`);
            whereParams.push(value);
            return bridge;
        },
        order(column, { ascending = true } = {}) {
            orderBy = `${column} ${ascending ? 'ASC' : 'DESC'}`;
            return bridge;
        },
        limit(val) {
            limitVal = val;
            return bridge;
        },
        range(from, to) {
            offsetVal = from;
            limitVal = to - from + 1;
            return bridge;
        },
        single() {
            isSingle = true;
            limitVal = 1;
            return bridge;
        },
        async then(resolve) {
            try {
                let sql = `SELECT ${selectFields} FROM ${tableName}`;
                if (whereConditions.length > 0) {
                    sql += ` WHERE ${whereConditions.join(' AND ')}`;
                }
                if (orderBy) {
                    sql += ` ORDER BY ${orderBy}`;
                }
                if (limitVal) {
                    sql += ` LIMIT ${limitVal}`;
                }
                if (offsetVal) {
                    sql += ` OFFSET ${offsetVal}`;
                }

                const result = await pool.query(sql, whereParams);
                const data = isSingle ? result.rows[0] || null : result.rows;
                resolve({ data, error: null, count: result.rowCount });
            } catch (error) {
                resolve({ data: null, error, count: 0 });
            }
        }
    };

    // Métodos de escritura
    bridge.insert = (data) => ({
        select() { return this; },
        single() { return this; },
        async then(resolve) {
            try {
                const keys = Object.keys(data);
                const values = Object.values(data);
                const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
                const sql = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
                const result = await pool.query(sql, values);
                resolve({ data: result.rows[0], error: null });
            } catch (error) {
                resolve({ data: null, error });
            }
        }
    });

    bridge.update = (data) => {
        const updateData = data;
        return {
            eq(column, value) {
                whereConditions.push(`${column} = $${whereParams.length + 1}`);
                whereParams.push(value);
                return this;
            },
            select() { return this; },
            single() { isSingle = true; return this; },
            async then(resolve) {
                try {
                    const keys = Object.keys(updateData);
                    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
                    const values = Object.values(updateData);
                    const whereClause = whereConditions.map((c, i) =>
                        c.replace(/\$\d+/, `$${keys.length + i + 1}`)
                    ).join(' AND ');

                    const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause} RETURNING *`;
                    const result = await pool.query(sql, [...values, ...whereParams]);
                    const resultData = isSingle ? result.rows[0] || null : result.rows;
                    resolve({ data: resultData, error: null });
                } catch (error) {
                    resolve({ data: null, error });
                }
            }
        };
    };

    return bridge;
}

/**
 * Helper para probar la conexión
 */
async function testConnection() {
    try {
        if (useSupabaseSDK && supabase) {
            const { data, error } = await supabase
                .from('usuarios')
                .select('id')
                .limit(1);

            if (error) {
                console.error('❌ Error conectando a Supabase:', error.message);
                return false;
            }
            console.log('✅ Conexión a Supabase verificada');
        } else {
            const result = await pool.query('SELECT 1 as connected');
            if (result.rows[0].connected === 1) {
                console.log('✅ Conexión a PostgreSQL verificada');
            }
        }
        return true;
    } catch (error) {
        console.error('❌ Error conectando a la base de datos:', error.message);
        return false;
    }
}

// Exportar el proxy que funciona en ambos modos
module.exports = {
    supabase: useSupabaseSDK ? supabase : { from: (table) => createPgBridge(table) },
    pool,
    testConnection,
    useSupabaseSDK
};

