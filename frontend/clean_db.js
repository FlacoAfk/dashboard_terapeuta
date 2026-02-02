const fs = require('fs');
const path = require('path');

// 1. Manually parse .env to avoid dependency issues
const envPath = path.resolve(__dirname, '../backend/.env');
console.log(`Reading .env from ${envPath}`);
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const idx = line.indexOf('=');
    if (idx !== -1) {
        const key = line.substring(0, idx);
        let val = line.substring(idx + 1);
        // Remove quotes if present
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        env[key] = val;
    }
});

const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

async function cleanTable(table) {
    console.log(`Cleaning ${table}...`);
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=neq.0`, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Prefer': 'return=minimal'
            }
        });
        if (!res.ok) {
            const text = await res.text();
            console.error(`Failed to clean ${table}: ${res.status} ${text}`);
        } else {
            console.log(`  > ${table} cleaned.`);
        }
    } catch (e) {
        console.error(`Error cleaning ${table}:`, e.message);
    }
}

async function cleanAuthUsers() {
    console.log('Cleaning auth users...');
    try {
        const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });

        if (!listRes.ok) {
            console.error('Failed to list users:', listRes.status);
            return;
        }

        const data = await listRes.json();
        if (data.users) {
            for (const user of data.users) {
                console.log(`  > Deleting user ${user.email} (${user.id})`);
                await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
                    method: 'DELETE',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`
                    }
                });
            }
        }
    } catch (e) {
        console.error('Error cleaning auth users:', e.message);
    }
}

async function run() {
    console.log('--- STARTING DATABASE CLEANUP ---');
    await cleanTable('audit_logs');
    await cleanTable('metricas');
    await cleanTable('evaluacion');
    await cleanTable('eventos');
    await cleanTable('sesiones');
    await cleanTable('pacientes');
    await cleanTable('terapeuta_paciente'); // Dependencies first
    await cleanTable('terapeutas');
    await cleanTable('usuarios');

    await cleanAuthUsers();
    console.log('--- DATABASE CLEANUP COMPLETE ---');
}

run();
