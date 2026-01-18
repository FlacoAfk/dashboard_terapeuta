/**
 * ========================================
 * RUTAS DE SESIONES VR
 * ========================================
 * 
 * Endpoints para gestión de sesiones de juego
 * Requerimiento: RF-BDD-02
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/sesiones/{idPaciente}:
 *   get:
 *     summary: Obtener todas las sesiones de un paciente
 *     tags: [Sesiones VR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idPaciente
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del paciente
 *     responses:
 *       200:
 *         description: Lista de sesiones del paciente
 *       404:
 *         description: Paciente no encontrado
 */
router.get('/:idPaciente', authenticateToken, async (req, res) => {
    try {
        const { idPaciente } = req.params;

        const { data, error } = await supabase
            .from('sesiones')
            .select(`
                id,
                estado,
                fecha_inicio,
                fecha_fin,
                id_actividad,
                duracion_total,
                numero_pausas,
                numero_alertas_descanso
            `)
            .eq('id_paciente', idPaciente)
            .order('fecha_inicio', { ascending: false });

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            data: data,
            count: data.length
        });

    } catch (error) {
        console.error('Error obteniendo sesiones:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/sesiones:
 *   post:
 *     summary: Crear una nueva sesión VR
 *     tags: [Sesiones VR]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_paciente, id_actividad]
 *             properties:
 *               id_paciente: { type: integer, example: 1 }
 *               id_actividad: { type: integer, example: 1 }
 *               id_terapeuta: { type: integer, example: 1 }
 *     responses:
 *       201:
 *         description: Sesión creada exitosamente
 *       400:
 *         description: Datos inválidos
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { id_paciente, id_actividad, id_terapeuta } = req.body;

        if (!id_paciente || !id_actividad) {
            return res.status(400).json({
                success: false,
                error: 'id_paciente e id_actividad son requeridos'
            });
        }

        const { data, error } = await supabase
            .from('sesiones')
            .insert({
                id_paciente,
                id_actividad,
                id_terapeuta: id_terapeuta || req.user.id_terapeuta,
                estado: 'INICIADA',
                fecha_inicio: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        res.status(201).json({
            success: true,
            message: 'Sesión creada exitosamente',
            data: data
        });

    } catch (error) {
        console.error('Error creando sesión:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/sesiones/{id}:
 *   put:
 *     summary: Actualizar una sesión (finalizar, pausar, etc.)
 *     tags: [Sesiones VR]
 *     security:
 *       - bearerAuth: []
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
 *             properties:
 *               estado: { type: string, enum: [INICIADA, EN_PAUSA, COMPLETADA, INTERRUMPIDA] }
 *               fecha_fin: { type: string, format: date-time }
 *               duracion_total: { type: integer, description: "Duración en segundos" }
 *               numero_pausas: { type: integer }
 *               numero_alertas_descanso: { type: integer }
 *     responses:
 *       200:
 *         description: Sesión actualizada
 *       404:
 *         description: Sesión no encontrada
 */
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const { data, error } = await supabase
            .from('sesiones')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        if (!data) {
            return res.status(404).json({
                success: false,
                error: 'Sesión no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Sesión actualizada',
            data: data
        });

    } catch (error) {
        console.error('Error actualizando sesión:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/sesiones/{id}/finalizar:
 *   post:
 *     summary: Finalizar una sesión VR
 *     tags: [Sesiones VR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la sesión
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               duracion_total: { type: integer }
 *               numero_pausas: { type: integer }
 *               numero_alertas_descanso: { type: integer }
 *     responses:
 *       200:
 *         description: Sesión finalizada
 */
router.post('/:id/finalizar', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { duracion_total, numero_pausas, numero_alertas_descanso } = req.body;

        const { data, error } = await supabase
            .from('sesiones')
            .update({
                estado: 'COMPLETADA',
                fecha_fin: new Date().toISOString(),
                duracion_total: duracion_total || 0,
                numero_pausas: numero_pausas || 0,
                numero_alertas_descanso: numero_alertas_descanso || 0
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            message: 'Sesión finalizada',
            data: data
        });

    } catch (error) {
        console.error('Error finalizando sesión:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
