/**
 * ========================================
 * RUTAS: Resultados de Sesiones VR
 * ========================================
 * 
 * Endpoint para recibir datos del videojuego Unity
 * POST /api/v1/session-results
 * 
 * Formato JSON:
 * - schemaVersion, participantId, activityId
 * - startedAtIso, endedAtIso, totalSeconds
 * - summary: { totalErrors, totalDrops, totalReleases, setsCompleted }
 * - sets: [{ setName, errors, completion, returnedObjects }]
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

/**
 * @swagger
 * /api/v1/session-results:
 *   post:
 *     summary: Recibe y persiste el resultado de una sesión VR
 *     tags: [VR Results]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - schemaVersion
 *               - participantId
 *               - activityId
 *               - startedAtIso
 *               - endedAtIso
 *               - totalSeconds
 *               - sets
 *             properties:
 *               schemaVersion:
 *                 type: string
 *               participantId:
 *                 type: string
 *               activityId:
 *                 type: string
 *               startedAtIso:
 *                 type: string
 *                 format: date-time
 *               endedAtIso:
 *                 type: string
 *                 format: date-time
 *               totalSeconds:
 *                 type: number
 *               summary:
 *                 type: object
 *               sets:
 *                 type: array
 *     responses:
 *       201:
 *         description: Resultado creado
 *       400:
 *         description: Payload inválido
 *       422:
 *         description: Validación semántica fallida
 */
router.post('/session-results', async (req, res) => {
    try {
        const payload = req.body;

        // Validar campos requeridos
        const requiredFields = ['schemaVersion', 'participantId', 'activityId', 'startedAtIso', 'endedAtIso', 'totalSeconds', 'sets'];
        for (const field of requiredFields) {
            if (!payload[field]) {
                return res.status(400).json({
                    error: {
                        code: 'MISSING_FIELD',
                        message: `Campo requerido faltante: ${field}`
                    }
                });
            }
        }

        // Validar que sets sea un array con al menos 1 elemento
        if (!Array.isArray(payload.sets) || payload.sets.length === 0) {
            return res.status(400).json({
                error: {
                    code: 'INVALID_SETS',
                    message: 'El campo sets debe ser un array con al menos 1 elemento'
                }
            });
        }

        // Extraer summary (con valores por defecto)
        const summary = payload.summary || {};

        // 1. Insertar sesión principal
        const { data: sessionData, error: sessionError } = await supabase
            .from('vr_session_results')
            .insert({
                schema_version: payload.schemaVersion,
                participant_id: payload.participantId,
                activity_id: payload.activityId,
                started_at: payload.startedAtIso,
                ended_at: payload.endedAtIso,
                total_seconds: payload.totalSeconds,
                summary_total_errors: summary.totalErrors || 0,
                summary_total_drops: summary.totalDrops || 0,
                summary_total_releases: summary.totalReleases || 0,
                summary_sets_completed: summary.setsCompleted || 0,
                raw_payload: payload
            })
            .select('id, created_at')
            .single();

        if (sessionError) {
            console.error('Error insertando sesión:', sessionError);
            return res.status(500).json({
                error: {
                    code: 'DB_ERROR',
                    message: 'Error al guardar la sesión',
                    details: sessionError.message
                }
            });
        }

        const sessionId = sessionData.id;

        // 2. Insertar cada set
        for (const set of payload.sets) {
            // Validar campos requeridos del set
            if (!set.setName || !set.startedAtIso || !set.endedAtIso) {
                continue; // Skip sets inválidos
            }

            // Extraer completion (solo para Preparation)
            const completion = set.completion || {};

            const { data: setData, error: setError } = await supabase
                .from('vr_set_results')
                .insert({
                    session_id: sessionId,
                    set_name: set.setName,
                    started_at: set.startedAtIso,
                    ended_at: set.endedAtIso,
                    duration_seconds: set.durationSeconds || 0,
                    blocked_count: set.blockedCount || 0,
                    drops_count: set.dropsCount || 0,
                    releases_count: set.releasesCount || 0,
                    completion_coffee_added: completion.coffeeAdded ?? null,
                    completion_sugar_added: completion.sugarAdded ?? null,
                    completion_cup_coffee_amount_01: completion.cupCoffeeAmount01 ?? null
                })
                .select('id')
                .single();

            if (setError) {
                console.error(`Error insertando set ${set.setName}:`, setError);
                continue;
            }

            const setId = setData.id;

            // 3. Insertar errores del set
            if (set.errors && Array.isArray(set.errors)) {
                for (const error of set.errors) {
                    await supabase
                        .from('vr_set_errors')
                        .insert({
                            set_id: setId,
                            code: error.code,
                            message: error.message || null,
                            occurred_at: error.timestampIso
                        });
                }
            }

            // 4. Insertar objetos retornados (solo para Organization)
            if (set.returnedObjects && Array.isArray(set.returnedObjects)) {
                for (const objectName of set.returnedObjects) {
                    await supabase
                        .from('vr_set_returned_objects')
                        .insert({
                            set_id: setId,
                            object_name: objectName
                        });
                }
            }
        }

        // Respuesta exitosa
        res.status(201).json({
            id: sessionId,
            createdAtIso: sessionData.created_at
        });

    } catch (error) {
        console.error('Error en POST /session-results:', error);
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: error.message
            }
        });
    }
});

