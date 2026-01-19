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
const { supabase } = require('../config/supabase');
const { authenticateToken, requireSuperAdmin } = require('../middleware/authMiddleware');
const { AUDIT_TYPE_LABELS } = require('../utils/auditHelper');

/**
 * Parsear la descripción JSON de forma segura
 */
const parseDescripcion = (descripcion) => {
    try {
        if (!descripcion) return {};
        if (typeof descripcion === 'object') return descripcion;
        return JSON.parse(descripcion);
    } catch {
        return { raw: descripcion };
    }
};

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
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *       - in: query
 *         name: mes
 *         schema:
 *           type: integer
 *         description: Mes (1-12)
 *       - in: query
 *         name: anio
 *         schema:
 *           type: integer
 *         description: Año
 *     responses:
 *       200:
 *         description: Lista de eventos de auditoría
 */
router.get('/', authenticateToken, requireSuperAdmin, async (req, res) => {
    const { limit = 50, offset = 0, tipo, mes, anio } = req.query;

    try {
        // Construir query
        let query = supabase
            .from('auditoria')
            .select('id, tipo_accion, id_usuario, descripcion, fecha');

        if (tipo) {
            query = query.eq('tipo_accion', tipo);
        }

        // Filtrar por mes y año
        if (mes && anio) {
            const startDate = new Date(parseInt(anio), parseInt(mes) - 1, 1);
            const endDate = new Date(parseInt(anio), parseInt(mes), 0, 23, 59, 59);
            query = query.gte('fecha', startDate.toISOString());
            query = query.lte('fecha', endDate.toISOString());
        } else if (anio) {
            const startDate = new Date(parseInt(anio), 0, 1);
            const endDate = new Date(parseInt(anio), 11, 31, 23, 59, 59);
            query = query.gte('fecha', startDate.toISOString());
            query = query.lte('fecha', endDate.toISOString());
        }

        query = query
            .order('fecha', { ascending: false })
            .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

        const { data: auditData, error: auditError } = await query;

        if (auditError) throw auditError;

        // Obtener usuarios para mostrar nombres
        const userIds = [...new Set(auditData.filter(a => a.id_usuario).map(a => a.id_usuario))];
        let usersMap = {};

        if (userIds.length > 0) {
            const { data: users } = await supabase
                .from('usuarios')
                .select('id, email, nombre')
                .in('id', userIds);

            if (users) {
                usersMap = users.reduce((acc, u) => {
                    acc[u.id] = { email: u.email, nombre: u.nombre };
                    return acc;
                }, {});
            }
        }

        // Formatear respuesta con todos los campos
        const formattedData = auditData.map(a => {
            const descripcionObj = parseDescripcion(a.descripcion);
            const userInfo = usersMap[a.id_usuario] || {};

            // Extraer campos especiales de la descripción
            const { _actor_email, _ip_origen, _tipo_label, ...detalleClean } = descripcionObj;

            return {
                id: a.id,
                tipo_evento: a.tipo_accion,
                tipo_label: _tipo_label || AUDIT_TYPE_LABELS[a.tipo_accion] || a.tipo_accion,
                id_usuario: a.id_usuario,
                actor_email: _actor_email || userInfo.email || 'sistema',
                actor_nombre: userInfo.nombre || null,
                ip_origen: _ip_origen || 'localhost',
                detalle: Object.keys(detalleClean).length > 0 ? detalleClean : null,
                detalle_texto: Object.keys(detalleClean).length > 0
                    ? Object.entries(detalleClean).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(', ')
                    : null,
                timestamp: a.fecha
            };
        });

        // Contar total
        let countQuery = supabase
            .from('auditoria')
            .select('id', { count: 'exact', head: true });

        if (tipo) {
            countQuery = countQuery.eq('tipo_accion', tipo);
        }
        if (mes && anio) {
            const startDate = new Date(parseInt(anio), parseInt(mes) - 1, 1);
            const endDate = new Date(parseInt(anio), parseInt(mes), 0, 23, 59, 59);
            countQuery = countQuery.gte('fecha', startDate.toISOString());
            countQuery = countQuery.lte('fecha', endDate.toISOString());
        } else if (anio) {
            const startDate = new Date(parseInt(anio), 0, 1);
            const endDate = new Date(parseInt(anio), 11, 31, 23, 59, 59);
            countQuery = countQuery.gte('fecha', startDate.toISOString());
            countQuery = countQuery.lte('fecha', endDate.toISOString());
        }

        const { count } = await countQuery;

        res.json({
            success: true,
            data: formattedData,
            pagination: {
                total: count || 0,
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
 */
router.get('/user/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
    const { id } = req.params;
    const { limit = 50 } = req.query;

    try {
        const { data, error } = await supabase
            .from('auditoria')
            .select('id, tipo_accion, descripcion, fecha')
            .eq('id_usuario', id)
            .order('fecha', { ascending: false })
            .limit(parseInt(limit));

        if (error) throw error;

        const formattedData = data.map(a => {
            const descripcionObj = parseDescripcion(a.descripcion);
            const { _actor_email, _ip_origen, _tipo_label, ...detalleClean } = descripcionObj;

            return {
                id: a.id,
                tipo_evento: a.tipo_accion,
                tipo_label: _tipo_label || AUDIT_TYPE_LABELS[a.tipo_accion] || a.tipo_accion,
                ip_origen: _ip_origen || 'localhost',
                detalle: Object.keys(detalleClean).length > 0 ? detalleClean : null,
                timestamp: a.fecha
            };
        });

        res.json({ success: true, data: formattedData });

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
 */
router.get('/types', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('auditoria')
            .select('tipo_accion');

        if (error) throw error;

        // Agrupar y contar
        const counts = data.reduce((acc, row) => {
            acc[row.tipo_accion] = (acc[row.tipo_accion] || 0) + 1;
            return acc;
        }, {});

        const result = Object.entries(counts)
            .map(([tipo_evento, count]) => ({
                tipo_evento,
                tipo_label: AUDIT_TYPE_LABELS[tipo_evento] || tipo_evento,
                count
            }))
            .sort((a, b) => b.count - a.count);

        res.json({ success: true, data: result });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/audit/export:
 *   get:
 *     summary: Exportar auditoría a CSV
 *     tags: [Auditoría]
 */
router.get('/export', authenticateToken, requireSuperAdmin, async (req, res) => {
    const { mes, anio } = req.query;

    try {
        let query = supabase
            .from('auditoria')
            .select('id, tipo_accion, id_usuario, descripcion, fecha');

        // Filtrar por mes y año
        if (mes && anio) {
            const startDate = new Date(parseInt(anio), parseInt(mes) - 1, 1);
            const endDate = new Date(parseInt(anio), parseInt(mes), 0, 23, 59, 59);
            query = query.gte('fecha', startDate.toISOString());
            query = query.lte('fecha', endDate.toISOString());
        } else if (anio) {
            const startDate = new Date(parseInt(anio), 0, 1);
            const endDate = new Date(parseInt(anio), 11, 31, 23, 59, 59);
            query = query.gte('fecha', startDate.toISOString());
            query = query.lte('fecha', endDate.toISOString());
        }

        query = query.order('fecha', { ascending: false });

        const { data: auditData, error } = await query;
        if (error) throw error;

        // Obtener usuarios
        const userIds = [...new Set(auditData.filter(a => a.id_usuario).map(a => a.id_usuario))];
        let usersMap = {};

        if (userIds.length > 0) {
            const { data: users } = await supabase
                .from('usuarios')
                .select('id, email')
                .in('id', userIds);

            if (users) {
                usersMap = users.reduce((acc, u) => {
                    acc[u.id] = u.email;
                    return acc;
                }, {});
            }
        }

        // Generar CSV
        const headers = ['ID', 'Fecha', 'Tipo', 'Usuario', 'IP', 'Detalles'];
        const rows = auditData.map(a => {
            const descripcionObj = parseDescripcion(a.descripcion);
            const { _actor_email, _ip_origen, _tipo_label, ...detalleClean } = descripcionObj;

            return [
                a.id,
                new Date(a.fecha).toLocaleString('es-CO'),
                _tipo_label || AUDIT_TYPE_LABELS[a.tipo_accion] || a.tipo_accion,
                _actor_email || usersMap[a.id_usuario] || 'sistema',
                _ip_origen || 'localhost',
                Object.keys(detalleClean).length > 0 ? JSON.stringify(detalleClean) : ''
            ];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const filename = `auditoria_${mes || 'all'}_${anio || 'all'}.csv`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send('\uFEFF' + csvContent); // BOM for Excel UTF-8

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
