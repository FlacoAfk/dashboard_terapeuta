import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { CrearTerapeutaModal, EditarTerapeutaModal, ReasignarPacientesModal, ResetPasswordModal } from '../../components/modals';
import therapistService from '../../services/therapistService';

/**
 * Iconos SVG
 */
const Icons = {
    Search: () => (
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    ),
    Plus: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
    ),
    Edit: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
    ),
    View: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    ),
    Power: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
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
    Refresh: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
    ),
    Key: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
    )
};

/**
 * Badge de estado
 */
const StatusBadge = ({ active }) => (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
        active 
            ? 'bg-green-100 text-green-700' 
            : 'bg-gray-100 text-gray-500'
    }`}>
        {active ? 'Activo' : 'Inactivo'}
    </span>
);

/**
 * Botón de acción de la tabla
 */
const ActionButton = ({ icon: Icon, onClick, title, variant = 'default', disabled = false }) => {
    const variants = {
        default: 'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
        danger: 'text-gray-500 hover:text-red-600 hover:bg-red-50'
    };
    
    return (
        <button 
            onClick={onClick}
            title={title}
            disabled={disabled}
            className={`p-2 rounded-lg transition-colors ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <Icon />
        </button>
    );
};

/**
 * Vista de Gestión de Terapeutas
 */
