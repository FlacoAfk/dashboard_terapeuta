import React, { useState } from 'react';
import Modal from '../ui/Modal';
import patientService from '../../services/patientService';
import { showConfirm, showToast } from '../../utils/alertUtils';
import { Icons } from '../ui/Icons';

const EditarPacienteModal = ({ patient, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        identificacion: patient.identificacion || '',
        nombre: patient.nombre?.split(' ')[0] || '',
        apellido: patient.nombre?.split(' ').slice(1).join(' ') || '',
        edad: patient.edad || '',
        condicion: patient.diagnostico || ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Confirmación antes de guardar cambios
        const confirmed = await showConfirm(
            '¿Guardar cambios?',
            `Estás a punto de modificar los datos del paciente ${patient.nombre}.`,
            'Sí, guardar cambios'
        );

        if (!confirmed) return;

        setLoading(true);
        try {
            const result = await patientService.update(patient.id, formData);
            if (result.success) {
                showToast('success', 'Datos del paciente actualizados');
                onClose();
                onSuccess();
            } else {
                setError(result.error || 'Error al actualizar paciente');
            }
        } catch (err) {
            setError('Error al actualizar paciente');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} size="lg">
            <Modal.Header onClose={onClose} icon={Icons.Edit} iconBg="bg-teal-600">
                Editar Paciente
            </Modal.Header>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <Modal.Body>
                    <div className="space-y-4">
                        {/* Identificación */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Documento de Identidad <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.identificacion}
                                onChange={(e) => setFormData({ ...formData, identificacion: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-shadow outline-none"
                            />
                        </div>

                        {/* Nombre y Apellido */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-shadow outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Apellido
                                </label>
                                <input
                                    type="text"
                                    value={formData.apellido}
                                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-shadow outline-none"
                                />
                            </div>
                        </div>

                        {/* Edad */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Edad <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                value={formData.edad}
                                onChange={(e) => setFormData({ ...formData, edad: e.target.value })}
                                min="1"
                                max="120"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-shadow outline-none"
                            />
                        </div>

                        {/* Diagnóstico */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Diagnóstico / Condición <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={formData.condicion}
                                onChange={(e) => setFormData({ ...formData, condicion: e.target.value })}
                                rows={3}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-shadow outline-none resize-none"
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 animate-in fade-in slide-in-from-top-1">
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {error}
                            </div>
                        )}
                    </div>
                </Modal.Body>

                <Modal.Footer>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-5 py-2 rounded-lg transition-colors"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Icons.Save />
                                Guardar Cambios
                            </>
                        )}
                    </button>
                </Modal.Footer>
            </form>
        </Modal>
    );
};

export default EditarPacienteModal;
