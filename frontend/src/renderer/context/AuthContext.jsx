import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

// Crear contexto de autenticación
const AuthContext = createContext(null);

/**
 * Hook para usar el contexto de autenticación
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider');
    }
    return context;
};

/**
 * Proveedor de autenticación
 * Maneja el estado de autenticación global
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSetupConfigured, setIsSetupConfigured] = useState(true); // Default true to avoid flash

    // Verificar autenticación y configuración al cargar
    useEffect(() => {
        const init = async () => {
             await Promise.all([checkAuth(), checkSetupStatus()]);
             setLoading(false);
        };
        init();
    }, []);

    const checkSetupStatus = async () => {
        try {
            const result = await authService.checkSetup();
            console.log('[AuthContext] checkSetup result:', result);

            // Si el backend devuelve success: true, usamos el valor de 'configured'
            // Si falla, asumimos configurado para no bloquear error, o no configurado si es 404/etc
            if (result && typeof result.configured !== 'undefined') {
                setIsSetupConfigured(result.configured);
                
                // Si el sistema NO está configurado pero hay tokens viejos, limpiarlos
                // Esto evita el problema de pantalla en blanco por datos obsoletos
                if (!result.configured && authService.getToken()) {
                    console.log('[AuthContext] Sistema sin configurar pero hay token viejo. Limpiando...');
                    authService.removeToken();
                    setUser(null);
                }
            }
        } catch (error) {
            console.error('Error verificando setup:', error);
        }
    };

    /**
     * Verificar si hay una sesión activa
     */
    const checkAuth = async () => {
        try {
            const token = authService.getToken();
            if (token) {
                const userData = await authService.getMe();
                if (userData.success) {
                    setUser(userData.data);
                } else {
                    authService.removeToken();
                }
            }
        } catch (error) {
            console.error('Error verificando autenticación:', error);
            authService.removeToken();
        } 
    };

    /**
     * Iniciar sesión
     * @param {string} email - Correo electrónico
     * @param {string} password - Contraseña
     */
    const login = async (email, password) => {
        const result = await authService.login(email, password);

        if (result.success) {
            setUser(result.data.user);
        }

        return result;
    };

    /**
     * Cerrar sesión
     */
    const logout = () => {
        authService.removeToken();
        setUser(null);
    };

    // Valor del contexto
    const value = {
        user,
        loading,
        isAuthenticated: !!user,
        isSetupConfigured,
        checkSetupStatus, // Exponer para recargar tras setup exitoso
        login,
        logout,
        checkAuth
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
