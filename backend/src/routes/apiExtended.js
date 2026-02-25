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

router.get('/sessions', authenticateToken, requireTerapeuta, listSessions);
router.put('/sessions/:id', authenticateToken, requireTerapeuta, updateSessionReview);
router.get('/patients/:id/report', authenticateToken, requireTerapeuta, getPatientReport);
router.get('/terapeutas', authenticateToken, requireTerapeuta, listTherapists);
router.get('/dashboard/stats', authenticateToken, requireTerapeuta, getDashboardStats);

module.exports = router;
