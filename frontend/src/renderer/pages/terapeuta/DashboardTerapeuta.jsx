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
import { Icons } from '../../components/ui/Icons';

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
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Reset pagination when items per page changes
    useEffect(() => {
        setCurrentPage(1);
    }, [itemsPerPage]);

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

            // Fetch VR sessions filtered by therapist (uses /api/sessions which filters by assigned patients)
            let sessionsToday = 0;
            let sessionsThisWeek = 0;
            let totalSetsCompleted = 0;
            let totalErrors = 0;

            const activePatients = patientStats.success ? patientStats.data.activos : 0;

            // Solo buscar sesiones si el terapeuta tiene pacientes asignados
            if (patientsResult.success && patientsResult.data && patientsResult.data.length > 0) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                weekAgo.setHours(0, 0, 0, 0);

                try {
                    // Usar getDashboardSessions que llama a /api/sessions (filtrado por terapeuta)
                    const sessionsResult = await vrResultsService.getDashboardSessions({ limit: 200 });
                    if (sessionsResult.success && sessionsResult.data) {
                        sessionsResult.data.forEach(session => {
                            const sessionDate = new Date(session.started_at || session.created_at);
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
            }

            // Calculate rendimiento: percentage of sets completed without errors
            const totalEventos = totalSetsCompleted + totalErrors;
            const rendimiento = totalEventos > 0 ? Math.round((totalSetsCompleted / totalEventos) * 100) : 0;

            setStats({
                activos: activePatients,
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

    // Paginación
    const totalPages = Math.ceil(filteredPatients.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedPatients = filteredPatients.slice(startIndex, startIndex + itemsPerPage);

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
                                        paginatedPatients.map((patient) => (
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

                    {/* Pagination */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 lg:p-6 border-t border-gray-200">
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <span className="text-sm text-gray-500">
                                Mostrando {Math.min(startIndex + 1, filteredPatients.length)} - {Math.min(startIndex + itemsPerPage, filteredPatients.length)} de {filteredPatients.length}
                            </span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                className="text-sm border-gray-300 rounded-lg focus:ring-[#2AA87E] focus:border-[#2AA87E] p-1.5 bg-white shadow-sm"
                            >
                                <option value={10}>10 por página</option>
                                <option value={20}>20 por página</option>
                                <option value={50}>50 por página</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Icons.ChevronLeft />
                            </button>
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-sm font-medium transition-colors ${currentPage === i + 1
                                        ? 'bg-[#2AA87E] text-white'
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Icons.ChevronRight />
                            </button>
                        </div>
                    </div>
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
