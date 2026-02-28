/**
 * ========================================
 * SERVICIO: Resultados VR
 * ========================================
 * 
 * Servicio para obtener y gestionar resultados
 * de sesiones del videojuego VR (Unity).
 */

import api from './api';

const vrResultsService = {
    buildParams(filters = {}) {
        const params = new URLSearchParams();

        if (filters.participantId) params.append('participantId', String(filters.participantId));
        if (filters.activityId) params.append('activityId', String(filters.activityId));
        if (filters.estado_revision) params.append('estado_revision', String(filters.estado_revision));
        if (filters.id_paciente) params.append('id_paciente', String(filters.id_paciente));
        if (filters.search) params.append('search', String(filters.search));
        if (filters.sort) params.append('sort', String(filters.sort));
        if (filters.page) params.append('page', String(filters.page));
        if (filters.limit) params.append('limit', String(filters.limit));

        return params;
    },

    async fetchAllFromEndpoint(baseEndpoint, filters = {}) {
        const skipCache = filters.skipCache === true;
        const forceRefresh = filters.forceRefresh === true;
        const pageSize = filters.limit || 100;
        let page = 1;
        let totalPages = 1;
        const allData = [];

        while (page <= totalPages) {
            const params = this.buildParams({ ...filters, page, limit: pageSize });
            const endpoint = params.toString() ? `${baseEndpoint}?${params.toString()}` : baseEndpoint;
            const response = await api.get(endpoint, { skipCache, forceRefresh });
            const currentData = response?.data || [];
            allData.push(...currentData);

            totalPages = response?.pagination?.totalPages || 1;
            page += 1;
        }

        return {
            success: true,
            data: allData,
            count: allData.length
        };
    },

    /**
     * Obtener todas las sesiones VR
     * @param {object} filters - Filtros opcionales (participantId, activityId)
     */
    async getAllSessions(filters = {}) {
        const skipCache = filters.skipCache === true;
        const forceRefresh = filters.forceRefresh === true;
        if (filters.fetchAll === true) {
            return this.fetchAllFromEndpoint('/api/v1/session-results', filters);
        }

        const params = this.buildParams(filters);
        const endpoint = params.toString() ? `/api/v1/session-results?${params.toString()}` : '/api/v1/session-results';
        const response = await api.get(endpoint, { skipCache, forceRefresh });

        return {
            success: true,
            data: response?.data || [],
            count: response?.count ?? (response?.data || []).length,
            pagination: response?.pagination || null
        };
    },

    /**
     * Obtener sesiones VR de un participante específico
     * @param {string} participantId - ID del participante (puede ser el ID o identificacion)
     */
    async getSessionsByParticipant(participantId) {
        return this.getAllSessions({ participantId });
    },

    /**
     * Obtener detalle completo de una sesión VR
     * @param {string} sessionId - UUID de la sesión
     */
    async getSessionById(sessionId) {
        const response = await api.get(`/api/v1/session-results/${sessionId}`);
        return {
            success: response?.success !== false,
            data: response?.data || null
        };
    },

    /**
     * Obtener sesiones VR filtradas por terapeuta (para dashboard)
     * Usa /api/sessions que filtra por pacientes asignados al terapeuta
     * @param {object} filters - Filtros opcionales (estado_revision, id_paciente, limit)
     */
    async getDashboardSessions(filters = {}) {
        const skipCache = filters.skipCache === true;
        const forceRefresh = filters.forceRefresh === true;
        if (filters.fetchAll !== false) {
            return this.fetchAllFromEndpoint('/api/sessions', {
                ...filters,
                limit: filters.limit || 100
            });
        }

        const params = this.buildParams(filters);
        const endpoint = params.toString() ? `/api/sessions?${params.toString()}` : '/api/sessions';
    const response = await api.get(endpoint, { skipCache, forceRefresh });

        return {
            success: true,
            data: response?.data || [],
            count: response?.count ?? (response?.data || []).length,
            pagination: response?.pagination || null
        };
    },

    /**
     * Actualizar una sesión VR (observaciones, vinculación de paciente, etc.)
     * @param {string} sessionId - UUID de la sesión
     * @param {object} data - Datos a actualizar { observaciones, id_paciente }
     */
    async updateSession(sessionId, data) {
        return api.put(`/api/sessions/${sessionId}`, data);
    },

    /**
     * Formatear duración en segundos a formato legible
     * @param {number} seconds - Segundos
     */
    formatDuration(seconds) {
        if (!seconds || seconds < 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
};

export default vrResultsService;
