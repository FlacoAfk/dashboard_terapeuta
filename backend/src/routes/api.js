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
 *     summary: Obtener todos los pacientes
 *     tags: [Pacientes]
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
router.get('/patients', async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                p.id,
                p.identificacion,
                p.nombre,
                p.edad,
                p.diagnostico,
                p.fecha_registro
            FROM pacientes p
            ORDER BY p.fecha_registro DESC
        `);
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
router.get('/patients/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await query('SELECT * FROM pacientes WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Paciente no encontrado'
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
router.post('/patients', async (req, res) => {
    const { identificacion, nombre, edad, diagnostico } = req.body;

    if (!nombre) {
        return res.status(400).json({
            success: false,
            error: 'El nombre es requerido'
        });
    }

    try {
        const result = await query(
            `INSERT INTO pacientes (identificacion, nombre, edad, diagnostico)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [identificacion, nombre, edad, diagnostico]
        );

        res.status(201).json({
            success: true,
            message: 'Paciente creado exitosamente',
            data: result.rows[0]
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
router.put('/patients/:id', async (req, res) => {
    const { id } = req.params;
    const { identificacion, nombre, edad, diagnostico } = req.body;

    try {
        const result = await query(
            `UPDATE pacientes 
             SET identificacion = COALESCE($1, identificacion),
                 nombre = COALESCE($2, nombre),
                 edad = COALESCE($3, edad),
                 diagnostico = COALESCE($4, diagnostico)
             WHERE id = $5
             RETURNING *`,
            [identificacion, nombre, edad, diagnostico, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Paciente no encontrado'
            });
        }

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
router.delete('/patients/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await query('DELETE FROM pacientes WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Paciente no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Paciente eliminado',
            data: result.rows[0]
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
 *     summary: Obtener todas las sesiones de terapia
 *     tags: [Sesiones]
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
router.get('/sessions', async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                s.id,
                s.id_paciente,
                p.nombre as paciente_nombre,
                s.id_actividad,
                a.nombre as actividad_nombre,
                s.fecha_inicio,
                s.fecha_fin,
                s.estado,
                rs.total_aciertos,
                rs.total_errores,
                rs.tiempo_total_seg,
                rs.observaciones
            FROM sesiones s
            LEFT JOIN pacientes p ON s.id_paciente = p.id
            LEFT JOIN actividad_juego a ON s.id_actividad = a.id
            LEFT JOIN resumen_sesion rs ON s.id = rs.id_sesion
            ORDER BY s.fecha_inicio DESC
        `);

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
 *     summary: Crear una nueva sesión
 *     tags: [Sesiones]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SesionInput'
 *     responses:
 *       201:
 *         description: Sesión creada
 *       400:
 *         description: Datos inválidos
 */
router.post('/sessions', async (req, res) => {
    const { id_paciente, id_actividad } = req.body;

    if (!id_paciente || !id_actividad) {
        return res.status(400).json({
            success: false,
            error: 'id_paciente y id_actividad son requeridos'
        });
    }

    try {
        const result = await query(
            `INSERT INTO sesiones (id_paciente, id_actividad)
             VALUES ($1, $2)
             RETURNING *`,
            [id_paciente, id_actividad]
        );

        res.status(201).json({
            success: true,
            message: 'Sesión creada exitosamente',
            data: result.rows[0]
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
