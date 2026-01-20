/**
 * ========================================
 * RUTAS DE AUTENTICACIÓN
 * ========================================
 * 
 * Endpoints para login, setup y gestión de sesión
 * Requerimientos: RF-SEG-01, RF-SEG-02, RF-SEG-03
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { generateToken, authenticateToken } = require('../middleware/authMiddleware');
const { auditFromRequest, auditLogin, auditWithUser, AUDIT_TYPES } = require('../utils/auditHelper');

/**
 * ========================================
 * SISTEMA DE BLOQUEO DE CUENTA
 * ========================================
 * RF-SEG-01: Bloqueo después de 5 intentos fallidos
 */
const loginAttempts = new Map(); // email -> { count, lockedUntil }
const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutos

/**
 * Verificar si una cuenta está bloqueada
 */
const isAccountLocked = (email) => {
    const attempt = loginAttempts.get(email);
    if (!attempt) return false;

    if (attempt.lockedUntil && Date.now() < attempt.lockedUntil) {
        return true;
    }

    // Si el bloqueo expiró, resetear intentos
    if (attempt.lockedUntil && Date.now() >= attempt.lockedUntil) {
        loginAttempts.delete(email);
    }

    return false;
};

/**
 * Registrar intento fallido de login
 */
const recordFailedAttempt = (email) => {
    const attempt = loginAttempts.get(email) || { count: 0, lockedUntil: null };
    attempt.count += 1;

    if (attempt.count >= MAX_ATTEMPTS) {
        attempt.lockedUntil = Date.now() + LOCK_DURATION_MS;
    }

    loginAttempts.set(email, attempt);
    return attempt;
};

/**
 * Resetear intentos al login exitoso
 */
const resetAttempts = (email) => {
    loginAttempts.delete(email);
};

/**
 * Obtener tiempo restante de bloqueo
 */
