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
const { query } = require('../config/database');
const { generateToken, authenticateToken } = require('../middleware/authMiddleware');
const { auditFromRequest, AUDIT_TYPES } = require('../utils/auditHelper');

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
 *             required: [username, password]
 *             properties:
 *               username: { type: string, example: "admin" }
 *               password: { type: string, example: "Admin123!" }
 *     responses:
 *       200:
 *         description: Login exitoso
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            error: 'Username y password son requeridos'
        });
    }

    try {
        // Buscar usuario
        const result = await query(
            `SELECT u.*, t.id as id_terapeuta, t.nombre as terapeuta_nombre
             FROM usuarios u
             LEFT JOIN terapeutas t ON u.id = t.id_usuario
             WHERE u.username = $1`,
            [username]
        );

        if (result.rows.length === 0) {
            await auditFromRequest(req, AUDIT_TYPES.LOGIN_FAILED, { username, reason: 'Usuario no encontrado' });
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas'
            });
        }

        const user = result.rows[0];

        // Verificar que el usuario esté activo
        if (!user.activo) {
            await auditFromRequest(req, AUDIT_TYPES.LOGIN_FAILED, { username, reason: 'Usuario inactivo' });
            return res.status(401).json({
                success: false,
                error: 'Usuario desactivado. Contacte al administrador.'
            });
        }

        // Verificar contraseña
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            await auditFromRequest(req, AUDIT_TYPES.LOGIN_FAILED, { username, reason: 'Contraseña incorrecta' });
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas'
            });
        }

        // Actualizar último acceso
        await query('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = $1', [user.id]);

        // Generar token
        const token = generateToken({
            id: user.id,
            username: user.username,
            rol: user.rol,
            id_terapeuta: user.id_terapeuta
        });

        // Registrar auditoría
        await auditFromRequest(req, AUDIT_TYPES.LOGIN_SUCCESS, { username });

        res.json({
            success: true,
            message: 'Login exitoso',
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    rol: user.rol,
                    nombre: user.terapeuta_nombre || user.username,
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
 *             required: [nombre, correo, username, password]
 *             properties:
 *               nombre: { type: string, example: "Administrador Principal" }
 *               correo: { type: string, example: "admin@clinica.com" }
 *               username: { type: string, example: "superadmin" }
 *               password: { type: string, example: "Admin2024!" }
 *     responses:
 *       201:
 *         description: Superadministrador creado
 *       400:
 *         description: Ya existe un superadministrador
 */
router.post('/setup', async (req, res) => {
    const { nombre, correo, username, password } = req.body;

    // Validar campos requeridos
    if (!nombre || !correo || !username || !password) {
        return res.status(400).json({
            success: false,
            error: 'Todos los campos son requeridos: nombre, correo, username, password'
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
        const existingAdmin = await query("SELECT id FROM usuarios WHERE rol = 'SUPERADMIN'");

        if (existingAdmin.rows.length > 0) {
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
        const userResult = await query(
            `INSERT INTO usuarios (username, password_hash, rol, activo)
             VALUES ($1, $2, 'SUPERADMIN', true)
             RETURNING id, username, rol`,
            [username, passwordHash]
        );

        const newUser = userResult.rows[0];

        // Crear entrada de terapeuta asociada (para gestión)
        await query(
            `INSERT INTO terapeutas (nombre, correo, id_usuario, especialidad)
             VALUES ($1, $2, $3, 'Administración')`,
            [nombre, correo, newUser.id]
        );

        // Registrar auditoría
        await auditFromRequest(req, AUDIT_TYPES.SUPERADMIN_CREATED, {
            username,
            nombre,
            correo
        });

        // Generar token
        const token = generateToken({
            id: newUser.id,
            username: newUser.username,
            rol: newUser.rol
        });

        res.status(201).json({
            success: true,
            message: 'Superadministrador creado exitosamente',
            data: {
                token,
                user: {
                    id: newUser.id,
                    username: newUser.username,
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
        const result = await query(
            `SELECT u.id, u.username, u.rol, u.activo, u.ultimo_acceso,
                    t.id as id_terapeuta, t.nombre, t.correo, t.especialidad
             FROM usuarios u
             LEFT JOIN terapeutas t ON u.id = t.id_usuario
             WHERE u.id = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        const user = result.rows[0];
        res.json({
            success: true,
            data: {
                id: user.id,
                username: user.username,
                rol: user.rol,
                activo: user.activo,
                ultimo_acceso: user.ultimo_acceso,
                nombre: user.nombre || user.username,
                correo: user.correo,
                especialidad: user.especialidad,
                id_terapeuta: user.id_terapeuta
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
        const userResult = await query('SELECT password_hash FROM usuarios WHERE id = $1', [req.user.id]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        }

        // Verificar contraseña actual
        const validPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
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
        await query('UPDATE usuarios SET password_hash = $1 WHERE id = $2', [newPasswordHash, req.user.id]);

        // Registrar auditoría
        await auditFromRequest(req, AUDIT_TYPES.PASSWORD_CHANGE, { username: req.user.username });

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
        const result = await query("SELECT COUNT(*) as count FROM usuarios WHERE rol = 'SUPERADMIN'");
        const hasAdmin = parseInt(result.rows[0].count) > 0;

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

module.exports = router;
