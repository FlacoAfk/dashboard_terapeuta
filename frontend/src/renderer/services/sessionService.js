/**
 * ========================================
 * SERVICIO: Sesiones de Receta VR
 * ========================================
 * 
 * Servicio para crear y consultar sesiones de receta.
 * Flujo: Terapeuta elige receta → crea sesión → VR consulta por token.
 */

import api from './api';
import { DEFAULT_RECIPES, normalizeRecipes } from '../constants/recipes';

let cachedRecipes = [...DEFAULT_RECIPES];

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
        if (filters.refresh) {
            params.append('refresh', 'true');
        }

        if (params.toString()) {
            endpoint += '?' + params.toString();
        }

        return api.get(endpoint);
    },

    /**
     * Finalizar manualmente una sesión de receta desde dashboard
     * @param {string} sessionId - UUID de la sesión
     */
    async closeSession(sessionId) {
        return api.put(`/api/sessions/${sessionId}/close`, {});
    },

    /**
     * Cargar catálogo de recetas desde backend y guardarlo en cache local
     */
    async loadAvailableRecipes({ forceRefresh = false } = {}) {
        if (!forceRefresh && cachedRecipes.length > 0) {
            return cachedRecipes;
        }

        try {
            const response = await api.get('/api/sessions/recipes');
            cachedRecipes = normalizeRecipes(response?.data || response);
            return cachedRecipes;
        } catch (error) {
            return cachedRecipes;
        }
    },

    /**
     * Obtener catálogo de recetas desde cache
     */
    getAvailableRecipes() {
        return cachedRecipes;
    }
};

export default sessionService;
