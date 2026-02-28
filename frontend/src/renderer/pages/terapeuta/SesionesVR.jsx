import React, { useState, useEffect, useMemo } from 'react';
import TherapistLayout from '../../components/layout/TherapistLayout';
import { useAuth } from '../../context/AuthContext';
import vrResultsService from '../../services/vrResultsService';
import patientService from '../../services/patientService';
import sessionService from '../../services/sessionService';
import VRSessionCard from '../../components/ui/VRSessionCard';
import CrearSesionVRModal from '../../components/modals/CrearSesionVRModal';
import { Icons } from '../../components/ui/Icons';
import { showToast } from '../../utils/alertUtils';
import { useSession } from '../../context/SessionContext';
import MiniStat from './components/MiniStat';
import RecipeSessionsPanel from './components/RecipeSessionsPanel';
import {
    DEFAULT_RECIPES,
    findRecipeById,
    getActivityLabelWithEmoji
} from '../../constants/recipes';

/**
 * ========================================
 * PÁGINA: Sesiones VR
 * ========================================
 * 
 * Vista dedicada para que el terapeuta vea todas las sesiones
 * VR de sus pacientes asignados. Toda la información de la
 * sesión proviene del videojuego y es de solo lectura.
 * Lo único editable son las observaciones clínicas del terapeuta.
 */

// ========================================
// Componente principal
// ========================================

