const express = require('express');
const router = express.Router();

const { authenticateToken, requireTerapeuta } = require('../middleware/authMiddleware');
const {
    listSessions,
    updateSessionReview,
    getPatientReport,
    listTherapists,
    getDashboardStats
} = require('../controllers/apiExtendedController');

/**
 * @swagger
 * /api/sessions:
 *   get:
 *     summary: Listar sesiones VR para revisión
 *     tags: [Sesiones VR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: estado_revision
 *         schema:
 *           type: string
 *       - in: query
 *         name: pendientes
 *         schema:
 *           type: boolean
 *         description: Filtra sesiones sin paciente vinculado (campo legacy)
 *       - in: query
 *         name: id_paciente
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de sesiones para revisión
 *       401:
 *         description: No autenticado
 */
router.get('/sessions', authenticateToken, requireTerapeuta, listSessions);

/**
 * @swagger
 * /api/sessions/{id}:
 *   put:
 *     summary: Actualizar revisión de una sesión VR
 *     tags: [Sesiones VR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID de la sesión VR
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               observaciones:
 *                 type: string
 *                 maxLength: 2000
 *               id_paciente:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Revisión actualizada
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: Sesión o paciente no encontrado
 */
router.put('/sessions/:id', authenticateToken, requireTerapeuta, updateSessionReview);

/**
 * @swagger
 * /api/patients/{id}/report:
 *   get:
 *     summary: Obtener reporte clínico agregado de paciente
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del paciente
 *     responses:
 *       200:
 *         description: Reporte del paciente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: Paciente no encontrado
 */
router.get('/patients/:id/report', authenticateToken, requireTerapeuta, getPatientReport);

/**
 * @swagger
 * /api/terapeutas:
 *   get:
 *     summary: Listar terapeutas disponibles
 *     tags: [Terapeutas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de terapeutas
 *       401:
 *         description: No autenticado
 */
router.get('/terapeutas', authenticateToken, requireTerapeuta, listTherapists);

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Obtener estadísticas principales del dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas del dashboard
 *       401:
 *         description: No autenticado
 */
router.get('/dashboard/stats', authenticateToken, requireTerapeuta, getDashboardStats);

module.exports = router;
