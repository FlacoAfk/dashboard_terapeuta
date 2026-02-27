import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/ui/Logo';
import Button from '../components/ui/Button';
import api from '../services/api';

/**
 * Página de Recuperación de Contraseña
 * Permite al usuario solicitar un reseteo de contraseña
 */
const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    /**
     * Maneja el envío del formulario de recuperación
     * @param {Event} e - Evento del formulario
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validación de campo vacío
        if (!email.trim()) {
            setError('El correo electrónico es requerido');
            return;
        }

        // Validación de formato de email
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Ingrese un correo electrónico válido');
            return;
        }

        setLoading(true);
        try {
            // Llamada al endpoint de recuperación
            // Por seguridad, siempre mostramos éxito aunque el email no exista
            const response = await api.post('/api/auth/forgot-password', { email });
            
            if (response.success) {
                setSubmitted(true);
            } else {
                setSubmitted(true);
            }
        } catch (err) {
            // Manejo silencioso de errores para no revelar información del sistema
            setSubmitted(true);
        } finally {
            setLoading(false);
        }
    };

    // Pantalla de confirmación
    if (submitted) {
        return (
            <div className="min-h-screen bg-[#C5CDE8] flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">
                            Revise su correo
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Si existe una cuenta con el correo <strong>{email}</strong>, 
                            recibirá instrucciones para restablecer su contraseña.
                        </p>
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
                            <p className="text-sm text-blue-700">
                                <strong>Nota:</strong> Si no recibe el correo en unos minutos, 
                                contacte al administrador del sistema para que restablezca su contraseña manualmente.
                            </p>
                        </div>
                        <Button
                            onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email)}`)}
                            className="mb-3"
                        >
                            Ingresar Código
                        </Button>
                        <Button variant="secondary" onClick={() => navigate('/login')}>
                            Volver al Login
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
                        ¿Olvidó su contraseña?
                    </h1>
                    <p className="text-gray-600">
                        Ingrese su correo para recibir instrucciones
                    </p>
                </div>

                {/* Card del formulario */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Campo Correo Electrónico */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-gray-700">
                                Correo Electrónico
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                    placeholder="nombre@clinica.com"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                                />
                            </div>
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
                            Enviar Instrucciones
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

export default ForgotPassword;
