import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { showConfirm } from '../../utils/alertUtils';

/**
 * Iconos SVG para el sidebar
 */
const Icons = {
    Terapeutas: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
    ),
    Auditoria: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    ),
    Logout: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
    ),
    Logo: () => (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
    ),
    ChevronDown: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
    )
};

/**
 * Item de navegación en el sidebar
 */
const NavItem = ({ to, icon: Icon, label }) => (
    <NavLink
        to={to}
        className={({ isActive }) => 
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive 
                    ? 'bg-[#F76C6C]/10 text-[#F76C6C] font-medium' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`
        }
    >
        <Icon />
        <span>{label}</span>
    </NavLink>
);

/**
 * Layout del Panel de Administrador (Root)
 * Incluye header, sidebar y área de contenido
 */
const AdminLayout = ({ children }) => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [showUserMenu, setShowUserMenu] = React.useState(false);

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
            {/* Header */}
            <header className="bg-[#F76C6C] shadow-md z-20 fixed top-0 left-0 right-0 h-16">
                <div className="h-full px-6 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
                            <Icons.Logo />
                            <span className="text-white font-bold text-sm sr-only">VR</span>
                        </div>
                        <span className="text-white font-semibold text-lg">
                            Sistema VR
                        </span>
                    </div>

                    {/* User Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-full py-1.5 px-3 transition-colors"
                        >
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                                <span className="text-[#F76C6C] font-semibold text-sm">
                                    {user?.nombre?.charAt(0) || 'R'}
                                </span>
                            </div>
                            <span className="text-white font-medium text-sm">
                                Admin Root
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
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-20">
                                    <div className="px-4 py-2 border-b border-gray-100">
                                        <p className="text-sm font-medium text-gray-900">{user?.nombre || 'Admin'}</p>
                                        <p className="text-xs text-gray-500">{user?.email || user?.correo}</p>
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
            </header>

            <div className="flex flex-1 pt-16">
                {/* Sidebar */}
                <aside className="w-56 bg-white border-r border-gray-200 fixed left-0 top-16 bottom-0 z-10">
                    <nav className="p-4 flex flex-col h-full">
                        <div className="space-y-1 flex-1">
                            <NavItem 
                                to="/admin/terapeutas" 
                                icon={Icons.Terapeutas} 
                                label="Terapeutas" 
                            />
                            <NavItem 
                                to="/admin/auditoria" 
                                icon={Icons.Auditoria} 
                                label="Auditoría" 
                            />
                        </div>

                        {/* Logout button at bottom */}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors mt-auto"
                        >
                            <Icons.Logout />
                            <span>Cerrar Sesión</span>
                        </button>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 ml-56 p-8">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
