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
const { supabase } = require('../config/supabase');
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
        // Obtener usuarios
        const { data: usuarios, error: userError } = await supabase
            .from('usuarios')
            .select('id, email, rol, activo, fecha_creacion, ultimo_login')
            .order('fecha_creacion', { ascending: false });

        if (userError) throw userError;

        // Obtener terapeutas para hacer join manual
        const { data: terapeutas, error: terapError } = await supabase
            .from('terapeutas')
            .select('id, nombre, correo, especialidad, telefono, id_usuario');

        if (terapError) throw terapError;

        // Obtener conteo de pacientes
        const { data: assignments, error: aggError } = await supabase
            .from('terapeuta_paciente')
            .select('id_terapeuta, id_paciente');

        const counts = {};
        if (assignments) {
            assignments.forEach(a => {
                counts[a.id_terapeuta] = (counts[a.id_terapeuta] || 0) + 1;
            });
        }

        // Combinar datos
        const result = usuarios.map(user => {
            const terapeuta = terapeutas.find(t => t.id_usuario === user.id);
            return {
                id: user.id,
                username: user.email,
                rol: user.rol,
                activo: user.activo,
                fecha_creacion: user.fecha_creacion,
                ultimo_acceso: user.ultimo_login,
                id_terapeuta: terapeuta?.id || null,
                nombre: terapeuta?.nombre || null,
                correo: terapeuta?.correo || null,
                especialidad: terapeuta?.especialidad || null,
                telefono: terapeuta?.telefono || null,
                pacientes_count: terapeuta ? (counts[terapeuta.id] || 0) : 0
            };
        });

        res.json({ success: true, data: result });

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
 *               password: { type: string, example: "Terapeuta2024!@" }
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
    const { nombre, correo, password, especialidad, telefono } = req.body;

    // Validar campos requeridos (correo es el identificador de login)
    if (!nombre || !correo || !password) {
        return res.status(400).json({
            success: false,
            error: 'Campos requeridos: nombre, correo, password'
        });
    }

    // Validar contraseña (mínimo 8 caracteres con una mayúscula)
    if (password.length < 8 || !/[A-Z]/.test(password)) {
        return res.status(400).json({
            success: false,
            error: 'La contraseña debe tener mínimo 8 caracteres y al menos 1 mayúscula'
        });
    }

    try {
        // Verificar email único
        const { data: existingUser } = await supabase
            .from('usuarios')
            .select('id')
            .eq('email', correo)
            .single();

        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'El correo electrónico ya está registrado'
            });
        }

        // Hash de contraseña
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(password, salt);

        // Crear usuario (email = correo)
        const { data: newUser, error: userError } = await supabase
            .from('usuarios')
            .insert({
                email: correo,
                password_hash: passwordHash,
                rol: 'TERAPEUTA',
                activo: true
            })
            .select('id, email, rol')
            .single();

        if (userError) throw userError;

        // Crear terapeuta
        const { data: terapeuta, error: terapError } = await supabase
            .from('terapeutas')
            .insert({
                nombre,
                correo,
                especialidad: especialidad || 'General',
                telefono: telefono || null,
                id_usuario: newUser.id
            })
            .select()
            .single();

        if (terapError) throw terapError;

        // Auditoría
        await auditFromRequest(req, AUDIT_TYPES.TERAPEUTA_CREATED, {
            correo,
            nombre,
            especialidad: especialidad || 'General'
        });

        res.status(201).json({
            success: true,
            message: 'Terapeuta creado exitosamente',
            data: {
                usuario: { ...newUser, username: newUser.email },
                terapeuta
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
        // Buscar terapeuta existente
        const { data: existing } = await supabase
            .from('terapeutas')
            .select('*')
            .eq('id_usuario', id)
            .single();

        if (!existing) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        // Actualizar terapeuta
        const { data: updated, error } = await supabase
            .from('terapeutas')
            .update({
                nombre: nombre || existing.nombre,
                correo: correo || existing.correo,
                especialidad: especialidad || existing.especialidad,
                telefono: telefono || existing.telefono
            })
            .eq('id_usuario', id)
            .select()
            .single();

        if (error) throw error;

        // Auditoría
        await auditFromRequest(req, AUDIT_TYPES.USER_UPDATED, {
            id_usuario: id,
            cambios: { nombre, correo, especialidad, telefono }
        });

        res.json({
            success: true,
            message: 'Usuario actualizado',
            data: updated
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

        // Verificar que el usuario existe y obtener su estado actual
        const { data: user, error: userError } = await supabase
            .from('usuarios')
            .select('id, email, rol, activo')
            .eq('id', id)
            .single();

        if (userError || !user) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        }

        // RF-SEG-01: La eliminación/desactivación del superusuario está prohibida
        if (user.rol === 'SUPERADMIN') {
            return res.status(403).json({
                success: false,
                error: 'No se puede desactivar al Superadministrador'
            });
        }

        // Toggle estado
        const newState = !user.activo;
        const { data: updated, error } = await supabase
            .from('usuarios')
            .update({ activo: newState })
            .eq('id', id)
            .select('id, email, activo')
            .single();

        if (error) throw error;

        const auditType = newState ? AUDIT_TYPES.USER_ACTIVATED : AUDIT_TYPES.USER_DEACTIVATED;

        // Auditoría
        await auditFromRequest(req, auditType, {
            id_usuario: id,
            username: updated.email
        });

        res.json({
            success: true,
            message: `Usuario ${newState ? 'activado' : 'desactivado'}`,
            data: { ...updated, username: updated.email }
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

        const { data: updated, error } = await supabase
            .from('usuarios')
            .update({ password_hash: passwordHash })
            .eq('id', id)
            .select('id, email')
            .single();

        if (error) throw error;

        if (!updated) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        }

        // Auditoría
        await auditFromRequest(req, AUDIT_TYPES.PASSWORD_CHANGE, {
            id_usuario: id,
            username: updated.email,
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
