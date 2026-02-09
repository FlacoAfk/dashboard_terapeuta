/**
 * ========================================
 * SERVICIO DE AUTENTICACIÓN
 * ========================================
 * 
 * Maneja login, logout y verificación de sesión.
 * Se conecta con el backend en /api/auth/
 */

import api from './api';

const authService = {
    /**
     * Iniciar sesión
     * @param {string} email - Correo electrónico
     * @param {string} password - Contraseña
     * @returns {Promise<{success: boolean, data?: object, error?: string}>}
     */
    async login(email, password) {
        try {
            const response = await api.post('/api/auth/login', {
                email,
                password
            });

            if (response.success && response.data?.token) {
                // Guardar token
                api.setToken(response.data.token);

                return {
                    success: true,
                    data: response.data
                };
            }

            return {
                success: false,
                error: response.error || 'Error al iniciar sesión'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Error de conexión con el servidor'
            };
        }
    },

    /**
     * Obtener información del usuario actual
     * @returns {Promise<{success: boolean, data?: object, error?: string}>}
     */
    async getMe() {
        try {
            const response = await api.get('/api/auth/me');
            return response;
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * Verificar si el sistema está configurado
     * @returns {Promise<{configured: boolean}>}
     */
    async checkSetup() {
        try {
            const response = await api.get('/api/auth/check-setup');
            return response.data || response;
        } catch (error) {
            return { configured: false };
        }
    },

    /**
     * Crear superadministrador inicial (RF-SEG-01)
     * Solo funciona una vez durante la instalación
     * @param {object} data - { nombre, correo, password }
     * @returns {Promise<{success: boolean, data?: object, error?: string}>}
     */
    async setup(data) {
        try {
            const response = await api.post('/api/auth/setup', data);

            if (response.success && response.data?.token) {
                return {
                    success: true,
                    data: response.data
                };
            }

            return {
                success: false,
                error: response.error || 'Error al crear superadministrador'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Error de conexión'
            };
        }
    },

    /**
     * Obtener token almacenado
     */
    getToken() {
        return api.getToken();
    },

    /**
     * Eliminar token (logout)
     */
    removeToken() {
        api.removeToken();
    },

    /**
     * Verificar si hay un token válido
     */
    isAuthenticated() {
        return !!this.getToken();
    },

    /**
     * Solicitar código de verificación para cambio de contraseña
     * @returns {Promise<{success: boolean, message?: string, error?: string}>}
     */
    async requestVerificationCode() {
        try {
            const response = await api.post('/api/auth/request-verification-code', {});
            return response;
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Error al solicitar código'
            };
        }
    },

    /**
     * Restablecer contraseña usando código de verificación
     * @param {string} token - Código de verificación
     * @param {string} newPassword - Nueva contraseña
     */
    async resetPassword(token, newPassword) {
        try {
            const response = await api.post('/api/auth/reset-password', {
                token,
                newPassword
            });
            return response;
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Error al restablecer contraseña'
            };
        }
    }
};

export default authService;
