import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { GestionTerapeutas, Auditoria } from './pages/admin';
import { AuthProvider, useAuth } from './context/AuthContext';

/**
 * Componente de ruta protegida
 * Redirige al login si el usuario no está autenticado
 */
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    
    if (loading) {
        return (
            <div className="min-h-screen bg-login flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }
    
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    return children;
};

/**
 * Componente de ruta protegida para Admin
 * Redirige si no es administrador
 */
const AdminRoute = ({ children }) => {
    const { user, isAuthenticated, loading } = useAuth();
    
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#F76C6C] border-t-transparent"></div>
            </div>
        );
    }
    
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    // Verificar si es admin/root/superadmin (case-insensitive)
    const userRole = user?.rol?.toLowerCase() || '';
    const adminRoles = ['root', 'admin', 'superadmin'];
    if (!adminRoles.includes(userRole)) {
        return <Navigate to="/dashboard" replace />;
    }
    
    return children;
};

/**
 * Componente principal de la aplicación
 */
function App() {
    return (
        <AuthProvider>
            <Routes>
                {/* Ruta de login */}
                <Route path="/login" element={<Login />} />
                
                {/* Rutas protegidas - Dashboard general */}
                <Route 
                    path="/dashboard/*" 
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } 
                />
                
                {/* Rutas de Admin (Root) */}
                <Route 
                    path="/admin/terapeutas" 
                    element={
                        <AdminRoute>
                            <GestionTerapeutas />
                        </AdminRoute>
                    } 
                />
                <Route 
                    path="/admin/auditoria" 
                    element={
                        <AdminRoute>
                            <Auditoria />
                        </AdminRoute>
                    } 
                />
                <Route 
                    path="/admin" 
                    element={<Navigate to="/admin/terapeutas" replace />} 
                />
                
                {/* Redirección por defecto */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </AuthProvider>
    );
}

export default App;

