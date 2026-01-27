const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

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

const SCREENSHOT_DIR = path.resolve(__dirname, '../docs/manual_screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function cleanTable(table) {
    console.log(`Cleaning ${table}...`);
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
    }
}

async function cleanAuthUsers() {
    console.log('Cleaning auth users...');
    // List users
    const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: 'GET',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    });

    if (!listRes.ok) {
        console.error('Failed to list users (Key might not be service_role):', listRes.status);
        return;
    }

    const data = await listRes.json();
    if (data.users) {
        for (const user of data.users) {
            console.log(`Deleting user ${user.id}`);
            await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
                method: 'DELETE',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            });
        }
    }
}

async function run() {
    // Clean DB
    // Order matters? For Delete with Cascade, maybe not if configured, but let's be safe.
    // Metric/Eval depend on Session?
    await cleanTable('audit_logs');
    await cleanTable('metricas');
    await cleanTable('evaluacion');
    await cleanTable('eventos'); // if exists
    await cleanTable('sesiones');
    await cleanTable('pacientes');
    await cleanTable('usuarios');

    // Auth users
    await cleanAuthUsers();

    console.log('Database cleared. Starting Browser...');

    const browser = await chromium.launch({ headless: true });
    // Increase size for better screenshots
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    try {
        // FLOW BEGINS

        // 1. Setup
        console.log('Navigating to Setup...');
        await page.goto('http://localhost:5173');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_setup_initial.png') });

        // Check if we are on setup
        const url = page.url();
        console.log(`Current URL: ${url}`);

        let onLoginPage = url.includes('/login');

        // If on login page but we expect setup, maybe there's a link or we just fill the setup form if it's there?
        // Assumption: If no users, app redirects to /setup or shows setup form.

        // Let's look for "Crear Super Administrador" text or similar
        // Or fill inputs

        try {
            await page.fill('input[placeholder*="Nombre"]', 'Super Admin');
            await page.fill('input[placeholder*="Correo"]', 'admin@cerebroalfuego.com');
            await page.fill('input[placeholder*="Contraseña"]', 'DevPassword123!');

            // Confirm password might exist
            const confirm = await page.$('input[placeholder*="Confirm"]');
            if (confirm) await confirm.fill('DevPassword123!');

            await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_setup_filled.png') });

            // Click Submit
            await page.click('button[type="submit"]');
            await page.waitForTimeout(3000);
            console.log('Setup submitted.');
        } catch (e) {
            console.log('Could not fill setup form (maybe already setup or different field names):', e.message);
        }

        // 2. Login
        console.log('Attempting Login...');
        // Ensure we are on login
        if (!page.url().includes('login')) await page.goto('http://localhost:5173/login');

        await page.fill('input[type="email"]', 'admin@cerebroalfuego.com');
        await page.fill('input[type="password"]', 'DevPassword123!');
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_login.png') });
        await page.click('button[type="submit"]');

        await page.waitForTimeout(4000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_dashboard.png') });

        // 3. Create Therapist
        console.log('Creating Therapist user...');
        await page.goto('http://localhost:5173/usuarios');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_users_view.png') });

        // Click create button
        await page.click('button:has-text("Nuevo"), button:has-text("Crear"), button:has-text("+")');
        await page.waitForTimeout(1000);

        // Fill user form
        await page.fill('input[name="nombre"]', 'Terapeuta Test');
        await page.fill('input[name="email"]', 'terapeuta@test.com');
        await page.fill('input[name="password"]', 'Terapeuta123!'); // Only if password field exists on create
        // Role select
        const roleSelect = await page.$('select[name="rol"]');
        if (roleSelect) await roleSelect.selectOption({ label: 'Terapeuta' });
        else await page.fill('input[name="rol"]', 'terapeuta').catch(() => { }); // Fallback

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_user_create_form.png') });
        await page.click('button[type="submit"], button:has-text("Guardar")');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_user_created.png') });

        // 4. Create Patient
        console.log('Creating Patient...');
        await page.goto('http://localhost:5173/pacientes');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_patients_view.png') });

        await page.click('button:has-text("Nuevo"), button:has-text("Crear"), button:has-text("+")');
        await page.waitForTimeout(1000);

        await page.fill('input[name="nombre"]', 'Paciente Ejemplo');
        await page.fill('input[name="email"]', 'paciente@ejemplo.com');
        await page.fill('input[name="edad"]', '25');
        // If therapist select exists
        const therapistSelect = await page.$('select[name="id_terapeuta"]');
        if (therapistSelect) {
            // Try to select the one we just made
            await therapistSelect.selectOption({ label: 'Terapeuta Test' }).catch(async () => {
                // Or select first available if label matching fails
                await therapistSelect.selectOption({ index: 1 });
            });
        }

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_patient_create_form.png') });
        await page.click('button[type="submit"], button:has-text("Guardar")');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_patient_created.png') });

        // 5. Audit Log & Export
        console.log('Audit Log...');
        await page.goto('http://localhost:5173/auditoria');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_audit_log.png') });

        // Try export
        const exportBtn = await page.$('button:has-text("Exportar"), button:has-text("CSV")');
        if (exportBtn) {
            // Just hover or highlight
            await exportBtn.hover();
            await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_audit_export_hover.png') });
        }

        // 6. Disable Therapist / Reassign Prompt
        console.log('Disabling Therapist...');
        await page.goto('http://localhost:5173/usuarios');
        await page.waitForTimeout(2000);

        // Locate the delete/disable button for 'terapeuta@test.com'
        // This is tricky without specific IDs. Assuming row structure.
        // We'll take a screenshot of the list first.

        // Try to find the row
        const row = page.locator('tr:has-text("terapeuta@test.com")');
        if (await row.count() > 0) {
            const disableBtn = row.locator('button[title="Desactivar"], button:has-text("Desactivar"), button[title="Eliminar"]');
            if (await disableBtn.count() > 0) {
                await disableBtn.click();
                await page.waitForTimeout(1000);
                await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13_disable_action.png') });

                // Confirm if modal
                await page.click('button:has-text("Confirmar"), button:has-text("Sí"), button:has-text("Aceptar")').catch(() => { });
                await page.waitForTimeout(2000);

                // Check if reassign prompt appears
                await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14_reassign_prompt_or_result.png') });
            }
        }

        // 7. Profile Edit
        console.log('Profile Edit...');
        await page.goto('http://localhost:5173/perfil');
        await page.waitForTimeout(2000);
        const nameInput = await page.$('input[name="nombre"]');
        if (nameInput) {
            await nameInput.fill('Admin Updated');
            await page.screenshot({ path: path.join(SCREENSHOT_DIR, '15_profile_edit.png') });
        }

        // 8. Change Password (View)
        console.log('Change Password View...');
        // Might be in profile or separate
        if (await page.$('text=Cambiar Contraseña')) {
            await page.click('text=Cambiar Contraseña');
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(SCREENSHOT_DIR, '16_change_password_view.png') });
        }

    } catch (e) {
        console.error('Workflow error:', e);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '99_error.png') });
    } finally {
        await browser.close();
    }
}

run();
