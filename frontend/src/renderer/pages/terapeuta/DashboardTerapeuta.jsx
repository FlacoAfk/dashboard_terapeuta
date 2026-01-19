import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TherapistLayout from '../../components/layout/TherapistLayout';
import { useAuth } from '../../context/AuthContext';
import patientService from '../../services/patientService';
import sessionService from '../../services/sessionService';

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

            // Fetch stats
            const sessionStats = await sessionService.getStats();
            const patientStats = await patientService.getStats();

            setStats({
                activos: patientStats.success ? patientStats.data.activos : 0,
                hoy: sessionStats.success ? sessionStats.data.hoy : 0,
                semana: sessionStats.success ? sessionStats.data.semana : 0,
                rendimiento: sessionStats.success ? sessionStats.data.rendimientoPromedio : 0
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
        try {
            const result = await patientService.toggleStatus(patient.id, patient.activo);
            if (result.success) {
                fetchData(); // Refresh
            } else {
                alert('Error al cambiar estado: ' + result.error);
            }
        } catch (err) {
            alert('Error al cambiar estado');
        }
    };

    return (
        <TherapistLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="text-2xl">👋</span>
                        Bienvenido, {user?.nombre || 'Dr. Terapeuta'}
                    </h1>
                    <p className="text-gray-500 mt-1">
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
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <h2 className="text-lg font-semibold text-gray-900">MIS PACIENTES</h2>

                            <div className="flex items-center gap-4">
                                {/* Search */}
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Buscar..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2AA87E]/20 focus:border-[#2AA87E] w-48"
                                    />
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <Icons.Search />
                                    </div>
                                </div>

                                {/* New Patient Button */}
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="flex items-center gap-2 bg-[#2AA87E] hover:bg-[#239469] text-white font-medium px-4 py-2 rounded-lg transition-colors"
                                >
                                    <Icons.Plus />
                                    Nuevo Paciente
                                </button>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="flex gap-4 mt-4">
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

            {/* Modals - TODO */}
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

// Placeholder modals - will be replaced by actual components
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">Crear Nuevo Paciente</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Documento de Identidad *</label>
                        <input
                            type="text"
                            value={formData.identificacion}
                            onChange={(e) => setFormData({ ...formData, identificacion: e.target.value })}
                            placeholder="Ej. 1001234567"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#2AA87E]/20 focus:border-[#2AA87E]"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                            <input
                                type="text"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                placeholder="Ej. Ana"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#2AA87E]/20 focus:border-[#2AA87E]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                            <input
                                type="text"
                                value={formData.apellido}
                                onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                                placeholder="Ej. López García"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#2AA87E]/20 focus:border-[#2AA87E]"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Edad *</label>
                        <input
                            type="number"
                            value={formData.edad}
                            onChange={(e) => setFormData({ ...formData, edad: e.target.value })}
                            placeholder="Ej. 45"
                            min="1"
                            max="120"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#2AA87E]/20 focus:border-[#2AA87E]"
                        />
                        <p className="text-xs text-gray-500 mt-1">Solo números, entre 1 y 120</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Diagnóstico (DCLA) *</label>
                        <textarea
                            value={formData.condicion}
                            onChange={(e) => setFormData({ ...formData, condicion: e.target.value })}
                            placeholder="Describa el diagnóstico o condición del paciente..."
                            rows={3}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#2AA87E]/20 focus:border-[#2AA87E]"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-[#2AA87E] hover:bg-[#239469] text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>✓ Crear</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

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
        setLoading(true);
        try {
            const result = await patientService.update(patient.id, formData);
            if (result.success) {
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">Editar Paciente</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Documento de Identidad *</label>
                        <input
                            type="text"
                            value={formData.identificacion}
                            onChange={(e) => setFormData({ ...formData, identificacion: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#2AA87E]/20 focus:border-[#2AA87E]"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                            <input
                                type="text"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#2AA87E]/20 focus:border-[#2AA87E]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                            <input
                                type="text"
                                value={formData.apellido}
                                onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#2AA87E]/20 focus:border-[#2AA87E]"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Edad *</label>
                        <input
                            type="number"
                            value={formData.edad}
                            onChange={(e) => setFormData({ ...formData, edad: e.target.value })}
                            min="1"
                            max="120"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#2AA87E]/20 focus:border-[#2AA87E]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Diagnóstico (DCLA) *</label>
                        <textarea
                            value={formData.condicion}
                            onChange={(e) => setFormData({ ...formData, condicion: e.target.value })}
                            rows={3}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#2AA87E]/20 focus:border-[#2AA87E]"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-[#2AA87E] hover:bg-[#239469] text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>✓ Guardar Cambios</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DashboardTerapeuta;
