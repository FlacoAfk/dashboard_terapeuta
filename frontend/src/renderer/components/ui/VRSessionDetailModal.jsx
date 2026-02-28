import React, { useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import vrResultsService from '../../services/vrResultsService';
import {
    isSessionNeverStarted,
    getDifficultyInfo,
    getRecipeName,
    formatDurationDetailed
} from './vrSessionCardUtils';
import {
    QuickStat,
    TabResumen,
    TabEtapas,
    TabErrores,
    TabMotricidad,
    TabEvaluacion
} from './VRSessionDetailSections';

const VRSessionDetailModal = ({ session, onClose, onSessionUpdated }) => {
    const [observaciones, setObservaciones] = useState(session.observaciones_terapeuta || '');
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [localSession, setLocalSession] = useState(session);
    const [activeTab, setActiveTab] = useState('resumen');
    const isNeverStarted = isSessionNeverStarted(localSession);

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

    const analytics = useMemo(() => {
        const sets = localSession.sets || [];
        const totalErrors = localSession.summary_total_errors || 0;
        const totalDrops = localSession.summary_total_drops || 0;
        const totalReleases = localSession.summary_total_releases || 0;
        const setsCompleted = localSession.summary_sets_completed || 0;
        const totalSeconds = localSession.total_seconds || 0;

        const totalBlocked = sets.reduce((acc, set) => acc + (set.blocked_count || 0), 0);
        const avgSetDuration = sets.length > 0
            ? sets.reduce((acc, set) => acc + (set.duration_seconds || 0), 0) / sets.length
            : 0;

        const longestSet = sets.length > 0
            ? sets.reduce((a, b) => (a.duration_seconds || 0) > (b.duration_seconds || 0) ? a : b)
            : null;
        const shortestSet = sets.length > 0
            ? sets.reduce((a, b) => (a.duration_seconds || 0) < (b.duration_seconds || 0) ? a : b)
            : null;

        const errorsByCode = {};
        const errorTimeline = [];
        sets.forEach((set) => {
            const setErrors = set.errors || [];
            setErrors.forEach((err) => {
                const code = err.code || 'UNKNOWN';
                if (!errorsByCode[code]) {
                    errorsByCode[code] = { count: 0, stages: new Set(), contexts: [], message: err.message };
                }
                errorsByCode[code].count += 1;
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

        const worstStage = sets.length > 0
            ? sets.reduce((a, b) => {
                const errA = (a.errors?.length || a.errors_count || 0);
                const errB = (b.errors?.length || b.errors_count || 0);
                return errA > errB ? a : b;
            })
            : null;
        const worstStageErrors = worstStage ? (worstStage.errors?.length || worstStage.errors_count || 0) : 0;

        const cleanStages = sets.filter((set) => (set.errors?.length || set.errors_count || 0) === 0);

        let score = 100;
        score -= totalErrors * 8;
        score -= totalDrops * 3;
        score -= totalBlocked * 2;
        score -= Math.max(0, (4 - setsCompleted)) * 15;
        if (totalSeconds > 600) score -= 5;
        if (totalSeconds > 900) score -= 5;
        score = Math.max(0, Math.min(100, score));

        if (isSessionNeverStarted(localSession)) {
            score = 0;
        }

        const motorInteractions = totalDrops + totalReleases + totalBlocked;
        const motorEfficiency = motorInteractions > 0
            ? Math.round(((totalReleases) / motorInteractions) * 100)
            : 100;

        const activeTime = sets.reduce((acc, set) => acc + (set.duration_seconds || 0), 0);
        const idleTime = Math.max(0, totalSeconds - activeTime);
        const efficiencyPct = totalSeconds > 0 ? Math.round((activeTime / totalSeconds) * 100) : 0;

        const adjustedMotorEfficiency = isSessionNeverStarted(localSession) ? 0 : motorEfficiency;
        const adjustedEfficiencyPct = isSessionNeverStarted(localSession) ? 0 : efficiencyPct;

        return {
            totalErrors,
            totalDrops,
            totalReleases,
            setsCompleted,
            totalSeconds,
            totalBlocked,
            avgSetDuration,
            longestSet,
            shortestSet,
            errorsByCode,
            sortedErrors,
            errorTimeline,
            worstStage,
            worstStageErrors,
            cleanStages,
            score,
            motorInteractions,
            motorEfficiency: adjustedMotorEfficiency,
            activeTime,
            idleTime,
            efficiencyPct: adjustedEfficiencyPct
        };
    }, [localSession]);

    const getPerformanceInfo = () => {
        const score = analytics.score;
        if (isNeverStarted) return { title: 'Sesión no iniciada', color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200', scoreColor: 'text-gray-600', strokeColor: '#9ca3af' };
        if (score >= 90) return { title: '¡Excelente desempeño!', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', scoreColor: 'text-green-600', strokeColor: '#2AA87E' };
        if (score >= 70) return { title: 'Buen desempeño', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', scoreColor: 'text-emerald-600', strokeColor: '#10b981' };
        if (score >= 50) return { title: 'Desempeño regular', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200', scoreColor: 'text-yellow-600', strokeColor: '#eab308' };
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
        } catch {
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" role="button" tabIndex={-1} aria-label="Cerrar modal" onClick={onClose} onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[94vh] overflow-hidden flex flex-col"
                role="dialog"
                aria-modal="true"
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
            >
                <div className="bg-gradient-to-r from-[#2AA87E] to-[#35C99A] p-5 text-white flex-shrink-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-1 flex-wrap">
                                <h2 className="text-xl font-bold">Resumen Detallado de Sesión VR</h2>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${isNeverStarted
                                    ? 'bg-gray-500 text-white'
                                    : isReviewed
                                        ? 'bg-white/30 text-white'
                                        : 'bg-orange-400 text-white'
                                    }`}>
                                    {isNeverStarted ? '⏸️ No iniciada' : (isReviewed ? '✓ Revisada' : '⏳ Pendiente de revisión')}
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

                    <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-white/20">
                        <QuickStat label="Puntuación" value={`${analytics.score}/100`} />
                        <QuickStat label="Etapas" value={`${analytics.setsCompleted}/4`} />
                        <QuickStat label="Errores" value={analytics.totalErrors} />
                        <QuickStat label="Caídas" value={analytics.totalDrops} />
                        <QuickStat label="Bloqueos" value={analytics.totalBlocked} />
                        <QuickStat label="Eficiencia" value={`${analytics.efficiencyPct}%`} />
                    </div>
                </div>

                <div className="border-b border-gray-200 bg-gray-50 px-4 flex-shrink-0">
                    <div className="flex gap-1 overflow-x-auto">
                        {tabs.map((tab) => (
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

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {activeTab === 'resumen' && (
                        <TabResumen
                            session={localSession}
                            analytics={analytics}
                            performance={performance}
                            formatFullDate={formatFullDate}
                            isNeverStarted={isNeverStarted}
                        />
                    )}
                    {activeTab === 'etapas' && <TabEtapas session={localSession} />}
                    {activeTab === 'errores' && <TabErrores analytics={analytics} session={localSession} />}
                    {activeTab === 'motor' && <TabMotricidad analytics={analytics} session={localSession} />}
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
                            isNeverStarted={isNeverStarted}
                        />
                    )}
                </div>

                <div className="border-t border-gray-200 p-4 bg-gray-50 flex-shrink-0 flex gap-2">
                    {!isReviewed && !isNeverStarted && activeTab !== 'evaluacion' && (
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

export default VRSessionDetailModal;
