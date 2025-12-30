import React from 'react';

/**
 * Componente Logo VR
 * Ícono de gafas VR para el sistema clínico
 * 
 * @param {string} size - Tamaño: 'sm' | 'md' | 'lg'
 * @param {string} className - Clases adicionales
 */
const Logo = ({ size = 'md', className = '' }) => {
    const sizes = {
        sm: 'w-10 h-10',
        md: 'w-14 h-14',
        lg: 'w-20 h-20'
    };

    return (
        <div 
            className={`
                ${sizes[size]} 
                bg-[#6366F1] rounded-xl 
                flex items-center justify-center
                shadow-lg shadow-[#6366F1]/30
                ${className}
            `}
        >
            {/* Ícono de gafas VR */}
            <svg 
                className="w-2/3 h-2/3 text-white" 
                viewBox="0 0 24 24" 
                fill="currentColor"
            >
                {/* Diseño simplificado de gafas VR similar al mockup */}
                <path d="M20.5 10.5c-.83 0-1.5.67-1.5 1.5v2c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-2c0-.83-.67-1.5-1.5-1.5z"/>
                <path d="M3.5 10.5c-.83 0-1.5.67-1.5 1.5v2c0 .83.67 1.5 1.5 1.5S5 14.83 5 14v-2c0-.83-.67-1.5-1.5-1.5z"/>
                <path d="M21 8H3c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h7l1-2h2l1 2h7c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2zm-13 5.5c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm8 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
            </svg>
        </div>
    );
};

export default Logo;
