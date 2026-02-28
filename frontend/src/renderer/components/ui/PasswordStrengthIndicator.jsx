import React from 'react';

/**
 * Componente que muestra la fortaleza de una contraseña
 * Cumple con RF-SEG-01: Validación de contraseña segura
 * Requisitos: mínimo 10 caracteres, mayúsculas, minúsculas, números y símbolos (@$!%*?&)
 */
const PasswordStrengthIndicator = ({ password, showRequirements = true }) => {
    // Validaciones individuales
    const checks = {
        length: password.length >= 10,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        symbol: /[@$!%*?&]/.test(password)
    };

    // Calcular nivel de fortaleza (0-5)
    const strength = Object.values(checks).filter(Boolean).length;

    // Determinar color y texto según la fortaleza
    const getStrengthInfo = () => {
        if (strength === 0) return { color: 'bg-gray-200', text: '', textColor: 'text-gray-400' };
        if (strength <= 2) return { color: 'bg-red-500', text: 'Débil', textColor: 'text-red-500' };
        if (strength <= 3) return { color: 'bg-yellow-500', text: 'Regular', textColor: 'text-yellow-600' };
        if (strength <= 4) return { color: 'bg-blue-500', text: 'Buena', textColor: 'text-blue-500' };
        return { color: 'bg-green-500', text: 'Fuerte', textColor: 'text-green-500' };
    };

    const strengthInfo = getStrengthInfo();
    const isValid = strength === 5;

    // Ícono de check o X
    const CheckIcon = () => (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    );

    const XIcon = () => (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    );

    if (!password) return null;

    return (
        <div className="mt-2 space-y-2">
            {/* Barra de progreso */}
            <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-300 ${strengthInfo.color}`}
                        style={{ width: `${(strength / 5) * 100}%` }}
                    />
                </div>
                <span className={`text-xs font-medium ${strengthInfo.textColor}`}>
                    {strengthInfo.text}
                </span>
            </div>

            {/* Lista de requisitos */}
            {showRequirements && (
                <div className="grid grid-cols-2 gap-1 text-xs">
                    <div className={`flex items-center gap-1.5 ${checks.length ? 'text-green-600' : 'text-gray-400'}`}>
                        {checks.length ? <CheckIcon /> : <XIcon />}
                        <span>Mínimo 10 caracteres</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${checks.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
                        {checks.uppercase ? <CheckIcon /> : <XIcon />}
                        <span>Una mayúscula (A-Z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${checks.lowercase ? 'text-green-600' : 'text-gray-400'}`}>
                        {checks.lowercase ? <CheckIcon /> : <XIcon />}
                        <span>Una minúscula (a-z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${checks.number ? 'text-green-600' : 'text-gray-400'}`}>
                        {checks.number ? <CheckIcon /> : <XIcon />}
                        <span>Un número (0-9)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${checks.symbol ? 'text-green-600' : 'text-gray-400'}`}>
                        {checks.symbol ? <CheckIcon /> : <XIcon />}
                        <span>Un símbolo (@$!%*?&)</span>
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * Hook para validar contraseña según RF-SEG-01
 */
export const usePasswordValidation = (password) => {
    const checks = {
        length: password.length >= 10,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        symbol: /[@$!%*?&]/.test(password)
    };

    const isValid = Object.values(checks).every(Boolean);
    const strength = Object.values(checks).filter(Boolean).length;

    return { isValid, strength, checks };
};

/**
 * Función para validar contraseña (uso en formularios)
 */
export const validatePassword = (password) => {
    if (!password) return 'La contraseña es requerida';
    if (password.length < 10) return 'Mínimo 10 caracteres';
    if (!/[A-Z]/.test(password)) return 'Debe contener al menos 1 mayúscula';
    if (!/[a-z]/.test(password)) return 'Debe contener al menos 1 minúscula';
    if (!/[0-9]/.test(password)) return 'Debe contener al menos 1 número';
    if (!/[@$!%*?&]/.test(password)) return 'Debe contener al menos 1 símbolo (@$!%*?&)';
    return null;
};

export default PasswordStrengthIndicator;
