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
    User: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
    ),
    ChevronDown: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
    ),
    ChevronUp: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
    )
};

/**
 * Avatar con iniciales
 */
const Avatar = ({ nombre, size = 'md' }) => {
    const initials = nombre
        ?.split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || '?';

    const sizes = {
        sm: 'w-10 h-10 text-sm',
        md: 'w-12 h-12 text-base',
        lg: 'w-14 h-14 text-lg'
    };

    const colors = [
        'bg-blue-500', 'bg-green-500', 'bg-purple-500',
        'bg-pink-500', 'bg-amber-500', 'bg-cyan-500'
    ];
    const colorIndex = nombre?.charCodeAt(0) % colors.length || 0;

    return (
        <div className={`${sizes[size]} ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>
            {initials}
        </div>
    );
};

/**
 * Fila de paciente expandible con información
 */
const PatientRow = ({ patient, assignment, onAssign, therapists, isExpanded, onExpand }) => {
    const selectedTherapist = therapists.find(t => String(t.id_terapeuta) === String(assignment));
    
    return (
        <div className={`border rounded-lg transition-all ${isExpanded ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
            {/* Fila principal */}
            <div className="flex items-center gap-4 p-4">
                <Avatar nombre={patient.nombre} size="sm" />
                
                {/* Info del paciente */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 text-base">{patient.nombre}</h4>
                        <button
                            onClick={onExpand}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors"
                            title={isExpanded ? "Ocultar detalles" : "Ver detalles"}
                        >
                            {isExpanded ? <Icons.ChevronUp /> : <Icons.ChevronDown />}
                        </button>
                    </div>
                    <p className="text-sm text-gray-500">
                        ID: {patient.identificacion || patient.id}
                        {patient.edad && ` • ${patient.edad} años`}
                    </p>
                </div>
                
                {/* Selector de terapeuta */}
                <div className="flex-shrink-0 w-64">
                    <select
                        value={assignment || ''}
                        onChange={(e) => onAssign(e.target.value)}
                        className={`w-full text-sm border rounded-lg px-4 py-2.5 transition-colors font-medium ${
                            assignment 
                                ? 'border-green-400 bg-green-50 text-green-800' 
                                : 'border-gray-300 text-gray-600 bg-white'
                        }`}
                    >
                        <option value="">Seleccionar terapeuta...</option>
                        {therapists.map(t => (
                            <option key={t.id} value={t.id_terapeuta}>
                                {t.nombre} ({t.pacientes || 0} pacientes)
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            
            {/* Panel expandido con información detallada */}
            {isExpanded && (
                <div className="px-4 pb-4 pt-0">
                    <div className="grid grid-cols-2 gap-6 bg-white rounded-lg border border-gray-200 p-4">
                        {/* Información del paciente */}
                        <div>
                            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                                <Icons.User />
                                Información del Paciente
                            </h5>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Nombre completo:</span>
                                    <span className="font-medium text-gray-900">{patient.nombre}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Identificación:</span>
                                    <span className="font-medium text-gray-900">{patient.identificacion || 'No especificada'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Edad:</span>
                                    <span className="font-medium text-gray-900">{patient.edad ? `${patient.edad} años` : 'No especificada'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Diagnóstico:</span>
                                    <span className="font-medium text-gray-900 text-right max-w-[200px]">
                                        {patient.diagnostico || 'No especificado'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Información del terapeuta seleccionado */}
                        <div>
                            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                                <Icons.User />
                                Terapeuta Destino
                            </h5>
                            {selectedTherapist ? (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Nombre:</span>
                                        <span className="font-medium text-gray-900">{selectedTherapist.nombre}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Especialidad:</span>
                                        <span className="font-medium text-gray-900">{selectedTherapist.especialidad || 'General'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Pacientes actuales:</span>
                                        <span className="font-medium text-gray-900">{selectedTherapist.pacientes || 0}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Email:</span>
                                        <span className="font-medium text-gray-900">{selectedTherapist.correo || selectedTherapist.email || '-'}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-gray-400 italic">
                                    Selecciona un terapeuta para ver su información
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

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
    const [manualAssignments, setManualAssignments] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [expandedPatient, setExpandedPatient] = useState(null);

    // Limpiar al abrir
    useEffect(() => {
        if (isOpen) {
            setExpandedPatient(null);
            setManualAssignments({});
        }
    }, [isOpen]);

    const handleManualAssignment = (patientId, therapistId) => {
        setManualAssignments(prev => ({
            ...prev,
            [patientId]: therapistId
        }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await onSubmit({
                therapistId: therapist.id,
                patients: patients.map(p => p.id),
                targetTherapists: [],
                assignmentType: 'manual',
                manualAssignments: manualAssignments
            });
            handleClose();
        } catch (error) {
            console.error('Error reasignando pacientes:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setManualAssignments({});
        setExpandedPatient(null);
        onClose();
    };

    // Verificar que TODOS los pacientes tengan un terapeuta asignado válido
    const allPatientsAssigned = patients.every(patient => 
        manualAssignments[patient.id] && manualAssignments[patient.id] !== ''
    );

    const canSubmit = allPatientsAssigned;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="2xl">
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

                {/* Lista de pacientes */}
                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
                    {patients.map(patient => (
                        <PatientRow
                            key={patient.id}
                            patient={patient}
                            assignment={manualAssignments[patient.id]}
                            onAssign={(therapistId) => handleManualAssignment(patient.id, therapistId)}
                            therapists={availableTherapists}
                            isExpanded={expandedPatient === patient.id}
                            onExpand={() => setExpandedPatient(expandedPatient === patient.id ? null : patient.id)}
                        />
                    ))}
                </div>

                {/* Info box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                    <div className="text-blue-500 mt-0.5 flex-shrink-0">
                        <Icons.Info />
                    </div>
                    <p className="text-sm text-blue-700">
                        <strong>Tip:</strong> Haz clic en la flecha junto al nombre del paciente para ver información detallada 
                        tanto del paciente como del terapeuta seleccionado.
                    </p>
                </div>
            </Modal.Body>

            <Modal.Footer>
                <button
                    type="button"
                    onClick={handleClose}
                    className="px-5 py-2.5 text-gray-700 hover:text-gray-900 font-medium transition-colors hover:bg-gray-100 rounded-lg"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={!canSubmit || isSubmitting}
                    className="flex items-center gap-2 bg-[#F76C6C] hover:bg-[#E55A5A] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
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
