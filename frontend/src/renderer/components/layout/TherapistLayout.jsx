import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { showConfirm } from '../../utils/alertUtils';

/**
 * Iconos SVG para el sidebar del terapeuta
 */
const Icons = {
    Pacientes: () => (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
    ),
    Configuracion: () => (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    Logout: () => (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
    ),
    Logo: () => (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
    ),
    ChevronDown: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
    ),
    Clock: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    Menu: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    ),
    ChevronLeft: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
    ),
    ChevronRight: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
    )
};

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
 * Componente de reloj en tiempo real
 */
const LiveClock = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="hidden md:flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
            <Icons.Clock />
            <span className="text-white text-sm font-medium">
                {time.toLocaleTimeString('es-CO', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                })}
            </span>
        </div>
    );
};

/**
 * Layout del Panel del Terapeuta
 * Tema verde según mockups - Responsivo
 */
const TherapistLayout = ({ children }) => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

                    {/* Right side - Clock and User */}
                    <div className="flex items-center gap-4">
                        <LiveClock />

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
                    className={`bg-white border-r border-gray-200 fixed left-0 top-16 bottom-0 z-10 transition-all duration-300 ${
                        sidebarCollapsed ? 'w-16' : 'w-56'
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
                            className={`flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors mt-auto ${
                                sidebarCollapsed ? 'justify-center' : ''
                            }`}
                        >
                            <Icons.Logout />
                            {!sidebarCollapsed && <span>Cerrar Sesión</span>}
                        </button>
                    </nav>
                </aside>

                {/* Main Content - Responsivo */}
                <main 
                    className={`flex-1 p-4 lg:p-6 xl:p-8 transition-all duration-300 ${
                        sidebarCollapsed ? 'ml-16' : 'ml-56'
                    }`}
                >
                    {children}
                </main>
            </div>
        </div>
    );
};

export default TherapistLayout;
