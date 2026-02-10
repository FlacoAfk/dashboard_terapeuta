import React, { useState } from 'react';
import Modal from '../ui/Modal';
import PasswordStrengthIndicator, { validatePassword } from '../ui/PasswordStrengthIndicator';
import { Icons } from '../ui/Icons';
import FormField from '../ui/FormField';

/**
 * Modal para crear nuevo terapeuta
 * Cumple con RF-SEG-02: Crear credenciales de nuevos terapeutas
 * El login es solo por correo electrónico + contraseña
 */
const CrearTerapeutaModal = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        password: '',
        nombre: '',
        apellido: '',
        correo: '',
        username: '',
        especialidad: '',
        telefono: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Limpiar error del campo cuando se modifica
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Correo electrónico (ahora es el identificador principal)
        if (!formData.correo) {
            newErrors.correo = 'El correo es requerido';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) {
            newErrors.correo = 'Correo electrónico inválido';
        }

        // Contraseña: usar validación robusta (RF-SEG-01)
        const passwordError = validatePassword(formData.password);
        if (passwordError) {
            newErrors.password = passwordError;
        }

        // Nombre
        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre es requerido';
        }

        // Apellido
        if (!formData.apellido.trim()) {
            newErrors.apellido = 'El apellido es requerido';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            await onSubmit({
                nombre: `${formData.nombre} ${formData.apellido}`,
                correo: formData.correo,
                username: formData.username,
                password: formData.password,
                especialidad: formData.especialidad || 'General',
                telefono: formData.telefono || null
            });
            handleClose();
        } catch (error) {
            setErrors({ submit: error.message || 'Error al crear terapeuta' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setFormData({ password: '', nombre: '', apellido: '', correo: '', username: '', especialidad: '', telefono: '' });
        setErrors({});
        setShowPassword(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="md">
            <Modal.Header onClose={handleClose} icon={Icons.User} iconBg="bg-teal-500">
                Crear Nuevo Terapeuta
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
                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors ${errors.nombre ? 'border-red-300' : 'border-gray-300'
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
                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors ${errors.apellido ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                />
                            </FormField>
                        </div>

                        {/* Correo Electrónico - Ahora es el campo principal de login */}
                        <FormField
                            label="Correo Electrónico"
                            required
                            hint="Este será el identificador para iniciar sesión"
                            error={errors.correo}
                        >
                            <input
                                type="email"
                                name="correo"
                                value={formData.correo}
                                onChange={handleChange}
                                placeholder="juan.perez@clinica.com"
                                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors ${errors.correo ? 'border-red-300' : 'border-gray-300'
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
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                                />
                            </FormField>

                            <FormField label="Teléfono" hint="Opcional">
                                <input
                                    type="tel"
                                    name="telefono"
                                    value={formData.telefono}
                                    onChange={handleChange}
                                    placeholder="3001234567"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                                />
                            </FormField>
                        </div>

                        {/* Contraseña */}
                        <FormField
                            label="Contraseña"
                            required
                            hint="Mín. 10 caracteres, mayúsculas, minúsculas, números y símbolos"
                            error={errors.password}
                        >
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className={`w-full px-4 py-2.5 pr-12 border rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors ${errors.password ? 'border-red-300' : 'border-gray-300'
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
                            <PasswordStrengthIndicator password={formData.password} showRequirements={true} />
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
                            <Icons.Check />
                        )}
                        Crear
                    </button>
                </Modal.Footer>
            </form>
        </Modal>
    );
};

export default CrearTerapeutaModal;
