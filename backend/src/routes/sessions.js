/**
 * ========================================
 * RUTAS: Gestión de Sesiones de Receta VR
 * ========================================
 * 
 * Flujo: Terapeuta crea sesión con receta → VR consulta por token
 * 
 * POST /api/sessions              → Crear sesión (Panel Terapeuta, requiere JWT)
 * GET  /api/sessions/by-token/:token → Consultar sesión por token (VR, requiere API Key)
 * PUT  /api/sessions/:id/finish   → Finalizar sesión (VR, requiere API Key)
 * GET  /api/sessions/recipe-sessions → Listar sesiones de receta del terapeuta (Panel, requiere JWT)
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { supabase } = require('../config/supabase');
const { authenticateToken, requireTerapeuta, validateUnityApiKey } = require('../middleware/authMiddleware');
const { auditFromRequest, AUDIT_TYPES } = require('../utils/auditHelper');
const { buildCacheKey, getCachedJson, setCachedJson, invalidateCacheByPattern } = require('../utils/cache');
const { VALID_RECIPES, VALID_RECIPE_IDS } = require('../constants/recipes');
const SESSION_WAIT_TIMEOUT_MINUTES = 30;

async function invalidateSessionCaches() {
    await Promise.all([
        invalidateCacheByPattern('sessions:recipe-sessions:*'),
        invalidateCacheByPattern('sessions:recipes:*')
    ]);
}

/**
 * Genera un token alfanumérico único de 6 caracteres (mayúsculas + dígitos).
 * Excluye I/O/0/1 para evitar confusión visual.
 */
function generateStartToken() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let token = '';
    const bytes = crypto.randomBytes(6);
    for (let i = 0; i < 6; i++) {
        token += chars[bytes[i] % chars.length];
    }
    return token;
}

/**
 * Cierra automáticamente sesiones CREATED vencidas (no iniciadas en VR).
 */
async function closeExpiredCreatedSessions(createdBy = null) {
    const threshold = new Date(Date.now() - SESSION_WAIT_TIMEOUT_MINUTES * 60 * 1000).toISOString();

    let query = supabase
        .from('sessions')
        .update({ status: 'FINISHED' })
        .eq('status', 'CREATED')
        .lt('created_at', threshold)
        .select('id, participant_code, start_token, created_by');

    if (createdBy) {
        query = query.eq('created_by', createdBy);
    }

    const { data, error } = await query;
    if (error) {
        console.error('Error cerrando sesiones vencidas:', error);
        return [];
    }

    return data || [];
}

// ========================================
// POST / → Crear sesión de receta (Panel Terapeuta)
// ========================================

/**
 * @swagger
 * /api/sessions:
 *   post:
 *     summary: Crear sesión de receta VR
 *     tags: [Sesiones Receta VR]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       El terapeuta selecciona una receta y crea una sesión activa para un participante.
 *       Se genera un start_token único de 6 caracteres que el VR usará para cargar la receta.
 *       Solo puede existir una sesión ACTIVE por participante.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - participant_code
 *               - recipe_id
 *             properties:
 *               participant_code:
 *                 type: string
 *                 description: Código/identificación del participante
 *                 example: "JPPE1234"
 *               recipe_id:
 *                 type: string
 *                 description: Identificador de la receta a cargar en VR
 *                 example: "tinto"
 *     responses:
 *       201:
 *         description: Sesión creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 session_id:
 *                   type: string
 *                   format: uuid
 *                 start_token:
 *                   type: string
 *                   example: "ABC123"
 *                 recipe_id:
 *                   type: string
 *                   example: "tinto"
 *                 status:
 *                   type: string
 *                   example: "ACTIVE"
 *       400:
 *         description: Datos inválidos (campos faltantes)
 *       403:
 *         description: Solo terapeutas pueden crear sesiones
 *       409:
 *         description: Ya existe una sesión activa para este participante
 */
