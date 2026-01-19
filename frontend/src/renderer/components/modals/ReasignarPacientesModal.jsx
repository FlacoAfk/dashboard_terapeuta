import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';

/**
 * Iconos SVG
 */
const Icons = {
    Warning: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
    ),
    Search: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    ),
    User: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    ),
    Users: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    ),
    Info: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    Check: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    )
};

/**
 * Checkbox personalizado
 */
const Checkbox = ({ checked, onChange, className = '' }) => (
    <div
        onClick={onChange}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${checked
            ? 'bg-[#F76C6C] border-[#F76C6C] text-white'
            : 'border-gray-300 hover:border-[#F76C6C]'
            } ${className}`}
    >
        {checked && <Icons.Check />}
    </div>
);

/**
 * Radio button personalizado
 */
const RadioButton = ({ checked, onChange, label }) => (
    <label className="flex items-center gap-3 cursor-pointer group" onClick={onChange}>
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${checked
            ? 'border-[#F76C6C]'
            : 'border-gray-300 group-hover:border-[#F76C6C]'
            }`}>
            {checked && (
                <div className="w-2.5 h-2.5 rounded-full bg-[#F76C6C]" />
            )}
        </div>
        <span className="text-sm text-gray-700">{label}</span>
    </label>
);

/**
 * Modal para reasignar pacientes antes de desactivar terapeuta
 * Cumple con RF-SEG-02: No se puede eliminar terapeuta con pacientes activos
 */
