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
const { authenticateToken, requireTerapeuta, validateUnityApiKey } = require('../middleware/authMiddleware');
const { buildCacheKey, getCachedJson, setCachedJson, invalidateCacheByPattern } = require('../utils/cache');

async function invalidateVrResultsCache(sessionId = null) {
    await Promise.all([
        invalidateCacheByPattern('vr:session-results:list:*'),
        invalidateCacheByPattern('vr:patients-lookup:*'),
        sessionId ? invalidateCacheByPattern(`vr:session-results:detail:${sessionId}`) : Promise.resolve(0)
    ]);
}

/**
 * @swagger
 * /api/v1/session-results:
 *   post:
 *     summary: Recibe y persiste el resultado de una sesión VR
 *     tags: [VR Results]
 *     security:
 *       - apiKeyAuth: []
 *     description: |
 *       Endpoint para Unity. Requiere API Key en el header X-API-Key.
 *       Vincula automáticamente al paciente si participantId coincide con una identificación en BD.
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
router.post('/session-results', validateUnityApiKey, async (req, res) => {
    try {
        const payload = req.body;

        // Validar campos requeridos (schemaVersion es opcional)
        const requiredFields = ['participantId', 'activityId', 'startedAtIso', 'endedAtIso', 'totalSeconds', 'sets'];
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

        // Calcular resumen desde los sets si no viene en el payload
        // Esto es necesario porque Unity puede no enviar el campo summary
        let calculatedErrors = 0, calculatedDrops = 0, calculatedReleases = 0;

        for (const set of payload.sets) {
            calculatedDrops += set.dropsCount || 0;
            calculatedReleases += set.releasesCount || 0;
            // Contar errores del array errors de cada set
            if (Array.isArray(set.errors)) {
                calculatedErrors += set.errors.length;
            }
        }

        // Usar summary del payload si existe, sino usar valores calculados
        const providedSummary = payload.summary || {};
        const summary = {
            totalErrors: providedSummary.totalErrors ?? calculatedErrors,
            totalDrops: providedSummary.totalDrops ?? calculatedDrops,
            totalReleases: providedSummary.totalReleases ?? calculatedReleases,
            setsCompleted: providedSummary.setsCompleted ?? payload.sets.length
        };

        // Buscar paciente por identificación (cédula) para vincular automáticamente
        // Unity ya verificó que el paciente existe antes de iniciar la sesión
        let idPacienteVinculado = null;

        if (payload.participantId && payload.participantId !== 'UNKNOWN') {
            const { data: patient } = await supabase
                .from('pacientes')
                .select('id')
                .eq('identificacion', payload.participantId)
                .eq('activo', true)
                .single();

            if (patient) {
                idPacienteVinculado = patient.id;
            }
        }

        // 1. Insertar sesión principal
        const { data: sessionData, error: sessionError } = await supabase
            .from('vr_session_results')
            .insert({
                schema_version: payload.schemaVersion || null,
                participant_id: payload.participantId,
                activity_id: payload.activityId,
                started_at: payload.startedAtIso,
                ended_at: payload.endedAtIso,
                total_seconds: payload.totalSeconds,
                summary_total_errors: summary.totalErrors,
                summary_total_drops: summary.totalDrops,
                summary_total_releases: summary.totalReleases,
                summary_sets_completed: summary.setsCompleted,
                raw_payload: payload,
                // Vinculación automática si se encontró el paciente
                id_paciente_vinculado: idPacienteVinculado,
                id_terapeuta_revisor: null,
                observaciones_terapeuta: null,
                estado_revision: 'PENDIENTE_REVISION'
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

            // Extraer errorsCount del JSON de Unity
            const errorsCount = set.errorsCount || (Array.isArray(set.errors) ? set.errors.length : 0);

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
                    errors_count: errorsCount
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
                            // Unity envía timeIso, no timestampIso
                            occurred_at: error.timeIso || error.timestampIso,
                            // Nuevo campo: objeto relacionado al error
                            objeto_contexto: error.context || null
                        });
                }
            }

            // 4. [REMOVED] Insertar objetos retornados
            // La tabla vr_set_returned_objects fu eliminada del schema.
            // Si se necesita auditar esto en el futuro, se debe agregar al JSON de vr_set_results o crear la tabla nuevamente.
            /*
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
            */
        }

        // Respuesta exitosa
        await invalidateVrResultsCache(sessionId);

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
 *     security:
 *       - bearerAuth: []
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
router.get('/session-results', authenticateToken, requireTerapeuta, async (req, res) => {
    try {
        const { participantId, activityId } = req.query;

        const cacheKey = buildCacheKey('vr:session-results:list', {
            role: req.user.rol,
            therapistId: req.user.id_terapeuta || null,
            participantId: participantId || null,
            activityId: activityId || null
        });

        const cachedPayload = await getCachedJson(cacheKey);
        if (cachedPayload) {
            return res.json(cachedPayload);
        }

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

        const payload = {
            success: true,
            data: data,
            count: data.length
        };

        await setCachedJson(cacheKey, payload, 20);
        res.json(payload);

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
 *     security:
 *       - bearerAuth: []
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
router.get('/session-results/:id', authenticateToken, requireTerapeuta, async (req, res) => {
    try {
        const { id } = req.params;

        const cacheKey = buildCacheKey(`vr:session-results:detail:${id}`, {
            role: req.user.rol,
            therapistId: req.user.id_terapeuta || null
        });

        const cachedPayload = await getCachedJson(cacheKey);
        if (cachedPayload) {
            return res.json(cachedPayload);
        }

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

        const setIds = (sets || []).map((set) => set.id);
        let errorsBySetId = new Map();

        if (setIds.length > 0) {
            const { data: allErrors, error: errorsQueryError } = await supabase
                .from('vr_set_errors')
                .select('*')
                .in('set_id', setIds)
                .order('occurred_at', { ascending: true });

            if (errorsQueryError) {
                return res.status(500).json({
                    error: { code: 'DB_ERROR', message: errorsQueryError.message }
                });
            }

            errorsBySetId = (allErrors || []).reduce((acc, currentError) => {
                const bucket = acc.get(currentError.set_id) || [];
                bucket.push(currentError);
                acc.set(currentError.set_id, bucket);
                return acc;
            }, new Map());
        }

        const setsWithDetails = (sets || []).map((set) => ({
            ...set,
            errors: errorsBySetId.get(set.id) || [],
            returnedObjects: [] // Table removed: returnedObjects unused
        }));

        const payload = {
            success: true,
            data: {
                ...session,
                sets: setsWithDetails
            }
        };

        await setCachedJson(cacheKey, payload, 45);
        res.json(payload);

    } catch (error) {
        res.status(500).json({
            error: { code: 'INTERNAL_ERROR', message: error.message }
        });
    }
});

// ========================================
// ENDPOINT PARA UNITY: Búsqueda de Pacientes
// ========================================
// Permite que Unity consulte si un paciente existe usando su cédula.
// Requiere API Key en el header X-API-Key (configurar UNITY_API_KEY en .env)
// Devuelve datos mínimos para no comprometer privacidad.

/**
 * @swagger
 * /api/v1/patients/lookup:
 *   get:
 *     summary: Buscar paciente por número de identificación (para Unity)
 *     tags: [Unity - Pacientes]
 *     security:
 *       - apiKeyAuth: []
 *     description: |
 *       Endpoint público para que Unity verifique si un paciente existe.
 *       Requiere API Key en el header X-API-Key.
 *       Devuelve datos mínimos sin exponer información sensible.
 *     parameters:
 *       - in: header
 *         name: X-API-Key
 *         required: true
 *         schema:
 *           type: string
 *         description: API Key de Unity (configurada en .env como UNITY_API_KEY)
 *       - in: query
 *         name: identificacion
 *         required: true
 *         schema:
 *           type: string
 *         description: Número de cédula/identificación del paciente
 *     responses:
 *       200:
 *         description: Resultado de la búsqueda
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 found:
 *                   type: boolean
 *                 participant_id:
 *                   type: string
 *                 display_name:
 *                   type: string
 *       401:
 *         description: API Key inválida
 *       400:
 *         description: Parámetro identificacion faltante
 */
router.get('/patients/lookup', validateUnityApiKey, async (req, res) => {
    try {
        const { identificacion } = req.query;

        if (!identificacion) {
            return res.status(400).json({
                error: {
                    code: 'MISSING_PARAM',
                    message: 'El parámetro identificacion es requerido'
                }
            });
        }

        const cacheKey = buildCacheKey('vr:patients-lookup', { identificacion });
        const cachedPayload = await getCachedJson(cacheKey);
        if (cachedPayload) {
            return res.json(cachedPayload);
        }

        // Buscar paciente por identificación exacta
        const { data: patient, error } = await supabase
            .from('pacientes')
            .select('id, identificacion, nombre, activo')
            .eq('identificacion', identificacion)
            .eq('activo', true)  // Solo pacientes activos
            .single();

        if (error || !patient) {
            // No encontrado - responder sin revelar si existe o no (seguridad)
            const payload = {
                found: false,
                participant_id: null,
                display_name: null
            };

            await setCachedJson(cacheKey, payload, 60);
            return res.json(payload);
        }

        // Generar nombre parcial para privacidad (ej: "Juan P.")
        const nameParts = patient.nombre.split(' ');
        const displayName = nameParts.length > 1
            ? `${nameParts[0]} ${nameParts[1].charAt(0)}.`
            : nameParts[0];

        const payload = {
            found: true,
            participant_id: patient.identificacion,
            display_name: displayName,
            // Opcionalmente podríamos agregar el ID interno si Unity lo necesita
            internal_id: patient.id
        };

        await setCachedJson(cacheKey, payload, 60);
        res.json(payload);

    } catch (error) {
        res.status(500).json({
            error: { code: 'INTERNAL_ERROR', message: error.message }
        });
    }
});

module.exports = router;
