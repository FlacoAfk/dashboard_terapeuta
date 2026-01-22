
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const tables = [
    'evaluacion_cognitiva',
    'resumen_cognitivo_sesion',
    'resumen_sesion',
    'eventos_interacciones',
    'sesiones',
    'terapeuta_paciente',
    'password_reset_tokens',
    'auditoria',
    'pacientes',
    'terapeutas',
    'usuarios'
];

async function wipe() {
    console.log('Starting database wipe...');

    for (const table of tables) {
        try {
            // Delete all rows where id is not 0 (effectively all rows)
            // Note: If using UUIDs, filter might need adjustment, but 'id' usually integer > 0 in this schema
            // If primary key is different, this might fail unless generic logic is used.
            // Schema says 'id' is INTEGER (PK) for all tables.

            // Check if table has data first to avoid unnecessary errors? No, just delete.
            // Using a filter that is always true: id > -1
            const { error: countError, count } = await supabase.from(table).select('*', { count: 'exact', head: true });

            if (count > 0) {
                const { error } = await supabase.from(table).delete().neq('id', -1);
                if (error) {
                    console.error(`Failed to wipe ${table}:`, error.message);
                } else {
                    console.log(`Wiped ${table}`);
                }
            } else {
                console.log(`Table ${table} is already empty.`);
            }

        } catch (err) {
            console.error(`Exception wiping ${table}:`, err.message);
        }
    }

    console.log('Wipe complete.');
}

wipe();
