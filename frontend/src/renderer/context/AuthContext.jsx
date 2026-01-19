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

    // Verificar autenticación al cargar
    useEffect(() => {
        checkAuth();
    }, []);

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
        } finally {
            setLoading(false);
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
