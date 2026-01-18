/**
 * ========================================
 * RUTAS DE EVALUACIÓN COGNITIVA
 * ========================================
 * 
 * Endpoints para clasificación de aciertos, errores y omisiones
 * Requerimiento: RF-BDD-04
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/evaluacion:
 *   post:
 *     summary: Registrar una evaluación cognitiva
 *     tags: [Evaluación Cognitiva]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_sesion, resultado_tipo]
 *             properties:
 *               id_sesion: { type: integer, example: 1 }
 *               id_evento: { type: integer, description: "ID del evento relacionado" }
 *               resultado_tipo:
 *                 type: string
 *                 enum: [ACIERTO, ERROR, OMISION]
 *                 example: "ACIERTO"
 *               resultado_detalle: { type: string, example: "Seleccionó ingrediente correcto" }
 *               objeto_esperado_id: { type: string, example: "ingrediente_sal" }
 *               objeto_elegido_id: { type: string, example: "ingrediente_sal" }
 *               tiempo_desde_ultimo_evento: { type: integer, description: "Milisegundos" }
 *               confidence_score: { type: number, minimum: 0, maximum: 1 }
 *     responses:
 *       201:
 *         description: Evaluación registrada exitosamente
 *       400:
 *         description: Datos inválidos
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const {
            id_sesion,
            id_evento,
            resultado_tipo,
            resultado_detalle,
            objeto_esperado_id,
            objeto_elegido_id,
            tiempo_desde_ultimo_evento,
            confidence_score
        } = req.body;

        if (!id_sesion || !resultado_tipo) {
            return res.status(400).json({
                success: false,
                error: 'id_sesion y resultado_tipo son requeridos'
            });
        }

        // Validar tipo de resultado
        const tiposValidos = ['ACIERTO', 'ERROR', 'OMISION'];
        if (!tiposValidos.includes(resultado_tipo)) {
            return res.status(400).json({
                success: false,
                error: `resultado_tipo inválido. Valores permitidos: ${tiposValidos.join(', ')}`
            });
        }

        const { data, error } = await supabase
            .from('evaluacion_cognitiva')
            .insert({
                id_sesion,
                id_evento,
                resultado_tipo,
                resultado_detalle,
                objeto_esperado_id,
                objeto_elegido_id,
                tiempo_desde_ultimo_evento,
                confidence_score,
                timestamp_evaluacion: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        res.status(201).json({
            success: true,
            message: 'Evaluación registrada',
            data: data
        });

    } catch (error) {
        console.error('Error registrando evaluación:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/evaluacion/batch:
 *   post:
 *     summary: Registrar múltiples evaluaciones (batch)
 *     tags: [Evaluación Cognitiva]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [evaluaciones]
 *             properties:
 *               evaluaciones:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Evaluaciones registradas
 */
router.post('/batch', authenticateToken, async (req, res) => {
    try {
        const { evaluaciones } = req.body;

        if (!evaluaciones || !Array.isArray(evaluaciones) || evaluaciones.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Se requiere un array de evaluaciones'
            });
        }

        const evaluacionesConTimestamp = evaluaciones.map(e => ({
            ...e,
            timestamp_evaluacion: e.timestamp_evaluacion || new Date().toISOString()
        }));

        const { data, error } = await supabase
            .from('evaluacion_cognitiva')
            .insert(evaluacionesConTimestamp)
            .select();

        if (error) {
            throw error;
        }

        res.status(201).json({
            success: true,
            message: `${data.length} evaluaciones registradas`,
            data: data
        });

    } catch (error) {
        console.error('Error registrando evaluaciones batch:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/evaluacion/{idSesion}:
 *   get:
 *     summary: Obtener todas las evaluaciones de una sesión
 *     tags: [Evaluación Cognitiva]
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
 *         name: resultado_tipo
 *         schema:
 *           type: string
 *           enum: [ACIERTO, ERROR, OMISION]
 *         description: Filtrar por tipo de resultado
 *     responses:
 *       200:
 *         description: Lista de evaluaciones de la sesión
 */
router.get('/:idSesion', authenticateToken, async (req, res) => {
    try {
        const { idSesion } = req.params;
        const { resultado_tipo } = req.query;

        let query = supabase
            .from('evaluacion_cognitiva')
            .select('*')
            .eq('id_sesion', idSesion)
            .order('timestamp_evaluacion', { ascending: true });

        if (resultado_tipo) {
            query = query.eq('resultado_tipo', resultado_tipo);
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
        console.error('Error obteniendo evaluaciones:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/evaluacion/{idSesion}/resumen:
 *   get:
 *     summary: Obtener resumen de evaluación cognitiva por sesión
 *     tags: [Evaluación Cognitiva]
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
 *         description: Resumen de aciertos, errores y omisiones
 */
router.get('/:idSesion/resumen', authenticateToken, async (req, res) => {
    try {
        const { idSesion } = req.params;

        const { data, error } = await supabase
            .from('evaluacion_cognitiva')
            .select('resultado_tipo, tiempo_desde_ultimo_evento')
            .eq('id_sesion', idSesion);

        if (error) {
            throw error;
        }

        // Calcular resumen
        const resumen = {
            aciertos: 0,
            errores: 0,
            omisiones: 0,
            total: data.length,
            tiempo_promedio_reaccion: 0
        };

        let tiempoTotal = 0;
        let eventosConTiempo = 0;

        data.forEach(evaluacion => {
            switch (evaluacion.resultado_tipo) {
                case 'ACIERTO':
                    resumen.aciertos++;
                    break;
                case 'ERROR':
                    resumen.errores++;
                    break;
                case 'OMISION':
                    resumen.omisiones++;
                    break;
            }

            if (evaluacion.tiempo_desde_ultimo_evento) {
                tiempoTotal += evaluacion.tiempo_desde_ultimo_evento;
                eventosConTiempo++;
            }
        });

        resumen.tiempo_promedio_reaccion = eventosConTiempo > 0
            ? Math.round(tiempoTotal / eventosConTiempo)
            : 0;

        resumen.porcentaje_aciertos = resumen.total > 0
            ? Math.round((resumen.aciertos / resumen.total) * 100)
            : 0;

        res.json({
            success: true,
            data: {
                id_sesion: parseInt(idSesion),
                ...resumen
            }
        });

    } catch (error) {
        console.error('Error obteniendo resumen de evaluación:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
