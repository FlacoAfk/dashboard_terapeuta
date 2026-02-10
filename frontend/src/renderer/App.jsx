import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SetupPage from './pages/SetupPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { GestionTerapeutas, Auditoria } from './pages/admin';
import { DashboardTerapeuta, DetallePaciente, SesionesVR } from './pages/terapeuta';
import ConfiguracionTerapeuta from './pages/terapeuta/ConfiguracionTerapeuta';
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
        return <Navigate to="/terapeuta" replace />;
    }

    return children;
};

/**
 * Componente de ruta protegida para Terapeuta
 * Redirige si no es terapeuta
 */
const TherapistRoute = ({ children }) => {
    const { user, isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#2AA87E] border-t-transparent"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Verificar si es terapeuta
    const userRole = user?.rol?.toLowerCase() || '';
    if (userRole !== 'terapeuta') {
        // Si es admin, redirigir a admin
        const adminRoles = ['root', 'admin', 'superadmin'];
        if (adminRoles.includes(userRole)) {
            return <Navigate to="/admin/terapeutas" replace />;
        }
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

/**
 * Componente de guardia global de configuración
 */
const SetupGuard = ({ children }) => {
    const { isSetupConfigured, loading } = useAuth();
    const location = useLocation();

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent"></div>
        </div>
    );

    // Si NO está configurado y no estamos en setup, ir a setup
    if (isSetupConfigured === false && location.pathname !== '/setup') {
        return <Navigate to="/setup" replace />;
    }

    // Si SÍ está configurado y estamos en setup, ir a login
    if (isSetupConfigured === true && location.pathname === '/setup') {
        return <Navigate to="/login" replace />;
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
                {/* Todas las rutas envueltas en SetupGuard */}
                <Route path="/*" element={
                    <SetupGuard>
                        <Routes>
                             {/* Ruta de setup inicial */}
                            <Route path="/setup" element={<SetupPage />} />
                            
                            <Route path="/login" element={<Login />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/reset-password" element={<ResetPassword />} />

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

                            {/* Rutas de Terapeuta */}
                            <Route
                                path="/terapeuta"
                                element={
                                    <TherapistRoute>
                                        <DashboardTerapeuta />
                                    </TherapistRoute>
                                }
                            />
                            <Route
                                path="/terapeuta/sesiones"
                                element={
                                    <TherapistRoute>
                                        <SesionesVR />
                                    </TherapistRoute>
                                }
                            />
                            <Route
                                path="/terapeuta/paciente/:id"
                                element={
                                    <TherapistRoute>
                                        <DetallePaciente />
                                    </TherapistRoute>
                                }
                            />
                            <Route
                                path="/terapeuta/configuracion"
                                element={
                                    <TherapistRoute>
                                        <ConfiguracionTerapeuta />
                                    </TherapistRoute>
                                }
                            />

                            {/* Redirección por defecto */}
                            <Route path="/" element={<Navigate to="/login" replace />} />
                            <Route path="*" element={<Navigate to="/login" replace />} />
                        </Routes>
                    </SetupGuard>
                } />
            </Routes>
        </AuthProvider>
    );
}

export default App;
