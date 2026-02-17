import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { CrearTerapeutaModal, EditarTerapeutaModal, ReasignarPacientesModal, ResetPasswordModal } from '../../components/modals';
import therapistService from '../../services/therapistService';
import { showAlert, showConfirm, showToast } from '../../utils/alertUtils';
import { Icons } from '../../components/ui/Icons';

/**
 * Badge de estado
 */
const StatusBadge = ({ active }) => (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${active
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
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Reset pagination when items per page changes
    useEffect(() => {
        setCurrentPage(1);
    }, [itemsPerPage]);

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

                // RF-SEG-02 (Safety): Check for inactive therapists with patients
                const inconsistent = result.data.find(t => !t.activo && t.pacientes > 0);
                if (inconsistent) {
                    // Trigger reassignment flow immediately
                    try {
                        const patientsResult = await therapistService.getPatients(inconsistent.id_terapeuta || inconsistent.id);
                        if (patientsResult.success) {
                            setTherapistPatients(patientsResult.data);
                            setSelectedTherapist(inconsistent);
                            setShowReasignarModal(true);
                        }
                    } catch (err) {
                        // Error handled by caller
                    }
                }

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
                nombre: data.nombre,
                correo: data.correo,
                password: data.password,
                especialidad: data.especialidad || 'General',
                telefono: data.telefono
            });

            if (result.success) {
                await fetchTherapists(); // Recargar lista
                showToast('success', 'Terapeuta creado exitosamente');
            } else {
                showAlert('error', 'Error', result.error);
            }
        } catch (err) {
            showAlert('error', 'Error', 'No se pudo crear el terapeuta');
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
                nombre: data.nombre,
                correo: data.correo,
                especialidad: data.especialidad,
                telefono: data.telefono
            });

            if (result.success) {
                await fetchTherapists();
                showToast('success', 'Terapeuta actualizado');
            } else {
                showAlert('error', 'Error', result.error);
            }
        } catch (err) {
            showAlert('error', 'Error', 'No se pudo actualizar el terapeuta');
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleStatus = async (therapist) => {
        const action = therapist.activo ? 'desactivar' : 'activar';

        // Confirmación antes de cualquier acción
        const confirmed = await showConfirm(
            `¿${action.charAt(0).toUpperCase() + action.slice(1)} terapeuta?`,
            `¿Estás seguro que deseas ${action} a ${therapist.nombre}?`
        );

        if (!confirmed) return;

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
                    showToast('success', `Terapeuta ${therapist.activo ? 'desactivado' : 'activado'} correctamente`);
                } else {
                    showAlert('error', 'Error', result.error);
                }
            } catch (err) {
                showAlert('error', 'Error', 'Error al cambiar estado');
            } finally {
                setActionLoading(false);
            }
        }
    };

    const handleReasignarSubmit = async (data) => {
        setActionLoading(true);
        try {
            // Crear asignaciones de pacientes
            const assignments = data.patients.map((patientId, index) => ({
                patientId,
                therapistId: data.manualAssignments?.[patientId] ||
                    data.targetTherapists[index % data.targetTherapists.length]
            }));

            const reassignResult = await therapistService.reassignPatients(assignments);

            if (reassignResult.success) {
                // Desactivar el terapeuta SOLO si está activo actualmente.
                if (selectedTherapist?.activo) {
                    await therapistService.toggleStatus(data.therapistId);
                }
                await fetchTherapists();
                showToast('success', 'Pacientes reasignados y terapeuta desactivado');
            } else {
                showAlert('error', 'Error', reassignResult.error);
            }
        } catch (err) {
            showAlert('error', 'Error', 'Error al reasignar pacientes');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
                        Gestión de Terapeutas
                    </h1>
                    <button
                        onClick={handleNewTherapist}
                        className="flex items-center gap-2 bg-[#F76C6C] hover:bg-[#E55A5A] text-white font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm w-full sm:w-auto justify-center"
                    >
                        <Icons.Plus />
                        <span className="hidden sm:inline">Nuevo terapeuta</span>
                        <span className="sm:hidden">Nuevo</span>
                    </button>
                </div>

                {/* Filtros y Búsqueda */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-6">
                        {/* Search */}
                        <div className="relative flex-1 max-w-full lg:max-w-md">
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

                        {/* Filter Tabs and Refresh */}
                        <div className="flex items-center gap-2">
                            <div className="flex items-center bg-gray-100 rounded-lg p-1 flex-1 lg:flex-none">
                                {['todos', 'activos', 'inactivos'].map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`px-2 lg:px-4 py-2 rounded-md text-xs lg:text-sm font-medium transition-colors capitalize flex-1 lg:flex-none ${filter === f
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
                                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 flex-shrink-0"
                                title="Recargar"
                            >
                                <Icons.Refresh />
                            </button>
                        </div>
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
                                        <th className="pb-4 pr-4">Nombre</th>
                                        <th className="pb-4 pr-4">Correo</th>
                                        <th className="pb-4 pr-4">Especialidad</th>
                                        <th className="pb-4 pr-4">Teléfono</th>
                                        <th className="pb-4 pr-4 text-center">Pacientes</th>
                                        <th className="pb-4 pr-4">Estado</th>
                                        <th className="pb-4 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedTherapists.map((therapist) => (
                                        <tr key={therapist.id} className="hover:bg-gray-50">
                                            <td className="py-4 pr-4 text-gray-700">
                                                {therapist.nombre}
                                            </td>
                                            <td className="py-4 pr-4 text-gray-500">
                                                {therapist.correo}
                                            </td>
                                            <td className="py-4 pr-4 text-gray-500">
                                                {therapist.especialidad || '-'}
                                            </td>
                                            <td className="py-4 pr-4 text-gray-500">
                                                {therapist.telefono || '-'}
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
                                                        icon={therapist.activo ? Icons.Deactivate : Icons.Activate}
                                                        onClick={() => handleToggleStatus(therapist)}
                                                        title={therapist.activo ? 'Desactivar' : 'Activar'}
                                                        variant={therapist.activo ? 'danger' : 'default'}
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
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-200">
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <span className="text-sm text-gray-500">
                                Mostrando {Math.min(startIndex + 1, filteredTherapists.length)} - {Math.min(startIndex + itemsPerPage, filteredTherapists.length)} de {filteredTherapists.length}
                            </span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                className="text-sm border-gray-300 rounded-lg focus:ring-[#F76C6C] focus:border-[#F76C6C] p-1.5 bg-white shadow-sm"
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
                    // If this was a forced opening (inactive but has patients), verify if it's resolved?
                    // The user requested "obligatoriamente".
                    // For now, simpler to allow close but it will popup again on refresh.
                    // Or we can check if the condition persists.
                    setShowReasignarModal(false);
                    setSelectedTherapist(null);
                }}
                onSubmit={handleReasignarSubmit}
                therapist={selectedTherapist}
                patients={therapistPatients}
                availableTherapists={availableTherapists}
            // Force blocking if it's a safety check? (Optional enhancement)
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
                            showToast('success', 'Contraseña reseteada exitosamente');
                        } else {
                            throw new Error(result.error);
                        }
                    } catch (err) {
                        showAlert('error', 'Error', 'Error al resetear contraseña: ' + err.message);
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
