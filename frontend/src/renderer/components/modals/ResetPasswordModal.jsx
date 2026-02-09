import React, { useState } from 'react';
import Modal from '../ui/Modal';
import PasswordStrengthIndicator, { validatePassword } from '../ui/PasswordStrengthIndicator';
import { showConfirm, showToast, showAlert } from '../../utils/alertUtils';

/**
 * Iconos SVG
 */
const Icons = {
    Key: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
    ),
    Eye: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    ),
    EyeOff: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
    ),
    Check: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    ),
    Lock: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
    )
};

/**
 * Componente de campo de formulario
 */
const FormField = ({ label, required, hint, error, children }) => (
    <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
        {hint && !error && (
            <p className="text-xs text-gray-400">{hint}</p>
        )}
        {error && (
            <p className="text-xs text-red-500">{error}</p>
        )}
    </div>
);

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

            <form onSubmit={handleSubmit}>
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

