/**
 * ========================================
 * RUTAS DE GESTIÓN DE USUARIOS
 * ========================================
 * 
 * CRUD de usuarios (solo Superadministrador)
 * Requerimientos: RF-SEG-02, RF-SEG-03
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken, requireSuperAdmin } = require('../middleware/authMiddleware');
const { auditFromRequest, AUDIT_TYPES } = require('../utils/auditHelper');

/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     summary: Listar todos los usuarios (solo Superadmin)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *       403:
 *         description: Acceso denegado
 */
router.get('/', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                u.id,
                u.email as username,
                u.rol,
                u.activo,
                u.fecha_creacion,
                u.ultimo_login as ultimo_acceso,
                t.id as id_terapeuta,
                t.nombre,
                t.correo,
                t.especialidad,
                t.telefono
            FROM usuarios u
            LEFT JOIN terapeutas t ON u.id = t.id_usuario
            ORDER BY u.fecha_creacion DESC
        `);

        res.json({ success: true, data: result.rows });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/usuarios/terapeuta:
 *   post:
 *     summary: Crear nuevo terapeuta (solo Superadmin)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     description: RF-SEG-02 - El Superadministrador puede crear credenciales de nuevos terapeutas
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, correo, username, password, especialidad]
 *             properties:
 *               nombre: { type: string, example: "Dr. Juan García" }
 *               correo: { type: string, example: "juan@clinica.com" }
 *               username: { type: string, example: "terapeuta_juan" }
 *               password: { type: string, example: "Terapeuta2024!" }
 *               especialidad: { type: string, example: "Neuropsicología" }
 *               telefono: { type: string, example: "3001234567" }
 *     responses:
 *       201:
 *         description: Terapeuta creado
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: Acceso denegado
 */
router.post('/terapeuta', authenticateToken, requireSuperAdmin, async (req, res) => {
    const { nombre, correo, username, password, especialidad, telefono } = req.body;

    // Validar campos requeridos
    if (!nombre || !correo || !username || !password || !especialidad) {
        return res.status(400).json({
            success: false,
            error: 'Campos requeridos: nombre, correo, username, password, especialidad'
        });
    }

    // Validar contraseña (mínimo 10 caracteres con complejidad)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({
            success: false,
            error: 'La contraseña debe tener mínimo 10 caracteres, mayúsculas, minúsculas, números y símbolos'
        });
    }

    try {
        // Verificar email/username único
        const existingUser = await query('SELECT id FROM usuarios WHERE email = $1', [username]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'El username ya existe'
            });
        }

        // Hash de contraseña
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(password, salt);

        // Crear usuario
        const userResult = await query(
            `INSERT INTO usuarios (email, password_hash, rol, activo)
             VALUES ($1, $2, 'TERAPEUTA', true)
             RETURNING id, email as username, rol`,
            [username, passwordHash]
        );

        const newUser = userResult.rows[0];

        // Crear terapeuta
        const terapeutaResult = await query(
            `INSERT INTO terapeutas (nombre, correo, especialidad, telefono, id_usuario)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [nombre, correo, especialidad, telefono || null, newUser.id]
        );

        // Auditoría
        await auditFromRequest(req, AUDIT_TYPES.TERAPEUTA_CREATED, {
            username,
            nombre,
            correo,
            especialidad
        });

        res.status(201).json({
            success: true,
            message: 'Terapeuta creado exitosamente',
            data: {
                usuario: newUser,
                terapeuta: terapeutaResult.rows[0]
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/usuarios/{id}:
 *   put:
 *     summary: Actualizar usuario/terapeuta (solo Superadmin)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre: { type: string }
 *               correo: { type: string }
 *               especialidad: { type: string }
 *               telefono: { type: string }
 *     responses:
 *       200:
 *         description: Usuario actualizado
 */
router.put('/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
    const { id } = req.params;
    const { nombre, correo, especialidad, telefono } = req.body;

    try {
        // Actualizar terapeuta
        const result = await query(
            `UPDATE terapeutas 
             SET nombre = COALESCE($1, nombre),
                 correo = COALESCE($2, correo),
                 especialidad = COALESCE($3, especialidad),
                 telefono = COALESCE($4, telefono)
             WHERE id_usuario = $5
             RETURNING *`,
            [nombre, correo, especialidad, telefono, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        // Auditoría
        await auditFromRequest(req, AUDIT_TYPES.USER_UPDATED, {
            id_usuario: id,
            cambios: { nombre, correo, especialidad, telefono }
        });

        res.json({
            success: true,
            message: 'Usuario actualizado',
            data: result.rows[0]
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/usuarios/{id}/toggle-estado:
 *   put:
 *     summary: Activar/desactivar usuario (solo Superadmin)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     description: RF-SEG-02 - El Superadministrador puede editar estado de terapeutas (activo/inactivo)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Estado actualizado
 */
router.put('/:id/toggle-estado', authenticateToken, requireSuperAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        // No permitir desactivar al propio usuario
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({
                success: false,
                error: 'No puede desactivar su propia cuenta'
            });
        }

        // Verificar que el usuario que se va a desactivar no sea superadmin
        const userCheck = await query('SELECT rol FROM usuarios WHERE id = $1', [id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        }

        // RF-SEG-01: La eliminación/desactivación del superusuario está prohibida
        if (userCheck.rows[0].rol === 'SUPERADMIN') {
            return res.status(403).json({
                success: false,
                error: 'No se puede desactivar al Superadministrador'
            });
        }

        // Toggle estado
        const result = await query(
            `UPDATE usuarios 
             SET activo = NOT activo 
             WHERE id = $1 
             RETURNING id, username, activo`,
            [id]
        );

        const newState = result.rows[0].activo;
        const auditType = newState ? AUDIT_TYPES.USER_ACTIVATED : AUDIT_TYPES.USER_DEACTIVATED;

        // Auditoría
        await auditFromRequest(req, auditType, {
            id_usuario: id,
            username: result.rows[0].username
        });

        res.json({
            success: true,
            message: `Usuario ${newState ? 'activado' : 'desactivado'}`,
            data: result.rows[0]
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/usuarios/{id}/reset-password:
 *   post:
 *     summary: Resetear contraseña de usuario (solo Superadmin)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newPassword]
 *             properties:
 *               newPassword: { type: string }
 *     responses:
 *       200:
 *         description: Contraseña reseteada
 */
router.post('/:id/reset-password', authenticateToken, requireSuperAdmin, async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
        return res.status(400).json({
            success: false,
            error: 'newPassword es requerido'
        });
    }

    // Validar contraseña
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/;
    if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
            success: false,
            error: 'La contraseña debe tener mínimo 10 caracteres, mayúsculas, minúsculas, números y símbolos'
        });
    }

    try {
        // Hash de nueva contraseña
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        const result = await query(
            'UPDATE usuarios SET password_hash = $1 WHERE id = $2 RETURNING id, username',
            [passwordHash, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        }

        // Auditoría
        await auditFromRequest(req, AUDIT_TYPES.PASSWORD_CHANGE, {
            id_usuario: id,
            username: result.rows[0].username,
            accion: 'reset_by_admin'
        });

        res.json({
            success: true,
            message: 'Contraseña reseteada exitosamente'
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
