/**
 * ========================================
 * RUTAS DE AUDITORÍA
 * ========================================
 * 
 * Consulta de eventos de auditoría
 * Requerimiento: RF-BDD-08
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken, requireSuperAdmin } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/audit:
 *   get:
 *     summary: Listar eventos de auditoría (solo Superadmin)
 *     tags: [Auditoría]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Número máximo de registros
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset para paginación
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de evento
 *       - in: query
 *         name: desde
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha inicial (YYYY-MM-DD)
 *       - in: query
 *         name: hasta
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha final (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Lista de eventos de auditoría
 *       403:
 *         description: Acceso denegado
 */
router.get('/', authenticateToken, requireSuperAdmin, async (req, res) => {
    const { limit = 50, offset = 0, tipo, desde, hasta } = req.query;

    try {
        let queryStr = `
            SELECT 
                a.id,
                a.tipo_accion as tipo_evento,
                a.id_usuario,
                u.email as actor_username,
                a.descripcion as detalle,
                '' as ip_origen,
                a.fecha as timestamp
            FROM auditoria a
            LEFT JOIN usuarios u ON a.id_usuario = u.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 0;

        if (tipo) {
            paramCount++;
            queryStr += ` AND a.tipo_accion = $${paramCount}`;
            params.push(tipo);
        }

        if (desde) {
            paramCount++;
            queryStr += ` AND a.fecha >= $${paramCount}`;
            params.push(desde);
        }

        if (hasta) {
            paramCount++;
            queryStr += ` AND a.fecha <= $${paramCount}::date + interval '1 day'`;
            params.push(hasta);
        }

        queryStr += ` ORDER BY a.fecha DESC`;

        paramCount++;
        queryStr += ` LIMIT $${paramCount}`;
        params.push(parseInt(limit));

        paramCount++;
        queryStr += ` OFFSET $${paramCount}`;
        params.push(parseInt(offset));

        const result = await query(queryStr, params);

        // Contar total
        let countQuery = 'SELECT COUNT(*) as total FROM auditoria WHERE 1=1';
        const countParams = [];
        let countParamNum = 0;

        if (tipo) {
            countParamNum++;
            countQuery += ` AND tipo_accion = $${countParamNum}`;
            countParams.push(tipo);
        }
        if (desde) {
            countParamNum++;
            countQuery += ` AND fecha >= $${countParamNum}`;
            countParams.push(desde);
        }
        if (hasta) {
            countParamNum++;
            countQuery += ` AND fecha <= $${countParamNum}::date + interval '1 day'`;
            countParams.push(hasta);
        }

        const countResult = await query(countQuery, countParams);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                total: parseInt(countResult.rows[0].total),
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/audit/user/{id}:
 *   get:
 *     summary: Obtener eventos de un usuario específico
 *     tags: [Auditoría]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Eventos del usuario
 */
router.get('/user/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
    const { id } = req.params;
    const { limit = 50 } = req.query;

    try {
        const result = await query(
            `SELECT 
                a.id,
                a.tipo_accion as tipo_evento,
                a.descripcion as detalle,
                '' as ip_origen,
                a.fecha as timestamp
            FROM auditoria a
            WHERE a.id_usuario = $1
            ORDER BY a.fecha DESC
            LIMIT $2`,
            [id, parseInt(limit)]
        );

        res.json({ success: true, data: result.rows });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/audit/types:
 *   get:
 *     summary: Obtener tipos de eventos disponibles
 *     tags: [Auditoría]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tipos de eventos
 */
router.get('/types', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const result = await query(`
            SELECT DISTINCT tipo_accion as tipo_evento, COUNT(*) as count
            FROM auditoria
            GROUP BY tipo_accion
            ORDER BY count DESC
        `);

        res.json({ success: true, data: result.rows });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
