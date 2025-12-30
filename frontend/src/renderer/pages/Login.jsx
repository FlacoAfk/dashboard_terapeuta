import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Logo from '../components/ui/Logo';

/**
 * Verificar si el rol es de administrador
 */
const isAdminRole = (rol) => {
    const adminRoles = ['root', 'admin', 'superadmin'];
    return adminRoles.includes(rol?.toLowerCase() || '');
};

/**
 * Página de Login
 * Basada en el mockup proporcionado
 */
const Login = () => {
    const navigate = useNavigate();
    const { login, isAuthenticated, user } = useAuth();
    
    // Estado del formulario
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Redireccionar si ya está autenticado
    React.useEffect(() => {
        if (isAuthenticated && user) {
            // Redirigir según el rol
            if (isAdminRole(user.rol)) {
                navigate('/admin/terapeutas');
            } else {
                navigate('/dashboard');
            }
        }
    }, [isAuthenticated, user, navigate]);

    /**
     * Manejar cambios en los inputs
     */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Limpiar error al escribir
        if (error) setError('');
    };

    /**
     * Manejar envío del formulario
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validaciones básicas
        if (!formData.username.trim()) {
            setError('El usuario es requerido');
            return;
        }
        if (!formData.password) {
            setError('La contraseña es requerida');
            return;
        }

        setLoading(true);

        try {
            const result = await login(formData.username, formData.password);
            
            if (result.success) {
                // Redirigir según el rol del usuario
                const userRole = result.data?.user?.rol;
                if (isAdminRole(userRole)) {
                    navigate('/admin/terapeutas');
                } else {
                    navigate('/dashboard');
                }
            } else {
                setError(result.error || 'Credenciales inválidas');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#C5CDE8] flex flex-col items-center justify-center p-4">
            {/* Contenedor principal */}
            <div className="w-full max-w-md">
                {/* Logo y título */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <Logo size="lg" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-1">
                        Sistema Clínico VR
                    </h1>
                    <p className="text-gray-600">
                        Gestión de Terapias
                    </p>
                </div>

                {/* Card del formulario */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Campo Usuario */}
                        <Input
                            name="username"
                            label="Usuario"
                            placeholder="nombre@clinica.com"
                            value={formData.username}
                            onChange={handleChange}
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            }
                        />

                        {/* Campo Contraseña */}
                        <Input
                            name="password"
                            type="password"
                            label="Contraseña"
                            placeholder="••••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            }
                        />

                        {/* Mensaje de error */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {error}
                            </div>
                        )}

                        {/* Botón de login */}
                        <Button
                            type="submit"
                            loading={loading}
                            disabled={loading}
                        >
                            Iniciar Sesión
                        </Button>
                    </form>
                </div>
            </div>

            {/* Versión */}
            <div className="absolute bottom-4 right-4 text-gray-500 text-sm">
                v1.0.0
            </div>
        </div>
    );
};

export default Login;
