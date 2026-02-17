import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { showConfirm } from '../../utils/alertUtils';
import { Icons } from '../ui/Icons';
import FloatingSessionClock from '../ui/FloatingSessionClock';

/**
 * Item de navegación en el sidebar - responsivo
 */
const NavItem = ({ to, icon: Icon, label, end, collapsed }) => (
    <NavLink
        to={to}
        end={end}
        title={collapsed ? label : undefined}
        className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                ? 'bg-[#2AA87E]/10 text-[#2AA87E] font-medium border-l-4 border-[#2AA87E]'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            } ${collapsed ? 'justify-center border-l-0' : ''}`
        }
    >
        <Icon />
        {!collapsed && <span className="whitespace-nowrap">{label}</span>}
    </NavLink>
);



/**
 * Layout del Panel del Terapeuta
 * Tema verde según mockups - Responsivo
 */
const TherapistLayout = ({ children }) => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [showUserMenu, setShowUserMenu] = useState(false);
    // Initialize from localStorage if available, default to false (expanded)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        const saved = localStorage.getItem('therapist_sidebar_collapsed');
        return saved === 'true';
    });

    // Save to localStorage whenever state changes
    useEffect(() => {
        localStorage.setItem('therapist_sidebar_collapsed', sidebarCollapsed);
    }, [sidebarCollapsed]);

    const handleLogout = async () => {
        const confirmed = await showConfirm(
            '¿Cerrar sesión?',
            '¿Estás seguro que deseas salir del sistema?',
            'Sí, cerrar sesión'
        );

        if (confirmed) {
            logout();
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header - Verde */}
            <header className="bg-[#2AA87E] shadow-md z-20 fixed top-0 left-0 right-0 h-16">
                <div className="h-full px-4 lg:px-6 flex items-center justify-between">
                    {/* Logo y toggle sidebar */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors lg:hidden"
                            title={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
                        >
                            <Icons.Menu />
                        </button>
                        <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
                            <Icons.Logo />
                        </div>
                        <span className="text-white font-semibold text-lg hidden sm:inline">
                            Sistema VR
                        </span>
                    </div>

                    {/* Right side - User */}
                    <div className="flex items-center gap-4">

                        {/* User Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-full py-1.5 px-3 transition-colors"
                            >
                                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                                    <span className="text-[#2AA87E] font-semibold text-sm">
                                        {user?.nombre?.charAt(0) || 'T'}
                                    </span>
                                </div>
                                <span className="text-white font-medium text-sm hidden sm:inline max-w-[150px] truncate">
                                    {user?.nombre || 'Dr. Terapeuta'}
                                </span>
                                <Icons.ChevronDown />
                            </button>

                            {/* Dropdown */}
                            {showUserMenu && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowUserMenu(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-1 z-20">
                                        <div className="px-4 py-2 border-b border-gray-100">
                                            <p className="text-sm font-medium text-gray-900 truncate" title={user?.nombre}>{user?.nombre || 'Terapeuta'}</p>
                                            <p className="text-xs text-gray-500 truncate" title={user?.email}>{user?.email || 'terapeuta@sistema.com'}</p>
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                        >
                                            <Icons.Logout />
                                            Cerrar sesión
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 pt-16">
                {/* Sidebar - Responsivo */}
                <aside
                    className={`bg-white border-r border-gray-200 fixed left-0 top-16 bottom-0 z-10 transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-56'
                        }`}
                >
                    <nav className="p-2 lg:p-4 flex flex-col h-full">
                        {/* Toggle button for desktop */}
                        <button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="hidden lg:flex items-center justify-center p-2 mb-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors self-end"
                            title={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
                        >
                            {sidebarCollapsed ? <Icons.ChevronRight /> : <Icons.ChevronLeft />}
                        </button>

                        <div className="space-y-1 flex-1">
                            <NavItem
                                to="/terapeuta"
                                icon={Icons.Pacientes}
                                label="Pacientes"
                                end
                                collapsed={sidebarCollapsed}
                            />
                            <NavItem
                                to="/terapeuta/sesiones"
                                icon={Icons.Sesiones}
                                label="Sesiones VR"
                                collapsed={sidebarCollapsed}
                            />
                            <NavItem
                                to="/terapeuta/configuracion"
                                icon={Icons.Configuracion}
                                label="Configuración"
                                collapsed={sidebarCollapsed}
                            />
                        </div>

                        {/* Logout button at bottom */}
                        <button
                            onClick={handleLogout}
                            title={sidebarCollapsed ? 'Cerrar Sesión' : undefined}
                            className={`flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors mt-auto ${sidebarCollapsed ? 'justify-center' : ''
                                }`}
                        >
                            <Icons.Logout />
                            {!sidebarCollapsed && <span>Cerrar Sesión</span>}
                        </button>
                    </nav>
                </aside>

                {/* Main Content - Responsivo */}
                <main
                    className={`flex-1 p-4 lg:p-6 xl:p-8 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-56'
                        }`}
                >
                    {children}
                </main>
            </div>

            {/* Reloj flotante — solo visible cuando hay sesión VR activa */}
            <FloatingSessionClock />
        </div>
    );
};

export default TherapistLayout;
