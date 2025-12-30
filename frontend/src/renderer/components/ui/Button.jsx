import React from 'react';

/**
 * Componente Button reutilizable
 * 
 * @param {string} variant - Variante del botón: 'primary' | 'secondary'
 * @param {boolean} loading - Estado de carga
 * @param {boolean} disabled - Deshabilitado
 * @param {string} className - Clases adicionales
 * @param {React.ReactNode} children - Contenido del botón
 */
const Button = ({
    variant = 'primary',
    loading = false,
    disabled = false,
    className = '',
    children,
    ...props
}) => {
    const baseStyles = `
        w-full py-3.5 px-6 rounded-xl font-semibold text-base
        transition-all duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-60 disabled:cursor-not-allowed
        flex items-center justify-center gap-2
    `;

    const variants = {
        primary: `
            bg-[#6366F1] text-white
            hover:bg-[#5558E3] active:bg-[#4F46E5]
            focus:ring-[#6366F1]
        `,
        secondary: `
            bg-gray-100 text-gray-700
            hover:bg-gray-200 active:bg-gray-300
            focus:ring-gray-400
        `
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <svg 
                    className="animate-spin h-5 w-5" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                >
                    <circle 
                        className="opacity-25" 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        stroke="currentColor" 
                        strokeWidth="4"
                    />
                    <path 
                        className="opacity-75" 
                        fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
            )}
            {children}
        </button>
    );
};

export default Button;