const GestionTerapeutas = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('todos'); // 'todos', 'activos', 'inactivos'
    const [therapists, setTherapists] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const itemsPerPage = 5;

    // Estados de los modales
    const [showCrearModal, setShowCrearModal] = useState(false);
    const [showEditarModal, setShowEditarModal] = useState(false);
    const [showReasignarModal, setShowReasignarModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [selectedTherapist, setSelectedTherapist] = useState(null);
    const [therapistPatients, setTherapistPatients] = useState([]);

    // Cargar terapeutas al montar
    useEffect(() => {
        fetchTherapists();
    }, []);

    const fetchTherapists = async () => {
        setLoading(true);
        setError('');
        try {
            const result = await therapistService.getAll();
            if (result.success) {
                setTherapists(result.data);
            } else {
                setError(result.error || 'Error al cargar terapeutas');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    // Filtrar terapeutas
    const filteredTherapists = therapists.filter(t => {
        const matchesSearch = 
            (t.usuario || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.nombre || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesFilter = 
            filter === 'todos' ||
            (filter === 'activos' && t.activo) ||
            (filter === 'inactivos' && !t.activo);
        
        return matchesSearch && matchesFilter;
    });

    // Paginación
    const totalPages = Math.ceil(filteredTherapists.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedTherapists = filteredTherapists.slice(startIndex, startIndex + itemsPerPage);

    // Terapeutas activos para reasignación (excluyendo el que se va a desactivar)
    const availableTherapists = therapists
        .filter(t => t.activo && t.id !== selectedTherapist?.id)
        .map(t => ({ ...t }));

    const handleNewTherapist = () => {
        setShowCrearModal(true);
    };

    const handleCrearSubmit = async (data) => {
        setActionLoading(true);
        try {
            const result = await therapistService.create({
                nombre: `${data.nombre} ${data.apellido || ''}`.trim(),
                correo: data.correo,
                username: data.username,
                password: data.password,
                especialidad: 'General'
            });
            
            if (result.success) {
                await fetchTherapists(); // Recargar lista
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (err) {
            alert('Error al crear terapeuta');
        } finally {
            setActionLoading(false);
        }
    };

    const handleEdit = (therapist) => {
        setSelectedTherapist(therapist);
        setShowEditarModal(true);
    };

    const handleEditarSubmit = async (data) => {
        setActionLoading(true);
        try {
            const result = await therapistService.update(data.id, {
                nombre: `${data.nombre} ${data.apellido || ''}`.trim(),
                correo: data.correo
            });
            
            if (result.success) {
                await fetchTherapists();
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (err) {
            alert('Error al actualizar terapeuta');
        } finally {
            setActionLoading(false);
        }
    };

    const handleView = (therapist) => {
        // TODO: Implementar vista de detalles
        console.log('Ver terapeuta:', therapist);
    };

    const handleToggleStatus = async (therapist) => {
        if (therapist.activo && therapist.pacientes > 0) {
            // RF-SEG-02: Si tiene pacientes, cargar lista y mostrar modal
            try {
                const patientsResult = await therapistService.getPatients(therapist.id_terapeuta);
                if (patientsResult.success) {
                    setTherapistPatients(patientsResult.data);
                }
            } catch (err) {
                console.error('Error obteniendo pacientes:', err);
            }
            setSelectedTherapist(therapist);
            setShowReasignarModal(true);
        } else {
            // Toggle directo si no tiene pacientes o si está inactivo
            setActionLoading(true);
            try {
                const result = await therapistService.toggleStatus(therapist.id);
                if (result.success) {
                    await fetchTherapists();
                } else {
                    alert(`Error: ${result.error}`);
                }
            } catch (err) {
                alert('Error al cambiar estado');
            } finally {
                setActionLoading(false);
            }
        }
    };

    const handleReasignarSubmit = async (data) => {
        setActionLoading(true);
        try {
            // Crear asignaciones de pacientes
            const assignments = data.patients.map(patientId => ({
                patientId,
                therapistId: data.manualAssignments?.[patientId] || data.targetTherapists[0]
            }));
            
            const reassignResult = await therapistService.reassignPatients(assignments);
            
            if (reassignResult.success) {
                // Desactivar el terapeuta
                await therapistService.toggleStatus(data.therapistId);
                await fetchTherapists();
            } else {
                alert(`Error: ${reassignResult.error}`);
            }
        } catch (err) {
            alert('Error al reasignar pacientes');
        } finally {
            setActionLoading(false);
        }
    }; 

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Gestión de Terapeutas
                    </h1>
                    <button
                        onClick={handleNewTherapist}
                        className="flex items-center gap-2 bg-[#F76C6C] hover:bg-[#E55A5A] text-white font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm"
                    >
                        <Icons.Plus />
                        Nuevo terapeuta
                    </button>
                </div>

                {/* Filtros y Búsqueda */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between gap-4 mb-6">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                <Icons.Search />
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar por usuario o nombre..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F76C6C]/20 focus:border-[#F76C6C] transition-colors"
                            />
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex items-center bg-gray-100 rounded-lg p-1">
                            {['todos', 'activos', 'inactivos'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
                                        filter === f
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    {f === 'todos' ? 'Todos' : f === 'activos' ? 'Activos' : 'Inactivos'}
                                </button>
                            ))}
                        </div>
                        {/* Refresh Button */}
                        <button
                            onClick={fetchTherapists}
                            disabled={loading}
                            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                            title="Recargar"
                        >
                            <Icons.Refresh />
                        </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    {/* Loading */}
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#F76C6C] border-t-transparent"></div>
                        </div>
                    ) : (
                    /* Table */
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                    <th className="pb-4 pr-4">Usuario</th>
                                    <th className="pb-4 pr-4">Nombre</th>
                                    <th className="pb-4 pr-4">Correo</th>
                                    <th className="pb-4 pr-4 text-center">Pacientes</th>
                                    <th className="pb-4 pr-4">Estado</th>
                                    <th className="pb-4 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedTherapists.map((therapist) => (
                                    <tr key={therapist.id} className="hover:bg-gray-50">
                                        <td className="py-4 pr-4">
                                            <span className="font-medium text-gray-900">
                                                {therapist.usuario}
                                            </span>
                                        </td>
                                        <td className="py-4 pr-4 text-gray-700">
                                            {therapist.nombre}
                                        </td>
                                        <td className="py-4 pr-4 text-gray-500">
                                            {therapist.correo}
                                        </td>
                                        <td className="py-4 pr-4 text-center">
                                            <span className="font-medium text-gray-900">
                                                {therapist.pacientes}
                                            </span>
                                        </td>
                                        <td className="py-4 pr-4">
                                            <StatusBadge active={therapist.activo} />
                                        </td>
                                        <td className="py-4">
                                            <div className="flex items-center justify-center gap-1">
                                                <ActionButton 
                                                    icon={Icons.Edit} 
                                                    onClick={() => handleEdit(therapist)}
                                                    title="Editar"
                                                />
                                                <ActionButton 
                                                    icon={Icons.View} 
                                                    onClick={() => handleView(therapist)}
                                                    title="Ver detalles"
                                                />
                                                <ActionButton 
                                                    icon={Icons.Power} 
                                                    onClick={() => handleToggleStatus(therapist)}
                                                    title={therapist.activo ? 'Desactivar' : 'Activar'}
                                                    variant="danger"
                                                />
                                                <ActionButton 
                                                    icon={Icons.Key} 
                                                    onClick={() => {
                                                        setSelectedTherapist(therapist);
                                                        setShowResetModal(true);
                                                    }}
                                                    title="Resetear contraseña"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    )}

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                        <span className="text-sm text-gray-500">
                            Mostrando {Math.min(startIndex + 1, filteredTherapists.length)} - {Math.min(startIndex + itemsPerPage, filteredTherapists.length)} de {filteredTherapists.length} resultados
                        </span>
                        <div className="flex items-center gap-2">
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
                                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                                        currentPage === i + 1
                                            ? 'bg-[#F76C6C] text-white'
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

            {/* Modales */}
            <CrearTerapeutaModal
                isOpen={showCrearModal}
                onClose={() => setShowCrearModal(false)}
                onSubmit={handleCrearSubmit}
            />

            <EditarTerapeutaModal
                isOpen={showEditarModal}
                onClose={() => {
                    setShowEditarModal(false);
                    setSelectedTherapist(null);
                }}
                onSubmit={handleEditarSubmit}
                therapist={selectedTherapist}
            />

            <ReasignarPacientesModal
                isOpen={showReasignarModal}
                onClose={() => {
                    setShowReasignarModal(false);
                    setSelectedTherapist(null);
                }}
                onSubmit={handleReasignarSubmit}
                therapist={selectedTherapist}
                patients={therapistPatients}
                availableTherapists={availableTherapists}
            />

            <ResetPasswordModal
                isOpen={showResetModal}
                onClose={() => {
                    setShowResetModal(false);
                    setSelectedTherapist(null);
                }}
                onSubmit={async (data) => {
                    setActionLoading(true);
                    try {
                        const result = await therapistService.resetPassword(data.therapistId, data.newPassword);
                        if (result.success) {
                            alert('Contraseña reseteada exitosamente');
                        } else {
                            throw new Error(result.error);
                        }
                    } catch (err) {
                        alert('Error al resetear contraseña: ' + err.message);
                    } finally {
                        setActionLoading(false);
                    }
                }}
                therapist={selectedTherapist}
            />
        </AdminLayout>
    );
};

export default GestionTerapeutas;
