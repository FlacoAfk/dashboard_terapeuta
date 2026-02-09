import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TherapistLayout from '../../components/layout/TherapistLayout';
import { useAuth } from '../../context/AuthContext';
import patientService from '../../services/patientService';
import vrResultsService from '../../services/vrResultsService';
import Swal from 'sweetalert2';
import { showConfirm, showToast } from '../../utils/alertUtils';
import CrearPacienteModal from '../../components/modals/CrearPacienteModal';
import EditarPacienteModal from '../../components/modals/EditarPacienteModal';

/**
 * Iconos SVG
 */
const Icons = {
    Users: () => (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    Calendar: () => (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    ),
    Chart: () => (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
    ),
    Search: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    ),
    Plus: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
    ),
    Eye: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    ),
    Edit: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
    ),
    Deactivate: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
    ),
    Activate: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    Refresh: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
    )
};

/**
 * Card de estadística
 */
const StatCard = ({ icon: Icon, value, label, color = 'green' }) => {
    const colors = {
        green: 'text-[#2AA87E]',
        blue: 'text-blue-600',
        purple: 'text-purple-600',
        amber: 'text-amber-600'
    };

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg bg-gray-50 ${colors[color]}`}>
                    <Icon />
                </div>
                <div>
                    <p className="text-3xl font-bold text-gray-900">{value}</p>
                    <p className="text-sm text-gray-500">{label}</p>
                </div>
            </div>
        </div>
    );
};

/**
 * Badge de estado
 */
const StatusBadge = ({ activo }) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${activo !== false
        ? 'bg-green-100 text-green-700'
        : 'bg-gray-100 text-gray-600'
        }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${activo !== false ? 'bg-green-500' : 'bg-gray-400'}`}></span>
        {activo !== false ? 'Activo' : 'Inactivo'}
    </span>
);

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
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base'
    };

    const colors = [
        'bg-blue-500', 'bg-green-500', 'bg-purple-500',
        'bg-pink-500', 'bg-amber-500', 'bg-cyan-500'
    ];
    const colorIndex = nombre?.charCodeAt(0) % colors.length || 0;

    return (
        <div className={`${sizes[size]} ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-semibold`}>
            {initials}
        </div>
    );
};

/**
 * Dashboard principal del Terapeuta
 */
