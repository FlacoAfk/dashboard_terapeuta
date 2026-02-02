import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TherapistLayout from '../../components/layout/TherapistLayout';
import patientService from '../../services/patientService';
import vrResultsService from '../../services/vrResultsService';
import VRSessionCard from '../../components/ui/VRSessionCard';
import EditarPacienteModal from '../../components/modals/EditarPacienteModal';

/**
 * Iconos SVG
 */
const Icons = {
    Back: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
    ),
    Edit: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
    ),
    ChevronLeft: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
    ),
    ChevronRight: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
    ),
    VR: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
    )
};

/**
 * Avatar con iniciales
 */
const Avatar = ({ nombre, size = 'lg' }) => {
    const initials = nombre
        ?.split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || '?';

    const sizes = {
        md: 'w-12 h-12 text-lg',
        lg: 'w-16 h-16 text-xl'
    };

    return (
        <div className={`${sizes[size]} bg-[#2AA87E] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
            {initials}
        </div>
    );
};

/**
 * Vista de detalle de paciente con historial de sesiones VR
 */
const DetallePaciente = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [vrSessions, setVrSessions] = useState([]);
    const [vrLoading, setVrLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [showEditModal, setShowEditModal] = useState(false);
    const sessionsPerPage = 10;

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const patientResult = await patientService.getById(id);
            if (!patientResult.success) {
                setError(patientResult.error || 'Error al cargar paciente');
                return;
            }
            setPatient(patientResult.data);
            fetchVRSessions(patientResult.data);
        } catch (err) {
            setError('Error al cargar datos del paciente');
        } finally {
            setLoading(false);
        }
    };

    const fetchVRSessions = async (patientData) => {
        setVrLoading(true);
        try {
            const participantId = patientData.identificacion || `PAC_${patientData.id}`;
            const result = await vrResultsService.getSessionsByParticipant(participantId);
            if (result.success && result.data) {
                const sessionsWithDetails = await Promise.all(
                    result.data.map(async (session) => {
                        try {
                            const detail = await vrResultsService.getSessionById(session.id);
                            return detail.success ? detail.data : session;
                        } catch {
                            return session;
                        }
                    })
                );
                setVrSessions(sessionsWithDetails);
            }
        } catch (err) {
            console.error('Error cargando sesiones VR:', err);
        } finally {
            setVrLoading(false);
        }
    };

    const handleEditSuccess = () => {
        setShowEditModal(false);
        fetchData(); // Recargar datos del paciente
    };

    const totalPages = Math.ceil(vrSessions.length / sessionsPerPage);
    const paginatedVrSessions = vrSessions.slice(
        (currentPage - 1) * sessionsPerPage,
        currentPage * sessionsPerPage
    );

    if (loading) {
        return (
            <TherapistLayout>
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#2AA87E] border-t-transparent"></div>
                </div>
            </TherapistLayout>
        );
    }

    if (error || !patient) {
        return (
            <TherapistLayout>
                <div className="bg-red-50 text-red-600 p-6 rounded-xl">
                    {error || 'Paciente no encontrado'}
                </div>
                <button
                    onClick={() => navigate('/terapeuta')}
                    className="mt-4 text-[#2AA87E] hover:underline flex items-center gap-2"
                >
                    <Icons.Back /> Volver al Dashboard
                </button>
            </TherapistLayout>
        );
    }

    return (
        <TherapistLayout>
            <div className="space-y-6">
                {/* Back link */}
                <button
                    onClick={() => navigate('/terapeuta')}
                    className="flex items-center gap-2 text-gray-500 hover:text-[#2AA87E] transition-colors"
                >
                    <Icons.Back />
                    <span>Volver al Dashboard</span>
                </button>

                {/* Patient Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6 overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                            <Avatar nombre={patient.nombre} />
                            <div className="min-w-0 flex-1">
                                <h1 className="text-xl lg:text-2xl font-bold text-gray-900 truncate" title={patient.nombre}>
                                    {patient.nombre}
                                </h1>
                                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-500 mt-1">
                                    <span className="truncate">📋 Doc: {patient.identificacion || 'N/A'}</span>
                                    <span>📅 {patient.edad || '-'} años</span>
                                </div>
                                {patient.diagnostico && (
                                    <span className="inline-block mt-2 px-3 py-1 bg-[#2AA87E]/10 text-[#2AA87E] rounded-full text-sm font-medium truncate max-w-full" title={patient.diagnostico}>
                                        {patient.diagnostico}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="flex items-center gap-2 text-gray-500 hover:text-[#2AA87E] transition-colors text-sm whitespace-nowrap flex-shrink-0 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-lg"
                        >
                            <Icons.Edit />
                            <span className="hidden sm:inline">Editar Paciente</span>
                            <span className="sm:hidden">Editar</span>
                        </button>
                    </div>
                </div>

                {/* Sessions History - Solo VR */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <Icons.VR />
                            <h2 className="text-lg font-semibold text-gray-900">
                                Historial de Sesiones VR ({vrSessions.length})
                            </h2>
                        </div>
                    </div>

                    {/* VR Sessions Content */}
                    <div className="p-4 lg:p-6">
                        {vrLoading ? (
                            <div className="py-12 text-center">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#2AA87E] border-t-transparent"></div>
                                <p className="mt-2 text-gray-500">Cargando sesiones del videojuego...</p>
                            </div>
                        ) : vrSessions.length === 0 ? (
                            <div className="py-12 text-center text-gray-500">
                                <div className="text-4xl mb-3">🎮</div>
                                <p>No hay sesiones del videojuego VR registradas para este paciente.</p>
                                <p className="text-sm mt-1">Las sesiones aparecerán aquí cuando el paciente complete actividades en el juego.</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    {paginatedVrSessions.map((vrSession) => (
                                        <VRSessionCard
                                            key={vrSession.id}
                                            session={vrSession}
                                        />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-center gap-2 flex-wrap">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
                                        >
                                            <Icons.ChevronLeft />
                                        </button>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`w-10 h-10 rounded-lg font-medium transition-colors ${currentPage === page
                                                        ? 'bg-[#2AA87E] text-white'
                                                        : 'hover:bg-gray-100 text-gray-700'
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
                                        >
                                            <Icons.ChevronRight />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de edición */}
            {showEditModal && (
                <EditarPacienteModal
                    patient={patient}
                    onClose={() => setShowEditModal(false)}
                    onSuccess={handleEditSuccess}
                />
            )}
        </TherapistLayout>
    );
};

export default DetallePaciente;

