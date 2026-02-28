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
    buildRecipeParams(filters = {}) {
        const params = new URLSearchParams();

        if (filters.status) params.append('status', String(filters.status));
        if (filters.participant_code) params.append('participant_code', String(filters.participant_code));
        if (filters.recipe_id) params.append('recipe_id', String(filters.recipe_id));
        if (filters.search) params.append('search', String(filters.search));
        if (filters.sort) params.append('sort', String(filters.sort));
        if (filters.page) params.append('page', String(filters.page));
        if (filters.limit) params.append('limit', String(filters.limit));
        if (filters.refresh) params.append('refresh', 'true');

        return params;
    },

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
        const skipCache = filters.skipCache === true;
        const forceRefresh = filters.forceRefresh === true;
        const fetchAll = filters.fetchAll !== false;

        if (!fetchAll) {
            const params = this.buildRecipeParams(filters);
            const endpoint = params.toString()
                ? `/api/sessions/recipe-sessions?${params.toString()}`
                : '/api/sessions/recipe-sessions';
            const response = await api.get(endpoint, { skipCache, forceRefresh });

            return {
                success: true,
                data: response?.data || [],
                count: response?.count ?? (response?.data || []).length,
                pagination: response?.pagination || null
            };
        }

        const pageSize = filters.limit || 100;
        let page = 1;
        let totalPages = 1;
        const allData = [];

        while (page <= totalPages) {
            const params = this.buildRecipeParams({ ...filters, page, limit: pageSize });
            const endpoint = `/api/sessions/recipe-sessions?${params.toString()}`;
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