/**
 * @swagger
 * /api/v1/session-results:
 *   get:
 *     summary: Lista todas las sesiones VR
 *     tags: [VR Results]
 *     parameters:
 *       - in: query
 *         name: participantId
 *         schema:
 *           type: string
 *         description: Filtrar por participante
 *       - in: query
 *         name: activityId
 *         schema:
 *           type: string
 *         description: Filtrar por actividad
 *     responses:
 *       200:
 *         description: Lista de sesiones
 */
router.get('/session-results', async (req, res) => {
    try {
        const { participantId, activityId } = req.query;

        let query = supabase
            .from('vr_session_results')
            .select('*')
            .order('created_at', { ascending: false });

        if (participantId) {
            query = query.eq('participant_id', participantId);
        }

        if (activityId) {
            query = query.eq('activity_id', activityId);
        }

        const { data, error } = await query;

        if (error) {
            return res.status(500).json({
                error: { code: 'DB_ERROR', message: error.message }
            });
        }

        res.json({
            success: true,
            data: data,
            count: data.length
        });

    } catch (error) {
        res.status(500).json({
            error: { code: 'INTERNAL_ERROR', message: error.message }
        });
    }
});

/**
 * @swagger
 * /api/v1/session-results/{id}:
 *   get:
 *     summary: Obtiene una sesión VR con todos sus sets, errores y objetos
 *     tags: [VR Results]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Sesión con detalles completos
 *       404:
 *         description: Sesión no encontrada
 */
router.get('/session-results/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener sesión
        const { data: session, error: sessionError } = await supabase
            .from('vr_session_results')
            .select('*')
            .eq('id', id)
            .single();

        if (sessionError || !session) {
            return res.status(404).json({
                error: { code: 'NOT_FOUND', message: 'Sesión no encontrada' }
            });
        }

        // Obtener sets de la sesión
        const { data: sets } = await supabase
            .from('vr_set_results')
            .select('*')
            .eq('session_id', id)
            .order('started_at', { ascending: true });

        // Para cada set, obtener errores y objetos retornados
        const setsWithDetails = [];
        for (const set of (sets || [])) {
            const { data: errors } = await supabase
                .from('vr_set_errors')
                .select('*')
                .eq('set_id', set.id)
                .order('occurred_at', { ascending: true });

            const { data: returnedObjects } = await supabase
                .from('vr_set_returned_objects')
                .select('object_name')
                .eq('set_id', set.id);

            setsWithDetails.push({
                ...set,
                errors: errors || [],
                returnedObjects: (returnedObjects || []).map(o => o.object_name)
            });
        }

        res.json({
            success: true,
            data: {
                ...session,
                sets: setsWithDetails
            }
        });

    } catch (error) {
        res.status(500).json({
            error: { code: 'INTERNAL_ERROR', message: error.message }
        });
    }
});

module.exports = router;
