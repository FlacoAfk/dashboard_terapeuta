import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { Icons } from '../ui/Icons';
import FormField from '../ui/FormField';

/**
 * Modal para editar terapeuta
 * Cumple con RF-SEG-02: Modificar información de terapeutas
 */
const EditarTerapeutaModal = ({ isOpen, onClose, onSubmit, therapist }) => {
    const [formData, setFormData] = useState({
        password: '',
        nombre: '',
        apellido: '',
        correo: '',
        especialidad: '',
        telefono: ''
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
                password: '',  // No mostramos la contraseña actual
                nombre: nombre,
                apellido: apellido,
                correo: therapist.correo || '',
                especialidad: therapist.especialidad || '',
                telefono: therapist.telefono || ''
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

        // Contraseña es opcional en edición (solo si se quiere cambiar)
        if (formData.password && formData.password.length < 10) {
            newErrors.password = 'Mínimo 10 caracteres';
        } else if (formData.password && !/[A-Z]/.test(formData.password)) {
            newErrors.password = 'Debe contener al menos 1 mayúscula';
        } else if (formData.password && !/[a-z]/.test(formData.password)) {
            newErrors.password = 'Debe contener al menos 1 minúscula';
        } else if (formData.password && !/\d/.test(formData.password)) {
            newErrors.password = 'Debe contener al menos 1 número';
        } else if (formData.password && !/[@$!%*?&]/.test(formData.password)) {
            newErrors.password = 'Debe contener al menos 1 símbolo (@$!%*?&)';
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
                // username se elimina o se usa el correo si el backend lo requiere, pero aquí la solicitud original de 'tal cual' sugiere UX visual.
                // En el backend anterior vimos que 'username' se usaba para 'usuario'.
                // Si el backend espera 'username', podemos enviar el correo también.
                // Asumiremos que el backend maneja actualización sin 'username' explícito o que el correo funge como tal.
                nombre: `${formData.nombre} ${formData.apellido}`,
                correo: formData.correo,
                especialidad: formData.especialidad,
                telefono: formData.telefono
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
        setFormData({ password: '', nombre: '', apellido: '', correo: '', especialidad: '', telefono: '' });
        setErrors({});
        setShowPassword(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="md">
            <Modal.Header onClose={handleClose} icon={Icons.Edit} iconBg="bg-orange-500">
                Editar Terapeuta
            </Modal.Header>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <Modal.Body>
                    <div className="space-y-5">
                        <p className="text-sm text-gray-600 font-medium">
                            Información del Terapeuta
                        </p>

                        {/* Nombre y Apellido en grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Nombre" required error={errors.nombre}>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleChange}
                                    placeholder="Juan"
                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors ${errors.nombre ? 'border-red-300' : 'border-gray-300'
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
                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors ${errors.apellido ? 'border-red-300' : 'border-gray-300'
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
                                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors ${errors.correo ? 'border-red-300' : 'border-gray-300'
                                    }`}
                            />
                        </FormField>

                        {/* Especialidad y Teléfono */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Especialidad" hint="Ej: Neuropsicología">
                                <input
                                    type="text"
                                    name="especialidad"
                                    value={formData.especialidad}
                                    onChange={handleChange}
                                    placeholder="General"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                                />
                            </FormField>

                            <FormField label="Teléfono" hint="Opcional">
                                <input
                                    type="tel"
                                    name="telefono"
                                    value={formData.telefono}
                                    onChange={handleChange}
                                    placeholder="3001234567"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                                />
                            </FormField>
                        </div>


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
