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
const crypto = require('crypto');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { generateToken, authenticateToken } = require('../middleware/authMiddleware');
const { auditFromRequest, auditLogin, auditWithUser, AUDIT_TYPES } = require('../utils/auditHelper');
const { sendPasswordResetEmail, sendVerificationCodeEmail } = require('../services/emailService');
const { validateLogin } = require('../validators/authValidator');

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
router.post('/login', validateLogin, async (req, res) => {
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
            if (user) {
                // Generar código de 6 dígitos
                const code = Math.floor(100000 + Math.random() * 900000).toString();
                const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

                // Invalidar tokens anteriores del usuario
                await supabase
                    .from('password_reset_tokens')
                    .update({ used: true })
                    .eq('id_usuario', user.id)
                    .eq('used', false);

                // Guardar nuevo código
                const { error: tokenError } = await supabase
                    .from('password_reset_tokens')
                    .insert({
                        id_usuario: user.id,
                        token: code,
                        expires_at: expiresAt.toISOString(),
                        used: false
                    });

                if (tokenError) {
                    console.error('Error guardando código:', tokenError.message);
                } else {
                    // Enviar email con el código
                    const emailResult = await sendVerificationCodeEmail(email, code);

                    // Registrar en auditoría
                    await auditFromRequest(req, AUDIT_TYPES.PASSWORD_RESET_REQUEST || 'PASSWORD_RESET_REQUEST', {
                        email,
                        message: 'Solicitud de restablecimiento de contraseña (código)',
                        emailSent: emailResult.success
                    });

                    if (emailResult.success) {
                        console.log(`📧 Código de recuperación enviado a: ${email}`);
                    } else {
                        console.error(`❌ Error enviando email a ${email}: ${emailResult.error}`);
                    }
                }
            }
        }

        // Por seguridad, siempre devolvemos éxito
        res.json({
            success: true,
            message: 'Si el email existe, recibirá instrucciones para restablecer su contraseña'
        });

    } catch (error) {
        // Por seguridad, no revelamos errores específicos
        console.error('Error en forgot-password:', error.message);
        res.json({
            success: true,
            message: 'Si el email existe, recibirá instrucciones para restablecer su contraseña'
        });
    }
});

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Restablecer contraseña con token
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200:
 *         description: Contraseña actualizada
 *       400:
 *         description: Token inválido o expirado
 */
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({
            success: false,
            error: 'Token y nueva contraseña son requeridos'
        });
    }

    // Validar política de contraseña
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/;
    if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
            success: false,
            error: 'La contraseña debe tener mínimo 10 caracteres, incluir mayúsculas, minúsculas, números y símbolos (@$!%*?&)'
        });
    }

    try {
        // Buscar token válido
        const { data: tokenData, error: tokenError } = await supabase
            .from('password_reset_tokens')
            .select('id, id_usuario, expires_at, used')
            .eq('token', token)
            .single();

        if (tokenError || !tokenData) {
            return res.status(400).json({
                success: false,
                error: 'Token inválido o no encontrado'
            });
        }

        // Verificar si ya fue usado
        if (tokenData.used) {
            return res.status(400).json({
                success: false,
                error: 'Este enlace ya fue utilizado. Solicite uno nuevo.'
            });
        }

        // Verificar si expiró
        if (new Date(tokenData.expires_at) < new Date()) {
            return res.status(400).json({
                success: false,
                error: 'Este enlace ha expirado. Solicite uno nuevo.'
            });
        }

        // Hash de nueva contraseña
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        // Actualizar contraseña
        const { error: updateError } = await supabase
            .from('usuarios')
            .update({ password_hash: passwordHash })
            .eq('id', tokenData.id_usuario);

        if (updateError) {
            throw updateError;
        }

        // Marcar token como usado
        await supabase
            .from('password_reset_tokens')
            .update({ used: true })
            .eq('id', tokenData.id);

        // Obtener email del usuario para auditoría
        const { data: userData } = await supabase
            .from('usuarios')
            .select('email')
            .eq('id', tokenData.id_usuario)
            .single();

        // Registrar auditoría
        await auditFromRequest(req, AUDIT_TYPES.PASSWORD_CHANGE, {
            id_usuario: tokenData.id_usuario,
            email: userData?.email,
            method: 'reset_token'
        });

        console.log(`✅ Contraseña restablecida para usuario ${tokenData.id_usuario}`);

        res.json({
            success: true,
            message: 'Contraseña restablecida exitosamente. Ahora puede iniciar sesión.'
        });

    } catch (error) {
        console.error('Error en reset-password:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al restablecer la contraseña'
        });
    }
});

/**
 * @swagger
 * /api/auth/request-verification-code:
 *   post:
 *     summary: Solicitar código de verificación para cambio de contraseña
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Código enviado
 */
router.post('/request-verification-code', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const email = req.user.email;

        // Generar código de 6 dígitos
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

        // Invalidar tokens anteriores
        await supabase
            .from('password_reset_tokens')
            .update({ used: true })
            .eq('id_usuario', userId)
            .eq('used', false);

        // Guardar nuevo código
        const { error: tokenError } = await supabase
            .from('password_reset_tokens')
            .insert({
                id_usuario: userId,
                token: code, // Usamos el código como token
                expires_at: expiresAt.toISOString(),
                used: false
            });

        if (tokenError) {
            throw tokenError;
        }

        // Enviar email
        const emailResult = await sendVerificationCodeEmail(email, code);

        if (!emailResult.success) {
            return res.status(500).json({
                success: false,
                error: 'Error al enviar el correo de verificación'
            });
        }

        // Auditoría
        await auditFromRequest(req, AUDIT_TYPES.PASSWORD_RESET_REQUEST || 'PASSWORD_RESET_REQUEST', {
            email,
            method: 'verification_code'
        });

        res.json({
            success: true,
            message: 'Código de verificación enviado a su correo electrónico'
        });

    } catch (error) {
        console.error('Error en request-verification-code:', error);
        res.status(500).json({ success: false, error: 'Error al generar código de verificación' });
    }
});

module.exports = router;

