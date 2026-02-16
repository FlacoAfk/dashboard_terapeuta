/**
 * ========================================
 * SERVICIO: Sesiones de Receta VR
 * ========================================
 * 
 * Servicio para crear y consultar sesiones de receta.
 * Flujo: Terapeuta elige receta → crea sesión → VR consulta por token.
 */

import api from './api';

const sessionService = {
    /**
     * Crear una nueva sesión de receta
     * @param {object} data - { participant_code, recipe_id }
     * @returns {Promise<object>} - { success, session_id, start_token, recipe_id, status }
     */
    async createSession(data) {
        return api.post('/api/sessions', {
            participant_code: data.participant_code,
            recipe_id: data.recipe_id
        });
    },

    /**
     * Listar sesiones de receta del terapeuta autenticado
     * @param {object} filters - Filtros opcionales { status, participant_code }
     * @returns {Promise<object>} - { success, data, count }
     */
    async getRecipeSessions(filters = {}) {
        let endpoint = '/api/sessions/recipe-sessions';
        const params = new URLSearchParams();

        if (filters.status) {
            params.append('status', filters.status);
        }
        if (filters.participant_code) {
            params.append('participant_code', filters.participant_code);
        }

        if (params.toString()) {
            endpoint += '?' + params.toString();
        }

        return api.get(endpoint);
    },

    /**
     * Obtener las recetas disponibles (hardcoded por ahora, luego vendrá de BD)
     * @returns {Array} - Lista de recetas disponibles
     */
    getAvailableRecipes() {
        return [
            { id: 'tinto', name: 'Tinto (Café)', description: 'Preparación de café tinto colombiano' }
            // Se agregarán más recetas en el futuro
        ];
    }
};

export default sessionService;
