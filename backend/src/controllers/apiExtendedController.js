const { auditFromRequest, AUDIT_TYPES } = require('../utils/auditHelper');
const { invalidatePatientCaches } = require('../utils/cacheInvalidation');
const apiExtendedService = require('../services/apiExtendedService');

function sendError(res, error) {
    const status = error.status || 500;
    const payload = {
        success: false,
        error: error.message
    };

    if (error.code) {
        payload.code = error.code;
    }

    return res.status(status).json(payload);
}

async function listSessions(req, res) {
    try {
        const payload = await apiExtendedService.listSessions({
            user: req.user,
            query: req.query
        });
        return res.json(payload);
    } catch (error) {
        return sendError(res, error);
    }
}

async function updateSessionReview(req, res) {
    try {
        const result = await apiExtendedService.updateSessionReview({
            user: req.user,
            sessionId: req.params.id,
            body: req.body
        });

        await auditFromRequest(req, AUDIT_TYPES.SESSION_REVIEWED, {
            session_id: req.params.id,
            participant_id: result.session.participant_id,
            id_paciente_vinculado: result.updated.id_paciente_vinculado,
            tiene_evaluacion: result.observaciones
                ? result.observaciones.startsWith('[Calificación:')
                : false
        });

        await invalidatePatientCaches();

        return res.json({
            success: true,
            data: result.updated
        });
    } catch (error) {
        return sendError(res, error);
    }
}

async function getPatientReport(req, res) {
    try {
        const payload = await apiExtendedService.getPatientReport({
            user: req.user,
            patientId: req.params.id
        });
        return res.json(payload);
    } catch (error) {
        return sendError(res, error);
    }
}

async function listTherapists(req, res) {
    try {
        const payload = await apiExtendedService.listTherapists();
        return res.json(payload);
    } catch (error) {
        return sendError(res, error);
    }
}

async function getDashboardStats(req, res) {
    try {
        const payload = await apiExtendedService.getDashboardStats({ user: req.user });
        return res.json(payload);
    } catch (error) {
        return sendError(res, error);
    }
}

module.exports = {
    listSessions,
    updateSessionReview,
    getPatientReport,
    listTherapists,
    getDashboardStats
};