const getLockTimeRemaining = (email) => {
    const attempt = loginAttempts.get(email);
    if (!attempt || !attempt.lockedUntil) return 0;
    const remaining = Math.ceil((attempt.lockedUntil - Date.now()) / 1000 / 60);
    return remaining > 0 ? remaining : 0;
};

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: "admin@cerebro.com" }
 *               password: { type: string, example: "Admin123!@" }
 *     responses:
 *       200:
 *         description: Login exitoso
 *       401:
 *         description: Credenciales inválidas
 *       423:
 *         description: Cuenta bloqueada temporalmente
 */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            error: 'Email y password son requeridos'
        });
    }

    // Verificar si la cuenta está bloqueada
    if (isAccountLocked(email)) {
        const remainingMinutes = getLockTimeRemaining(email);
        await auditLogin(req, AUDIT_TYPES.LOGIN_FAILED, email, { reason: 'Cuenta bloqueada', remainingMinutes });
        return res.status(423).json({
            success: false,
            error: `Cuenta bloqueada por demasiados intentos fallidos. Intente nuevamente en ${remainingMinutes} minutos.`,
            code: 'ACCOUNT_LOCKED',
            remainingMinutes
        });
    }

    try {
        // Buscar usuario y terapeuta asociado
        const { data: userData, error: userError } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', email)
            .single();

        if (userError || !userData) {
            recordFailedAttempt(email);
            await auditLogin(req, AUDIT_TYPES.LOGIN_FAILED, email, { reason: 'Usuario no encontrado' });
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas'
            });
        }

        // Buscar terapeuta asociado
        const { data: terapeutaData } = await supabase
            .from('terapeutas')
            .select('id, nombre')
            .eq('id_usuario', userData.id)
            .single();

        const user = {
            ...userData,
            id_terapeuta: terapeutaData?.id || null,
            terapeuta_nombre: terapeutaData?.nombre || null
        };

        // Verificar que el usuario esté activo
        if (!user.activo) {
            await auditLogin(req, AUDIT_TYPES.LOGIN_FAILED, email, { reason: 'Usuario inactivo' });
            return res.status(401).json({
                success: false,
                error: 'Usuario desactivado. Contacte al administrador.'
            });
        }

        // Verificar contraseña
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            const attempt = recordFailedAttempt(email);
            const attemptsRemaining = MAX_ATTEMPTS - attempt.count;
            await auditLogin(req, AUDIT_TYPES.LOGIN_FAILED, email, { reason: 'Contraseña incorrecta', attemptsRemaining });

            let errorMessage = 'Credenciales inválidas';
            if (attemptsRemaining > 0 && attemptsRemaining <= 2) {
                errorMessage += `. Intentos restantes: ${attemptsRemaining}`;
            } else if (attemptsRemaining <= 0) {
                const remainingMinutes = getLockTimeRemaining(email);
                return res.status(423).json({
                    success: false,
                    error: `Cuenta bloqueada por demasiados intentos fallidos. Intente nuevamente en ${remainingMinutes} minutos.`,
                    code: 'ACCOUNT_LOCKED',
                    remainingMinutes
                });
            }

            return res.status(401).json({
                success: false,
                error: errorMessage
            });
        }

        // Actualizar último acceso
        await supabase
            .from('usuarios')
            .update({ ultimo_login: new Date().toISOString() })
            .eq('id', user.id);

        // Generar token
        const token = generateToken({
            id: user.id,
            email: user.email,
            rol: user.rol,
            id_terapeuta: user.id_terapeuta
        });

        // Login exitoso: resetear intentos fallidos
        resetAttempts(email);

        // Registrar auditoría con usuario autenticado
        await auditWithUser(req, AUDIT_TYPES.LOGIN_SUCCESS, user, { email });

        res.json({
            success: true,
            message: 'Login exitoso',
            data: {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    rol: user.rol,
                    nombre: user.terapeuta_nombre || user.email,
                    id_terapeuta: user.id_terapeuta
                }
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/auth/setup:
 *   post:
 *     summary: Crear Superadministrador inicial (solo funciona una vez)
 *     tags: [Autenticación]
 *     description: |
 *       RF-SEG-01: Creación del Superusuario.
 *       Solo puede ejecutarse una vez durante la instalación inicial.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, correo, password]
 *             properties:
 *               nombre: { type: string, example: "Administrador Principal" }
 *               correo: { type: string, example: "admin@clinica.com" }
 *               password: { type: string, example: "Contraseña123!@" }
 *     responses:
 *       201:
 *         description: Superadministrador creado
 *       400:
 *         description: Ya existe un superadministrador
 */
router.post('/setup', async (req, res) => {
    const { nombre, correo, password } = req.body;

    // Validar campos requeridos
    if (!nombre || !correo || !password) {
        return res.status(400).json({
            success: false,
            error: 'Todos los campos son requeridos: nombre, correo, password'
        });
    }

    // Validar política de contraseña (RF-SEG-01: mínimo 10 caracteres, mayúsculas, minúsculas, número, símbolo)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({
            success: false,
            error: 'La contraseña debe tener mínimo 10 caracteres, incluir mayúsculas, minúsculas, números y símbolos (@$!%*?&)'
        });
    }

    try {
        // Verificar si ya existe un superadministrador
        const { data: existingAdmin } = await supabase
            .from('usuarios')
            .select('id')
            .eq('rol', 'SUPERADMIN')
            .limit(1);

        if (existingAdmin && existingAdmin.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Ya existe un Superadministrador. Esta operación solo puede realizarse una vez.',
                code: 'SUPERADMIN_EXISTS'
            });
        }

        // Hash de la contraseña
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(password, salt);

        // Crear usuario superadmin
        const { data: newUser, error: userError } = await supabase
            .from('usuarios')
            .insert({
                email: correo,
                password_hash: passwordHash,
                rol: 'SUPERADMIN',
                activo: true
            })
            .select('id, email, rol')
            .single();

        if (userError) {
            throw userError;
        }

        // Crear entrada de terapeuta asociada (para gestión)
        await supabase
            .from('terapeutas')
            .insert({
                nombre,
                correo,
                id_usuario: newUser.id,
                especialidad: 'Administración'
            });

        // Registrar auditoría
        await auditFromRequest(req, AUDIT_TYPES.SUPERADMIN_CREATED, {
            email: correo,
            nombre
        });

        // Generar token
        const token = generateToken({
            id: newUser.id,
            email: newUser.email,
            rol: newUser.rol
        });

        res.status(201).json({
            success: true,
            message: 'Superadministrador creado exitosamente',
            data: {
                token,
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    rol: newUser.rol,
                    nombre
                }
            }
        });

    } catch (error) {
        console.error('Error en setup:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obtener información del usuario autenticado
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Información del usuario
 *       401:
 *         description: No autenticado
 */
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const { data: user, error: userError } = await supabase
            .from('usuarios')
            .select('id, email, rol, activo, ultimo_login')
            .eq('id', req.user.id)
            .single();

        if (userError || !user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        // Buscar terapeuta asociado
        const { data: terapeuta } = await supabase
            .from('terapeutas')
            .select('id, nombre, correo, especialidad')
            .eq('id_usuario', user.id)
            .single();

        res.json({
            success: true,
            data: {
                id: user.id,
                email: user.email,
                rol: user.rol,
                activo: user.activo,
                ultimo_acceso: user.ultimo_login,
                nombre: terapeuta?.nombre || user.email,
                correo: terapeuta?.correo,
                especialidad: terapeuta?.especialidad,
                id_terapeuta: terapeuta?.id
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Cambiar contraseña del usuario actual
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200:
 *         description: Contraseña actualizada
 *       401:
 *         description: Contraseña actual incorrecta
 */
router.post('/change-password', authenticateToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({
            success: false,
            error: 'currentPassword y newPassword son requeridos'
        });
    }

    // Validar nueva contraseña
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/;
    if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
            success: false,
            error: 'La nueva contraseña debe tener mínimo 10 caracteres, incluir mayúsculas, minúsculas, números y símbolos'
        });
    }

    try {
        // Obtener usuario actual
        const { data: user, error: userError } = await supabase
            .from('usuarios')
            .select('password_hash')
            .eq('id', req.user.id)
            .single();

        if (userError || !user) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        }

        // Verificar contraseña actual
        const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                error: 'Contraseña actual incorrecta'
            });
        }

        // Hash de nueva contraseña
        const salt = await bcrypt.genSalt(12);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        // Actualizar contraseña
        await supabase
            .from('usuarios')
            .update({ password_hash: newPasswordHash })
            .eq('id', req.user.id);

        // Registrar auditoría
        await auditFromRequest(req, AUDIT_TYPES.PASSWORD_CHANGE, { email: req.user.email });

        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/auth/check-setup:
 *   get:
 *     summary: Verificar si el sistema ya tiene un superadministrador
 *     tags: [Autenticación]
 *     responses:
 *       200:
 *         description: Estado de configuración
 */
