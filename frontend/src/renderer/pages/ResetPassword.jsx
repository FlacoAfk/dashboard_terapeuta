import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import Logo from '../components/ui/Logo';
import Button from '../components/ui/Button';
import api from '../services/api';

/**
 * Página de Restablecimiento de Contraseña
 * Permite al usuario establecer una nueva contraseña usando el token del email
 */
const ResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const tokenFromUrl = (searchParams.get('token') || '').trim();
    const emailHint = (searchParams.get('email') || '').trim();
    const requiresVerificationCode = tokenFromUrl.length === 0;

    const [formData, setFormData] = useState({
        verificationCode: tokenFromUrl,
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);




    /**
     * Manejar cambios en los inputs
     */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (error) setError('');
    };

    /**
     * Validar contraseña
     */
    const validateForm = () => {
        if (requiresVerificationCode) {
            const code = formData.verificationCode.trim();
            if (!/^\d{6}$/.test(code)) {
                return 'Ingrese el código de 6 dígitos enviado a su correo';
            }
        }

        if (formData.password.length < 10) {
            return 'La contraseña debe tener al menos 10 caracteres';
        }
        if (!/[A-Z]/.test(formData.password)) {
            return 'La contraseña debe incluir al menos una mayúscula';
        }
        if (!/[a-z]/.test(formData.password)) {
            return 'La contraseña debe incluir al menos una minúscula';
        }
        if (!/\d/.test(formData.password)) {
            return 'La contraseña debe incluir al menos un número';
        }
        if (!/[@$!%*?&]/.test(formData.password)) {
            return 'La contraseña debe incluir al menos un símbolo (@$!%*?&)';
        }
        if (formData.password !== formData.confirmPassword) {
            return 'Las contraseñas no coinciden';
        }
        return null;
    };

    /**
     * Manejar envío del formulario
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validar formulario
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        const recoveryToken = tokenFromUrl || formData.verificationCode.trim();

        setLoading(true);
        try {
            const response = await api.post('/api/auth/reset-password', {
                token: recoveryToken,
                newPassword: formData.password
            });

            if (response.success) {
                setSuccess(true);
            } else {
                setError(response.error || 'Error al restablecer la contraseña');
            }
        } catch (err) {
            setError(err.message || 'Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    // Pantalla de éxito
    if (success) {
        return (
            <div className="min-h-screen bg-[#C5CDE8] flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">
                            ¡Contraseña Actualizada!
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Su contraseña ha sido restablecida exitosamente. 
                            Ahora puede iniciar sesión con su nueva contraseña.
                        </p>
                        <Button onClick={() => navigate('/login')}>
                            Ir al Login
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#C5CDE8] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo y título */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <Logo size="lg" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-1">
                        Restablecer Contraseña
                    </h1>
                    <p className="text-gray-600">
                        {requiresVerificationCode
                            ? 'Ingrese el código recibido y su nueva contraseña'
                            : 'Ingrese su nueva contraseña'}
                    </p>
                    {requiresVerificationCode && emailHint && (
                        <p className="text-xs text-gray-500 mt-2">
                            Correo: <strong>{emailHint}</strong>
                        </p>
                    )}
                </div>

                {/* Card del formulario */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Código de verificación (flujo por correo) */}
                        {requiresVerificationCode && (
                            <div className="space-y-1.5">
                                <label htmlFor="resetpassword-field-174" className="block text-sm font-medium text-gray-700">
                                    Código de Verificación
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M9 3h6a2 2 0 012 2v1H7V5a2 2 0 012-2zm-2 4h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2z" />
                                        </svg>
                                    </div>
                                    <input id="resetpassword-field-174"
                                        type="text"
                                        name="verificationCode"
                                        value={formData.verificationCode}
                                        onChange={handleChange}
                                        placeholder="123456"
                                        inputMode="numeric"
                                        maxLength={6}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors tracking-[0.4em] font-semibold"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Campo Nueva Contraseña */}
                        <div className="space-y-1.5">
                            <label htmlFor="resetpassword-field-199" className="block text-sm font-medium text-gray-700">
                                Nueva Contraseña
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <input id="resetpassword-field-199"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••••"
                                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
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
                        </div>

                        {/* Campo Confirmar Contraseña */}
                        <div className="space-y-1.5">
                            <label htmlFor="resetpassword-field-237" className="block text-sm font-medium text-gray-700">
                                Confirmar Contraseña
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <input id="resetpassword-field-237"
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="••••••••••"
                                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                >
                                    {showConfirmPassword ? (
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
                        </div>

                        {/* Requisitos de contraseña */}
                        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
                            <p className="font-medium mb-2">La contraseña debe tener:</p>
                            <ul className="space-y-1 text-xs">
                                <li className={formData.password.length >= 10 ? 'text-green-600' : ''}>
                                    • Mínimo 10 caracteres
                                </li>
                                <li className={/[A-Z]/.test(formData.password) ? 'text-green-600' : ''}>
                                    • Al menos una mayúscula
                                </li>
                                <li className={/[a-z]/.test(formData.password) ? 'text-green-600' : ''}>
                                    • Al menos una minúscula
                                </li>
                                <li className={/\d/.test(formData.password) ? 'text-green-600' : ''}>
                                    • Al menos un número
                                </li>
                                <li className={/[@$!%*?&]/.test(formData.password) ? 'text-green-600' : ''}>
                                    • Al menos un símbolo (@$!%*?&)
                                </li>
                            </ul>
                        </div>

                        {/* Mensaje de error */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {error}
                            </div>
                        )}

                        {/* Botón de enviar */}
                        <Button
                            type="submit"
                            loading={loading}
                            disabled={loading}
                            className="w-full"
                        >
                            Restablecer Contraseña
                        </Button>
                    </form>

                    {/* Link a login */}
                    <div className="mt-6 text-center">
                        <Link 
                            to="/login" 
                            className="text-teal-600 hover:underline font-medium inline-flex items-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Volver al Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
