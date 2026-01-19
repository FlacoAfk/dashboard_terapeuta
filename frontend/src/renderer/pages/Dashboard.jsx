import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Dashboard principal
 * Se muestra después del login exitoso
 */
const Dashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    /**
     * Manejar cierre de sesión
     */
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-[#E85A5A] shadow-md">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold">VR</span>
                        </div>
                        <span className="text-white font-semibold text-xl">
                            Sistema Clínico VR
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                                <span className="text-[#E85A5A] font-semibold text-sm">
                                    {user?.nombre?.charAt(0) || 'U'}
                                </span>
                            </div>
                            <span className="text-white font-medium">
                                {user?.nombre || user?.email}
                            </span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="text-white/80 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            {/* Contenido principal */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="bg-white rounded-2xl shadow-sm p-8">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">
                        Bienvenido, {user?.nombre || user?.email}
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Has iniciado sesión exitosamente en el Sistema Clínico VR.
                    </p>

                    {/* Info del usuario */}
                    <div className="bg-gray-50 rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-gray-700 mb-4">
                            Información de la sesión
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Email</p>
                                <p className="font-medium text-gray-800">{user?.email}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Rol</p>
                                <p className="font-medium text-gray-800">{user?.rol}</p>
                            </div>
                            {user?.correo && (
                                <div>
                                    <p className="text-sm text-gray-500">Correo</p>
                                    <p className="font-medium text-gray-800">{user?.correo}</p>
                                </div>
                            )}
                            {user?.especialidad && (
                                <div>
                                    <p className="text-sm text-gray-500">Especialidad</p>
                                    <p className="font-medium text-gray-800">{user?.especialidad}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