router.post('/', authenticateToken, requireTerapeuta, async (req, res) => {
    try {
        const { participant_code, recipe_id } = req.body;

        // ── Validaciones ──
        if (!participant_code || typeof participant_code !== 'string' || participant_code.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'participant_code es requerido',
                code: 'MISSING_FIELD'
            });
        }

        if (!recipe_id || typeof recipe_id !== 'string' || recipe_id.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'recipe_id es requerido',
                code: 'MISSING_FIELD'
            });
        }

        if (!VALID_RECIPE_IDS.includes(recipe_id.trim())) {
            return res.status(400).json({
                success: false,
                error: `recipe_id inválido. Valores permitidos: ${VALID_RECIPE_IDS.join(', ')}`,
                code: 'INVALID_RECIPE',
                valid_recipes: VALID_RECIPE_IDS
            });
        }

        // Obtener id_terapeuta del usuario autenticado
        const createdBy = req.user.id_terapeuta;
        if (!createdBy) {
            return res.status(403).json({
                success: false,
                error: 'Solo terapeutas pueden crear sesiones',
                code: 'NOT_THERAPIST'
            });
        }

        await closeExpiredCreatedSessions(createdBy);

        // ── Restricción global: solo una sesión en curso por terapeuta (CREATED o ACTIVE) ──
        const { data: inProgressSession } = await supabase
            .from('sessions')
            .select('id, start_token, participant_code, recipe_id, status, created_at')
            .eq('created_by', createdBy)
            .in('status', ['CREATED', 'ACTIVE'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (inProgressSession) {
            return res.status(409).json({
                success: false,
                error: 'Ya tienes una sesión en curso. Debes finalizarla antes de crear otra.',
                code: 'SESSION_IN_PROGRESS',
                session: inProgressSession
            });
        }

        // ── Verificar que no exista sesión en curso para este participante ──
        const { data: existingSession } = await supabase
            .from('sessions')
            .select('id, start_token, status')
            .eq('participant_code', participant_code.trim())
            .in('status', ['CREATED', 'ACTIVE'])
            .maybeSingle();

        if (existingSession) {
            return res.status(409).json({
                success: false,
                error: 'Ya existe una sesión activa para este participante',
                code: 'SESSION_ALREADY_ACTIVE',
                existing_token: existingSession.start_token
            });
        }

        // ── Generar token único ──
        let startToken;
        let tokenUnique = false;
        let attempts = 0;

        while (!tokenUnique && attempts < 10) {
            startToken = generateStartToken();
            const { data: tokenCheck } = await supabase
                .from('sessions')
                .select('id')
                .eq('start_token', startToken)
                .maybeSingle();

            if (!tokenCheck) tokenUnique = true;
            attempts++;
        }

        if (!tokenUnique) {
            return res.status(500).json({
                success: false,
                error: 'No se pudo generar un token único. Intente de nuevo.',
                code: 'TOKEN_GENERATION_FAILED'
            });
        }

        // ── Crear sesión ──
        const { data: newSession, error: insertError } = await supabase
            .from('sessions')
            .insert({
                participant_code: participant_code.trim(),
                recipe_id: recipe_id.trim(),
                status: 'CREATED',
                start_token: startToken,
                created_by: createdBy
            })
            .select('id, start_token, recipe_id, status, participant_code, created_at')
            .single();

        if (insertError) {
            console.error('Error creando sesión de receta:', insertError);
            return res.status(500).json({
                success: false,
                error: 'Error al crear la sesión',
                details: insertError.message
            });
        }

        // ── Auditoría ──
        await auditFromRequest(req, AUDIT_TYPES.SESSION_CREATED || 'SESSION_CREATED', {
            session_id: newSession.id,
            participant_code: participant_code.trim(),
            recipe_id: recipe_id.trim(),
            start_token: startToken
        });

        await invalidateSessionCaches();

        // ── Respuesta según contrato ──
        res.status(201).json({
            success: true,
            session_id: newSession.id,
            start_token: newSession.start_token,
            recipe_id: newSession.recipe_id,
            status: newSession.status
        });

    } catch (error) {
        console.error('Error en POST /api/sessions:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// GET /by-token/:token → Consultar sesión por token (VR / Unity)
// ========================================

/**
 * @swagger
 * /api/sessions/by-token/{token}:
 *   get:
 *     summary: Consultar sesión por start_token (para VR / Unity)
 *     tags: [Sesiones Receta VR]
 *     security:
 *       - apiKeyAuth: []
 *     description: |
 *       El juego VR ingresa el token de 6 caracteres para obtener la sesión activa
 *       y saber qué receta cargar. Requiere API Key en el header X-API-Key.
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de inicio de sesión (6 caracteres alfanuméricos)
 *         example: "ABC123"
 *       - in: header
 *         name: X-API-Key
 *         required: true
 *         schema:
 *           type: string
 *         description: API Key de Unity
 *     responses:
 *       200:
 *         description: Sesión activa encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 session_id:
 *                   type: string
 *                   format: uuid
 *                   example: "S-9001"
 *                 participant_code:
 *                   type: string
 *                   example: "JPPE1234"
 *                 recipe_id:
 *                   type: string
 *                   example: "tinto"
 *                 status:
 *                   type: string
 *                   example: "ACTIVE"
 *       400:
 *         description: Token no proporcionado
 *       401:
 *         description: API Key inválida
 *       404:
 *         description: No se encontró sesión activa con ese token
 */
router.get('/by-token/:token', validateUnityApiKey, async (req, res) => {
    try {
        const { token } = req.params;

        await closeExpiredCreatedSessions();

        if (!token || token.trim().length === 0) {
            return res.status(400).json({
                error: { code: 'MISSING_TOKEN', message: 'Token es requerido' }
            });
        }

        const { data: session, error } = await supabase
            .from('sessions')
            .select('id, participant_code, recipe_id, status')
            .eq('start_token', token.trim().toUpperCase())
            .in('status', ['CREATED', 'ACTIVE'])
            .maybeSingle();

        if (error) {
            console.error('Error consultando sesión por token:', error);
            return res.status(500).json({
                error: { code: 'DB_ERROR', message: error.message }
            });
        }

        if (!session) {
            return res.status(404).json({
                error: {
                    code: 'SESSION_NOT_FOUND',
                    message: 'No se encontró una sesión activa con ese token'
                }
            });
        }

        let responseSession = session;

        // La primera vez que VR consulta token, la sesión pasa de CREATED a ACTIVE
        if (session.status === 'CREATED') {
            const { data: activatedSession, error: activateError } = await supabase
                .from('sessions')
                .update({ status: 'ACTIVE' })
                .eq('id', session.id)
                .eq('status', 'CREATED')
                .select('id, participant_code, recipe_id, status')
                .single();

            if (!activateError && activatedSession) {
                responseSession = activatedSession;
                await invalidateSessionCaches();
            }
        }

        // ── Respuesta según contrato ──
        res.json({
            session_id: responseSession.id,
            participant_code: responseSession.participant_code,
            recipe_id: responseSession.recipe_id,
            status: responseSession.status
        });

    } catch (error) {
        console.error('Error en GET /sessions/by-token:', error);
        res.status(500).json({
            error: { code: 'INTERNAL_ERROR', message: error.message }
        });
    }
});

// ========================================
// PUT /:id/finish → Finalizar sesión (VR / Unity)
// ========================================

/**
 * @swagger
 * /api/sessions/{id}/finish:
 *   put:
 *     summary: Marcar sesión como FINISHED (para VR / Unity)
 *     tags: [Sesiones Receta VR]
 *     security:
 *       - apiKeyAuth: []
 *     description: |
 *       El juego VR marca la sesión como finalizada una vez que el participante
 *       completa la receta. Requiere API Key en el header X-API-Key.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID de la sesión
 *       - in: header
 *         name: X-API-Key
 *         required: true
 *         schema:
 *           type: string
 *         description: API Key de Unity
 *     responses:
 *       200:
 *         description: Sesión finalizada exitosamente
 *       401:
 *         description: API Key inválida
 *       404:
 *         description: Sesión activa no encontrada
 */
router.put('/:id/finish', validateUnityApiKey, async (req, res) => {
    try {
        const { id } = req.params;

        const { data: updated, error } = await supabase
            .from('sessions')
            .update({ status: 'FINISHED' })
            .eq('id', id)
            .in('status', ['CREATED', 'ACTIVE'])
            .select('id, status')
            .single();

        if (error || !updated) {
            return res.status(404).json({
                error: { code: 'NOT_FOUND', message: 'Sesión activa no encontrada' }
            });
        }

        await invalidateSessionCaches();

        res.json({
            success: true,
            session_id: updated.id,
            status: updated.status
        });

    } catch (error) {
        console.error('Error en PUT /sessions/:id/finish:', error);
        res.status(500).json({
            error: { code: 'INTERNAL_ERROR', message: error.message }
        });
    }
});

// ========================================
// PUT /:id/close → Finalizar sesión desde Dashboard (JWT)
// ========================================

router.put('/:id/close', authenticateToken, requireTerapeuta, async (req, res) => {
    try {
        const { id } = req.params;

        const { data: existingSession, error: readError } = await supabase
            .from('sessions')
            .select('id, status, created_by, participant_code, start_token, recipe_id')
            .eq('id', id)
            .maybeSingle();

        if (readError) {
            return res.status(500).json({ success: false, error: readError.message });
        }

        if (!existingSession) {
            return res.status(404).json({
                success: false,
                error: 'Sesión no encontrada',
                code: 'NOT_FOUND'
            });
        }

        if (req.user.rol === 'TERAPEUTA' && req.user.id_terapeuta && existingSession.created_by !== req.user.id_terapeuta) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para finalizar esta sesión',
                code: 'ACCESS_DENIED'
            });
        }

        if (!['CREATED', 'ACTIVE'].includes(existingSession.status)) {
            return res.status(400).json({
                success: false,
                error: 'La sesión ya está finalizada',
                code: 'SESSION_ALREADY_FINISHED'
            });
        }

        const { data: updated, error: updateError } = await supabase
            .from('sessions')
            .update({ status: 'FINISHED' })
            .eq('id', id)
            .in('status', ['CREATED', 'ACTIVE'])
            .select('id, status, participant_code, start_token, recipe_id')
            .single();

        if (updateError || !updated) {
            return res.status(404).json({
                success: false,
                error: 'No se pudo finalizar la sesión',
                code: 'NOT_FOUND'
            });
        }

        await auditFromRequest(req, AUDIT_TYPES.SESSION_FINISHED || 'SESSION_FINISHED', {
            session_id: updated.id,
            participant_code: updated.participant_code,
            recipe_id: updated.recipe_id,
            finish_source: 'DASHBOARD'
        });

        await invalidateSessionCaches();

        res.json({
            success: true,
            session_id: updated.id,
            status: updated.status
        });
    } catch (error) {
        console.error('Error en PUT /sessions/:id/close:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// GET /recipe-sessions → Listar sesiones de receta del terapeuta (Panel)
// ========================================

/**
 * @swagger
 * /api/sessions/recipe-sessions:
 *   get:
 *     summary: Listar sesiones de receta creadas por el terapeuta
 *     tags: [Sesiones Receta VR]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Lista las sesiones de receta creadas. SUPERADMIN ve todas,
 *       TERAPEUTA solo ve las que él creó.
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [CREATED, ACTIVE, FINISHED]
 *         description: Filtrar por estado
 *       - in: query
 *         name: participant_code
 *         schema:
 *           type: string
 *         description: Filtrar por código de participante
 *     responses:
 *       200:
 *         description: Lista de sesiones de receta
 */
router.get('/recipe-sessions', authenticateToken, requireTerapeuta, async (req, res) => {
    try {
        const { status, participant_code, refresh } = req.query;
        const forceRefresh = String(refresh || '').toLowerCase() === 'true';

        const cacheKey = buildCacheKey('sessions:recipe-sessions', {
            role: req.user.rol,
            therapistId: req.user.id_terapeuta || null,
            status: status || null,
            participant_code: participant_code || null
        });

        if (!forceRefresh) {
            const cachedPayload = await getCachedJson(cacheKey);
            if (cachedPayload) {
                return res.json(cachedPayload);
            }
        }

        if (req.user.id_terapeuta) {
            await closeExpiredCreatedSessions(req.user.id_terapeuta);
        }

        let query = supabase
            .from('sessions')
            .select('id, participant_code, recipe_id, status, start_token, created_by, created_at')
            .order('created_at', { ascending: false });

        // TERAPEUTA solo ve sus sesiones; SUPERADMIN ve todas
        if (req.user.rol === 'TERAPEUTA' && req.user.id_terapeuta) {
            query = query.eq('created_by', req.user.id_terapeuta);
        }

        if (status) {
            query = query.eq('status', status);
        }

        if (participant_code) {
            query = query.eq('participant_code', participant_code.trim());
        }

        const { data: sessions, error } = await query;

        if (error) throw error;

        const payload = {
            success: true,
            data: sessions || [],
            count: (sessions || []).length
        };

        await setCachedJson(cacheKey, payload, 20);
        res.json(payload);

    } catch (error) {
        console.error('Error en GET /sessions/recipe-sessions:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// GET /recipes → Lista de recetas disponibles (Panel Terapeuta)
// ========================================

/**
 * @swagger
 * /api/sessions/recipes:
 *   get:
 *     summary: Obtener catálogo de recetas disponibles
 *     tags: [Sesiones Receta VR]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Retorna la lista de recetas válidas que el juego VR soporta,
 *       organizadas por nivel de dificultad.
 *     responses:
 *       200:
 *         description: Lista de recetas disponibles
 */
router.get('/recipes', authenticateToken, requireTerapeuta, async (req, res) => {
    const cacheKey = buildCacheKey('sessions:recipes', { version: 1 });

    const cachedPayload = await getCachedJson(cacheKey);
    if (cachedPayload) {
        return res.json(cachedPayload);
    }

    const grouped = {
        facil: VALID_RECIPES.filter(r => r.difficulty === 'facil'),
        intermedio: VALID_RECIPES.filter(r => r.difficulty === 'intermedio'),
        dificil: VALID_RECIPES.filter(r => r.difficulty === 'dificil')
    };

    const payload = {
        success: true,
        data: VALID_RECIPES,
        grouped,
        count: VALID_RECIPES.length
    };

    await setCachedJson(cacheKey, payload, 300);
    return res.json(payload);
});

module.exports = router;
module.exports.VALID_RECIPES = VALID_RECIPES;
module.exports.VALID_RECIPE_IDS = VALID_RECIPE_IDS;
