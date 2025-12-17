/**
 * ========================================
 * CLIENTE API - Base
 * ========================================
 * 
 * Este archivo proporciona funciones para hacer peticiones HTTP al backend.
 * Uso: window.api.get('/api/endpoint')
 *      window.api.post('/api/endpoint', { data })
 */

const API_URL = 'http://localhost:3001';

/**
 * Cliente API con métodos para GET, POST, PUT, DELETE
 */
const api = {
    /**
     * Petición GET
     * @param {string} endpoint - Ruta del endpoint (ej: '/api/patients')
     */
    async get(endpoint) {
        return this._request(endpoint, { method: 'GET' });
    },

    /**
     * Petición POST
     * @param {string} endpoint - Ruta del endpoint
     * @param {object} data - Datos a enviar
     */
    async post(endpoint, data) {
        return this._request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Petición PUT
     * @param {string} endpoint - Ruta del endpoint
     * @param {object} data - Datos a actualizar
     */
    async put(endpoint, data) {
        return this._request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    /**
     * Petición DELETE
     * @param {string} endpoint - Ruta del endpoint
     */
    async delete(endpoint) {
        return this._request(endpoint, { method: 'DELETE' });
    },

    /**
     * Método interno para hacer peticiones
     * (No usar directamente, usar get/post/put/delete)
     */
    async _request(endpoint, options = {}) {
        const url = `${API_URL}${endpoint}`;

        try {
            console.log(`[API] ${options.method} ${url}`);

            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || `Error ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error(`[API] Error:`, error.message);
            throw error;
        }
    }
};

// Hacer disponible globalmente
window.api = api;