const SesionesVR = () => {
    const { user } = useAuth();
    const { syncSession } = useSession();
    const [sessions, setSessions] = useState([]);
    const [recipeSessions, setRecipeSessions] = useState([]);
    const [recipes, setRecipes] = useState(DEFAULT_RECIPES);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filtros
    const [filterEstado, setFilterEstado] = useState('todos'); // todos, PENDIENTE_REVISION, REVISADA
    const [filterPaciente, setFilterPaciente] = useState('todos');
    const [filterActividad, setFilterActividad] = useState('todos');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState('recientes'); // recientes, antiguos
    const [showCrearSesion, setShowCrearSesion] = useState(false);
    const [recipeExpanded, setRecipeExpanded] = useState(true);

    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const sessionsPerPage = 10;
    const [recipeCurrentPage, setRecipeCurrentPage] = useState(1);
    const recipeSessionsPerPage = 4;
    const RECIPE_SESSION_POLL_MS = 10000;

    useEffect(() => {
        fetchData();
    }, []);

    const formatDateTime = (value) => {
        if (!value) return '—';
        return new Date(value).toLocaleString('es-CO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getRemainingMinutes = (createdAt) => {
        const elapsedMs = Date.now() - new Date(createdAt).getTime();
        const remainingMs = Math.max(0, (30 * 60 * 1000) - elapsedMs);
        return Math.ceil(remainingMs / (60 * 1000));
    };

    const getRecipeName = (recipeId) => {
        const recipe = findRecipeById(recipeId, recipes);
        return recipe?.name || recipeId;
    };

    const syncRecipeSessionState = (nextRecipeSessions = []) => {
        setRecipeSessions(nextRecipeSessions);

        const currentSession = nextRecipeSessions.find(s => ['CREATED', 'ACTIVE'].includes(s.status));
        if (currentSession) {
            syncSession({
                session_id: currentSession.id,
                start_token: currentSession.start_token,
                recipe_id: currentSession.recipe_id,
                recipe_name: getRecipeName(currentSession.recipe_id),
                participant_code: currentSession.participant_code,
                status: currentSession.status,
                started_at: new Date(currentSession.created_at).getTime()
            });
        } else {
            syncSession(null);
        }
    };

    const fetchData = async (options = {}) => {
        const forceRefresh = options.forceRefresh === true;
        setLoading(true);
        setError('');
        try {
            // Cargar sesiones y pacientes en paralelo
            const [sessionsResult, patientsResult, recipeSessionsResult, recipesResult] = await Promise.all([
                vrResultsService.getDashboardSessions({ limit: 500 }),
                patientService.getAll(),
                sessionService.getRecipeSessions({ refresh: forceRefresh }),
                sessionService.loadAvailableRecipes({ forceRefresh })
            ]);

            if (sessionsResult.success) {
                // Cargar detalle completo de cada sesión (con sets y errores)
                const sessionsWithDetails = await Promise.all(
                    (sessionsResult.data || []).map(async (session) => {
                        try {
                            const detail = await vrResultsService.getSessionById(session.id);
                            return detail.success
                                ? { ...session, ...detail.data }
                                : session;
                        } catch {
                            return session;
                        }
                    })
                );
                setSessions(sessionsWithDetails);
            } else {
                setError(sessionsResult.error || 'Error al cargar sesiones');
            }

            if (patientsResult.success) {
                setPatients(patientsResult.data || []);
            }

            if (recipeSessionsResult.success) {
                syncRecipeSessionState(recipeSessionsResult.data || []);
            }

            if (Array.isArray(recipesResult) && recipesResult.length > 0) {
                setRecipes(recipesResult);
            }
        } catch (err) {
            setError('Error al cargar datos de sesiones VR');
            console.error('[SesionesVR] Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const inProgressRecipeSession = useMemo(
        () => recipeSessions.find(s => ['CREATED', 'ACTIVE'].includes(s.status)) || null,
        [recipeSessions]
    );

    useEffect(() => {
        if (!inProgressRecipeSession) return;

        let cancelled = false;

        const pollRecipeSessions = async () => {
            try {
                const recipeSessionsResult = await sessionService.getRecipeSessions({ refresh: true });
                if (!cancelled && recipeSessionsResult.success) {
                    syncRecipeSessionState(recipeSessionsResult.data || []);
                }
            } catch (pollError) {
                console.error('[SesionesVR] Poll recipe sessions error:', pollError);
            }
        };

        const timerId = setInterval(pollRecipeSessions, RECIPE_SESSION_POLL_MS);

        return () => {
            cancelled = true;
            clearInterval(timerId);
        };
    }, [inProgressRecipeSession, RECIPE_SESSION_POLL_MS]);

    const totalRecipePages = Math.max(1, Math.ceil(recipeSessions.length / recipeSessionsPerPage));
    const paginatedRecipeSessions = recipeSessions.slice(
        (recipeCurrentPage - 1) * recipeSessionsPerPage,
        recipeCurrentPage * recipeSessionsPerPage
    );

    useEffect(() => {
        if (recipeCurrentPage > totalRecipePages) {
            setRecipeCurrentPage(totalRecipePages);
        }
    }, [recipeCurrentPage, totalRecipePages]);

    const handleCloseRecipeSession = async (sessionId) => {
        try {
            await sessionService.closeSession(sessionId);
            showToast('success', 'Sesión finalizada correctamente');
            await fetchData({ forceRefresh: true });
        } catch (err) {
            showToast('error', err.message || 'No se pudo finalizar la sesión');
        }
    };

    const getSessionStatusBadge = (status) => {
        if (status === 'CREATED') {
            return 'bg-amber-100 text-amber-700';
        }
        if (status === 'ACTIVE') {
            return 'bg-emerald-100 text-emerald-700';
        }
        return 'bg-gray-100 text-gray-600';
    };

    const getSessionStatusLabel = (status) => {
        if (status === 'CREATED') return 'En espera de inicio';
        if (status === 'ACTIVE') return 'Iniciada por VR';
        return 'Finalizada';
    };

    // Estadísticas calculadas
    const stats = useMemo(() => {
        const total = sessions.length;
        const pendientes = sessions.filter(s => s.estado_revision !== 'REVISADA').length;
        const revisadas = sessions.filter(s => s.estado_revision === 'REVISADA').length;

        // Sesiones de hoy
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const hoy = sessions.filter(s => {
            const d = new Date(s.started_at || s.created_at);
            return d >= today;
        }).length;

        // Sesiones esta semana
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        weekAgo.setHours(0, 0, 0, 0);
        const semana = sessions.filter(s => {
            const d = new Date(s.started_at || s.created_at);
            return d >= weekAgo;
        }).length;

        return { total, pendientes, revisadas, hoy, semana };
    }, [sessions]);

    // Actividades únicas para filtro
    const uniqueActivities = useMemo(() => {
        const acts = new Set(sessions.map(s => s.activity_id).filter(Boolean));
        return Array.from(acts).sort();
    }, [sessions]);

    // Pacientes con sesiones para el filtro
    const patientsWithSessions = useMemo(() => {
        const patientIds = new Set(sessions.map(s => s.id_paciente_vinculado).filter(Boolean));
        return patients.filter(p => patientIds.has(p.id));
    }, [sessions, patients]);

    // Sesiones filtradas
    const filteredSessions = useMemo(() => {
        let result = [...sessions];

        // Filtro por estado de revisión
        if (filterEstado === 'PENDIENTE_REVISION') {
            result = result.filter(s => s.estado_revision !== 'REVISADA');
        } else if (filterEstado === 'REVISADA') {
            result = result.filter(s => s.estado_revision === 'REVISADA');
        }

        // Filtro por paciente
        if (filterPaciente !== 'todos') {
            const pacienteId = parseInt(filterPaciente);
            result = result.filter(s => s.id_paciente_vinculado === pacienteId);
        }

        // Filtro por actividad
        if (filterActividad !== 'todos') {
            result = result.filter(s => s.activity_id === filterActividad);
        }

        // Búsqueda por texto (nombre de paciente, participant_id)
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            result = result.filter(s => {
                const pacienteNombre = s.paciente_nombre?.toLowerCase() || '';
                const participantId = s.participant_id?.toLowerCase() || '';
                const activityId = s.activity_id?.toLowerCase() || '';
                return pacienteNombre.includes(term) ||
                    participantId.includes(term) ||
                    activityId.includes(term);
            });
        }

        // Ordenamiento
        result.sort((a, b) => {
            const dateA = new Date(a.started_at || a.created_at);
            const dateB = new Date(b.started_at || b.created_at);
            return sortOrder === 'recientes' ? dateB - dateA : dateA - dateB;
        });

        return result;
    }, [sessions, filterEstado, filterPaciente, filterActividad, searchTerm, sortOrder]);

    // Paginación
    const totalPages = Math.ceil(filteredSessions.length / sessionsPerPage);
    const paginatedSessions = filteredSessions.slice(
        (currentPage - 1) * sessionsPerPage,
        currentPage * sessionsPerPage
    );

    // Reset de página al cambiar filtros
    useEffect(() => {
        setCurrentPage(1);
    }, [filterEstado, filterPaciente, filterActividad, searchTerm, sortOrder]);

    const handleSessionUpdated = (updatedSession) => {
        setSessions(prev =>
            prev.map(s => s.id === updatedSession.id ? { ...s, ...updatedSession } : s)
        );
    };

    const getActivityLabel = (activityId) => {
        return getActivityLabelWithEmoji(activityId, recipes);
    };

    const clearFilters = () => {
        setFilterEstado('todos');
        setFilterPaciente('todos');
        setFilterActividad('todos');
        setSearchTerm('');
        setSortOrder('recientes');
    };

    const handleRefreshAll = async () => {
        setCurrentPage(1);
        setRecipeCurrentPage(1);
        await fetchData();
    };

    const hasActiveFilters = filterEstado !== 'todos' || filterPaciente !== 'todos' ||
        filterActividad !== 'todos' || searchTerm.trim() !== '';

    return (
        <TherapistLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-xl lg:text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <span className="text-2xl">🎮</span>
                            Sesiones VR
                        </h1>
                        <p className="text-gray-500 mt-1 text-sm">
                            Resumen de todas las sesiones del videojuego de tus pacientes. Solo puedes agregar observaciones clínicas.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                            onClick={handleRefreshAll}
                            disabled={loading}
                            className="inline-flex items-center justify-center w-11 h-11 rounded-lg border border-gray-300 bg-white text-gray-600 hover:text-[#2AA87E] hover:border-[#2AA87E]/40 hover:bg-[#2AA87E]/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Recargar todas las peticiones de sesiones VR"
                        >
                            <Icons.Refresh />
                        </button>

                        <button
                            onClick={() => setShowCrearSesion(true)}
                            disabled={!!inProgressRecipeSession}
                            title={inProgressRecipeSession ? 'Hay una sesión en curso. Finalízala para crear una nueva.' : undefined}
                            className="inline-flex items-center gap-2 bg-[#2AA87E] hover:bg-[#238c68] text-white font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm"
                        >
                            <Icons.Plus />
                            Nueva Sesión VR
                        </button>
                    </div>
                </div>

                {/* Modal crear sesión */}
                <CrearSesionVRModal
                    isOpen={showCrearSesion}
                    onClose={() => setShowCrearSesion(false)}
                    onSuccess={() => fetchData({ forceRefresh: true })}
                    patients={patients}
                    blockedSession={inProgressRecipeSession}
                />

                {/* Estadísticas rápidas */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    <MiniStat icon="📊" value={stats.total} label="Total sesiones" color="gray" />
                    <MiniStat icon="📅" value={stats.hoy} label="Sesiones hoy" color="blue" />
                    <MiniStat icon="📆" value={stats.semana} label="Esta semana" color="purple" />
                    <MiniStat icon="⏳" value={stats.pendientes} label="Pendientes de revisión" color="orange" />
                    <MiniStat icon="✅" value={stats.revisadas} label="Revisadas" color="green" />
                </div>

                <RecipeSessionsPanel
                    Icons={Icons}
                    recipeExpanded={recipeExpanded}
                    setRecipeExpanded={setRecipeExpanded}
                    recipeSessions={recipeSessions}
                    inProgressRecipeSession={inProgressRecipeSession}
                    getRemainingMinutes={getRemainingMinutes}
                    handleCloseRecipeSession={handleCloseRecipeSession}
                    paginatedRecipeSessions={paginatedRecipeSessions}
                    getRecipeName={getRecipeName}
                    getSessionStatusBadge={getSessionStatusBadge}
                    getSessionStatusLabel={getSessionStatusLabel}
                    formatDateTime={formatDateTime}
                    totalRecipePages={totalRecipePages}
                    recipeCurrentPage={recipeCurrentPage}
                    setRecipeCurrentPage={setRecipeCurrentPage}
                    recipeSessionsPerPage={recipeSessionsPerPage}
                />

                {/* Panel de filtros */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex flex-col gap-4">
                        {/* Primera fila: Búsqueda + botones rápidos estado */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            {/* Buscador */}
                            <div className="relative flex-1">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <Icons.Search />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Buscar por paciente, participante o actividad..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2AA87E]/20 focus:border-[#2AA87E] text-sm"
                                />
                            </div>

                            {/* Botones rápidos de estado */}
                            <div className="flex bg-gray-100 rounded-lg p-1 gap-0.5 self-start">
                                {[
                                    { id: 'todos', label: 'Todas', count: stats.total },
                                    { id: 'PENDIENTE_REVISION', label: 'Pendientes', count: stats.pendientes },
                                    { id: 'REVISADA', label: 'Revisadas', count: stats.revisadas }
                                ].map(btn => (
                                    <button
                                        key={btn.id}
                                        onClick={() => setFilterEstado(btn.id)}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${filterEstado === btn.id
                                            ? 'bg-white shadow-sm text-[#2AA87E]'
                                            : 'text-gray-600 hover:text-gray-800'
                                            }`}
                                    >
                                        {btn.label}
                                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${filterEstado === btn.id
                                            ? 'bg-[#2AA87E]/10 text-[#2AA87E]'
                                            : 'bg-gray-200 text-gray-500'
                                            }`}>
                                            {btn.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Segunda fila: Filtros detallados */}
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Filtro por Paciente */}
                            <div className="flex items-center gap-2">
                                <label htmlFor="filter-paciente" className="text-xs text-gray-500 font-medium uppercase tracking-wider">Paciente:</label>
                                <select
                                    id="filter-paciente"
                                    value={filterPaciente}
                                    onChange={(e) => setFilterPaciente(e.target.value)}
                                    className="border border-gray-300 rounded-lg py-1.5 px-3 text-sm focus:ring-2 focus:ring-[#2AA87E]/20 focus:border-[#2AA87E] bg-white"
                                >
                                    <option value="todos">Todos los pacientes</option>
                                    {patientsWithSessions.map(p => (
                                        <option key={p.id} value={p.id}>{p.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Filtro por Actividad */}
                            <div className="flex items-center gap-2">
                                <label htmlFor="filter-actividad" className="text-xs text-gray-500 font-medium uppercase tracking-wider">Actividad:</label>
                                <select
                                    id="filter-actividad"
                                    value={filterActividad}
                                    onChange={(e) => setFilterActividad(e.target.value)}
                                    className="border border-gray-300 rounded-lg py-1.5 px-3 text-sm focus:ring-2 focus:ring-[#2AA87E]/20 focus:border-[#2AA87E] bg-white"
                                >
                                    <option value="todos">Todas las actividades</option>
                                    {uniqueActivities.map(act => (
                                        <option key={act} value={act}>{getActivityLabel(act)}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Ordenamiento */}
                            <div className="flex items-center gap-2">
                                <label htmlFor="filter-orden" className="text-xs text-gray-500 font-medium uppercase tracking-wider">Orden:</label>
                                <select
                                    id="filter-orden"
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value)}
                                    className="border border-gray-300 rounded-lg py-1.5 px-3 text-sm focus:ring-2 focus:ring-[#2AA87E]/20 focus:border-[#2AA87E] bg-white"
                                >
                                    <option value="recientes">Más recientes</option>
                                    <option value="antiguos">Más antiguas</option>
                                </select>
                            </div>

                            {/* Limpiar filtros */}
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1 ml-auto"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Limpiar filtros
                                </button>
                            )}

                        </div>
                    </div>
                </div>

                {/* Info banner - solo lectura */}
                {!loading && sessions.length > 0 && stats.pendientes > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                        <span className="text-amber-500 mt-0.5">
                            <Icons.Warning />
                        </span>
                        <div>
                            <p className="text-sm font-medium text-amber-800">
                                Tienes {stats.pendientes} sesión{stats.pendientes !== 1 ? 'es' : ''} pendiente{stats.pendientes !== 1 ? 's' : ''} de revisión
                            </p>
                            <p className="text-xs text-amber-600 mt-0.5">
                                Haz clic en una sesión para ver el detalle completo y agregar tus observaciones clínicas.
                            </p>
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl flex items-center gap-2">
                        <span>❌</span>
                        {error}
                    </div>
                )}

                {/* Lista de sesiones */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Icons.VR />
                            <h2 className="text-base font-semibold text-gray-900">
                                {hasActiveFilters ? 'Sesiones filtradas' : 'Todas las sesiones'}
                            </h2>
                            <span className="text-sm text-gray-500">
                                ({filteredSessions.length} {filteredSessions.length === 1 ? 'sesión' : 'sesiones'})
                            </span>
                        </div>
                        {filteredSessions.length !== sessions.length && (
                            <span className="text-xs text-gray-400">
                                de {sessions.length} total
                            </span>
                        )}
                    </div>

                    <div className="p-4 lg:p-6">
                        {loading ? (
                            <div className="py-16 text-center">
                                <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-[#2AA87E] border-t-transparent"></div>
                                <p className="mt-3 text-gray-500">Cargando sesiones del videojuego...</p>
                            </div>
                        ) : filteredSessions.length === 0 ? (
                            <div className="py-16 text-center text-gray-500">
                                <div className="text-5xl mb-4">
                                    {hasActiveFilters ? '🔍' : '🎮'}
                                </div>
                                <p className="text-lg font-medium text-gray-700">
                                    {hasActiveFilters
                                        ? 'No se encontraron sesiones con los filtros aplicados'
                                        : 'No hay sesiones VR registradas'}
                                </p>
                                <p className="text-sm mt-2 max-w-md mx-auto">
                                    {hasActiveFilters
                                        ? 'Intenta cambiar los filtros o buscar con otros términos.'
                                        : 'Las sesiones aparecerán aquí automáticamente cuando tus pacientes completen actividades en el videojuego.'}
                                </p>
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="mt-4 px-4 py-2 bg-[#2AA87E] hover:bg-[#239469] text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Limpiar filtros
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="space-y-3">
                                    {paginatedSessions.map((session) => (
                                        <div key={session.id} className="relative">
                                            {/* Badge de paciente si filtramos por "todos" */}
                                            {filterPaciente === 'todos' && session.paciente_nombre && (
                                                <div className="absolute -top-1 left-4 z-10">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#2AA87E] text-white rounded-b-lg text-xs font-medium shadow-sm">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                        {session.paciente_nombre}
                                                    </span>
                                                </div>
                                            )}
                                            <VRSessionCard
                                                session={session}
                                                onSessionUpdated={handleSessionUpdated}
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Paginación */}
                                {totalPages > 1 && (
                                    <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
                                        <p className="text-sm text-gray-500">
                                            Mostrando {((currentPage - 1) * sessionsPerPage) + 1}-
                                            {Math.min(currentPage * sessionsPerPage, filteredSessions.length)} de {filteredSessions.length}
                                        </p>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                                            >
                                                <Icons.ChevronLeft />
                                            </button>

                                            {/* Páginas inteligentes */}
                                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                                .filter(page => {
                                                    if (totalPages <= 7) return true;
                                                    if (page === 1 || page === totalPages) return true;
                                                    if (Math.abs(page - currentPage) <= 1) return true;
                                                    return false;
                                                })
                                                .map((page, idx, arr) => (
                                                    <React.Fragment key={page}>
                                                        {idx > 0 && arr[idx - 1] !== page - 1 && (
                                                            <span className="px-1 text-gray-400">...</span>
                                                        )}
                                                        <button
                                                            onClick={() => setCurrentPage(page)}
                                                            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                                                                ? 'bg-[#2AA87E] text-white'
                                                                : 'hover:bg-gray-100 text-gray-700'
                                                                }`}
                                                        >
                                                            {page}
                                                        </button>
                                                    </React.Fragment>
                                                ))
                                            }

                                            <button
                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                disabled={currentPage === totalPages}
                                                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                                            >
                                                <Icons.ChevronRight />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Nota informativa */}
                {!loading && sessions.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <Icons.Info />
                            <div className="text-sm text-blue-700">
                                <p className="font-medium text-blue-800 mb-1">Información sobre las sesiones</p>
                                <ul className="space-y-1 text-xs">
                                    <li>• Los datos de cada sesión (errores, tiempos, etapas) provienen directamente del videojuego y <strong>no se pueden modificar</strong>.</li>
                                    <li>• Como terapeuta puedes agregar <strong>observaciones clínicas</strong> haciendo clic en una sesión y usando la pestaña "Evaluación".</li>
                                    <li>• Las sesiones nuevas aparecen automáticamente cuando un paciente completa una actividad en el juego VR.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </TherapistLayout>
    );
};

export default SesionesVR;
