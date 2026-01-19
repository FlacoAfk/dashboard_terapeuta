import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TherapistLayout from '../../components/layout/TherapistLayout';
import patientService from '../../services/patientService';
import sessionService from '../../services/sessionService';

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
    Clock: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    Calendar: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
    ),
    Close: () => (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
        <div className={`${sizes[size]} bg-[#2AA87E] rounded-full flex items-center justify-center text-white font-bold`}>
            {initials}
        </div>
    );
};

/**
 * Badge de dificultad
 */
const DificultadBadge = ({ nivel }) => {
    const { label, color } = sessionService.formatDificultad(nivel);
    const colors = {
        green: 'bg-green-100 text-green-700',
        amber: 'bg-amber-100 text-amber-700',
        red: 'bg-red-100 text-red-700',
        gray: 'bg-gray-100 text-gray-600'
    };

    return (
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[color]}`}>
            {label}
        </span>
    );
};

/**
 * Badge de rendimiento
 */
const RendimientoBadge = ({ session }) => {
    const { label, color } = sessionService.calculateRendimiento(session);
    const colors = {
        green: 'text-green-600',
        emerald: 'text-emerald-600',
        amber: 'text-amber-600',
        orange: 'text-orange-600',
        red: 'text-red-600',
        gray: 'text-gray-500'
    };

    return (
        <span className={`font-medium ${colors[color]}`}>
            {label} →
        </span>
    );
};

/**
 * Modal de detalle de sesión
 */
const DetallesSesionModal = ({ session, patient, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [sessionDetail, setSessionDetail] = useState(null);

    useEffect(() => {
        fetchSessionDetail();
    }, [session.id]);

    const fetchSessionDetail = async () => {
        setLoading(true);
        try {
            const result = await sessionService.getById(session.id);
            if (result.success) {
                setSessionDetail(result.data);
            }
        } catch (err) {
            console.error('Error loading session detail:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('es-CO', {
            weekday: 'long',
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
                    <div className="flex items-center gap-3">
                        <Icons.VR />
                        <h2 className="text-xl font-semibold text-gray-900">Detalle de Sesión VR</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1"
                    >
                        <Icons.Close />
                    </button>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="py-12 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#2AA87E] border-t-transparent"></div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Patient Info */}
                            <div>
                                <p className="font-semibold text-gray-900">{patient.nombre}</p>
                                <p className="text-sm text-gray-500 flex items-center gap-2">
                                    <Icons.Calendar />
                                    {formatDate(session.fecha_inicio)}
                                    <Icons.Clock />
                                    {formatTime(session.fecha_inicio)} - {session.fecha_fin ? formatTime(session.fecha_fin) : 'En curso'}
                                </p>
                            </div>

                            {/* General Info */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                                    INFORMACIÓN GENERAL
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500">Dificultad</p>
                                        <DificultadBadge nivel={session.nivel_dificultad} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Duración Total</p>
                                        <p className="font-semibold text-gray-900">
                                            {sessionService.formatTiempo(session.tiempo_total_seg)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Activity Info */}
                            {session.actividad_nombre && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                                        ACTIVIDAD
                                    </h3>
                                    <p className="font-medium text-gray-900">{session.actividad_nombre}</p>
                                </div>
                            )}

                            {/* Errors Section */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                                    ERRORES COMETIDOS
                                </h3>
                                <div className="bg-red-50 rounded-lg p-4">
                                    <p className="text-red-700 font-semibold flex items-center gap-2">
                                        <span className="text-red-500">⊘</span>
                                        Total de errores: {session.total_errores || 0}
                                    </p>
                                </div>
                            </div>

                            {/* Results */}
                            <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-lg p-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">{session.total_aciertos || 0}</p>
                                    <p className="text-xs text-gray-500">Aciertos</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-red-600">{session.total_errores || 0}</p>
                                    <p className="text-xs text-gray-500">Errores</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-amber-600">{session.total_omisiones || 0}</p>
                                    <p className="text-xs text-gray-500">Omisiones</p>
                                </div>
                            </div>

                            {/* Observations */}
                            {session.observaciones && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                                        OBSERVACIONES
                                    </h3>
                                    <p className="text-gray-700 bg-blue-50 rounded-lg p-4">
                                        {session.observaciones}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

/**
 * Vista de detalle de paciente con historial de sesiones
 */
const DetallePaciente = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedSession, setSelectedSession] = useState(null);
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
            // Fetch patient
            const patientResult = await patientService.getById(id);
            if (!patientResult.success) {
                setError(patientResult.error || 'Error al cargar paciente');
                return;
            }
            setPatient(patientResult.data);

            // Fetch sessions
            const sessionsResult = await sessionService.getByPatient(id);
            if (sessionsResult.success) {
                setSessions(sessionsResult.data);
            }
        } catch (err) {
            setError('Error al cargar datos del paciente');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const options = { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' };
        return date.toLocaleDateString('es-CO', options);
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    // Pagination
    const totalPages = Math.ceil(sessions.length / sessionsPerPage);
    const paginatedSessions = sessions.slice(
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <Avatar nombre={patient.nombre} />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{patient.nombre}</h1>
                                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                    <span>📋 Doc: {patient.identificacion || 'N/A'}</span>
                                    <span>📅 {patient.edad || '-'} años</span>
                                </div>
                                {patient.diagnostico && (
                                    <span className="inline-block mt-2 px-3 py-1 bg-[#2AA87E]/10 text-[#2AA87E] rounded-full text-sm font-medium">
                                        {patient.diagnostico}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => {/* TODO: Edit modal */ }}
                            className="flex items-center gap-2 text-gray-500 hover:text-[#2AA87E] transition-colors"
                        >
                            <Icons.Edit />
                            Editar Paciente
                        </button>
                    </div>
                </div>

                {/* Sessions History */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Icons.VR />
                            <h2 className="text-lg font-semibold text-gray-900">Historial de Sesiones VR</h2>
                        </div>
                        <span className="text-sm text-gray-500">
                            Total sesiones: {sessions.length}
                        </span>
                    </div>

                    {sessions.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            Este paciente aún no tiene sesiones registradas.
                        </div>
                    ) : (
                        <>
                            <div className="divide-y divide-gray-100">
                                {paginatedSessions.map((session) => (
                                    <div key={session.id} className="p-6 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className={`w-2 h-2 rounded-full ${session.estado === 'COMPLETADA' ? 'bg-green-500' :
                                                            session.estado === 'INICIADA' ? 'bg-amber-500' : 'bg-gray-400'
                                                        }`}></span>
                                                    <span className="font-semibold text-gray-900">
                                                        {formatDate(session.fecha_inicio)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                                                    <Icons.Clock />
                                                    {formatTime(session.fecha_inicio)}
                                                </div>
                                                <div className="grid grid-cols-4 gap-6 text-sm">
                                                    <div>
                                                        <p className="text-gray-500 uppercase text-xs tracking-wider mb-1">Dificultad</p>
                                                        <DificultadBadge nivel={session.nivel_dificultad} />
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 uppercase text-xs tracking-wider mb-1">Errores</p>
                                                        <p className="font-semibold text-gray-900">{session.total_errores || 0}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 uppercase text-xs tracking-wider mb-1">Tiempo Total</p>
                                                        <p className="font-semibold text-gray-900">
                                                            {sessionService.formatTiempo(session.tiempo_total_seg)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 uppercase text-xs tracking-wider mb-1">Rendimiento</p>
                                                        <RendimientoBadge session={session} />
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setSelectedSession(session)}
                                                className="text-[#2AA87E] hover:text-[#239469] font-medium text-sm flex items-center gap-1 whitespace-nowrap"
                                            >
                                                Ver Detalle Completo
                                                <Icons.ChevronRight />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="p-4 border-t border-gray-200 flex items-center justify-center gap-2">
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

            {/* Session Detail Modal */}
            {selectedSession && (
                <DetallesSesionModal
                    session={selectedSession}
                    patient={patient}
                    onClose={() => setSelectedSession(null)}
                />
            )}
        </TherapistLayout>
    );
};

export default DetallePaciente;
