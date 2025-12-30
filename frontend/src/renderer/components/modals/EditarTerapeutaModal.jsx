import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';

/**
 * Iconos SVG
 */
const Icons = {
    Edit: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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
    Save: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
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
 * Modal para editar terapeuta
 * Cumple con RF-SEG-02: Modificar información de terapeutas
 */
const EditarTerapeutaModal = ({ isOpen, onClose, onSubmit, therapist }) => {
    const [formData, setFormData] = useState({
        usuario: '',
        password: '',
        nombre: '',
        apellido: '',
        correo: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Cargar datos del terapeuta cuando se abre el modal
    useEffect(() => {
        if (therapist && isOpen) {
            // Separar nombre completo en nombre y apellido
            const nombreCompleto = therapist.nombre || '';
            const partes = nombreCompleto.split(' ');
            const nombre = partes[0] || '';
            const apellido = partes.slice(1).join(' ') || '';

            setFormData({
                usuario: therapist.usuario || '',
                password: '',  // No mostramos la contraseña actual
                nombre: nombre,
                apellido: apellido,
                correo: therapist.correo || ''
            });
        }
    }, [therapist, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.usuario) {
            newErrors.usuario = 'El usuario es requerido';
        } else if (!/^[a-z0-9]+$/.test(formData.usuario)) {
            newErrors.usuario = 'Solo letras minúsculas y números';
        }

        // Contraseña es opcional en edición (solo si se quiere cambiar)
        if (formData.password && formData.password.length < 8) {
            newErrors.password = 'Mínimo 8 caracteres';
        } else if (formData.password && !/[A-Z]/.test(formData.password)) {
            newErrors.password = 'Debe contener al menos 1 mayúscula';
        }

        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre es requerido';
        }

        if (!formData.apellido.trim()) {
            newErrors.apellido = 'El apellido es requerido';
        }

        if (!formData.correo) {
            newErrors.correo = 'El correo es requerido';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) {
            newErrors.correo = 'Correo electrónico inválido';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const updateData = {
                id: therapist.id,
                username: formData.usuario,
                nombre: `${formData.nombre} ${formData.apellido}`,
                correo: formData.correo
            };
            
            // Solo incluir password si se cambió
            if (formData.password) {
                updateData.password = formData.password;
            }

            await onSubmit(updateData);
            handleClose();
        } catch (error) {
            setErrors({ submit: error.message || 'Error al actualizar terapeuta' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setFormData({ usuario: '', password: '', nombre: '', apellido: '', correo: '' });
        setErrors({});
        setShowPassword(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="md">
            <Modal.Header onClose={handleClose} icon={Icons.Edit} iconBg="bg-orange-500">
                Editar Terapeuta
            </Modal.Header>

            <form onSubmit={handleSubmit}>
                <Modal.Body>
                    <div className="space-y-5">
                        <p className="text-sm text-gray-600 font-medium">
                            Información del Terapeuta
                        </p>

                        {/* Usuario */}
                        <FormField 
                            label="Usuario" 
                            required 
                            hint="Solo letras minúsculas y números"
                            error={errors.usuario}
                        >
                            <input
                                type="text"
                                name="usuario"
                                value={formData.usuario}
                                onChange={handleChange}
                                placeholder="jperez"
                                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors ${
                                    errors.usuario ? 'border-red-300' : 'border-gray-300'
                                }`}
                            />
                        </FormField>

                        {/* Contraseña */}
                        <FormField 
                            label="Contraseña" 
                            required 
                            hint="Mín. 1 mayúscula y 8 dígitos (dejar vacío para mantener actual)"
                            error={errors.password}
                        >
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="P@ssw0rd123"
                                    className={`w-full px-4 py-2.5 pr-12 border rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors ${
                                        errors.password ? 'border-red-300' : 'border-gray-300'
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
                        </FormField>

                        {/* Nombre y Apellido */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Nombre" required error={errors.nombre}>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleChange}
                                    placeholder="Juan"
                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors ${
                                        errors.nombre ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                />
                            </FormField>

                            <FormField label="Apellido" required error={errors.apellido}>
                                <input
                                    type="text"
                                    name="apellido"
                                    value={formData.apellido}
                                    onChange={handleChange}
                                    placeholder="Pérez García"
                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors ${
                                        errors.apellido ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                />
                            </FormField>
                        </div>

                        {/* Correo Electrónico */}
                        <FormField label="Correo Electrónico" required error={errors.correo}>
                            <input
                                type="email"
                                name="correo"
                                value={formData.correo}
                                onChange={handleChange}
                                placeholder="juan.perez@mail.com"
                                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors ${
                                    errors.correo ? 'border-red-300' : 'border-gray-300'
                                }`}
                            />
                        </FormField>

                        <p className="text-xs text-gray-400">* Campos obligatorios</p>

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
                        disabled={isSubmitting}
                        className="flex items-center gap-2 bg-[#F76C6C] hover:bg-[#E55A5A] disabled:bg-gray-300 text-white font-medium px-5 py-2 rounded-lg transition-colors"
                    >
                        {isSubmitting ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Icons.Save />
                        )}
                        Guardar
                    </button>
                </Modal.Footer>
            </form>
        </Modal>
    );
};

export default EditarTerapeutaModal;