const ReasignarPacientesModal = ({
    isOpen,
    onClose,
    onSubmit,
    therapist,
    patients = [],
    availableTherapists = []
}) => {
    const [selectedPatients, setSelectedPatients] = useState([]);
    const [selectedTherapists, setSelectedTherapists] = useState([]);
    const [assignmentType, setAssignmentType] = useState('distribute');
    const [searchTerm, setSearchTerm] = useState('');
    const [manualAssignments, setManualAssignments] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Inicializar con todos los pacientes seleccionados
    useEffect(() => {
        if (isOpen && patients.length > 0) {
            setSelectedPatients(patients.map(p => p.id));
        }
    }, [isOpen, patients]);

    const filteredTherapists = availableTherapists.filter(t =>
        t.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handlePatientToggle = (patientId) => {
        setSelectedPatients(prev =>
            prev.includes(patientId)
                ? prev.filter(id => id !== patientId)
                : [...prev, patientId]
        );
    };

    const handleTherapistToggle = (therapistId) => {
        setSelectedTherapists(prev =>
            prev.includes(therapistId)
                ? prev.filter(id => id !== therapistId)
                : [...prev, therapistId]
        );
    };

    const handleSelectAll = () => {
        setSelectedPatients(patients.map(p => p.id));
    };

    const handleDeselectAll = () => {
        setSelectedPatients([]);
    };

    const handleManualAssignment = (patientId, therapistId) => {
        setManualAssignments(prev => ({
            ...prev,
            [patientId]: therapistId
        }));
    };

    const handleSubmit = async () => {
        if (selectedPatients.length === 0) return;
        if (assignmentType !== 'manual' && selectedTherapists.length === 0) return;

        setIsSubmitting(true);
        try {
            await onSubmit({
                therapistId: therapist.id,
                patients: selectedPatients,
                targetTherapists: selectedTherapists,
                assignmentType,
                manualAssignments: assignmentType === 'manual' ? manualAssignments : null
            });
            handleClose();
        } catch (error) {
            console.error('Error reasignando pacientes:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setSelectedPatients([]);
        setSelectedTherapists([]);
        setAssignmentType('distribute');
        setSearchTerm('');
        setManualAssignments({});
        onClose();
    };

    const canSubmit = selectedPatients.length > 0 &&
        (assignmentType === 'manual'
            ? Object.keys(manualAssignments).length === selectedPatients.length
            : selectedTherapists.length > 0
        );

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="lg">
            <Modal.Header onClose={handleClose} icon={Icons.Warning} iconBg="bg-amber-500">
                Reasignar Pacientes de {therapist?.nombre}
            </Modal.Header>

            <Modal.Body className="space-y-6">
                {/* Warning Alert */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800">
                        Este terapeuta tiene <strong>{patients.length} pacientes</strong> asignados.
                        Debes reasignarlos a otros terapeutas activos antes de proceder con la desactivación.
                    </p>
                </div>

                {/* Pacientes a Reasignar */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Icons.User />
                            <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                Pacientes a Reasignar ({selectedPatients.length}/{patients.length})
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <button
                                onClick={handleSelectAll}
                                className="text-teal-600 hover:text-teal-700 font-medium"
                            >
                                Seleccionar todos
                            </button>
                            <button
                                onClick={handleDeselectAll}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                Deseleccionar
                            </button>
                        </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-48 overflow-y-auto">
                        {patients.map(patient => (
                            <div
                                key={patient.id}
                                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                            >
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        checked={selectedPatients.includes(patient.id)}
                                        onChange={() => handlePatientToggle(patient.id)}
                                    />
                                    <span className="text-sm text-gray-900">
                                        {patient.nombre} <span className="text-gray-400">(ID: {patient.id})</span>
                                    </span>
                                </div>
                                {assignmentType === 'manual' && (
                                    <select
                                        value={manualAssignments[patient.id] || ''}
                                        onChange={(e) => handleManualAssignment(patient.id, e.target.value)}
                                        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-500"
                                    >
                                        <option value="">Manual: Seleccionar..</option>
                                        {availableTherapists.map(t => (
                                            <option key={t.id} value={t.id_terapeuta}>{t.nombre}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Seleccionar Terapeutas Destino */}
                {assignmentType !== 'manual' && (
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Icons.Users />
                            <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                Seleccionar Terapeutas Destino
                            </span>
                        </div>

                        {/* Buscador */}
                        <div className="relative mb-3">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <Icons.Search />
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar terapeuta activo..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F76C6C]/20 focus:border-[#F76C6C] transition-colors"
                            />
                        </div>

                        {/* Lista de terapeutas */}
                        <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-40 overflow-y-auto">
                            {filteredTherapists.map(t => (
                                <div
                                    key={t.id}
                                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                                >
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            checked={selectedTherapists.includes(t.id_terapeuta)}
                                            onChange={() => handleTherapistToggle(t.id_terapeuta)}
                                        />
                                        <span className="text-sm text-gray-900">{t.nombre}</span>
                                    </div>
                                    <span className="text-sm text-gray-400">{t.pacientes} pacientes</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Opciones de Asignación */}
                <div>
                    <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                        Opciones de Asignación
                    </p>
                    <div className="space-y-3">
                        <RadioButton
                            checked={assignmentType === 'distribute'}
                            onChange={() => setAssignmentType('distribute')}
                            label="Distribuir equitativamente entre seleccionados"
                        />
                        <RadioButton
                            checked={assignmentType === 'single'}
                            onChange={() => setAssignmentType('single')}
                            label="Asignar todos a un solo terapeuta"
                        />
                        <RadioButton
                            checked={assignmentType === 'manual'}
                            onChange={() => setAssignmentType('manual')}
                            label="Asignación manual por paciente"
                        />
                    </div>

                    {/* Info box */}
                    <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-start gap-3">
                        <div className="text-gray-400 mt-0.5">
                            <Icons.Info />
                        </div>
                        <p className="text-xs text-gray-500">
                            {assignmentType === 'distribute' &&
                                'La distribución equitativa asignará los pacientes seleccionados balanceando la carga actual de los terapeutas destino seleccionados.'
                            }
                            {assignmentType === 'single' &&
                                'Todos los pacientes serán asignados al terapeuta seleccionado. Selecciona solo un terapeuta destino.'
                            }
                            {assignmentType === 'manual' &&
                                'Selecciona manualmente a qué terapeuta quieres asignar cada paciente usando los selectores de la lista.'
                            }
                        </p>
                    </div>
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
                    onClick={handleSubmit}
                    disabled={!canSubmit || isSubmitting}
                    className="flex items-center gap-2 bg-[#F76C6C] hover:bg-[#E55A5A] disabled:bg-gray-300 text-white font-medium px-5 py-2 rounded-lg transition-colors"
                >
                    {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Icons.Check />
                    )}
                    Reasignar y Desactivar
                </button>
            </Modal.Footer>
        </Modal>
    );
};

export default ReasignarPacientesModal;
