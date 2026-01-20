import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/ui/Logo';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import PasswordStrengthIndicator, { validatePassword } from '../components/ui/PasswordStrengthIndicator';
import authService from '../services/authService';

/**
 * Página de Setup Inicial del Superadministrador
 * RF-SEG-01: Creación del Superusuario (solo una vez durante instalación)
 */
const SetupPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [setupComplete, setSetupComplete] = useState(false);
    const [formData, setFormData] = useState({
        nombre: '',
        correo: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Verificar si ya existe un superadmin
    useEffect(() => {
        const checkSetup = async () => {
            try {
                const result = await authService.checkSetup();
                if (result.setupComplete) {
                    setSetupComplete(true);
                }
            } catch (error) {
                console.error('Error checking setup:', error);
            } finally {
                setLoading(false);
            }
        };
        checkSetup();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre es requerido';
        }

        if (!formData.correo.trim()) {
            newErrors.correo = 'El correo es requerido';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) {
            newErrors.correo = 'Correo electrónico inválido';
        }

        const passwordError = validatePassword(formData.password);
        if (passwordError) {
            newErrors.password = passwordError;
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Las contraseñas no coinciden';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setSubmitting(true);
        try {
            const result = await authService.setup({
                nombre: formData.nombre,
                correo: formData.correo,
                password: formData.password
            });

            if (result.success) {
                // Redirigir al login con mensaje de éxito
                navigate('/login', { 
                    state: { message: '¡Superadministrador creado exitosamente! Inicie sesión.' }
                });
            } else {
                setErrors({ submit: result.error || 'Error al crear superadministrador' });
            }
        } catch (error) {
            setErrors({ submit: error.message || 'Error de conexión' });
        } finally {
            setSubmitting(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-[#C5CDE8] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent"></div>
            </div>
        );
    }

    // Si ya existe superadmin, redirigir al login
    if (setupComplete) {
        return (
            <div className="min-h-screen bg-[#C5CDE8] flex flex-col items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Sistema Configurado</h2>
                    <p className="text-gray-600 mb-6">
                        El superadministrador ya fue creado. Use sus credenciales para iniciar sesión.
                    </p>
                    <Button onClick={() => navigate('/login')}>
                        Ir al Login
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#C5CDE8] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-lg">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <Logo size="lg" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        Configuración Inicial
                    </h1>
                    <p className="text-gray-600">
                        Configure la cuenta de Superadministrador del sistema
                    </p>
                </div>

                {/* Card del formulario */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* Info banner */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-sm text-blue-700">
                                <p className="font-medium">RF-SEG-01: Solo puede existir un Superadministrador</p>
                                <p className="mt-1 text-blue-600">
                                    Esta cuenta tendrá acceso total a todas las funciones del sistema.
                                </p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Nombre completo */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-gray-700">
                                Nombre Completo <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                placeholder="Administrador del Sistema"
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors ${
                                    errors.nombre ? 'border-red-300' : 'border-gray-300'
                                }`}
                            />
                            {errors.nombre && (
                                <p className="text-xs text-red-500">{errors.nombre}</p>
                            )}
                        </div>

                        {/* Correo */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-gray-700">
                                Correo Electrónico <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                name="correo"
                                value={formData.correo}
                                onChange={handleChange}
                                placeholder="admin@clinica.com"
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors ${
                                    errors.correo ? 'border-red-300' : 'border-gray-300'
                                }`}
                            />
                            {errors.correo && (
                                <p className="text-xs text-red-500">{errors.correo}</p>
                            )}
                        </div>

                        {/* Contraseña */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-gray-700">
                                Contraseña <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Contraseña segura"
                                    className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors ${
                                        errors.password ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <PasswordStrengthIndicator password={formData.password} />
                            {errors.password && (
                                <p className="text-xs text-red-500">{errors.password}</p>
                            )}
                        </div>

                        {/* Confirmar contraseña */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-gray-700">
                                Confirmar Contraseña <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Repetir contraseña"
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors ${
                                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                                }`}
                            />
                            {errors.confirmPassword && (
                                <p className="text-xs text-red-500">{errors.confirmPassword}</p>
                            )}
                        </div>

                        {/* Error general */}
                        {errors.submit && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                                {errors.submit}
                            </div>
                        )}

                        {/* Botón submit */}
                        <Button
                            type="submit"
                            loading={submitting}
                            disabled={submitting}
                            className="w-full"
                        >
                            Crear Superadministrador
                        </Button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-gray-500 mt-4">
                    ¿Ya tiene un superadministrador?{' '}
                    <button 
                        onClick={() => navigate('/login')}
                        className="text-teal-600 hover:underline font-medium"
                    >
                        Iniciar sesión
                    </button>
                </p>
            </div>
        </div>
    );
};

export default SetupPage;
