/**
 * ========================================
 * RUTAS DE MÉTRICAS COGNITIVAS
 * ========================================
 * 
 * Endpoints para consultar métricas y resúmenes de sesiones
 * Requerimiento: RF-BDD-09
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/metricas/{idSesion}:
 *   get:
 *     summary: Obtener métricas cognitivas de una sesión
 *     tags: [Métricas]
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
 *         description: Métricas de la sesión
 *       404:
 *         description: Métricas no encontradas
 */
router.get('/:idSesion', authenticateToken, async (req, res) => {
    try {
        const { idSesion } = req.params;

        const { data, error } = await supabase
            .from('resumen_cognitivo_sesion')
            .select('*')
            .eq('id_sesion', idSesion)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        if (!data) {
            return res.status(404).json({
                success: false,
                error: 'No se encontraron métricas para esta sesión'
            });
        }

        res.json({
            success: true,
            data: data
        });

    } catch (error) {
        console.error('Error obteniendo métricas:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/metricas/paciente/{idPaciente}:
 *   get:
 *     summary: Obtener historial de métricas de un paciente
 *     tags: [Métricas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idPaciente
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del paciente
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número máximo de resultados
 *     responses:
 *       200:
 *         description: Historial de métricas del paciente
 */
router.get('/paciente/:idPaciente', authenticateToken, async (req, res) => {
    try {
        const { idPaciente } = req.params;
        const limit = parseInt(req.query.limit) || 10;

        // Primero obtener las sesiones del paciente
        const { data: sesiones, error: sesionesError } = await supabase
            .from('sesiones')
            .select('id')
            .eq('id_paciente', idPaciente)
            .order('fecha_inicio', { ascending: false })
            .limit(limit);

        if (sesionesError) {
            throw sesionesError;
        }

        if (!sesiones || sesiones.length === 0) {
            return res.json({
                success: true,
                data: [],
                count: 0
            });
        }

        const sesionIds = sesiones.map(s => s.id);

        // Obtener métricas para esas sesiones
        const { data: metricas, error: metricasError } = await supabase
            .from('resumen_cognitivo_sesion')
            .select('*')
            .in('id_sesion', sesionIds);

        if (metricasError) {
            throw metricasError;
        }

        res.json({
            success: true,
            data: metricas,
            count: metricas.length
        });

    } catch (error) {
        console.error('Error obteniendo métricas del paciente:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/metricas/{idSesion}:
 *   post:
 *     summary: Guardar o actualizar métricas de una sesión
 *     tags: [Métricas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idSesion
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
 *               total_aciertos: { type: integer }
 *               total_errores: { type: integer }
 *               total_omisiones: { type: integer }
 *               tiempo_total: { type: integer, description: "Tiempo en segundos" }
 *               tiempo_promedio_reaccion: { type: integer, description: "Tiempo en ms" }
 *               puntaje_final: { type: number }
 *               observaciones: { type: string }
 *     responses:
 *       200:
 *         description: Métricas guardadas
 */
router.post('/:idSesion', authenticateToken, async (req, res) => {
    try {
        const { idSesion } = req.params;
        const metricas = req.body;

        // Verificar si ya existen métricas para esta sesión
        const { data: existing } = await supabase
            .from('resumen_cognitivo_sesion')
            .select('id')
            .eq('id_sesion', idSesion)
            .single();

        let result;

        if (existing) {
            // Actualizar
            const { data, error } = await supabase
                .from('resumen_cognitivo_sesion')
                .update({
                    ...metricas,
                    updated_at: new Date().toISOString()
                })
                .eq('id_sesion', idSesion)
                .select()
                .single();

            if (error) throw error;
            result = data;
        } else {
            // Insertar
            const { data, error } = await supabase
                .from('resumen_cognitivo_sesion')
                .insert({
                    id_sesion: parseInt(idSesion),
                    ...metricas,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;
            result = data;
        }

        res.json({
            success: true,
            message: 'Métricas guardadas',
            data: result
        });

    } catch (error) {
        console.error('Error guardando métricas:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/metricas/{idSesion}/calcular:
 *   post:
 *     summary: Calcular y guardar métricas automáticamente basadas en eventos y evaluaciones
 *     tags: [Métricas]
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
 *         description: Métricas calculadas y guardadas
 */
router.post('/:idSesion/calcular', authenticateToken, async (req, res) => {
    try {
        const { idSesion } = req.params;

        // Obtener evaluaciones de la sesión
        const { data: evaluaciones, error: evalError } = await supabase
            .from('evaluacion_cognitiva')
            .select('resultado_tipo, tiempo_desde_ultimo_evento')
            .eq('id_sesion', idSesion);

        if (evalError) throw evalError;

        // Obtener información de la sesión
        const { data: sesion, error: sesionError } = await supabase
            .from('sesiones')
            .select('duracion_total, fecha_inicio, fecha_fin')
            .eq('id', idSesion)
            .single();

        if (sesionError && sesionError.code !== 'PGRST116') throw sesionError;

        // Calcular métricas
        let aciertos = 0, errores = 0, omisiones = 0;
        let tiempoTotal = 0, eventosConTiempo = 0;

        evaluaciones.forEach(e => {
            switch (e.resultado_tipo) {
                case 'ACIERTO': aciertos++; break;
                case 'ERROR': errores++; break;
                case 'OMISION': omisiones++; break;
            }
            if (e.tiempo_desde_ultimo_evento) {
                tiempoTotal += e.tiempo_desde_ultimo_evento;
                eventosConTiempo++;
            }
        });

        const metricas = {
            id_sesion: parseInt(idSesion),
            total_aciertos: aciertos,
            total_errores: errores,
            total_omisiones: omisiones,
            tiempo_total: sesion?.duracion_total || 0,
            tiempo_promedio_reaccion: eventosConTiempo > 0 ? Math.round(tiempoTotal / eventosConTiempo) : 0,
            puntaje_final: evaluaciones.length > 0 ? Math.round((aciertos / evaluaciones.length) * 100) : 0
        };

        // Upsert métricas
        const { data: existing } = await supabase
            .from('resumen_cognitivo_sesion')
            .select('id')
            .eq('id_sesion', idSesion)
            .single();

        let result;
        if (existing) {
            const { data, error } = await supabase
                .from('resumen_cognitivo_sesion')
                .update({ ...metricas, updated_at: new Date().toISOString() })
                .eq('id_sesion', idSesion)
                .select()
                .single();
            if (error) throw error;
            result = data;
        } else {
            const { data, error } = await supabase
                .from('resumen_cognitivo_sesion')
                .insert({ ...metricas, created_at: new Date().toISOString() })
                .select()
                .single();
            if (error) throw error;
            result = data;
        }

        res.json({
            success: true,
            message: 'Métricas calculadas y guardadas',
            data: result
        });

    } catch (error) {
        console.error('Error calculando métricas:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
