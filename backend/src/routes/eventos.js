/**
 * ========================================
 * RUTAS DE EVENTOS DE INTERACCIÓN
 * ========================================
 * 
 * Endpoints para registrar y consultar eventos VR
 * Requerimiento: RF-BDD-03 (Logging cognitivo)
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/eventos:
 *   post:
 *     summary: Registrar un evento de interacción VR
 *     tags: [Eventos VR]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_sesion, tipo_accion]
 *             properties:
 *               id_sesion: { type: integer, example: 1 }
 *               tipo_accion:
 *                 type: string
 *                 enum: [pick_up, drop, pour, cut, move, open_drawer, turn_on_stove, turn_off_stove, pause, resume]
 *                 example: "pick_up"
 *               objeto_id: { type: string, example: "ingrediente_tomate_01" }
 *               objeto_descripcion: { type: string, example: "Tomate rojo" }
 *               posicion_x: { type: number, example: 1.5 }
 *               posicion_y: { type: number, example: 0.8 }
 *               posicion_z: { type: number, example: -2.3 }
 *               cantidad: { type: number, description: "Cantidad (ej: ml vertidos)", example: 250 }
 *               metadatos_estado: { type: object, description: "JSON con estado adicional" }
 *     responses:
 *       201:
 *         description: Evento registrado exitosamente
 *       400:
 *         description: Datos inválidos
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const {
            id_sesion,
            tipo_accion,
            objeto_id,
            objeto_descripcion,
            posicion_x,
            posicion_y,
            posicion_z,
            cantidad,
            metadatos_estado
        } = req.body;

        if (!id_sesion || !tipo_accion) {
            return res.status(400).json({
                success: false,
                error: 'id_sesion y tipo_accion son requeridos'
            });
        }

        // Validar tipo de acción
        const tiposValidos = [
            'pick_up', 'drop', 'pour', 'cut', 'move',
            'open_drawer', 'close_drawer', 'turn_on_stove', 'turn_off_stove',
            'pause', 'resume', 'alerta_descanso', 'inicio_actividad', 'fin_actividad'
        ];

        if (!tiposValidos.includes(tipo_accion)) {
            return res.status(400).json({
                success: false,
                error: `tipo_accion inválido. Valores permitidos: ${tiposValidos.join(', ')}`
            });
        }

        const { data, error } = await supabase
            .from('eventos_interacciones')
            .insert({
                id_sesion,
                tipo_accion,
                objeto_id,
                objeto_descripcion,
                posicion_x,
                posicion_y,
                posicion_z,
                cantidad,
                metadatos_estado,
                timestamp_evento: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        res.status(201).json({
            success: true,
            message: 'Evento registrado',
            data: data
        });

    } catch (error) {
        console.error('Error registrando evento:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/eventos/batch:
 *   post:
 *     summary: Registrar múltiples eventos de interacción (batch)
 *     tags: [Eventos VR]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [eventos]
 *             properties:
 *               eventos:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id_sesion: { type: integer }
 *                     tipo_accion: { type: string }
 *                     objeto_id: { type: string }
 *                     timestamp_evento: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Eventos registrados exitosamente
 */
router.post('/batch', authenticateToken, async (req, res) => {
    try {
        const { eventos } = req.body;

        if (!eventos || !Array.isArray(eventos) || eventos.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Se requiere un array de eventos'
            });
        }

        // Agregar timestamp si no existe
        const eventosConTimestamp = eventos.map(e => ({
            ...e,
            timestamp_evento: e.timestamp_evento || new Date().toISOString()
        }));

        const { data, error } = await supabase
            .from('eventos_interacciones')
            .insert(eventosConTimestamp)
            .select();

        if (error) {
            throw error;
        }

        res.status(201).json({
            success: true,
            message: `${data.length} eventos registrados`,
            data: data
        });

    } catch (error) {
        console.error('Error registrando eventos batch:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/eventos/{idSesion}:
 *   get:
 *     summary: Obtener todos los eventos de una sesión
 *     tags: [Eventos VR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idSesion
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la sesión
 *       - in: query
 *         name: tipo_accion
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de acción
 *     responses:
 *       200:
 *         description: Lista de eventos de la sesión
 */
router.get('/:idSesion', authenticateToken, async (req, res) => {
    try {
        const { idSesion } = req.params;
        const { tipo_accion } = req.query;

        let query = supabase
            .from('eventos_interacciones')
            .select('*')
            .eq('id_sesion', idSesion)
            .order('timestamp_evento', { ascending: true });

        if (tipo_accion) {
            query = query.eq('tipo_accion', tipo_accion);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            data: data,
            count: data.length
        });

    } catch (error) {
        console.error('Error obteniendo eventos:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/eventos/{idSesion}/resumen:
 *   get:
 *     summary: Obtener resumen de eventos por tipo para una sesión
 *     tags: [Eventos VR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idSesion
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la sesión
 *     responses:
 *       200:
 *         description: Resumen de eventos agrupados por tipo
 */
router.get('/:idSesion/resumen', authenticateToken, async (req, res) => {
    try {
        const { idSesion } = req.params;

        const { data, error } = await supabase
            .from('eventos_interacciones')
            .select('tipo_accion')
            .eq('id_sesion', idSesion);

        if (error) {
            throw error;
        }

        // Agrupar por tipo de acción
        const resumen = data.reduce((acc, evento) => {
            acc[evento.tipo_accion] = (acc[evento.tipo_accion] || 0) + 1;
            return acc;
        }, {});

        res.json({
            success: true,
            data: {
                id_sesion: parseInt(idSesion),
                total_eventos: data.length,
                por_tipo: resumen
            }
        });

    } catch (error) {
        console.error('Error obteniendo resumen de eventos:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
