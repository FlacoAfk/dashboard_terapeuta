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
const { authenticateToken, requireTerapeuta } = require('../middleware/authMiddleware');
const { auditFromRequest, AUDIT_TYPES } = require('../utils/auditHelper');

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
 * Middleware para validar API Key de Unity
 */
const validateUnityApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    const expectedKey = process.env.UNITY_API_KEY;

    if (!expectedKey) {
        console.error('[Security] UNITY_API_KEY no está configurada en .env');
        return res.status(500).json({
            error: { code: 'CONFIG_ERROR', message: 'API Key no configurada en el servidor' }
        });
    }

    if (!apiKey || apiKey !== expectedKey) {
        return res.status(401).json({
            error: { code: 'UNAUTHORIZED', message: 'API Key inválida o no proporcionada' }
        });
    }

    next();
};

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

        // Obtener id_terapeuta del usuario autenticado
        const createdBy = req.user.id_terapeuta;
        if (!createdBy) {
            return res.status(403).json({
                success: false,
                error: 'Solo terapeutas pueden crear sesiones',
                code: 'NOT_THERAPIST'
            });
        }

        // ── Verificar que no exista sesión ACTIVE para este participante ──
        const { data: existingSession } = await supabase
            .from('sessions')
            .select('id, start_token')
            .eq('participant_code', participant_code.trim())
            .eq('status', 'ACTIVE')
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
                status: 'ACTIVE',
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

        if (!token || token.trim().length === 0) {
            return res.status(400).json({
                error: { code: 'MISSING_TOKEN', message: 'Token es requerido' }
            });
        }

        const { data: session, error } = await supabase
            .from('sessions')
            .select('id, participant_code, recipe_id, status')
            .eq('start_token', token.trim().toUpperCase())
            .eq('status', 'ACTIVE')
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

        // ── Respuesta según contrato ──
        res.json({
            session_id: session.id,
            participant_code: session.participant_code,
            recipe_id: session.recipe_id,
            status: session.status
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
            .eq('status', 'ACTIVE')
            .select('id, status')
            .single();

        if (error || !updated) {
            return res.status(404).json({
                error: { code: 'NOT_FOUND', message: 'Sesión activa no encontrada' }
            });
        }

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
        const { status, participant_code } = req.query;

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

        res.json({
            success: true,
            data: sessions || [],
            count: (sessions || []).length
        });

    } catch (error) {
        console.error('Error en GET /sessions/recipe-sessions:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