const DashboardTerapeuta = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('todos'); // todos, activos, inactivos
    const [stats, setStats] = useState({ activos: 0, hoy: 0, semana: 0, rendimiento: 0 });

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch patients
            const patientsResult = await patientService.getAll();
            if (patientsResult.success) {
                setPatients(patientsResult.data);
            } else {
                setError(patientsResult.error);
            }

            // Fetch patient stats
            const patientStats = await patientService.getStats();

            // Fetch ALL VR sessions in a single request (the backend filters by therapist)
            let sessionsToday = 0;
            let sessionsThisWeek = 0;
            let totalSetsCompleted = 0;
            let totalErrors = 0;

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            weekAgo.setHours(0, 0, 0, 0);

            try {
                const sessionsResult = await vrResultsService.getAllSessions();
                if (sessionsResult.success && sessionsResult.data) {
                    sessionsResult.data.forEach(session => {
                        const sessionDate = new Date(session.started_at || session.started_at_iso);
                        if (sessionDate >= today) sessionsToday++;
                        if (sessionDate >= weekAgo) sessionsThisWeek++;
                        // Use summary fields from the session for performance metrics
                        totalSetsCompleted += session.summary_sets_completed || 0;
                        totalErrors += session.summary_total_errors || 0;
                    });
                }
            } catch (vrErr) {
                console.error('[DashboardTerapeuta] Error cargando sesiones VR:', vrErr);
            }

            // Calculate rendimiento: percentage of sets completed without errors
            const totalEventos = totalSetsCompleted + totalErrors;
            const rendimiento = totalEventos > 0 ? Math.round((totalSetsCompleted / totalEventos) * 100) : 0;

            setStats({
                activos: patientStats.success ? patientStats.data.activos : 0,
                hoy: sessionsToday,
                semana: sessionsThisWeek,
                rendimiento: rendimiento
            });
        } catch (err) {
            setError('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    // Filter patients
    const filteredPatients = patients.filter(p => {
        const matchesSearch = p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.identificacion?.includes(searchTerm);
        const matchesFilter = filter === 'todos' ||
            (filter === 'activos' && p.activo !== false) ||
            (filter === 'inactivos' && p.activo === false);
        return matchesSearch && matchesFilter;
    });

    const handleViewPatient = (patient) => {
        navigate(`/terapeuta/paciente/${patient.id}`);
    };

    const handleEditPatient = (patient) => {
        setSelectedPatient(patient);
        setShowEditModal(true);
    };

    const handleToggleStatus = async (patient) => {
        const action = patient.activo !== false ? 'desactivar' : 'activar';
        const confirmed = await showConfirm(
            `¿${action.charAt(0).toUpperCase() + action.slice(1)} paciente?`,
            `Estás a punto de ${action} al paciente ${patient.nombre}.`,
            `Sí, ${action}`
        );

        if (!confirmed) return;

        try {
            const result = await patientService.toggleStatus(patient.id, patient.activo);
            if (result.success) {
                showToast('success', `Paciente ${action === 'activar' ? 'activado' : 'desactivado'} correctamente`);
                fetchData(); // Refresh
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: result.error || 'No se pudo cambiar el estado'
                });
            }
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Ha ocurrido un error inesperado'
            });
        }
    };

    return (
        <TherapistLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-xl lg:text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="text-2xl">👋</span>
                        <span className="truncate">Bienvenido, {user?.nombre || 'Dr. Terapeuta'}</span>
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm lg:text-base">
                        Aquí tienes un resumen de tu actividad reciente.
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        icon={Icons.Users}
                        value={stats.activos}
                        label="Pacientes Activos"
                        color="green"
                    />
                    <StatCard
                        icon={Icons.Calendar}
                        value={stats.hoy}
                        label="Sesiones Hoy"
                        color="blue"
                    />
                    <StatCard
                        icon={Icons.Calendar}
                        value={stats.semana}
                        label="Sesiones Esta Sem."
                        color="purple"
                    />
                    <StatCard
                        icon={Icons.Chart}
                        value={`${stats.rendimiento}%`}
                        label="Rendimiento Promedio"
                        color="amber"
                    />
                </div>

                {/* Patients Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="p-4 lg:p-6 border-b border-gray-200">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                            <h2 className="text-lg font-semibold text-gray-900">MIS PACIENTES</h2>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                                {/* Search */}
                                <div className="relative flex-1 sm:flex-none">
                                    <input
                                        type="text"
                                        placeholder="Buscar..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2AA87E]/20 focus:border-[#2AA87E] w-full sm:w-48"
                                    />
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <Icons.Search />
                                    </div>
                                </div>

                                {/* New Patient Button */}
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="flex items-center justify-center gap-2 bg-[#2AA87E] hover:bg-[#239469] text-white font-medium px-4 py-2 rounded-lg transition-colors"
                                >
                                    <Icons.Plus />
                                    <span className="hidden sm:inline">Nuevo Paciente</span>
                                    <span className="sm:hidden">Nuevo</span>
                                </button>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-4 items-start sm:items-center justify-between">
                            <div className="flex flex-wrap gap-2 sm:gap-4 items-center">
                                <label className="text-sm text-gray-500">Filtros:</label>
                                {['todos', 'activos', 'inactivos'].map((f) => (
                                    <label key={f} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="filter"
                                            checked={filter === f}
                                            onChange={() => setFilter(f)}
                                            className="text-[#2AA87E] focus:ring-[#2AA87E]"
                                        />
                                        <span className="text-sm text-gray-700 capitalize">{f}</span>
                                    </label>
                                ))}
                            </div>

                            {/* Refresh Button */}
                            <button
                                onClick={fetchData}
                                disabled={loading}
                                className="p-2 text-gray-500 hover:text-[#2AA87E] hover:bg-[#2AA87E]/10 rounded-lg transition-colors"
                                title="Recargar datos"
                            >
                                <Icons.Refresh />
                            </button>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 border-b border-red-100">
                            {error}
                        </div>
                    )}

                    {/* Loading */}
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#2AA87E] border-t-transparent"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        <th className="px-6 py-4">Documento</th>
                                        <th className="px-6 py-4">Nombre</th>
                                        <th className="px-6 py-4">Edad</th>
                                        <th className="px-6 py-4">Diagnóstico</th>
                                        <th className="px-6 py-4">Estado</th>
                                        <th className="px-6 py-4">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredPatients.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                                No se encontraron pacientes
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredPatients.map((patient) => (
                                            <tr key={patient.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar nombre={patient.nombre} />
                                                        <div>
                                                            <p className="font-medium text-gray-900">{patient.identificacion || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    {patient.nombre}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {patient.edad || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {patient.diagnostico || '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <StatusBadge activo={patient.activo} />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleViewPatient(patient)}
                                                            className="p-2 text-gray-500 hover:text-[#2AA87E] hover:bg-[#2AA87E]/10 rounded-lg transition-colors"
                                                            title="Ver paciente"
                                                        >
                                                            <Icons.Eye />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditPatient(patient)}
                                                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Editar paciente"
                                                        >
                                                            <Icons.Edit />
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleStatus(patient)}
                                                            className={`p-2 rounded-lg transition-colors ${patient.activo !== false
                                                                ? 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                                                                : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
                                                                }`}
                                                            title={patient.activo !== false ? 'Desactivar' : 'Activar'}
                                                        >
                                                            {patient.activo !== false ? <Icons.Deactivate /> : <Icons.Activate />}
                                                        </button>

                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showCreateModal && (
                <CrearPacienteModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => { setShowCreateModal(false); fetchData(); }}
                />
            )}
            {showEditModal && selectedPatient && (
                <EditarPacienteModal
                    patient={selectedPatient}
                    onClose={() => { setShowEditModal(false); setSelectedPatient(null); }}
                    onSuccess={() => { setShowEditModal(false); setSelectedPatient(null); fetchData(); }}
                />
            )}
        </TherapistLayout>
    );
};

export default DashboardTerapeuta;
