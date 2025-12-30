import React from 'react';

/**
 * Componente Modal base reutilizable
 */
const Modal = ({ isOpen, onClose, children, size = 'md' }) => {
    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl'
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div 
                className="absolute inset-0 bg-black/50 transition-opacity"
                onClick={onClose}
            />
            
            {/* Modal Content */}
            <div className={`relative bg-white rounded-xl shadow-2xl w-full mx-4 ${sizeClasses[size]} max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200`}>
                {children}
            </div>
        </div>
    );
};

/**
 * Header del Modal
 */
Modal.Header = ({ children, onClose, icon: Icon, iconBg = 'bg-[#F76C6C]' }) => (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
            {Icon && (
                <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center text-white`}>
                    <Icon />
                </div>
            )}
            <h2 className="text-lg font-semibold text-gray-900">{children}</h2>
        </div>
        <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
        >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
    </div>
);

/**
 * Body del Modal con scroll
 */
Modal.Body = ({ children, className = '' }) => (
    <div className={`flex-1 overflow-y-auto px-6 py-4 ${className}`}>
        {children}
    </div>
);

/**
 * Footer del Modal
 */
Modal.Footer = ({ children }) => (
    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
        {children}
    </div>
);

export default Modal;
