/**
 * ========================================
 * RUTAS DE LA API
 * ========================================
 * 
 * Aquí se definen todos los endpoints de la API.
 * Todas las rutas empiezan con /api/
 * 
 * Ejemplo: GET /api/patients
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken, requireTerapeuta, requireSuperAdmin, optionalAuth } = require('../middleware/authMiddleware');
const { auditFromRequest, AUDIT_TYPES } = require('../utils/auditHelper');

// ========================================
// ESTADO DE LA API
// ========================================

/**
 * @swagger
 * /api/status:
 *   get:
 *     summary: Estado de la API
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API funcionando correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 version: { type: string }
 *                 database: { type: string }
 */
router.get('/status', (req, res) => {
    res.json({
        success: true,
        message: 'API funcionando correctamente',
        version: '1.0.0',
        database: 'Supabase PostgreSQL'
    });
});

/**
 * @swagger
 * /api/db-status:
 *   get:
 *     summary: Verificar conexión a base de datos
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Conexión exitosa
 *       500:
 *         description: Error de conexión
 */
router.get('/db-status', async (req, res) => {
    try {
        const result = await query('SELECT NOW() as current_time, current_database() as database');
        res.json({
            success: true,
            message: 'Conexión a base de datos exitosa',
            data: {
                currentTime: result.rows[0].current_time,
                database: result.rows[0].database
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error conectando a la base de datos',
            details: error.message
        });
    }
});

// ========================================
// PACIENTES
// ========================================

/**
 * @swagger
 * /api/patients:
 *   get:
 *     summary: Obtener lista de pacientes
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       RF-SEG-03: Los terapeutas solo ven sus pacientes asignados.
 *       El Superadministrador ve todos los pacientes.
 *     parameters:
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo/inactivo
 *       - in: query
 *         name: nombre
 *         schema:
 *           type: string
 *         description: Buscar por nombre
 *     responses:
 *       200:
 *         description: Lista de pacientes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Paciente'
 */
router.get('/patients', authenticateToken, requireTerapeuta, async (req, res) => {
    const { activo, nombre } = req.query;

    try {
        let queryStr = `
            SELECT 
                p.id,
                p.identificacion,
                p.nombre,
                p.edad,
                p.diagnostico,
                p.activo,
                p.fecha_registro,
                tp.id_terapeuta,
                t.nombre as terapeuta_nombre
            FROM pacientes p
            LEFT JOIN terapeuta_paciente tp ON p.id = tp.id_paciente
            LEFT JOIN terapeutas t ON tp.id_terapeuta = t.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 0;

        // RF-SEG-03: Si es terapeuta, solo ver sus pacientes asignados
        if (req.user.rol === 'TERAPEUTA' && req.user.id_terapeuta) {
            paramCount++;
            queryStr += ` AND tp.id_terapeuta = $${paramCount}`;
            params.push(req.user.id_terapeuta);
        }

        // Filtro por estado activo
        if (activo !== undefined) {
            paramCount++;
            queryStr += ` AND p.activo = $${paramCount}`;
            params.push(activo === 'true');
        }

        // Filtro por nombre
        if (nombre) {
            paramCount++;
            queryStr += ` AND LOWER(p.nombre) LIKE LOWER($${paramCount})`;
            params.push(`%${nombre}%`);
        }

        queryStr += ' ORDER BY p.fecha_registro DESC';

        const result = await query(queryStr, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/patients/{id}:
 *   get:
 *     summary: Obtener un paciente por ID
 *     tags: [Pacientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del paciente
 *     responses:
 *       200:
 *         description: Datos del paciente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Paciente'
 *       404:
 *         description: Paciente no encontrado
 */
router.get('/patients/:id', authenticateToken, requireTerapeuta, async (req, res) => {
    const { id } = req.params;
    try {
        // Verificar acceso según rol
        let queryStr = `
            SELECT p.*, tp.id_terapeuta, t.nombre as terapeuta_nombre
            FROM pacientes p
            LEFT JOIN terapeuta_paciente tp ON p.id = tp.id_paciente
            LEFT JOIN terapeutas t ON tp.id_terapeuta = t.id
            WHERE p.id = $1
        `;
        const params = [id];

        // RF-SEG-03: Terapeuta solo puede ver su paciente asignado
        if (req.user.rol === 'TERAPEUTA' && req.user.id_terapeuta) {
            queryStr += ` AND tp.id_terapeuta = $2`;
            params.push(req.user.id_terapeuta);
        }

        const result = await query(queryStr, params);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Paciente no encontrado o sin acceso'
            });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/patients:
 *   post:
 *     summary: Crear un nuevo paciente
 *     tags: [Pacientes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PacienteInput'
 *     responses:
 *       201:
 *         description: Paciente creado exitosamente
 *       400:
 *         description: Datos inválidos
 */
router.post('/patients', authenticateToken, requireTerapeuta, async (req, res) => {
    const { identificacion, nombre, edad, diagnostico } = req.body;

    if (!nombre) {
        return res.status(400).json({
            success: false,
            error: 'El nombre es requerido'
        });
    }

    try {
        // Crear paciente
        const result = await query(
            `INSERT INTO pacientes (identificacion, nombre, edad, diagnostico, activo)
             VALUES ($1, $2, $3, $4, true)
             RETURNING *`,
            [identificacion, nombre, edad, diagnostico]
        );

        const newPatient = result.rows[0];

        // RF-SEG-03: Si es terapeuta, asignar automáticamente el paciente
        if (req.user.rol === 'TERAPEUTA' && req.user.id_terapeuta) {
            await query(
                `INSERT INTO terapeuta_paciente (id_terapeuta, id_paciente)
                 VALUES ($1, $2)
                 ON CONFLICT DO NOTHING`,
                [req.user.id_terapeuta, newPatient.id]
            );
        }

        // Auditoría
        await auditFromRequest(req, AUDIT_TYPES.PATIENT_CREATED, {
            id_paciente: newPatient.id,
            nombre: newPatient.nombre,
            terapeuta_asignado: req.user.id_terapeuta || null
        });

        res.status(201).json({
            success: true,
            message: 'Paciente creado exitosamente',
            data: newPatient
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/patients/{id}:
 *   put:
 *     summary: Actualizar un paciente
 *     tags: [Pacientes]
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
 *             $ref: '#/components/schemas/PacienteInput'
 *     responses:
 *       200:
 *         description: Paciente actualizado
 *       404:
 *         description: Paciente no encontrado
 */
router.put('/patients/:id', authenticateToken, requireTerapeuta, async (req, res) => {
    const { id } = req.params;
    const { identificacion, nombre, edad, diagnostico, activo } = req.body;

    try {
        const result = await query(
            `UPDATE pacientes 
             SET identificacion = COALESCE($1, identificacion),
                 nombre = COALESCE($2, nombre),
                 edad = COALESCE($3, edad),
                 diagnostico = COALESCE($4, diagnostico),
                 activo = COALESCE($5, activo)
             WHERE id = $6
             RETURNING *`,
            [identificacion, nombre, edad, diagnostico, activo, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Paciente no encontrado'
            });
        }

        // Auditoría
        await auditFromRequest(req, AUDIT_TYPES.PATIENT_UPDATED, {
            id_paciente: id,
            cambios: { identificacion, nombre, edad, diagnostico, activo }
        });

        res.json({
            success: true,
            message: 'Paciente actualizado',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/patients/{id}:
 *   delete:
 *     summary: Eliminar un paciente
 *     tags: [Pacientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paciente eliminado
 *       404:
 *         description: Paciente no encontrado
 */
router.delete('/patients/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        // RF-SEG-02: Solo superadmin puede eliminar pacientes
        const result = await query('DELETE FROM pacientes WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Paciente no encontrado'
            });
        }

        // Auditoría
        await auditFromRequest(req, AUDIT_TYPES.PATIENT_DELETED, {
            id_paciente: id,
            nombre: result.rows[0].nombre
        });

        res.json({
            success: true,
            message: 'Paciente eliminado',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/patients/{id}/assign:
 *   post:
 *     summary: Asignar paciente a terapeuta (solo Superadmin)
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     description: RF-SEG-02 - Asignar o reasignar pacientes entre terapeutas
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del paciente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_terapeuta]
 *             properties:
 *               id_terapeuta: { type: integer, description: "ID del terapeuta a asignar" }
 *     responses:
 *       200:
 *         description: Paciente asignado exitosamente
 *       403:
 *         description: Solo Superadministrador puede reasignar
 */
router.post('/patients/:id/assign', authenticateToken, requireSuperAdmin, async (req, res) => {
    const { id } = req.params;
    const { id_terapeuta } = req.body;

    if (!id_terapeuta) {
        return res.status(400).json({
            success: false,
            error: 'id_terapeuta es requerido'
        });
    }

    try {
        // Verificar que el paciente existe
        const patientCheck = await query('SELECT id, nombre FROM pacientes WHERE id = $1', [id]);
        if (patientCheck.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Paciente no encontrado' });
        }

        // Verificar que el terapeuta existe y está activo
        const therapistCheck = await query(`
            SELECT t.id, t.nombre, u.activo
            FROM terapeutas t
            JOIN usuarios u ON t.id_usuario = u.id
            WHERE t.id = $1
        `, [id_terapeuta]);

        if (therapistCheck.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Terapeuta no encontrado' });
        }

        if (!therapistCheck.rows[0].activo) {
            return res.status(400).json({
                success: false,
                error: 'No se puede asignar a un terapeuta inactivo'
            });
        }

        // Obtener asignación anterior (para auditoría)
        const prevAssignment = await query(
            'SELECT id_terapeuta FROM terapeuta_paciente WHERE id_paciente = $1',
            [id]
        );
        const prevTerapeuta = prevAssignment.rows.length > 0 ? prevAssignment.rows[0].id_terapeuta : null;

        // Eliminar asignación anterior y crear nueva (upsert)
        await query('DELETE FROM terapeuta_paciente WHERE id_paciente = $1', [id]);
        await query(
            'INSERT INTO terapeuta_paciente (id_terapeuta, id_paciente) VALUES ($1, $2)',
            [id_terapeuta, id]
        );

        // Auditoría
        const auditType = prevTerapeuta ? AUDIT_TYPES.PATIENT_REASSIGNED : AUDIT_TYPES.PATIENT_ASSIGNED;
        await auditFromRequest(req, auditType, {
            id_paciente: id,
            paciente_nombre: patientCheck.rows[0].nombre,
            terapeuta_anterior: prevTerapeuta,
            terapeuta_nuevo: id_terapeuta,
            terapeuta_nombre: therapistCheck.rows[0].nombre
        });

        res.json({
            success: true,
            message: prevTerapeuta
                ? `Paciente reasignado a ${therapistCheck.rows[0].nombre}`
                : `Paciente asignado a ${therapistCheck.rows[0].nombre}`,
            data: {
                id_paciente: parseInt(id),
                id_terapeuta: id_terapeuta,
                terapeuta_nombre: therapistCheck.rows[0].nombre
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// SESIONES
// ========================================

/**
 * @swagger
 * /api/sessions:
 *   get:
 *     summary: Obtener sesiones de terapia
 *     tags: [Sesiones]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       RF-SEG-03: Terapeutas solo ven sesiones de sus pacientes.
 *       RF-BDD-02: Registro de sesiones clínicas.
 *     parameters:
 *       - in: query
 *         name: id_paciente
 *         schema:
 *           type: integer
 *         description: Filtrar por paciente
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [INICIADA, COMPLETADA, ABANDONADA]
 *         description: Filtrar por estado
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Lista de sesiones
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Sesion'
 */
router.get('/sessions', authenticateToken, requireTerapeuta, async (req, res) => {
    const { id_paciente, estado, limit = 50 } = req.query;

    try {
        let queryStr = `
            SELECT 
                s.id,
                s.id_paciente,
                p.nombre as paciente_nombre,
                s.id_actividad,
                a.nombre as actividad_nombre,
                a.nivel_dificultad,
                s.fecha_inicio,
                s.fecha_fin,
                s.estado,
                s.num_pausas,
                s.num_alertas_descanso,
                rs.total_aciertos,
                rs.total_errores,
                rs.total_omisiones,
                rs.tiempo_total_seg,
                rs.observaciones,
                tp.id_terapeuta
            FROM sesiones s
            LEFT JOIN pacientes p ON s.id_paciente = p.id
            LEFT JOIN actividad_juego a ON s.id_actividad = a.id
            LEFT JOIN resumen_sesion rs ON s.id = rs.id_sesion
            LEFT JOIN terapeuta_paciente tp ON s.id_paciente = tp.id_paciente
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 0;

        // RF-SEG-03: Terapeuta solo ve sesiones de sus pacientes
        if (req.user.rol === 'TERAPEUTA' && req.user.id_terapeuta) {
            paramCount++;
            queryStr += ` AND tp.id_terapeuta = $${paramCount}`;
            params.push(req.user.id_terapeuta);
        }

        if (id_paciente) {
            paramCount++;
            queryStr += ` AND s.id_paciente = $${paramCount}`;
            params.push(parseInt(id_paciente));
        }

        if (estado) {
            paramCount++;
            queryStr += ` AND s.estado = $${paramCount}`;
            params.push(estado);
        }

        queryStr += ` ORDER BY s.fecha_inicio DESC`;
        paramCount++;
        queryStr += ` LIMIT $${paramCount}`;
        params.push(parseInt(limit));

        const result = await query(queryStr, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/sessions/{id}:
 *   get:
 *     summary: Obtener una sesión con eventos detallados
 *     tags: [Sesiones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Sesión con detalles y eventos
 *       404:
 *         description: Sesión no encontrada
 */
router.get('/sessions/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const sessionResult = await query(`
            SELECT 
                s.*,
                p.nombre as paciente_nombre,
                p.diagnostico as paciente_diagnostico,
                a.nombre as actividad_nombre,
                a.nivel_dificultad,
                a.tiempo_max_seg,
                rs.total_aciertos,
                rs.total_errores,
                rs.tiempo_total_seg,
                rs.observaciones
            FROM sesiones s
            LEFT JOIN pacientes p ON s.id_paciente = p.id
            LEFT JOIN actividad_juego a ON s.id_actividad = a.id
            LEFT JOIN resumen_sesion rs ON s.id = rs.id_sesion
            WHERE s.id = $1
        `, [id]);

        if (sessionResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Sesión no encontrada'
            });
        }

        const eventsResult = await query(`
            SELECT 
                ei.*,
                ec.clasificacion,
                ec.puntaje
            FROM eventos_interacciones ei
            LEFT JOIN evaluacion_cognitiva ec ON ei.id = ec.id_evento
            WHERE ei.id_sesion = $1
            ORDER BY ei.timestamp_evento
        `, [id]);

        res.json({
            success: true,
            data: {
                session: sessionResult.rows[0],
                events: eventsResult.rows
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/sessions:
 *   post:
 *     summary: Crear una nueva sesión (desde Unity o dashboard)
 *     tags: [Sesiones]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       RF-BDD-02: Registro de sesión clínica con metadatos.
 *       RF-UNT-09: Pantalla de apertura de sesión.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_paciente, id_actividad]
 *             properties:
 *               id_paciente: { type: integer }
 *               id_actividad: { type: integer }
 *     responses:
 *       201:
 *         description: Sesión creada
 *       400:
 *         description: Datos inválidos
 */
router.post('/sessions', authenticateToken, requireTerapeuta, async (req, res) => {
    const { id_paciente, id_actividad } = req.body;

    if (!id_paciente || !id_actividad) {
        return res.status(400).json({
            success: false,
            error: 'id_paciente y id_actividad son requeridos'
        });
    }

    try {
        // Crear sesión con estado INICIADA
        const result = await query(
            `INSERT INTO sesiones (id_paciente, id_actividad, estado, fecha_inicio)
             VALUES ($1, $2, 'INICIADA', NOW())
             RETURNING *`,
            [id_paciente, id_actividad]
        );

        // Registrar auditoría
        await auditFromRequest(req, AUDIT_TYPES.SESSION_STARTED, {
            id_sesion: result.rows[0].id,
            id_paciente,
            id_actividad
        });

        res.status(201).json({
            success: true,
            message: 'Sesión creada exitosamente',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/sessions/{id}/finish:
 *   put:
 *     summary: Finalizar una sesión con resumen
 *     tags: [Sesiones]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       RF-BDD-02: Registro de fecha_fin, duración y estado.
 *       RF-BDD-04: Resumen de aciertos, errores, omisiones.
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
 *               estado:
 *                 type: string
 *                 enum: [COMPLETADA, ABANDONADA]
 *                 default: COMPLETADA
 *               total_aciertos: { type: integer }
 *               total_errores: { type: integer }
 *               total_omisiones: { type: integer }
 *               tiempo_total_seg: { type: integer }
 *               observaciones: { type: string }
 *               num_pausas: { type: integer, default: 0 }
 *               num_alertas_descanso: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: Sesión finalizada
 *       404:
 *         description: Sesión no encontrada
 */
router.put('/sessions/:id/finish', authenticateToken, requireTerapeuta, async (req, res) => {
    const { id } = req.params;
    const {
        estado = 'COMPLETADA',
        total_aciertos = 0,
        total_errores = 0,
        total_omisiones = 0,
        tiempo_total_seg,
        observaciones,
        num_pausas = 0,
        num_alertas_descanso = 0
    } = req.body;

    try {
        // Actualizar sesión
        const sessionResult = await query(
            `UPDATE sesiones 
             SET fecha_fin = NOW(),
                 estado = $1,
                 num_pausas = $2,
                 num_alertas_descanso = $3
             WHERE id = $4 AND estado = 'INICIADA'
             RETURNING *`,
            [estado, num_pausas, num_alertas_descanso, id]
        );

        if (sessionResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Sesión no encontrada o ya finalizada'
            });
        }

        // Crear o actualizar resumen
        await query(
            `INSERT INTO resumen_sesion (id_sesion, total_aciertos, total_errores, total_omisiones, tiempo_total_seg, observaciones)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id_sesion) DO UPDATE SET
                total_aciertos = EXCLUDED.total_aciertos,
                total_errores = EXCLUDED.total_errores,
                total_omisiones = EXCLUDED.total_omisiones,
                tiempo_total_seg = EXCLUDED.tiempo_total_seg,
                observaciones = EXCLUDED.observaciones`,
            [id, total_aciertos, total_errores, total_omisiones, tiempo_total_seg, observaciones]
        );

        // Auditoría
        const auditType = estado === 'COMPLETADA' ? AUDIT_TYPES.SESSION_FINISHED : AUDIT_TYPES.SESSION_ABANDONED;
        await auditFromRequest(req, auditType, {
            id_sesion: id,
            estado,
            total_aciertos,
            total_errores,
            total_omisiones
        });

        res.json({
            success: true,
            message: `Sesión ${estado.toLowerCase()}`,
            data: sessionResult.rows[0]
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/sessions/{id}/events:
 *   post:
 *     summary: Registrar evento de interacción desde Unity
 *     tags: [Sesiones]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       RF-BDD-03: Registro detallado de acciones (logging cognitivo).
 *       RF-UNT-08: Medición de aciertos, errores, omisiones.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la sesión
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tipo_accion]
 *             properties:
 *               tipo_accion:
 *                 type: string
 *                 enum: [PICK_UP, DROP, POUR, CUT, MOVE, OPEN_DRAWER, TURN_ON_STOVE, TURN_OFF_STOVE, PAUSE, RESUME, ALERT_DESCANSO]
 *               objeto_id: { type: string, description: "ID del asset en Unity" }
 *               objeto_descripcion: { type: string }
 *               posicion_x: { type: number }
 *               posicion_y: { type: number }
 *               posicion_z: { type: number }
 *               cantidad: { type: number, description: "Ej: ml vertidos" }
 *               metadatos: { type: object, description: "JSON adicional" }
 *               clasificacion:
 *                 type: string
 *                 enum: [ACIERTO, ERROR, OMISION]
 *     responses:
 *       201:
 *         description: Evento registrado
 */
router.post('/sessions/:id/events', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const {
        tipo_accion,
        objeto_id,
        objeto_descripcion,
        posicion_x,
        posicion_y,
        posicion_z,
        cantidad,
        metadatos,
        clasificacion
    } = req.body;

    if (!tipo_accion) {
        return res.status(400).json({
            success: false,
            error: 'tipo_accion es requerido'
        });
    }

    try {
        // Verificar que la sesión existe y está activa
        const sessionCheck = await query(
            "SELECT id FROM sesiones WHERE id = $1 AND estado = 'INICIADA'",
            [id]
        );

        if (sessionCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Sesión no encontrada o no está activa'
            });
        }

        // Insertar evento
        const eventResult = await query(
            `INSERT INTO eventos_interacciones 
             (id_sesion, tipo_accion, objeto_id, objeto_descripcion, posicion_x, posicion_y, posicion_z, cantidad, metadatos)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [id, tipo_accion, objeto_id, objeto_descripcion, posicion_x, posicion_y, posicion_z, cantidad, JSON.stringify(metadatos || {})]
        );

        const eventId = eventResult.rows[0].id;

        // Si hay clasificación cognitiva, registrarla
        if (clasificacion) {
            await query(
                `INSERT INTO evaluacion_cognitiva (id_evento, clasificacion)
                 VALUES ($1, $2)`,
                [eventId, clasificacion]
            );
        }

        res.status(201).json({
            success: true,
            message: 'Evento registrado',
            data: eventResult.rows[0]
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/patients/{id}/report:
 *   get:
 *     summary: Obtener informe completo de un paciente
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       RF-SEG-04: Ver informe del paciente con sesiones y resultados.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Informe del paciente
 *       404:
 *         description: Paciente no encontrado
 */
router.get('/patients/:id/report', authenticateToken, requireTerapeuta, async (req, res) => {
    const { id } = req.params;

    try {
        // Obtener datos del paciente
        const patientResult = await query(`
            SELECT p.*, tp.id_terapeuta, t.nombre as terapeuta_nombre
            FROM pacientes p
            LEFT JOIN terapeuta_paciente tp ON p.id = tp.id_paciente
            LEFT JOIN terapeutas t ON tp.id_terapeuta = t.id
            WHERE p.id = $1
        `, [id]);

        if (patientResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Paciente no encontrado' });
        }

        // RF-SEG-03: Verificar acceso
        if (req.user.rol === 'TERAPEUTA' && req.user.id_terapeuta) {
            if (patientResult.rows[0].id_terapeuta !== req.user.id_terapeuta) {
                return res.status(403).json({ success: false, error: 'Sin acceso a este paciente' });
            }
        }

        // Obtener resumen de sesiones
        const sessionsResult = await query(`
            SELECT 
                s.id,
                a.nombre as actividad,
                a.nivel_dificultad,
                s.fecha_inicio,
                s.fecha_fin,
                s.estado,
                rs.total_aciertos,
                rs.total_errores,
                rs.total_omisiones,
                rs.tiempo_total_seg,
                rs.observaciones
            FROM sesiones s
            LEFT JOIN actividad_juego a ON s.id_actividad = a.id
            LEFT JOIN resumen_sesion rs ON s.id = rs.id_sesion
            WHERE s.id_paciente = $1
            ORDER BY s.fecha_inicio DESC
        `, [id]);

        // Calcular estadísticas
        const stats = {
            total_sesiones: sessionsResult.rows.length,
            sesiones_completadas: sessionsResult.rows.filter(s => s.estado === 'COMPLETADA').length,
            total_aciertos: sessionsResult.rows.reduce((sum, s) => sum + (s.total_aciertos || 0), 0),
            total_errores: sessionsResult.rows.reduce((sum, s) => sum + (s.total_errores || 0), 0),
            total_omisiones: sessionsResult.rows.reduce((sum, s) => sum + (s.total_omisiones || 0), 0),
            tiempo_total_minutos: Math.round(sessionsResult.rows.reduce((sum, s) => sum + (s.tiempo_total_seg || 0), 0) / 60)
        };

        res.json({
            success: true,
            data: {
                patient: patientResult.rows[0],
                stats,
                sessions: sessionsResult.rows
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// TERAPEUTAS
// ========================================

/**
 * @swagger
 * /api/terapeutas:
 *   get:
 *     summary: Obtener todos los terapeutas
 *     tags: [Terapeutas]
 *     responses:
 *       200:
 *         description: Lista de terapeutas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Terapeuta'
 */
router.get('/terapeutas', async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                t.id,
                t.nombre,
                t.especialidad,
                t.correo,
                t.telefono,
                u.username,
                u.activo
            FROM terapeutas t
            LEFT JOIN usuarios u ON t.id_usuario = u.id
            ORDER BY t.nombre
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// ACTIVIDADES
// ========================================

/**
 * @swagger
 * /api/actividades:
 *   get:
 *     summary: Obtener todas las actividades del juego
 *     tags: [Actividades]
 *     responses:
 *       200:
 *         description: Lista de actividades
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Actividad'
 */
router.get('/actividades', async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                id,
                nombre,
                descripcion,
                nivel_dificultad,
                tiempo_max_seg,
                unity_id
            FROM actividad_juego
            ORDER BY nivel_dificultad, nombre
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/actividades/{id}:
 *   get:
 *     summary: Obtener actividad con ingredientes, utensilios y acciones
 *     tags: [Actividades]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Actividad con detalles completos
 *       404:
 *         description: Actividad no encontrada
 */
router.get('/actividades/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const activityResult = await query('SELECT * FROM actividad_juego WHERE id = $1', [id]);

        if (activityResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Actividad no encontrada'
            });
        }

        const ingredientsResult = await query(`
            SELECT i.*, ia.cantidad_requerida
            FROM ingrediente_actividad ia
            JOIN ingrediente i ON ia.id_ingrediente = i.id
            WHERE ia.id_actividad = $1
        `, [id]);

        const toolsResult = await query(`
            SELECT u.*
            FROM utensilio_actividad ua
            JOIN utensilio u ON ua.id_utensilio = u.id
            WHERE ua.id_actividad = $1
        `, [id]);

        const actionsResult = await query(`
            SELECT a.*, aa.orden
            FROM accion_actividad aa
            JOIN accion a ON aa.id_accion = a.id
            WHERE aa.id_actividad = $1
            ORDER BY aa.orden
        `, [id]);

        res.json({
            success: true,
            data: {
                activity: activityResult.rows[0],
                ingredients: ingredientsResult.rows,
                tools: toolsResult.rows,
                actions: actionsResult.rows
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// ESTADÍSTICAS / DASHBOARD
// ========================================

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Obtener estadísticas generales del dashboard
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Estadísticas del sistema
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardStats'
 */
router.get('/dashboard/stats', async (req, res) => {
    try {
        const statsResult = await query(`
            SELECT
                (SELECT COUNT(*) FROM pacientes) as total_pacientes,
                (SELECT COUNT(*) FROM sesiones) as total_sesiones,
                (SELECT COUNT(*) FROM sesiones WHERE estado = 'COMPLETADA') as sesiones_completadas,
                (SELECT COUNT(*) FROM terapeutas) as total_terapeutas,
                (SELECT COUNT(*) FROM actividad_juego) as total_actividades
        `);

        const recentSessions = await query(`
            SELECT 
                s.id,
                p.nombre as paciente,
                a.nombre as actividad,
                s.estado,
                s.fecha_inicio
            FROM sesiones s
            JOIN pacientes p ON s.id_paciente = p.id
            JOIN actividad_juego a ON s.id_actividad = a.id
            ORDER BY s.fecha_inicio DESC
            LIMIT 5
        `);

        res.json({
            success: true,
            data: {
                stats: statsResult.rows[0],
                recentSessions: recentSessions.rows
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
