import React from 'react';

/**
 * Componente de campo de formulario reutilizable
 * @param {string} label - Etiqueta del campo
 * @param {boolean} required - Si es obligatorio
 * @param {string} hint - Texto de ayuda
 * @param {string} error - Mensaje de error
 * @param {React.ReactNode} children - Input o elemento del formulario
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

export default FormField;
