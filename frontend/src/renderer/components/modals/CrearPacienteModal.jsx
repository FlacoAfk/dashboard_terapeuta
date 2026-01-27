import React, { useState } from 'react';
import patientService from '../../services/patientService';
import { showToast } from '../../utils/alertUtils';
import Swal from 'sweetalert2';

const CrearPacienteModal = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        identificacion: '',
        nombre: '',
        apellido: '',
        edad: '',
        condicion: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.nombre || !formData.identificacion) {
            setError('Nombre y documento son requeridos');
            return;
        }

        setLoading(true);
        try {
            const result = await patientService.create(formData);
            if (result.success) {
                // Confirmación visual
                showToast('success', 'Paciente registrado exitosamente');
                onSuccess();
            } else {
                setError(result.error || 'Error al crear paciente');
            }
        } catch (err) {
            setError('Error al crear paciente');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden transform transition-all">
                {/* Header */}
                <div className="bg-teal-600 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        Nuevo Paciente
                    </h2>
                    <button 
                        onClick={onClose} 
                        className="text-white/80 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Identificación */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Documento de Identidad <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.identificacion}
                            onChange={(e) => setFormData({ ...formData, identificacion: e.target.value })}
                            placeholder="Ej. 1001234567"
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
                                placeholder="Ej. Ana"
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
                                placeholder="Ej. López"
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
                            placeholder="Ej. 45"
                            min="1"
                            max="120"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-shadow outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">Edad del paciente en años (1-120)</p>
                    </div>

                    {/* Diagnóstico */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Diagnóstico / Condición <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={formData.condicion}
                            onChange={(e) => setFormData({ ...formData, condicion: e.target.value })}
                            placeholder="Describa el diagnóstico clínico..."
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

                    {/* Footer - Actions */}
                    <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors font-medium border border-gray-200"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-all shadow-sm shadow-teal-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Creando...
                                </>
                            ) : (
                                <>
                                    Crear Paciente
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CrearPacienteModal;
