/**
 * ========================================
 * COMPONENTE: VRSessionCard
 * ========================================
 * 
 * Tarjeta compacta para listar sesiones VR.
 * Al hacer clic, abre un modal con el detalle completo
 * incluyendo evaluación del terapeuta (observaciones + calificación).
 * 
 * Utiliza toda la información disponible en la BD:
 * - vr_session_results (sesión principal)
 * - vr_set_results (detalle por etapa: duración, bloqueos, drops, releases, errores)
 * - vr_set_errors (errores individuales con código, mensaje, timestamp, objeto_contexto)
 */

import React, { useState, useMemo } from 'react';
import Swal from 'sweetalert2';
import vrResultsService from '../../services/vrResultsService';

// ========================================
// Componente principal: Tarjeta compacta
// ========================================

const VRSessionCard = ({ session, onSessionUpdated }) => {
    const [showModal, setShowModal] = useState(false);

    const formatDate = (isoDate) => {
        if (!isoDate) return '-';
        const date = new Date(isoDate);
        return date.toLocaleDateString('es-CO', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatTime = (isoDate) => {
        if (!isoDate) return '';
        const date = new Date(isoDate);
        return date.toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const getStatusInfo = () => {
        const errors = session.summary_total_errors || 0;
        const sets = session.summary_sets_completed || 0;

        if (errors === 0 && sets >= 4) {
            return { label: 'Excelente', color: 'bg-green-500', icon: '🌟' };
        } else if (errors <= 2) {
            return { label: 'Bueno', color: 'bg-emerald-500', icon: '✓' };
        } else if (errors <= 5) {
            return { label: 'Regular', color: 'bg-yellow-500', icon: '⚠' };
        } else {
            return { label: 'Necesita práctica', color: 'bg-red-500', icon: '!' };
        }
    };

    const getReviewBadge = () => {
        if (session.estado_revision === 'REVISADA') {
            return { label: 'Revisada', class: 'bg-blue-100 text-blue-700' };
        }
        return { label: 'Pendiente', class: 'bg-orange-100 text-orange-700' };
    };

    const status = getStatusInfo();
    const reviewBadge = getReviewBadge();
    const difficulty = getDifficultyInfo(session.activity_id);

    return (
        <>
            <div
                onClick={() => setShowModal(true)}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg hover:border-[#2AA87E] transition-all cursor-pointer group"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 ${status.color} rounded-xl flex items-center justify-center text-white text-xl shadow-sm`}>
                            {status.icon}
                        </div>

                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-gray-900 group-hover:text-[#2AA87E] transition-colors">
                                    {getActivityDisplayName(session.activity_id)}
                                </h4>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${reviewBadge.class}`}>
                                    {reviewBadge.label}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    difficulty.color === 'green' ? 'bg-green-100 text-green-700' :
                                    difficulty.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                                    difficulty.color === 'red' ? 'bg-red-100 text-red-700' :
                                    'bg-gray-100 text-gray-700'
                                }`}>
                                    {difficulty.icon} {difficulty.label}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500">
                                📅 {formatDate(session.started_at)} • {formatTime(session.started_at)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-center hidden sm:block">
                            <p className="text-lg font-bold text-gray-800">
                                {vrResultsService.formatDuration(session.total_seconds)}
                            </p>
                            <p className="text-xs text-gray-500">Duración</p>
                        </div>

                        <div className="text-center hidden sm:block">
                            <p className={`text-lg font-bold ${session.summary_total_errors === 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {session.summary_total_errors || 0}
                            </p>
                            <p className="text-xs text-gray-500">Errores</p>
                        </div>

                        <div className="text-center hidden md:block">
                            <p className="text-lg font-bold text-purple-600">
                                {session.summary_sets_completed || 0}/4
                            </p>
                            <p className="text-xs text-gray-500">Etapas</p>
                        </div>

                        <div className="text-center hidden md:block">
                            <p className="text-lg font-bold text-blue-600">
                                {session.summary_total_drops || 0}
                            </p>
                            <p className="text-xs text-gray-500">Caídas</p>
                        </div>

                        <div className="text-gray-400 group-hover:text-[#2AA87E] transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {showModal && (
                <VRSessionDetailModal
                    session={session}
                    onClose={() => setShowModal(false)}
                    onSessionUpdated={(updated) => {
                        if (onSessionUpdated) onSessionUpdated(updated);
                    }}
                />
            )}
        </>
    );
};

// ========================================
// Funciones de nombre/display globales
// ========================================

const getActivityDisplayName = (activityId) => {
    if (!activityId) return 'Actividad VR';

    const names = {
        'tinto_easy_01': 'Preparar Tinto - Fácil',
        'tinto_easy_02': 'Preparar Tinto - Fácil',
        'tinto_medium_01': 'Preparar Tinto - Intermedio',
        'tinto_hard_01': 'Preparar Tinto - Difícil',
        'cafe_easy_01': 'Preparar Café - Fácil',
        'cafe_medium_01': 'Preparar Café - Intermedio',
        'cafe_hard_01': 'Preparar Café - Difícil',
        'huevos_easy_01': 'Preparar Huevos - Fácil',
        'huevos_medium_01': 'Preparar Huevos - Intermedio',
        'huevos_hard_01': 'Preparar Huevos - Difícil',
        'arepa_easy_01': 'Preparar Arepa - Fácil',
        'arepa_medium_01': 'Preparar Arepa - Intermedio',
        'arepa_hard_01': 'Preparar Arepa - Difícil',
        'agua_panela_easy': 'Agua de Panela - Fácil',
        'agua_panela_medium': 'Agua de Panela - Intermedio',
        'agua_panela_hard': 'Agua de Panela - Difícil'
    };

    if (names[activityId]) return names[activityId];

    return activityId
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
        .replace(/(\d+)$/, '- $1');
};

const getDifficultyInfo = (activityId) => {
    if (!activityId) return { label: 'N/A', color: 'gray', icon: '⚪' };
    const lower = activityId.toLowerCase();
    if (lower.includes('easy')) return { label: 'Fácil', color: 'green', icon: '🟢' };
    if (lower.includes('medium')) return { label: 'Intermedio', color: 'yellow', icon: '🟡' };
    if (lower.includes('hard')) return { label: 'Difícil', color: 'red', icon: '🔴' };
    return { label: 'N/A', color: 'gray', icon: '⚪' };
};

const getRecipeName = (activityId) => {
    if (!activityId) return 'Actividad VR';
    const lower = activityId.toLowerCase();
    if (lower.includes('tinto')) return 'Tinto';
    if (lower.includes('cafe')) return 'Café';
    if (lower.includes('huevos')) return 'Huevos';
    if (lower.includes('arepa')) return 'Arepa';
    if (lower.includes('agua_panela')) return 'Agua de Panela';
    return activityId;
};

const getErrorDisplayName = (errorCode) => {
    if (!errorCode) return 'Error no especificado';

    const errorNames = {
        'STOVE_ON_NO_POT': 'Encendió la estufa sin colocar la olla',
        'BURN': 'Quemó un alimento o se quemó',
        'BURNT_FOOD': 'La comida se quemó',
        'WRONG_INGREDIENT': 'Usó un ingrediente incorrecto',
        'FORGOT_SUGAR': 'Olvidó agregar el azúcar',
        'FORGOT_COFFEE': 'Olvidó agregar el café',
        'COFFEE_BEFORE_BOIL': 'Agregó café antes de hervir el agua',
        'SERVE_WITHOUT_SUGAR': 'Sirvió sin haber agregado azúcar',
        'SPILL_COFFEE': 'Derramó el café',
        'SPILL': 'Derramó líquido',
        'WRONG_UTENSIL': 'Seleccionó un utensilio incorrecto',
        'WRONG_ORDER': 'Ejecutó los pasos en orden incorrecto',
        'DROP_ITEM': 'Dejó caer un objeto',
        'TIME_EXCEEDED': 'Excedió el tiempo permitido',
        'INCOMPLETE_TASK': 'No completó la tarea',
        'TASK_SKIPPED': 'Omitió un paso importante'
    };

    if (errorNames[errorCode]) return errorNames[errorCode];

    return errorCode
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/^\w/, c => c.toUpperCase());
};

const formatObjectName = (objectName) => {
    if (!objectName) return 'Objeto';

    const objectNames = {
        'Meshy_AI_Café_Sello_Rojo_Pack_1220190201_texture': 'Café Sello Rojo',
        'Meshy_AI_Manuelita_Sugar_Packa_1220194307_texture': 'Azúcar Manuelita',
        'Meshy_AI_Water_Bottle_1224004012_texture': 'Botella de agua',
        'Cuchara': 'Cuchara',
        'Taza': 'Taza',
        'Azucarera': 'Azucarera',
        'Olla': 'Olla',
        'Estufa': 'Estufa',
        'Cafetera': 'Cafetera'
    };

    if (objectNames[objectName]) return objectNames[objectName];

    if (objectName.includes('Meshy_AI')) {
        const parts = objectName.split('_');
        const relevantParts = parts.filter(p =>
            !['Meshy', 'AI', 'texture', 'Pack'].includes(p) &&
            !/^\d+$/.test(p)
        );
        if (relevantParts.length > 0) return relevantParts.join(' ');
    }

    return objectName.replace(/_/g, ' ');
};

const getSetNameSpanish = (setName) => {
    const names = {
        'Ingredients': 'Ingredientes',
        'Utensils': 'Utensilios',
        'Preparation': 'Preparación',
        'Organization': 'Organización'
    };
    return names[setName] || setName;
};

const formatDurationDetailed = (seconds) => {
    if (!seconds || seconds < 0) return '0 min 0 seg';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins === 0) return `${secs} seg`;
    return `${mins} min ${secs} seg`;
};

const formatTimestamp = (isoDate) => {
    if (!isoDate) return '-';
    const date = new Date(isoDate);
    return date.toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
};

// ========================================
// Modal de detalle completo
// ========================================

const VRSessionDetailModal = ({ session, onClose, onSessionUpdated }) => {
    const [observaciones, setObservaciones] = useState(session.observaciones_terapeuta || '');
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [localSession, setLocalSession] = useState(session);
    const [activeTab, setActiveTab] = useState('resumen');

    const isReviewed = localSession.estado_revision === 'REVISADA';

    const formatFullDate = (isoDate) => {
        if (!isoDate) return '-';
        const date = new Date(isoDate);
        return date.toLocaleDateString('es-CO', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    // ===== Cálculos detallados usando datos de la BD =====
    const analytics = useMemo(() => {
        const sets = localSession.sets || [];
        const totalErrors = localSession.summary_total_errors || 0;
        const totalDrops = localSession.summary_total_drops || 0;
        const totalReleases = localSession.summary_total_releases || 0;
        const setsCompleted = localSession.summary_sets_completed || 0;
        const totalSeconds = localSession.total_seconds || 0;

        // Métricas por etapa
        const totalBlocked = sets.reduce((acc, s) => acc + (s.blocked_count || 0), 0);

        // Duración promedio por etapa
        const avgSetDuration = sets.length > 0
            ? sets.reduce((acc, s) => acc + (s.duration_seconds || 0), 0) / sets.length
            : 0;

        // Etapa más larga y más corta
        const longestSet = sets.length > 0
            ? sets.reduce((a, b) => (a.duration_seconds || 0) > (b.duration_seconds || 0) ? a : b)
            : null;
        const shortestSet = sets.length > 0
            ? sets.reduce((a, b) => (a.duration_seconds || 0) < (b.duration_seconds || 0) ? a : b)
            : null;

        // Errores agrupados por tipo
        const errorsByCode = {};
        const errorTimeline = [];
        sets.forEach(set => {
            const setErrors = set.errors || [];
            setErrors.forEach(err => {
                const code = err.code || 'UNKNOWN';
                if (!errorsByCode[code]) {
                    errorsByCode[code] = { count: 0, stages: new Set(), contexts: [], message: err.message };
                }
                errorsByCode[code].count++;
                errorsByCode[code].stages.add(set.set_name);
                if (err.objeto_contexto) {
                    errorsByCode[code].contexts.push(err.objeto_contexto);
                }
                errorTimeline.push({
                    ...err,
                    setName: set.set_name,
                    time: err.occurred_at
                });
            });
        });

        const sortedErrors = Object.entries(errorsByCode).sort((a, b) => b[1].count - a[1].count);
        errorTimeline.sort((a, b) => new Date(a.time) - new Date(b.time));

        // Etapa con más errores
        const worstStage = sets.length > 0
            ? sets.reduce((a, b) => {
                const errA = (a.errors?.length || a.errors_count || 0);
                const errB = (b.errors?.length || b.errors_count || 0);
                return errA > errB ? a : b;
            })
            : null;
        const worstStageErrors = worstStage ? (worstStage.errors?.length || worstStage.errors_count || 0) : 0;

        // Etapas sin errores
        const cleanStages = sets.filter(s => (s.errors?.length || s.errors_count || 0) === 0);

        // Score calculado (0-100)
        let score = 100;
        score -= totalErrors * 8;
        score -= totalDrops * 3;
        score -= totalBlocked * 2;
        score -= Math.max(0, (4 - setsCompleted)) * 15;
        if (totalSeconds > 600) score -= 5;
        if (totalSeconds > 900) score -= 5;
        score = Math.max(0, Math.min(100, score));

        // Indicadores motores
        const motorInteractions = totalDrops + totalReleases + totalBlocked;
        const motorEfficiency = motorInteractions > 0
            ? Math.round(((totalReleases) / motorInteractions) * 100)
            : 100;

        // Tiempo de actividad efectiva vs tiempo total
        const activeTime = sets.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
        const idleTime = Math.max(0, totalSeconds - activeTime);
        const efficiencyPct = totalSeconds > 0 ? Math.round((activeTime / totalSeconds) * 100) : 0;

        return {
            totalErrors, totalDrops, totalReleases, setsCompleted, totalSeconds,
            totalBlocked,
            avgSetDuration, longestSet, shortestSet,
            errorsByCode, sortedErrors, errorTimeline,
            worstStage, worstStageErrors, cleanStages,
            score, motorInteractions, motorEfficiency,
            activeTime, idleTime, efficiencyPct
        };
    }, [localSession]);

    const getPerformanceInfo = () => {
        const s = analytics.score;
        if (s >= 90) return { title: '¡Excelente desempeño!', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', scoreColor: 'text-green-600', strokeColor: '#2AA87E' };
        if (s >= 70) return { title: 'Buen desempeño', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', scoreColor: 'text-emerald-600', strokeColor: '#10b981' };
        if (s >= 50) return { title: 'Desempeño regular', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200', scoreColor: 'text-yellow-600', strokeColor: '#eab308' };
        return { title: 'Necesita práctica adicional', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', scoreColor: 'text-red-600', strokeColor: '#ef4444' };
    };

    const performance = getPerformanceInfo();
    const difficulty = getDifficultyInfo(localSession.activity_id);
    const recipe = getRecipeName(localSession.activity_id);

    const handleSaveEvaluation = async () => {
        if (!observaciones.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Observaciones vacías',
                text: 'Debe escribir sus observaciones clínicas antes de guardar.',
                confirmButtonColor: '#2AA87E'
            });
            return;
        }

        setSaving(true);
        try {
            const fullObservaciones = observaciones.trim();

            const result = await vrResultsService.updateSession(localSession.id, {
                observaciones: fullObservaciones
            });

            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Evaluación guardada',
                    text: 'La evaluación y observaciones se han guardado correctamente.',
                    confirmButtonColor: '#2AA87E',
                    timer: 2500
                });
                setIsEditing(false);
                const updated = {
                    ...localSession,
                    observaciones_terapeuta: fullObservaciones,
                    estado_revision: 'REVISADA'
                };
                setLocalSession(updated);
                if (onSessionUpdated) {
                    onSessionUpdated(result.data || updated);
                }
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: result.error || 'No se pudo guardar la evaluación.',
                    confirmButtonColor: '#2AA87E'
                });
            }
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error de conexión al guardar la evaluación.',
                confirmButtonColor: '#2AA87E'
            });
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { id: 'resumen', label: 'Resumen', icon: '📊' },
        { id: 'etapas', label: 'Etapas', icon: '📋' },
        { id: 'errores', label: 'Errores', icon: '❌', count: analytics.totalErrors },
        { id: 'motor', label: 'Motricidad', icon: '🤲' },
        { id: 'evaluacion', label: 'Evaluación', icon: '✍️' }
    ];

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[94vh] overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-[#2AA87E] to-[#35C99A] p-5 text-white flex-shrink-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-1 flex-wrap">
                                <h2 className="text-xl font-bold">
                                    Resumen Detallado de Sesión VR
                                </h2>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${isReviewed
                                    ? 'bg-white/30 text-white'
                                    : 'bg-orange-400 text-white'
                                    }`}>
                                    {isReviewed ? '✓ Revisada' : '⏳ Pendiente de revisión'}
                                </span>
                            </div>
                            <p className="text-white/80 flex items-center gap-2 text-sm flex-wrap">
                                <span>🍳 {recipe}</span>
                                <span>•</span>
                                <span>{difficulty.icon} {difficulty.label}</span>
                                <span>•</span>
                                <span>⏱️ {formatDurationDetailed(localSession.total_seconds)}</span>
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/20 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Quick Stats Bar */}
                    <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-white/20">
                        <QuickStat label="Puntuación" value={`${analytics.score}/100`} />
                        <QuickStat label="Etapas" value={`${analytics.setsCompleted}/4`} />
                        <QuickStat label="Errores" value={analytics.totalErrors} />
                        <QuickStat label="Caídas" value={analytics.totalDrops} />
                        <QuickStat label="Bloqueos" value={analytics.totalBlocked} />
                        <QuickStat label="Eficiencia" value={`${analytics.efficiencyPct}%`} />
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 bg-gray-50 px-4 flex-shrink-0">
                    <div className="flex gap-1 overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === tab.id
                                    ? 'border-[#2AA87E] text-[#2AA87E]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <span>{tab.icon}</span>
                                {tab.label}
                                {tab.count > 0 && (
                                    <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-bold">
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {activeTab === 'resumen' && (
                        <TabResumen
                            session={localSession}
                            analytics={analytics}
                            performance={performance}
                            formatFullDate={formatFullDate}
                        />
                    )}
                    {activeTab === 'etapas' && (
                        <TabEtapas session={localSession} />
                    )}
                    {activeTab === 'errores' && (
                        <TabErrores analytics={analytics} session={localSession} />
                    )}
                    {activeTab === 'motor' && (
                        <TabMotricidad analytics={analytics} session={localSession} />
                    )}
                    {activeTab === 'evaluacion' && (
                        <TabEvaluacion
                            isReviewed={isReviewed}
                            isEditing={isEditing}
                            setIsEditing={setIsEditing}
                            observaciones={observaciones}
                            setObservaciones={setObservaciones}
                            saving={saving}
                            handleSaveEvaluation={handleSaveEvaluation}
                            localSession={localSession}
                            analytics={analytics}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-4 bg-gray-50 flex-shrink-0 flex gap-2">
                    {!isReviewed && activeTab !== 'evaluacion' && (
                        <button
                            onClick={() => setActiveTab('evaluacion')}
                            className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <span>✍️</span> Evaluar sesión
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-[#2AA87E] hover:bg-[#239469] text-white rounded-xl font-medium transition-colors"
                    >
                        Cerrar resumen
                    </button>
                </div>
            </div>
        </div>
    );
};

// ========================================
// Quick stat en header
// ========================================
const QuickStat = ({ label, value }) => (
    <div className="text-center">
        <p className="text-white font-bold text-sm">{value}</p>
        <p className="text-white/60 text-xs">{label}</p>
    </div>
);

// ========================================
// Sub-componentes de secciones
// ========================================

const SectionHeader = ({ title, subtitle }) => (
    <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#2AA87E] rounded-full"></span>
            {title}
        </h3>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5 ml-3.5">{subtitle}</p>}
    </div>
);

const InfoCard = ({ icon, label, value }) => (
    <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-xs text-gray-500 mb-1">{icon} {label}</p>
        <p className="font-medium text-gray-800 text-sm">{value}</p>
    </div>
);

const MetricCard = ({ icon, value, label, maxValue, color, tooltip }) => {
    const colorClasses = {
        green: 'bg-green-50 border-green-200',
        yellow: 'bg-yellow-50 border-yellow-200',
        red: 'bg-red-50 border-red-200',
        blue: 'bg-blue-50 border-blue-200',
        purple: 'bg-purple-50 border-purple-200',
        orange: 'bg-orange-50 border-orange-200',
        emerald: 'bg-emerald-50 border-emerald-200'
    };
    const textColors = {
        green: 'text-green-700',
        yellow: 'text-yellow-700',
        red: 'text-red-700',
        blue: 'text-blue-700',
        purple: 'text-purple-700',
        orange: 'text-orange-700',
        emerald: 'text-emerald-700'
    };

    return (
        <div className={`${colorClasses[color] || 'bg-gray-50 border-gray-200'} border rounded-xl p-3 text-center`} title={tooltip}>
            <div className="text-2xl mb-1">{icon}</div>
            <p className={`text-xl font-bold ${textColors[color] || 'text-gray-700'}`}>
                {value}{maxValue && <span className="text-sm font-normal text-gray-400">/{maxValue}</span>}
            </p>
            <p className="text-xs text-gray-600">{label}</p>
        </div>
    );
};

// ========================================
// TAB: Resumen general
// ========================================

const TabResumen = ({ session, analytics, performance, formatFullDate }) => {
    return (
        <>
            {/* Información General */}
            <section>
                <SectionHeader title="Información General" />
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    <InfoCard icon="📅" label="Inicio de sesión" value={formatFullDate(session.started_at)} />
                    <InfoCard icon="🏁" label="Fin de sesión" value={formatFullDate(session.ended_at)} />
                    <InfoCard icon="⏱️" label="Duración total" value={formatDurationDetailed(session.total_seconds)} />
                    <InfoCard icon="🎯" label="ID Participante" value={session.participant_id || '-'} />
                    <InfoCard icon="🎮" label="Actividad" value={getActivityDisplayName(session.activity_id)} />
                    <InfoCard icon="📊" label="Versión esquema" value={session.schema_version || 'N/A'} />
                </div>
            </section>

            {/* Puntuación con score circular */}
            <section>
                <SectionHeader title="Puntuación y Desempeño" subtitle="Puntuación calculada en base a errores, caídas, bloqueos y etapas completadas" />
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex items-center justify-center">
                        <div className="relative w-32 h-32">
                            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                                <circle
                                    cx="50" cy="50" r="42" fill="none"
                                    stroke={performance.strokeColor}
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray={`${analytics.score * 2.64} 264`}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-3xl font-bold ${performance.scoreColor}`}>{analytics.score}</span>
                                <span className="text-xs text-gray-500">/ 100</span>
                            </div>
                        </div>
                    </div>
                    <div className={`flex-1 ${performance.bg} ${performance.border} border rounded-xl p-4`}>
                        <h4 className={`font-semibold ${performance.color} mb-2 text-base`}>{performance.title}</h4>
                        <div className="text-sm text-gray-700 space-y-2">
                            <p>
                                {analytics.score >= 90
                                    ? 'El paciente completó la actividad con un rendimiento sobresaliente. Demuestra buen nivel de atención, memoria de trabajo y coordinación motora.'
                                    : analytics.score >= 70
                                        ? 'El paciente completó la mayoría de las etapas con algunos errores menores. Muestra buena capacidad cognitiva con áreas puntuales de mejora.'
                                        : analytics.score >= 50
                                            ? 'El paciente presentó dificultades durante la sesión. Se recomienda continuar practicando y considerar actividades de menor dificultad.'
                                            : 'Se detectaron múltiples errores y dificultades significativas. Se sugiere revisar las etapas problemáticas y considerar actividades de menor dificultad progresivamente.'
                                }
                            </p>

                            {/* Hallazgos clave */}
                            <div className="mt-2 space-y-1">
                                <p className="font-medium text-gray-800">Hallazgos clave:</p>
                                <ul className="list-disc list-inside text-gray-600 text-xs space-y-0.5">
                                    <li>Completó {analytics.setsCompleted} de 4 etapas</li>
                                    {analytics.totalErrors > 0 && <li>Cometió {analytics.totalErrors} error{analytics.totalErrors !== 1 ? 'es' : ''} durante la sesión</li>}
                                    {analytics.totalErrors === 0 && <li>No cometió errores durante la sesión</li>}
                                    {analytics.totalDrops > 0 && <li>Se le cayeron objetos {analytics.totalDrops} vez{analytics.totalDrops !== 1 ? 'es' : ''}</li>}
                                    {analytics.totalBlocked > 0 && <li>Fue bloqueado {analytics.totalBlocked} vez{analytics.totalBlocked !== 1 ? 'es' : ''} por acciones incorrectas</li>}
                                    {analytics.cleanStages.length > 0 && <li>Etapa{analytics.cleanStages.length !== 1 ? 's' : ''} sin errores: {analytics.cleanStages.map(s => getSetNameSpanish(s.set_name)).join(', ')}</li>}
                                    {analytics.worstStage && analytics.worstStageErrors > 0 && (
                                        <li>Mayor dificultad: {getSetNameSpanish(analytics.worstStage.set_name)} ({analytics.worstStageErrors} errores)</li>
                                    )}
                                    <li>Eficiencia temporal: {analytics.efficiencyPct}% del tiempo fue actividad efectiva</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Métricas globales */}
            <section>
                <SectionHeader title="Métricas Globales de la Sesión" />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <MetricCard icon="✅" value={analytics.setsCompleted} label="Etapas completadas" maxValue="4" color="green" />
                    <MetricCard icon="❌" value={analytics.totalErrors} label="Total errores"
                        color={analytics.totalErrors === 0 ? 'green' : analytics.totalErrors <= 2 ? 'yellow' : 'red'} />
                    <MetricCard icon="👋" value={analytics.totalDrops} label="Objetos caídos" color="blue"
                        tooltip="Veces que el paciente dejó caer objetos" />
                    <MetricCard icon="🤲" value={analytics.totalReleases} label="Objetos liberados" color="purple"
                        tooltip="Veces que soltó objetos intencionalmente" />
                    <MetricCard icon="🚫" value={analytics.totalBlocked} label="Bloqueos" color="red"
                        tooltip="Acciones bloqueadas por incorrectas" />
                    <MetricCard icon="⏱️" value={vrResultsService.formatDuration(analytics.avgSetDuration)} label="Prom. por etapa" color="blue" />
                </div>
            </section>

            {/* Cronología visual */}
            {(session.sets && session.sets.length > 0) && (
                <section>
                    <SectionHeader title="Cronología de la Sesión" subtitle="Proporción de tiempo por cada etapa. Las barras rojas indican etapas con errores." />
                    <SessionTimeline session={session} />
                </section>
            )}

            {/* Tiempo detallado */}
            <section>
                <SectionHeader title="Distribución del Tiempo" />
                <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="flex-1">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Actividad efectiva</span>
                                <span>{analytics.efficiencyPct}%</span>
                            </div>
                            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[#2AA87E] rounded-full transition-all"
                                    style={{ width: `${analytics.efficiencyPct}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center text-sm">
                        <div>
                            <p className="font-bold text-gray-800">{formatDurationDetailed(session.total_seconds)}</p>
                            <p className="text-xs text-gray-500">Tiempo total</p>
                        </div>
                        <div>
                            <p className="font-bold text-green-600">{formatDurationDetailed(analytics.activeTime)}</p>
                            <p className="text-xs text-gray-500">Tiempo activo</p>
                        </div>
                        <div>
                            <p className="font-bold text-orange-600">{formatDurationDetailed(analytics.idleTime)}</p>
                            <p className="text-xs text-gray-500">Tiempo inactivo</p>
                        </div>
                    </div>
                    {analytics.longestSet && analytics.shortestSet && session.sets?.length > 1 && (
                        <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-xs text-gray-500">Etapa más larga</p>
                                <p className="font-medium text-gray-800">
                                    {getSetNameSpanish(analytics.longestSet.set_name)}: {formatDurationDetailed(analytics.longestSet.duration_seconds)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Etapa más corta</p>
                                <p className="font-medium text-gray-800">
                                    {getSetNameSpanish(analytics.shortestSet.set_name)}: {formatDurationDetailed(analytics.shortestSet.duration_seconds)}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Explicación de etapas */}
            <section>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                        <span>💡</span> ¿Qué significan las etapas?
                    </h4>
                    <div className="text-sm text-blue-700 space-y-1">
                        <p><strong>Ingredientes:</strong> El paciente debe identificar y recoger los ingredientes correctos.</p>
                        <p><strong>Utensilios:</strong> Selección de los utensilios necesarios para la preparación.</p>
                        <p><strong>Preparación:</strong> Ejecutar los pasos de cocina (hervir agua, agregar café, etc.).</p>
                        <p><strong>Organización:</strong> Limpiar y devolver los objetos a su lugar original.</p>
                    </div>
                </div>
            </section>
        </>
    );
};

// ========================================
// TAB: Etapas detalladas
// ========================================

const TabEtapas = ({ session }) => {
    const sets = session.sets || [];

    if (sets.length === 0) {
        return (
            <div className="text-center py-12 text-gray-400">
                <p className="text-4xl mb-2">📋</p>
                <p>No hay información de etapas disponible para esta sesión.</p>
            </div>
        );
    }

    return (
        <>
            <SectionHeader
                title={`Detalle por Etapa (${sets.length} etapas)`}
                subtitle="Información detallada de cada etapa incluyendo duración, interacciones y errores específicos"
            />
            <div className="space-y-4">
                {sets.map((set, index) => (
                    <SetDetailCard key={set.id || index} set={set} index={index + 1} />
                ))}
            </div>

            {/* Tabla comparativa */}
            {sets.length > 1 && (
                <section className="mt-6">
                    <SectionHeader title="Comparativa entre Etapas" />
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Etapa</th>
                                    <th className="text-center px-3 py-2.5 font-semibold text-gray-600">Duración</th>
                                    <th className="text-center px-3 py-2.5 font-semibold text-gray-600">Errores</th>
                                    <th className="text-center px-3 py-2.5 font-semibold text-gray-600">Bloqueos</th>
                                    <th className="text-center px-3 py-2.5 font-semibold text-gray-600">Caídas</th>
                                    <th className="text-center px-3 py-2.5 font-semibold text-gray-600">Liberaciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {sets.map((set, idx) => {
                                    const errCount = set.errors?.length || set.errors_count || 0;
                                    return (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-4 py-2.5 font-medium text-gray-800">{getSetNameSpanish(set.set_name)}</td>
                                            <td className="text-center px-3 py-2.5">{vrResultsService.formatDuration(set.duration_seconds)}</td>
                                            <td className={`text-center px-3 py-2.5 font-bold ${errCount === 0 ? 'text-green-600' : 'text-red-600'}`}>{errCount}</td>
                                            <td className="text-center px-3 py-2.5">{set.blocked_count || 0}</td>
                                            <td className="text-center px-3 py-2.5">{set.drops_count || 0}</td>
                                            <td className="text-center px-3 py-2.5">{set.releases_count || 0}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </>
    );
};

// ========================================
// TAB: Errores detallados
// ========================================

const TabErrores = ({ analytics, session }) => {
    const { sortedErrors, errorTimeline, totalErrors } = analytics;

    if (totalErrors === 0) {
        return (
            <div className="text-center py-12 text-gray-400">
                <p className="text-4xl mb-2">✅</p>
                <p className="text-lg font-medium text-green-600">¡Sin errores!</p>
                <p className="text-sm text-gray-500 mt-1">El paciente completó la sesión sin cometer errores.</p>
            </div>
        );
    }

    return (
        <>
            {/* Resumen de errores por tipo */}
            <section>
                <SectionHeader
                    title={`Errores por Tipo (${totalErrors} total)`}
                    subtitle="Errores agrupados por tipo con frecuencia, etapas afectadas y objetos involucrados"
                />
                <div className="space-y-2">
                    {sortedErrors.map(([code, info]) => (
                        <div key={code} className="bg-white border border-red-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-red-500">⚠️</span>
                                        <p className="font-semibold text-red-800">{getErrorDisplayName(code)}</p>
                                    </div>
                                    {info.message && (
                                        <p className="text-xs text-gray-500 mt-1 ml-7">{info.message}</p>
                                    )}
                                    <div className="flex flex-wrap gap-1.5 mt-2 ml-7">
                                        {Array.from(info.stages).map(stage => (
                                            <span key={stage} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                                                📋 {getSetNameSpanish(stage)}
                                            </span>
                                        ))}
                                        {info.contexts.length > 0 && (
                                            [...new Set(info.contexts)].map((ctx, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">
                                                    🎯 {formatObjectName(ctx)}
                                                </span>
                                            ))
                                        )}
                                    </div>
                                </div>
                                <div className="ml-3 flex flex-col items-center">
                                    <span className="px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-lg font-bold min-w-[36px] text-center">
                                        {info.count}
                                    </span>
                                    <span className="text-xs text-gray-400 mt-0.5">veces</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Línea de tiempo de errores */}
            {errorTimeline.length > 0 && (
                <section>
                    <SectionHeader
                        title="Línea de Tiempo de Errores"
                        subtitle="Orden cronológico de errores durante la sesión"
                    />
                    <div className="bg-gray-50 rounded-xl p-4">
                        <div className="relative pl-6 border-l-2 border-red-200 space-y-3">
                            {errorTimeline.map((err, idx) => (
                                <div key={idx} className="relative">
                                    <div className="absolute -left-[1.85rem] w-3 h-3 bg-red-400 rounded-full border-2 border-white"></div>
                                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-gray-800">{getErrorDisplayName(err.code)}</p>
                                            <span className="text-xs text-gray-400">{formatTimestamp(err.time)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                            <span>📋 {getSetNameSpanish(err.setName)}</span>
                                            {err.objeto_contexto && (
                                                <span>🎯 {formatObjectName(err.objeto_contexto)}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Distribución visual de errores por etapa */}
            <section>
                <SectionHeader title="Distribución de Errores por Etapa" />
                <div className="bg-gray-50 rounded-xl p-4">
                    <div className="space-y-2">
                        {(session.sets || []).map((set, idx) => {
                            const errCount = set.errors?.length || set.errors_count || 0;
                            const maxErrors = Math.max(...(session.sets || []).map(s => s.errors?.length || s.errors_count || 0), 1);
                            const pct = (errCount / maxErrors) * 100;

                            return (
                                <div key={idx} className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-gray-600 w-28 text-right">
                                        {getSetNameSpanish(set.set_name)}
                                    </span>
                                    <div className="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all flex items-center justify-end pr-2 ${errCount === 0 ? 'bg-green-400' : 'bg-red-400'}`}
                                            style={{ width: errCount === 0 ? '0%' : `${Math.max(pct, 15)}%` }}
                                        >
                                            {errCount > 0 && (
                                                <span className="text-white text-xs font-bold">{errCount}</span>
                                            )}
                                        </div>
                                    </div>
                                    {errCount === 0 && <span className="text-green-500 text-xs font-medium">✓ Sin errores</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>
        </>
    );
};

// ========================================
// TAB: Motricidad e interacciones
// ========================================

const TabMotricidad = ({ analytics, session }) => {
    const sets = session.sets || [];

    return (
        <>
            {/* Resumen de motricidad */}
            <section>
                <SectionHeader
                    title="Indicadores de Motricidad e Interacción"
                    subtitle="Análisis de las interacciones físicas del paciente con los objetos del entorno VR"
                />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <MetricCard icon="👋" value={analytics.totalDrops} label="Objetos caídos" color="blue"
                        tooltip="Objetos que el paciente dejó caer involuntariamente" />
                    <MetricCard icon="🤲" value={analytics.totalReleases} label="Liberaciones" color="purple"
                        tooltip="Objetos soltados intencionalmente" />
                    <MetricCard icon="🚫" value={analytics.totalBlocked} label="Bloqueos" color="red"
                        tooltip="Acciones bloqueadas por ser incorrectas" />
                    <MetricCard icon="📈" value={`${analytics.motorEfficiency}%`} label="Eficiencia motora" color="emerald"
                        tooltip="Porcentaje de interacciones exitosas vs fallidas" />
                </div>
            </section>

            {/* Eficiencia motora visual */}
            <section>
                <SectionHeader title="Eficiencia Motora General" />
                <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-center mb-4">
                        <div className="relative w-36 h-36">
                            <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                                <circle
                                    cx="50" cy="50" r="42" fill="none"
                                    stroke={analytics.motorEfficiency >= 80 ? '#2AA87E' : analytics.motorEfficiency >= 50 ? '#eab308' : '#ef4444'}
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                    strokeDasharray={`${analytics.motorEfficiency * 2.64} 264`}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-bold text-gray-800">{analytics.motorEfficiency}%</span>
                                <span className="text-xs text-gray-500">Eficiencia</span>
                            </div>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 text-center">
                        {analytics.motorEfficiency >= 80
                            ? 'Excelente control motor. El paciente manipula los objetos con buena precisión.'
                            : analytics.motorEfficiency >= 50
                                ? 'Control motor aceptable. Algunas dificultades al manipular objetos.'
                                : 'Dificultades significativas en el control motor. Se recomienda supervisión cercana.'}
                    </p>
                </div>
            </section>

            {/* Motricidad por etapa */}
            {sets.length > 0 && (
                <section>
                    <SectionHeader title="Interacciones por Etapa" subtitle="Detalle de caídas, bloqueos y liberaciones en cada etapa" />
                    <div className="space-y-2">
                        {sets.map((set, idx) => {
                            const totalInteractions = (set.drops_count || 0) + (set.releases_count || 0) + (set.blocked_count || 0);
                            return (
                                <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold text-gray-800">
                                            {getSetNameSpanish(set.set_name)}
                                        </h4>
                                        <span className="text-xs text-gray-400">
                                            {totalInteractions} interacciones
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="bg-blue-50 rounded-lg p-2 text-center">
                                            <p className="text-lg font-bold text-blue-700">{set.drops_count || 0}</p>
                                            <p className="text-xs text-blue-600">Caídas</p>
                                        </div>
                                        <div className="bg-red-50 rounded-lg p-2 text-center">
                                            <p className="text-lg font-bold text-red-700">{set.blocked_count || 0}</p>
                                            <p className="text-xs text-red-600">Bloqueos</p>
                                        </div>
                                        <div className="bg-purple-50 rounded-lg p-2 text-center">
                                            <p className="text-lg font-bold text-purple-700">{set.releases_count || 0}</p>
                                            <p className="text-xs text-purple-600">Liberaciones</p>
                                        </div>
                                    </div>
                                    {totalInteractions > 0 && (
                                        <div className="flex h-2 rounded-full overflow-hidden mt-2">
                                            {(set.drops_count || 0) > 0 && (
                                                <div className="bg-blue-400 h-full" style={{ width: `${((set.drops_count || 0) / totalInteractions) * 100}%` }}></div>
                                            )}
                                            {(set.blocked_count || 0) > 0 && (
                                                <div className="bg-red-400 h-full" style={{ width: `${((set.blocked_count || 0) / totalInteractions) * 100}%` }}></div>
                                            )}
                                            {(set.releases_count || 0) > 0 && (
                                                <div className="bg-purple-400 h-full" style={{ width: `${((set.releases_count || 0) / totalInteractions) * 100}%` }}></div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}
        </>
    );
};

// ========================================
// TAB: Evaluación del Terapeuta
// ========================================

const TabEvaluacion = ({
    isReviewed, isEditing, setIsEditing,
    observaciones, setObservaciones,
    saving, handleSaveEvaluation,
    localSession, analytics
}) => {
    // Texto de observaciones guardadas (sin prefijo de calificación legacy)
    const savedObservacionesText = useMemo(() => {
        const obs = localSession.observaciones_terapeuta || '';
        return obs.replace(/\[Calificación: \d\/5 - [^\]]+\]\n?/, '').trim();
    }, [localSession.observaciones_terapeuta]);

    return (
        <>
            {/* Resumen de datos automáticos (solo lectura) */}
            <section>
                <SectionHeader
                    title="Datos de la Sesión (Automáticos)"
                    subtitle="Información generada por el videojuego — no se puede modificar"
                />
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
                            <p className="text-2xl font-bold text-gray-800">{analytics.score}<span className="text-sm font-normal text-gray-400">/100</span></p>
                            <p className="text-xs text-gray-500 mt-1">Puntuación</p>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
                            <p className={`text-2xl font-bold ${analytics.totalErrors === 0 ? 'text-green-600' : 'text-red-600'}`}>{analytics.totalErrors}</p>
                            <p className="text-xs text-gray-500 mt-1">Errores</p>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
                            <p className="text-2xl font-bold text-blue-600">{analytics.setsCompleted}<span className="text-sm font-normal text-gray-400">/4</span></p>
                            <p className="text-xs text-gray-500 mt-1">Etapas completadas</p>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
                            <p className="text-2xl font-bold text-purple-600">{analytics.efficiencyPct}%</p>
                            <p className="text-xs text-gray-500 mt-1">Eficiencia</p>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 text-center mt-3 flex items-center justify-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Estos datos son generados por el videojuego y no pueden editarse
                    </p>
                </div>
            </section>

            {/* Observaciones del terapeuta (editable) */}
            <section>
                <SectionHeader
                    title="Observaciones Clínicas del Terapeuta"
                    subtitle="Este es el único campo que puedes completar desde el dashboard"
                />

                <div className="bg-white border-2 border-[#2AA87E]/30 rounded-xl p-5">
                    {/* Badge de estado */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${isReviewed ? 'bg-[#2AA87E]' : 'bg-orange-400'}`}></span>
                            <span className="text-sm font-medium text-gray-700">
                                {isReviewed
                                    ? 'Sesión revisada — observaciones guardadas'
                                    : 'Sesión pendiente de revisión'}
                            </span>
                        </div>
                        {isReviewed && !isEditing && (
                            <button
                                onClick={() => {
                                    setIsEditing(true);
                                    setObservaciones(savedObservacionesText);
                                }}
                                className="text-sm text-[#2AA87E] hover:text-[#239469] font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-[#2AA87E]/10 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Editar observaciones
                            </button>
                        )}
                    </div>

                    {/* Vista guardada */}
                    {isReviewed && !isEditing ? (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                            <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider flex items-center gap-1.5">
                                <span>📝</span> Observaciones registradas
                            </p>
                            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm">
                                {savedObservacionesText || 'Sin observaciones adicionales.'}
                            </p>
                        </div>
                    ) : (
                        /* Formulario de observaciones */
                        <div className="space-y-4">
                            {/* Guía para el terapeuta */}
                            <div className="bg-[#2AA87E]/5 border border-[#2AA87E]/20 rounded-lg p-3">
                                <p className="text-xs font-medium text-[#2AA87E] mb-1.5">💡 Sugerencias para las observaciones:</p>
                                <ul className="text-xs text-gray-600 space-y-0.5 list-disc list-inside">
                                    <li>Describa el desempeño general del paciente en esta sesión</li>
                                    <li>Señale dificultades observadas y posibles causas</li>
                                    <li>Incluya recomendaciones terapéuticas o plan de acción</li>
                                    <li>Compare con sesiones anteriores si es relevante</li>
                                </ul>
                            </div>

                            {/* Textarea de observaciones */}
                            <div>
                                <textarea
                                    value={observaciones}
                                    onChange={(e) => setObservaciones(e.target.value)}
                                    placeholder="Ej: El paciente mostró dificultad en la etapa de ingredientes, confundiendo el azúcar con la sal. Se recomienda reforzar la identificación de objetos antes de avanzar a actividades de mayor dificultad..."
                                    className="w-full border-2 border-gray-200 rounded-xl p-4 text-sm min-h-[160px] resize-y focus:ring-2 focus:ring-[#2AA87E]/30 focus:border-[#2AA87E] outline-none transition-colors placeholder:text-gray-300"
                                    maxLength={2000}
                                />
                                <div className="flex items-center justify-between mt-1.5">
                                    <span className="text-xs text-gray-400">{observaciones.length}/2000 caracteres</span>
                                </div>
                            </div>

                            {/* Botones de acción */}
                            <div className="flex gap-2 pt-1">
                                {isEditing && (
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setObservaciones(localSession.observaciones_terapeuta || '');
                                        }}
                                        className="px-5 py-3 text-sm text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                )}
                                <button
                                    onClick={handleSaveEvaluation}
                                    disabled={saving || !observaciones.trim()}
                                    className="flex-1 px-5 py-3 bg-[#2AA87E] hover:bg-[#239469] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            {isReviewed ? 'Actualizar observaciones' : 'Guardar observaciones y marcar como revisada'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
};

// ========================================
// Cronología visual de la sesión
// ========================================

const SessionTimeline = ({ session }) => {
    if (!session.sets || session.sets.length === 0) return null;
    const totalDuration = session.total_seconds || 1;

    return (
        <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-1 mb-3 h-8 rounded-lg overflow-hidden">
                {session.sets.map((set, idx) => {
                    const width = ((set.duration_seconds || 0) / totalDuration) * 100;
                    const hasErrors = (set.errors?.length || set.errors_count || 0) > 0;
                    const colors = [
                        hasErrors ? 'bg-red-400' : 'bg-green-400',
                        hasErrors ? 'bg-red-500' : 'bg-emerald-400',
                        hasErrors ? 'bg-orange-400' : 'bg-teal-400',
                        hasErrors ? 'bg-red-300' : 'bg-cyan-400'
                    ];
                    return (
                        <div
                            key={idx}
                            className={`${colors[idx % 4]} h-full rounded transition-all relative group cursor-default`}
                            style={{ width: `${Math.max(width, 5)}%` }}
                            title={`${getSetNameSpanish(set.set_name)}: ${vrResultsService.formatDuration(set.duration_seconds)} — ${(set.errors?.length || set.errors_count || 0)} errores`}
                        >
                            <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                {getSetNameSpanish(set.set_name).substring(0, 4)}
                            </span>
                        </div>
                    );
                })}
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                {session.sets.map((set, idx) => {
                    const errCount = set.errors?.length || set.errors_count || 0;
                    return (
                        <div key={idx} className="flex items-center gap-1">
                            <span className="font-medium">E{idx + 1}:</span>
                            <span>{getSetNameSpanish(set.set_name)}</span>
                            <span className="text-gray-400">({vrResultsService.formatDuration(set.duration_seconds)})</span>
                            {errCount > 0 && <span className="text-red-500 font-bold">⚠ {errCount}</span>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ========================================
// Tarjeta de detalle de una etapa
// ========================================

const SetDetailCard = ({ set, index }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const setNames = {
        'Ingredients': { name: 'Ingredientes', icon: '🥄', description: 'Recolección de ingredientes necesarios' },
        'Utensils': { name: 'Utensilios', icon: '🍳', description: 'Selección de utensilios de cocina' },
        'Preparation': { name: 'Preparación', icon: '☕', description: 'Proceso de cocción y preparación' },
        'Organization': { name: 'Organización', icon: '🧹', description: 'Limpieza y orden del espacio' }
    };

    const setInfo = setNames[set.set_name] || { name: set.set_name, icon: '📋', description: '' };
    const hasErrors = set.errors && set.errors.length > 0;
    const errorCount = set.errors?.length || set.errors_count || 0;
    const totalInteractions = (set.drops_count || 0) + (set.releases_count || 0) + (set.blocked_count || 0);

    const getStageStatus = () => {
        if (errorCount === 0) return { text: 'Sin errores', class: 'text-green-600 bg-green-100' };
        if (errorCount === 1) return { text: '1 error', class: 'text-yellow-600 bg-yellow-100' };
        return { text: `${errorCount} errores`, class: 'text-red-600 bg-red-100' };
    };

    const status = getStageStatus();

    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
            {/* Header clickeable */}
            <div
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
                            {setInfo.icon}
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900">
                                Etapa {index}: {setInfo.name}
                            </h4>
                            <p className="text-xs text-gray-500">{setInfo.description}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.class}`}>
                            {status.text}
                        </span>
                        <svg
                            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>

                {/* Métricas compactas siempre visibles */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-3">
                    <span className="flex items-center gap-1" title="Duración de la etapa">
                        <span>⏱️</span> {vrResultsService.formatDuration(set.duration_seconds)}
                    </span>
                    <span className="flex items-center gap-1" title="Acciones bloqueadas">
                        <span>🚫</span> {set.blocked_count || 0} bloqueos
                    </span>
                    <span className="flex items-center gap-1" title="Objetos que se cayeron">
                        <span>👇</span> {set.drops_count || 0} caídas
                    </span>
                    <span className="flex items-center gap-1" title="Objetos liberados">
                        <span>🤲</span> {set.releases_count || 0} liberaciones
                    </span>
                    {totalInteractions > 0 && (
                        <span className="flex items-center gap-1 text-gray-400">
                            Total: {totalInteractions} interacciones
                        </span>
                    )}
                </div>
            </div>

            {/* Contenido expandible */}
            {isExpanded && (
                <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50/50">
                    {/* Timestamps de la etapa */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white rounded-lg p-2">
                            <span className="text-gray-400">Inicio:</span>
                            <span className="ml-1 font-medium text-gray-700">{formatTimestamp(set.started_at)}</span>
                        </div>
                        <div className="bg-white rounded-lg p-2">
                            <span className="text-gray-400">Fin:</span>
                            <span className="ml-1 font-medium text-gray-700">{formatTimestamp(set.ended_at)}</span>
                        </div>
                    </div>

                    {/* Errores específicos de la etapa */}
                    {hasErrors && (
                        <div className="bg-red-50 rounded-lg p-3">
                            <p className="text-xs font-semibold text-red-700 mb-2">Errores en esta etapa:</p>
                            <ul className="space-y-2">
                                {set.errors.map((error, i) => (
                                    <li key={i} className="bg-white border border-red-100 rounded-lg p-2.5">
                                        <div className="flex items-start gap-2">
                                            <span className="text-red-400 mt-0.5">•</span>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-red-800">{getErrorDisplayName(error.code)}</p>
                                                <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                                                    <span>🕐 {formatTimestamp(error.occurred_at)}</span>
                                                    {error.objeto_contexto && (
                                                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">
                                                            🎯 {formatObjectName(error.objeto_contexto)}
                                                        </span>
                                                    )}
                                                </div>
                                                {error.message && (
                                                    <p className="text-xs text-gray-400 mt-1">{error.message}</p>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Estado de preparación */}
                    {set.set_name === 'Preparation' && (
                        <div className="bg-amber-50 rounded-lg p-3">
                            <p className="text-xs font-semibold text-amber-700 mb-2">Estado de preparación:</p>
                            <div className="flex flex-wrap gap-4 text-xs">
                                <span className={set.completion_coffee_added ? 'text-green-600' : 'text-gray-400'}>
                                    {set.completion_coffee_added ? '✅' : '❌'} Café agregado
                                </span>
                                <span className={set.completion_sugar_added ? 'text-green-600' : 'text-gray-400'}>
                                    {set.completion_sugar_added ? '✅' : '❌'} Azúcar agregada
                                </span>
                                {set.completion_cup_coffee_amount_01 !== null && set.completion_cup_coffee_amount_01 !== undefined && (
                                    <span className="text-amber-600">
                                        ☕ Nivel de taza: {Math.round(set.completion_cup_coffee_amount_01 * 100)}%
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Objetos retornados (Organization) */}
                    {set.returnedObjects && set.returnedObjects.length > 0 && (
                        <div className="bg-green-50 rounded-lg p-3">
                            <p className="text-xs font-semibold text-green-700 mb-2">Objetos organizados correctamente:</p>
                            <div className="flex flex-wrap gap-1">
                                {set.returnedObjects.map((obj, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-green-200 text-green-800 rounded text-xs">
                                        {formatObjectName(obj)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default VRSessionCard;