router.get('/check-setup', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('id')
            .eq('rol', 'SUPERADMIN')
            .limit(1);

        if (error) {
            throw error;
        }

        const hasAdmin = data && data.length > 0;

        res.json({
            success: true,
            data: {
                configured: hasAdmin,
                message: hasAdmin
                    ? 'Sistema configurado. Puede iniciar sesión.'
                    : 'Sistema no configurado. Debe crear el Superadministrador inicial.'
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Solicitar restablecimiento de contraseña
 *     tags: [Autenticación]
 *     description: |
 *       Envía instrucciones para restablecer la contraseña.
 *       Por seguridad, siempre devuelve éxito sin importar si el email existe.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, example: "usuario@clinica.com" }
 *     responses:
 *       200:
 *         description: Instrucciones enviadas (si el email existe)
 */
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            error: 'El email es requerido'
        });
    }

    try {
        // Buscar usuario
        const { data: user } = await supabase
            .from('usuarios')
            .select('id, email')
            .eq('email', email)
            .single();

        if (user) {
            // En una implementación real, aquí se enviaría un email con un token de reset
            // Por ahora, solo registramos en auditoría
            await auditFromRequest(req, AUDIT_TYPES.PASSWORD_RESET_REQUEST || 'PASSWORD_RESET_REQUEST', {
                email,
                message: 'Solicitud de restablecimiento de contraseña'
            });

            console.log(`📧 Solicitud de reset de contraseña para: ${email}`);
        }

        // Por seguridad, siempre devolvemos éxito
        res.json({
            success: true,
            message: 'Si el email existe, recibirá instrucciones para restablecer su contraseña'
        });

    } catch (error) {
        // Por seguridad, no revelamos errores específicos
        res.json({
            success: true,
            message: 'Si el email existe, recibirá instrucciones para restablecer su contraseña'
        });
    }
});

module.exports = router;
