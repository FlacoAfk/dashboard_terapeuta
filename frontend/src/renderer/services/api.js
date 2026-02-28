/**
 * ========================================
 * CLIENTE API BASE
 * ========================================
 * 
 * Cliente HTTP para comunicación con el backend.
 * Maneja tokens de autenticación automáticamente.
 */

import { getApiUrl, getApiTimeoutMs, isElectronRuntime } from '../config/runtime';

const API_URL = getApiUrl();
const API_TIMEOUT_MS = getApiTimeoutMs();

/**
 * Cliente API con métodos para GET, POST, PUT, DELETE
 */
const api = {
    /**
     * Obtener el token de autenticación
     */
    getAuthHeader() {
        const token = this.getToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    },

    /**
     * Obtener token almacenado
     */
    getToken() {
        // Usar electronAPI si está disponible, sino sessionStorage
        if (isElectronRuntime() && window.electronAPI?.getToken) {
            return window.electronAPI.getToken();
        }
        return sessionStorage.getItem('auth_token');
    },

    /**
     * Guardar token
     */
    setToken(token) {
        if (isElectronRuntime() && window.electronAPI?.setToken) {
            window.electronAPI.setToken(token);
        } else {
            sessionStorage.setItem('auth_token', token);
        }
    },

    /**
     * Eliminar token
     */
    removeToken() {
        if (isElectronRuntime() && window.electronAPI?.removeToken) {
            window.electronAPI.removeToken();
        } else {
            sessionStorage.removeItem('auth_token');
        }
    },

    /**
     * Petición GET
     * @param {string} endpoint - Ruta del endpoint
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
     */
    async _request(endpoint, options = {}) {
        const url = `${API_URL}${endpoint}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader(),
                    ...options.headers,
                },
            });

            let data;
            try {
                data = await response.json();
            } catch {
                data = { error: 'Respuesta inválida del servidor' };
            }

            if (!response.ok) {
                // Manejo automático de errores de autenticación
                if (data.code === 'USER_DISABLED' ||
                    data.code === 'TOKEN_EXPIRED' ||
                    data.code === 'AUTH_REQUIRED' ||
                    data.code === 'INVALID_TOKEN') {

                    console.warn('[API] Sesión inválida o usuario desactivado. Cerrando sesión...');
                    this.removeToken();

                    // Redirigir al login si no estamos ya allí
                    if (!window.location.pathname.includes('/login')) {
                        window.location.href = '/login';
                    }
                }

                throw new Error(data.error || data.message || `Error ${response.status}`);
            }

            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                const timeoutError = new Error(`Tiempo de espera agotado (${API_TIMEOUT_MS / 1000}s). Verifica que el backend esté corriendo en ${API_URL}.`);
                console.error('[API] Timeout:', timeoutError.message);
                throw timeoutError;
            }

            if (error instanceof TypeError) {
                const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
                const detail = isOffline
                    ? 'Parece que no tienes conexión a internet.'
                    : 'Puede ser un problema de red, CORS u origen no permitido.';
                const networkError = new Error(`No se pudo completar la conexión con ${API_URL}. ${detail}`);
                console.error('[API] Red:', networkError.message, error);
                throw networkError;
            }

            console.error(`[API] Error:`, error.message);
            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    }
};

export default api;
