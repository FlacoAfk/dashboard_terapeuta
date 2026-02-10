import React, { useState } from 'react';
import Modal from '../ui/Modal';
import PasswordStrengthIndicator, { validatePassword } from '../ui/PasswordStrengthIndicator';
import { showConfirm, showToast, showAlert } from '../../utils/alertUtils';
import { Icons } from '../ui/Icons';
import FormField from '../ui/FormField';

/**
 * Modal para resetear contraseña de un terapeuta
 * RF-SEG-02: Solo el Superadministrador puede resetear contraseñas
 */
const ResetPasswordModal = ({ isOpen, onClose, onSubmit, therapist }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const validateForm = () => {
        const newErrors = {};

        // Validar contraseña robusta
        const passwordError = validatePassword(newPassword);
        if (passwordError) {
            newErrors.newPassword = passwordError;
        }

        if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = 'Las contraseñas no coinciden';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        // Confirmación antes de proceder
        const confirmed = await showConfirm(
            '¿Cambiar contraseña?',
            `Se actualizará la contraseña para el terapeuta ${therapist.nombre}. Asegúrese de comunicar la nueva contraseña de forma segura.`,
            'Sí, cambiar',
            'Cancelar'
        );

        if (!confirmed) return;

        setLoading(true);
        try {
            await onSubmit({
                therapistId: therapist.id,
                newPassword
            });
            handleClose();
        } catch (error) {
            setErrors({ submit: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setNewPassword('');
        setConfirmPassword('');
        setErrors({});
        setShowPassword(false);
        onClose();
    };

    if (!therapist) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="md">
            <Modal.Header onClose={handleClose} icon={Icons.Key} iconBg="bg-teal-500">
                Resetear Contraseña
            </Modal.Header>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <Modal.Body>
                    <div className="space-y-5">
                        <div className="flex items-center gap-3 p-3 bg-teal-50 border border-teal-100 rounded-lg text-sm text-teal-800">
                            <Icons.Lock />
                            <div>
                                <span className="font-semibold block">Terapeuta: {therapist.nombre}</span>
                                <span className="text-xs opacity-80">La contraseña anterior dejará de funcionar inmediatamente.</span>
                            </div>
                        </div>

                        {/* Nueva Contraseña */}
                        <FormField
                            label="Nueva Contraseña"
                            required
                            hint="Mín. 10 caracteres, mayúsculas, minúsculas, números y símbolos"
                            error={errors.newPassword}
                        >
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => {
                                        setNewPassword(e.target.value);
                                        if (errors.newPassword) setErrors({ ...errors, newPassword: '' });
                                    }}
                                    placeholder="••••••••"
                                    className={`w-full px-4 py-2.5 pr-12 border rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors ${errors.newPassword ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                                </button>
                            </div>
                            <PasswordStrengthIndicator password={newPassword} showRequirements={true} />
                        </FormField>

                        {/* Confirmar Contraseña */}
                        <FormField
                            label="Confirmar Contraseña"
                            required
                            error={errors.confirmPassword}
                        >
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                                }}
                                placeholder="Repetir contraseña"
                                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                                    }`}
                            />
                        </FormField>

                        {errors.submit && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                                {errors.submit}
                            </div>
                        )}
                    </div>
                </Modal.Body>

                <Modal.Footer>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 bg-[#F76C6C] hover:bg-[#E55A5A] disabled:bg-gray-300 text-white font-medium px-5 py-2 rounded-lg transition-colors"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Icons.Check />
                        )}
                        Resetear Contraseña
                    </button>
                </Modal.Footer>
            </form>
        </Modal>
    );
};

export default ResetPasswordModal;

