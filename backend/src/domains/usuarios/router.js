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
const { supabase } = require('../../config/supabase');
const { authenticateToken, requireSuperAdmin } = require('../../middleware/authMiddleware');
const { validateUserCreate, validateUserUpdate } = require('../../validators/userValidator');
const { AUDIT_TYPES, auditFromRequest } = require('../../utils/auditHelper');
const { isValidPassword, getPasswordPolicyMessage } = require('../../utils/passwordPolicy');
const { cacheGetResponse, invalidateCacheOnMutation } = require('../../middleware/cacheMiddleware');
const {
    parsePagination,
    parseSearch,
    parseSort,
    applySortClauses,
    buildPaginationMetadata
} = require('../../utils/queryOptions');

/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     summary: Listar todos los usuarios (solo Superadmin)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 200
 *       - in: query
 *         name: rol
 *         schema:
 *           type: string
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Orden multi-criterio (ej. fecha_creacion:desc,rol:asc)
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *       403:
 *         description: Acceso denegado
 */
router.get(
    '/',
    authenticateToken,
    requireSuperAdmin,
    cacheGetResponse({
        prefix: 'api:users:list',
        ttlSeconds: 20,
        payloadBuilder: (req) => ({
            role: req.user.rol,
            page: req.query.page || null,
            limit: req.query.limit || null,
            search: req.query.search || null,
            rol: req.query.rol || null,
            activo: req.query.activo || null,
            sort: req.query.sort || null
        })
    }),
    async (req, res) => {
    try {
        const pagination = parsePagination(req.query, {
            page: 1,
            limit: 25,
            maxLimit: 200
        });
        const search = parseSearch(req.query);
        const sortClauses = parseSort(
            req.query,
            ['fecha_creacion', 'email', 'rol', 'activo', 'ultimo_login'],
            [{ field: 'fecha_creacion', ascending: false }]
        );

        let usersQuery = supabase
            .from('usuarios')
            .select('id, email, rol, activo, fecha_creacion, ultimo_login', { count: 'exact' });

        if (req.query.rol) {
            usersQuery = usersQuery.eq('rol', req.query.rol);
        }

        if (req.query.activo === 'true' || req.query.activo === 'false') {
            usersQuery = usersQuery.eq('activo', req.query.activo === 'true');
        }

        if (search) {
            usersQuery = usersQuery.or(`email.ilike.%${search}%,rol.ilike.%${search}%`);
        }

        usersQuery = applySortClauses(usersQuery, sortClauses).range(pagination.from, pagination.to);

        const { data: usuarios, count: totalUsers, error: userError } = await usersQuery;

        if (userError) throw userError;

        const userIds = (usuarios || []).map((user) => user.id);

        if (userIds.length === 0) {
            return res.json({
                success: true,
                data: [],
                count: 0,
                pagination: buildPaginationMetadata({
                    page: pagination.page,
                    limit: pagination.limit,
                    total: totalUsers || 0
                })
            });
        }

        // Obtener terapeutas para hacer join manual
        const { data: terapeutas, error: terapError } = await supabase
            .from('terapeutas')
            .select('id, nombre, correo, especialidad, telefono, id_usuario');

        if (terapError) throw terapError;

        // Obtener conteo de pacientes
        const { data: assignments, error: aggError } = await supabase
            .from('terapeuta_paciente')
            .select('id_terapeuta, id_paciente');

        if (aggError) throw aggError;

        const therapistByUserId = new Map((terapeutas || []).map((item) => [item.id_usuario, item]));

        const counts = {};
        if (assignments) {
            assignments.forEach(a => {
                counts[a.id_terapeuta] = (counts[a.id_terapeuta] || 0) + 1;
            });
        }

        // Combinar datos
        const result = usuarios.map(user => {
            const terapeuta = therapistByUserId.get(user.id);
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

        res.json({
            success: true,
            data: result,
            count: result.length,
            pagination: buildPaginationMetadata({
                page: pagination.page,
                limit: pagination.limit,
                total: totalUsers || 0
            })
        });

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
 *             required: [nombre, correo, password]
 *             properties:
 *               nombre: { type: string, example: "Dr. Juan García" }
 *               correo: { type: string, example: "juan@clinica.com" }
 *               password: { type: string, example: "Terapeuta@2024!" }
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
router.post('/terapeuta', authenticateToken, requireSuperAdmin, validateUserCreate, invalidateCacheOnMutation(['api:users:list:*', 'api:therapists:list:*', 'api:dashboard:stats:*']), async (req, res) => {
    const { nombre, correo, password, especialidad, telefono } = req.body;
    const normalizedCorreo = String(correo || '').trim().toLowerCase();

    // Validar campos requeridos (correo es el identificador de login)
    if (!nombre || !normalizedCorreo || !password) {
        return res.status(400).json({
            success: false,
            error: 'Campos requeridos: nombre, correo, password'
        });
    }

    // Validar contraseña (mínimo 10 caracteres, mayúscula, minúscula, número, símbolo)
    if (!isValidPassword(password)) {
        return res.status(400).json({
            success: false,
            error: getPasswordPolicyMessage()
        });
    }

    try {
        // Verificar email único
        const { data: existingUser } = await supabase
            .from('usuarios')
            .select('id')
            .ilike('email', normalizedCorreo)
            .maybeSingle();

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
                email: normalizedCorreo,
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
                correo: normalizedCorreo,
                especialidad: especialidad || 'General',
                telefono: telefono || null,
                id_usuario: newUser.id
            })
            .select()
            .single();

        if (terapError) throw terapError;

        // Auditoría
        await auditFromRequest(req, AUDIT_TYPES.TERAPEUTA_CREATED, {
            correo: normalizedCorreo,
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
router.put('/:id', authenticateToken, requireSuperAdmin, validateUserUpdate, invalidateCacheOnMutation(['api:users:list:*', 'api:therapists:list:*', 'api:dashboard:stats:*']), async (req, res) => {
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
            autor: req.user.email,
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
router.put('/:id/toggle-estado', authenticateToken, requireSuperAdmin, invalidateCacheOnMutation(['api:users:list:*', 'api:therapists:list:*', 'api:dashboard:stats:*']), async (req, res) => {
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

        const newState = !user.activo;

        // Si se está desactivando, verificar si es terapeuta con pacientes
        if (!newState && user.rol === 'TERAPEUTA') {
            // Hagamoslo bien: Obtener ID terapeuta
            const { data: terapeuta } = await supabase
                .from('terapeutas')
                .select('id')
                .eq('id_usuario', id)
                .single();

            if (terapeuta) {
                const { count } = await supabase
                    .from('terapeuta_paciente')
                    .select('id_paciente', { count: 'exact', head: true })
                    .eq('id_terapeuta', terapeuta.id);

                if (count > 0) {
                    return res.status(400).json({
                        success: false,
                        error: 'No se puede desactivar un terapeuta con pacientes asignados. Reasígnelos primero.',
                        code: 'THERAPIST_HAS_PATIENTS'
                    });
                }
            }
        }
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
router.post('/:id/reset-password', authenticateToken, requireSuperAdmin, invalidateCacheOnMutation(['api:users:list:*']), async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
        return res.status(400).json({
            success: false,
            error: 'newPassword es requerido'
        });
    }

    // Validar contraseña
    if (!isValidPassword(newPassword)) {
        return res.status(400).json({
            success: false,
            error: getPasswordPolicyMessage()
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
