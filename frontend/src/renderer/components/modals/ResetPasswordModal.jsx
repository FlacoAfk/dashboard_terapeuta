import React, { useState } from 'react';
import Modal from '../ui/Modal';

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

    const validatePassword = (password) => {
        // RF-SEG-01: Mínimo 10 caracteres, mayúsculas, minúsculas, números y símbolos
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/;
        return regex.test(password);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};

        if (!newPassword) {
            newErrors.newPassword = 'La contraseña es requerida';
        } else if (!validatePassword(newPassword)) {
            newErrors.newPassword = 'Mínimo 10 caracteres con mayúsculas, minúsculas, números y símbolos (@$!%*?&)';
        }

        if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = 'Las contraseñas no coinciden';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

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
        onClose();
    };

    if (!therapist) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="sm">
            <Modal.Header onClose={handleClose}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Resetear Contraseña</h2>
                        <p className="text-sm text-gray-500">{therapist.nombre}</p>
                    </div>
                </div>
            </Modal.Header>

            <form onSubmit={handleSubmit}>
                <Modal.Body>
                    <div className="space-y-4">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <p className="text-sm text-amber-700">
                                <strong>⚠️ Advertencia:</strong> Esta acción reseteará la contraseña del usuario. 
                                Asegúrese de comunicar la nueva contraseña al terapeuta de forma segura.
                            </p>
                        </div>

                        {/* Nueva Contraseña */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nueva Contraseña
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 ${
                                        errors.newPassword ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="Mínimo 10 caracteres"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                            {errors.newPassword && (
                                <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>
                            )}
                        </div>

                        {/* Confirmar Contraseña */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Confirmar Contraseña
                            </label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 ${
                                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Repetir contraseña"
                            />
                            {errors.confirmPassword && (
                                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                            )}
                        </div>

                        {errors.submit && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm">
                                {errors.submit}
                            </div>
                        )}

                        {/* Requisitos */}
                        <div className="text-xs text-gray-500 space-y-1">
                            <p className="font-medium">Requisitos de contraseña:</p>
                            <ul className="list-disc list-inside space-y-0.5">
                                <li>Mínimo 10 caracteres</li>
                                <li>Al menos una mayúscula (A-Z)</li>
                                <li>Al menos una minúscula (a-z)</li>
                                <li>Al menos un número (0-9)</li>
                                <li>Al menos un símbolo (@$!%*?&)</li>
                            </ul>
                        </div>
                    </div>
                </Modal.Body>

                <Modal.Footer>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Guardando...' : 'Resetear Contraseña'}
                    </button>
                </Modal.Footer>
            </form>
        </Modal>
    );
};

export default ResetPasswordModal;
