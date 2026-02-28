const repository = require('../repositories/apiExtendedRepository');
const { buildCacheKey, getCachedJson, setCachedJson } = require('../utils/cache');
const {
    parsePagination,
    parseSearch,
    parseSort,
    buildPaginationMetadata,
    toPositiveInteger
} = require('../utils/queryOptions');

function createHttpError(status, message, code) {
    const error = new Error(message);
    error.status = status;
    if (code) error.code = code;
    return error;
}

function buildSessionFilters(query, baseQuery) {
    let currentQuery = baseQuery;

    if (query.estado_revision) {
        currentQuery = currentQuery.eq('estado_revision', query.estado_revision);
    }

    if (query.pendientes === 'true') {
        currentQuery = currentQuery.is('id_paciente_vinculado', null);
    }

    if (query.id_paciente) {
        currentQuery = currentQuery.eq('id_paciente_vinculado', toPositiveInteger(query.id_paciente, 0));
    }

    if (query.activity_id) {
        currentQuery = currentQuery.eq('activity_id', query.activity_id);
    }

    const search = parseSearch(query);
    if (search) {
        currentQuery = currentQuery.or(`participant_id.ilike.%${search}%,activity_id.ilike.%${search}%`);
    }

    return currentQuery;
}

async function listSessions({ user, query }) {
    const pagination = parsePagination(query, {
        page: 1,
        limit: 25,
        maxLimit: 200
    });

    const sortClauses = parseSort(
        query,
        ['created_at', 'started_at', 'ended_at', 'total_seconds', 'summary_total_errors', 'summary_total_releases', 'estado_revision'],
        [{ field: 'created_at', ascending: false }]
    );

    let allowedPatientIds = null;
    if (user.rol === 'TERAPEUTA' && user.id_terapeuta) {
        allowedPatientIds = await repository.getAssignedPatientIdsForTherapist(user.id_terapeuta);
        if (allowedPatientIds.length === 0) {
            return {
                success: true,
                data: [],
                count: 0,
                pagination: buildPaginationMetadata({
                    page: pagination.page,
                    limit: pagination.limit,
                    total: 0
                })
            };
        }
    }

    const cacheKey = buildCacheKey('api:sessions:list', {
        role: user.rol,
        therapistId: user.id_terapeuta || null,
        page: pagination.page,
        limit: pagination.limit,
        estado_revision: query.estado_revision || null,
        pendientes: query.pendientes || null,
        id_paciente: query.id_paciente || null,
        activity_id: query.activity_id || null,
        search: parseSearch(query),
        sort: sortClauses
    });

    const cachedPayload = await getCachedJson(cacheKey);
    if (cachedPayload) {
        return cachedPayload;
    }

    let sessionsQuery = repository.buildVrSessionsQuery({
        from: pagination.from,
        to: pagination.to,
        sortClauses
    });
    if (allowedPatientIds) {
        sessionsQuery = sessionsQuery.in('id_paciente_vinculado', allowedPatientIds);
    }
    sessionsQuery = buildSessionFilters(query, sessionsQuery);

    const { data: sessions, count: total } = await repository.runQuery(sessionsQuery);

    const patientIds = Array.from(
        new Set(
            (sessions || [])
                .map((session) => session.id_paciente_vinculado)
                .filter(Boolean)
        )
    );

    const patientsData = await repository.getPatientsByIds(patientIds);
    const patientNameById = new Map((patientsData || []).map((patient) => [patient.id, patient.nombre]));

    const sessionsWithPatients = (sessions || []).map((session) => ({
        ...session,
        paciente_nombre: session.id_paciente_vinculado
            ? (patientNameById.get(session.id_paciente_vinculado) || null)
            : null
    }));

    const payload = {
        success: true,
        data: sessionsWithPatients,
        count: sessionsWithPatients.length,
        pagination: buildPaginationMetadata({
            page: pagination.page,
            limit: pagination.limit,
            total
        })
    };

    await setCachedJson(cacheKey, payload, 20);
    return payload;
}

function validateSessionUpdateInput(sessionId, observaciones, idPaciente) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId)) {
        throw createHttpError(400, 'El ID de sesión debe ser un UUID válido', 'INVALID_UUID');
    }

    if (observaciones !== undefined) {
        if (typeof observaciones !== 'string') {
            throw createHttpError(400, 'Las observaciones deben ser texto', 'INVALID_INPUT');
        }
        if (observaciones.length > 2000) {
            throw createHttpError(400, 'Las observaciones no pueden exceder 2000 caracteres', 'INPUT_TOO_LONG');
        }
    }

    if (idPaciente !== undefined && idPaciente !== null) {
        if (!Number.isInteger(idPaciente) || idPaciente <= 0) {
            throw createHttpError(400, 'El ID del paciente debe ser un número entero positivo', 'INVALID_INPUT');
        }
    }
}

