/**
 * ========================================
 * CLIENTE API BASE
 * ========================================
 * 
 * Cliente HTTP para comunicación con el backend.
 * Maneja tokens de autenticación automáticamente.
 */

const API_URL = window.env?.apiUrl || 'http://localhost:3001';

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
        if (window.electronAPI?.getToken) {
            return window.electronAPI.getToken();
        }
        return sessionStorage.getItem('auth_token');
    },

    /**
     * Guardar token
     */
    setToken(token) {
        if (window.electronAPI?.setToken) {
            window.electronAPI.setToken(token);
        } else {
            sessionStorage.setItem('auth_token', token);
        }
    },

    /**
     * Eliminar token
     */
    removeToken() {
        if (window.electronAPI?.removeToken) {
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

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader(),
                    ...options.headers,
                },
            });

            const data = await response.json();

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

                throw new Error(data.error || `Error ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error(`[API] Error:`, error.message);
            throw error;
        }
    }
};

export default api;
