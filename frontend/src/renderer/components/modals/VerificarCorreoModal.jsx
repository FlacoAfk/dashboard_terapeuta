import React, { useState } from 'react';
import Modal from '../ui/Modal';
import authService from '../../services/authService';
import { showToast } from '../../utils/alertUtils';
import { Icons } from '../ui/Icons';

const VerificarCorreoModal = ({ isOpen, onClose, email }) => {
    const [step, setStep] = useState(1); // 1: Send Code, 2: Verify & Change
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSendCode = async () => {
        setLoading(true);
        setError('');
        try {
            const result = await authService.requestVerificationCode();
            if (result.success) {
                showToast('success', 'Código enviado a tu correo');
                setStep(2);
            } else {
                setError(result.error || 'Error al enviar código');
            }
        } catch (err) {
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (newPassword.length < 10) {
            setError('La contraseña debe tener al menos 10 caracteres');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await authService.resetPassword(code, newPassword);
            if (result.success) {
                showToast('success', 'Contraseña actualizada correctamente');
                onClose();
            } else {
                setError(result.error || 'Código incorrecto o expirado');
            }
        } catch (err) {
            setError('Error al actualizar contraseña');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep(1);
        setCode('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="md">
            <Modal.Header onClose={handleClose} icon={Icons.Lock} iconBg="bg-[#2AA87E]">
                Cambiar Contraseña
            </Modal.Header>

            <Modal.Body>
                {step === 1 ? (
                    <div className="text-center py-6">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
                            <Icons.Mail />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Verificación de Seguridad</h3>
                        <p className="text-gray-500 mb-6">
                            Para proteger tu cuenta, enviaremos un código de verificación de 6 dígitos a tu correo electrónico:
                            <br />
                            <span className="font-medium text-gray-900">{email}</span>
                        </p>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleSendCode}
                            disabled={loading}
                            className="w-full bg-[#2AA87E] hover:bg-[#239469] text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Enviar Código
                                    <Icons.Mail />
                                </>
                            )}
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg mb-4">
                            <p className="text-sm text-blue-700">
                                Hemos enviado un código a <strong>{email}</strong>. Ingrésalo a continuación para establecer tu nueva contraseña.
                            </p>
                        </div>

                        <div>
                            <label htmlFor="verificarcorreomodal-field-123" className="block text-sm font-medium text-gray-700 mb-1">Código de Verificación</label>
                            <input id="verificarcorreomodal-field-123"
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="Ej: 123456"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2AA87E]/20 focus:border-[#2AA87E] text-center text-xl tracking-widest font-mono"
                                maxLength={6}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="verificarcorreomodal-field-136" className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
                            <div className="relative">
                                <input id="verificarcorreomodal-field-136"
                                    type={showPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2AA87E]/20 focus:border-[#2AA87E]"
                                    placeholder="Mínimo 10 caracteres"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="verificarcorreomodal-field-157" className="block text-sm font-medium text-gray-700 mb-1">Confirmar Contraseña</label>
                            <div className="relative">
                                <input id="verificarcorreomodal-field-157"
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#2AA87E]/20 focus:border-[#2AA87E] ${confirmPassword && newPassword !== confirmPassword ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    placeholder="Repite la contraseña"
                                    required
                                />
                            </div>
                            {confirmPassword && newPassword !== confirmPassword && (
                                <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>
                            )}
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                            >
                                Atrás
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-[#2AA87E] hover:bg-[#239469] text-white font-medium px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
                            >
                                {loading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Icons.Check />
                                        Cambiar Contraseña
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </Modal.Body>
        </Modal>
    );
};

export default VerificarCorreoModal;
