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
    /**
     * Obtener todas las sesiones VR
     * @param {object} filters - Filtros opcionales (participantId, activityId)
     */
    async getAllSessions(filters = {}) {
        let endpoint = '/api/v1/session-results';
        const params = new URLSearchParams();

        if (filters.participantId) {
            params.append('participantId', filters.participantId);
        }
        if (filters.activityId) {
            params.append('activityId', filters.activityId);
        }

        if (params.toString()) {
            endpoint += '?' + params.toString();
        }

        return api.get(endpoint);
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
        return api.get(`/api/v1/session-results/${sessionId}`);
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
    },

    /**
     * Obtener nombre legible del set
     * @param {string} setName - Nombre del set en inglés
     */
    getSetDisplayName(setName) {
        const names = {
            'Ingredients': 'Ingredientes',
            'Utensils': 'Utensilios',
            'Preparation': 'Preparación',
            'Organization': 'Organización'
        };
        return names[setName] || setName;
    },

    /**
     * Calcular color de indicador según errores
     * @param {number} errors - Número de errores
     */
    getErrorIndicatorColor(errors) {
        if (errors === 0) return 'text-green-500';
        if (errors <= 2) return 'text-yellow-500';
        return 'text-red-500';
    }
};

export default vrResultsService;
