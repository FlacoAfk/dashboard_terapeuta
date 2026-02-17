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
     * Obtener las recetas disponibles organizadas por dificultad
     * @returns {Array} - Lista de recetas disponibles
     */
    getAvailableRecipes() {
        return [
            // Nivel Fácil (3–5 ingredientes)
            { id: 'tinto',               name: 'Tinto',                       difficulty: 'facil',      ingredients_range: '3-5' },
            { id: 'cafe_con_leche',      name: 'Café con leche',              difficulty: 'facil',      ingredients_range: '3-5' },
            { id: 'macchiato',           name: 'Macchiato / Café manchado',    difficulty: 'facil',      ingredients_range: '3-5' },
            // Nivel Intermedio (6–10 ingredientes)
            { id: 'arepa_con_huevo',     name: 'Arepa con huevo',             difficulty: 'intermedio', ingredients_range: '6-10' },
            { id: 'panqueques_con_frutas', name: 'Panqueques con frutas',     difficulty: 'intermedio', ingredients_range: '6-10' },
            { id: 'avena_con_toppings',  name: 'Avena caliente con toppings', difficulty: 'intermedio', ingredients_range: '6-10' },
            // Nivel Difícil (11–15 ingredientes)
            { id: 'arroz_con_pollo',     name: 'Arroz con pollo',             difficulty: 'dificil',    ingredients_range: '11-15' },
            { id: 'spaghetti_bolognesa', name: 'Spaghetti a la boloñesa',     difficulty: 'dificil',    ingredients_range: '11-15' },
            { id: 'sancocho_de_res',     name: 'Sancocho de res',             difficulty: 'dificil',    ingredients_range: '11-15' }
        ];
    }
};

export default sessionService;
