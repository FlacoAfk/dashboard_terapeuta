import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Logo from '../components/ui/Logo';
import { showAlert } from '../utils/alertUtils';

/**
 * Verificar si el rol es de administrador
 */
const isAdminRole = (rol) => {
    const adminRoles = ['root', 'admin', 'superadmin'];
    return adminRoles.includes(rol?.toLowerCase() || '');
};

/**
 * Verificar si el rol es de terapeuta
 */
const isTherapistRole = (rol) => {
    return rol?.toLowerCase() === 'terapeuta';
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
        email: '',
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
            } else if (isTherapistRole(user.rol)) {
                navigate('/terapeuta');
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
        if (!formData.email.trim()) {
            setError('El correo electrónico es requerido');
            return;
        }
        if (!formData.email.includes('@')) {
            setError('Ingrese un correo electrónico válido');
            return;
        }
        if (!formData.password) {
            setError('La contraseña es requerida');
            return;
        }

        setLoading(true);

        try {
            const result = await login(formData.email, formData.password);

            if (result.success) {
                // Redirigir según el rol del usuario
                const userRole = result.data?.user?.rol;
                if (isAdminRole(userRole)) {
                    navigate('/admin/terapeutas');
                } else if (isTherapistRole(userRole)) {
                    navigate('/terapeuta');
                } else {
                    navigate('/dashboard');
                }
            } else {
                // Usar modal para errores de credenciales o cuenta
                await showAlert('error', 'Error de inicio de sesión', result.error || 'Credenciales inválidas');
            }
        } catch (err) {
            await showAlert('error', 'Error de conexión', 'No se pudo conectar con el servidor');
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
                        {/* Campo Correo Electrónico */}
                        <Input
                            name="email"
                            type="email"
                            label="Correo Electrónico"
                            placeholder="nombre@clinica.com"
                            value={formData.email}
                            onChange={handleChange}
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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
                    
                    {/* Link olvidé mi contraseña */}
                    <div className="mt-4 text-center">
                        <Link 
                            to="/forgot-password" 
                            className="text-sm text-teal-600 hover:underline"
                        >
                            ¿Olvidó su contraseña?
                        </Link>
                    </div>
                </div>
            </div>

            {/* Versión */}
            <div className="absolute bottom-4 right-4 text-gray-500 text-sm">
                v{window.env?.appVersion || '1.5.0'}
            </div>
        </div>
    );
};

export default Login;