async function updateSessionReview({ user, sessionId, body }) {
    const { observaciones, id_paciente: idPaciente } = body;
    validateSessionUpdateInput(sessionId, observaciones, idPaciente);

    const session = await repository.getVrSessionById(sessionId);
    if (!session) {
        throw createHttpError(404, 'Sesión VR no encontrada', 'SESSION_NOT_FOUND');
    }

    if (user.rol === 'TERAPEUTA' && user.id_terapeuta && session.id_paciente_vinculado) {
        const assignment = await repository.getTherapistPatientAssignment(session.id_paciente_vinculado, user.id_terapeuta);
        if (!assignment) {
            throw createHttpError(403, 'Sin acceso a esta sesión. El paciente no está asignado a usted.', 'ACCESS_DENIED');
        }
    }

    const updateData = {
        id_terapeuta_revisor: user.id_terapeuta,
        estado_revision: 'REVISADA'
    };

    if (observaciones !== undefined) {
        updateData.observaciones_terapeuta = observaciones;
    }

    if (idPaciente) {
        const patient = await repository.getActivePatientById(idPaciente);
        if (!patient) {
            throw createHttpError(404, 'Paciente no encontrado o inactivo', 'PATIENT_NOT_FOUND');
        }

        if (user.rol === 'TERAPEUTA' && user.id_terapeuta) {
            const patientAssignment = await repository.getTherapistPatientAssignment(idPaciente, user.id_terapeuta);
            if (!patientAssignment) {
                throw createHttpError(403, 'No puede vincular un paciente que no le está asignado', 'ACCESS_DENIED');
            }
        }

        updateData.id_paciente_vinculado = idPaciente;
    }

    const updated = await repository.updateVrSessionById(sessionId, updateData);

    return {
        updated,
        session,
        observaciones
    };
}

async function getPatientReport({ user, patientId }) {
    const cacheKey = buildCacheKey(`api:patients:report:${patientId}`, {
        role: user.rol,
        therapistId: user.id_terapeuta || null
    });

    const cachedPayload = await getCachedJson(cacheKey);
    if (cachedPayload) {
        return cachedPayload;
    }

    const patient = await repository.getPatientById(patientId);
    if (!patient) {
        throw createHttpError(404, 'Paciente no encontrado');
    }

    if (user.rol === 'TERAPEUTA' && user.id_terapeuta) {
        const assignment = await repository.getTherapistPatientAssignment(patientId, user.id_terapeuta);
        if (!assignment) {
            throw createHttpError(403, 'Sin acceso a este paciente');
        }
    }

    const therapistAssign = await repository.getTherapistAssignmentByPatient(patientId);
    const sessions = await repository.getPatientReportSessions(patientId);

    const formattedSessions = sessions.map((session) => ({
        id: session.id,
        actividad: session.activity_id,
        fecha_inicio: session.started_at,
        fecha_fin: session.ended_at,
        estado: session.estado_revision,
        total_aciertos: session.summary_total_releases,
        total_errores: session.summary_total_errors,
        total_drops: session.summary_total_drops,
        tiempo_total_seg: session.total_seconds,
        observaciones: session.observaciones_terapeuta
    }));

    const stats = {
        total_sesiones: formattedSessions.length,
        sesiones_completadas: formattedSessions.length,
        total_aciertos: formattedSessions.reduce((sum, session) => sum + session.total_aciertos, 0),
        total_errores: formattedSessions.reduce((sum, session) => sum + session.total_errores, 0),
        total_drops: formattedSessions.reduce((sum, session) => sum + session.total_drops, 0),
        tiempo_total_minutos: Math.round(formattedSessions.reduce((sum, session) => sum + session.tiempo_total_seg, 0) / 60)
    };

    const payload = {
        success: true,
        data: {
            patient: {
                ...patient,
                id_terapeuta: therapistAssign?.terapeutas?.id,
                terapeuta_nombre: therapistAssign?.terapeutas?.nombre
            },
            stats,
            sessions: formattedSessions
        }
    };

    await setCachedJson(cacheKey, payload, 30);
    return payload;
}

async function listTherapists() {
    const therapists = await repository.listTherapistsWithUsers();

    return {
        success: true,
        data: therapists.map((therapist) => ({
            id: therapist.id,
            nombre: therapist.nombre,
            especialidad: therapist.especialidad,
            correo: therapist.correo,
            telefono: therapist.telefono,
            email: therapist.usuarios?.email,
            activo: therapist.usuarios?.activo
        }))
    };
}

async function getDashboardStats({ user }) {
    const cacheKey = buildCacheKey('api:dashboard:stats', {
        role: user.rol,
        therapistId: user.id_terapeuta || null
    });

    const cachedPayload = await getCachedJson(cacheKey);
    if (cachedPayload) {
        return cachedPayload;
    }

    const [
        totalPacientes,
        totalSesiones,
        totalTerapeutas,
        activityIds,
        recentSessions
    ] = await Promise.all([
        repository.countPatients(),
        repository.countVrSessions(),
        repository.countTherapists(),
        repository.listActivityIds(),
        repository.listRecentSessions(5)
    ]);

    const payload = {
        success: true,
        data: {
            stats: {
                total_pacientes: totalPacientes,
                total_sesiones_vr: totalSesiones,
                total_terapeutas: totalTerapeutas,
                total_actividades: new Set(activityIds).size
            },
            recentSessions: recentSessions.map((session) => ({
                id: session.id,
                activity_id: session.activity_id,
                participant_id: session.participant_id,
                fecha_inicio: session.started_at,
                duracion_seg: session.total_seconds,
                errores: session.summary_total_errors
            }))
        }
    };

    await setCachedJson(cacheKey, payload, 20);
    return payload;
}

module.exports = {
    listSessions,
    updateSessionReview,
    getPatientReport,
    listTherapists,
    getDashboardStats
};
