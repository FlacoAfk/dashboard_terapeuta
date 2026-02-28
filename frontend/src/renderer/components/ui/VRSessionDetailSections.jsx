import React, { useMemo, useState } from 'react';
import vrResultsService from '../../services/vrResultsService';
import {
    getActivityDisplayName,
    getErrorDisplayName,
    formatObjectName,
    getSetNameSpanish,
    formatDurationDetailed,
    formatTimestamp
} from './vrSessionCardUtils';

export const QuickStat = ({ label, value }) => (
    <div className="text-center">
        <p className="text-white font-bold text-sm">{value}</p>
        <p className="text-white/60 text-xs">{label}</p>
    </div>
);

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

export const TabResumen = ({ session, analytics, performance, formatFullDate, isNeverStarted = false }) => {
    if (isNeverStarted) {
        return (
            <section>
                <SectionHeader
                    title="Sesión no iniciada"
                    subtitle="Se detectó una ejecución sin actividad real (por ejemplo, prueba de conexión o corte temprano)"
                />
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">⏸️</span>
                        <div>
                            <p className="text-sm font-semibold text-gray-800">No hay datos clínicos relevantes para analizar</p>
                            <p className="text-sm text-gray-600 mt-1">
                                Esta sesión no registró etapas completadas, errores ni aciertos, por lo que no representa una ejecución válida del ejercicio.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <InfoCard icon="🎯" label="ID Participante" value={session.participant_id || '-'} />
                        <InfoCard icon="🎮" label="Actividad" value={getActivityDisplayName(session.activity_id)} />
                        <InfoCard icon="📅" label="Fecha de registro" value={formatFullDate(session.started_at)} />
                    </div>
                </div>
            </section>
        );
    }

    return (
        <>
            <section>
                <SectionHeader title="Información General" />
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    <InfoCard icon="📅" label="Inicio de sesión" value={formatFullDate(session.started_at)} />
                    <InfoCard icon="🏁" label="Fin de sesión" value={formatFullDate(session.ended_at)} />
                    <InfoCard icon="⏱️" label="Duración total" value={formatDurationDetailed(session.total_seconds)} />
                    <InfoCard icon="🎯" label="ID Participante" value={session.participant_id || '-'} />
                    <InfoCard icon="🎮" label="Actividad" value={getActivityDisplayName(session.activity_id)} />
                    <InfoCard icon="📊" label="Versión de esquema" value={session.schema_version || 'N/A'} />
                </div>
            </section>

            <section>
                <SectionHeader title="Puntuación y Desempeño" subtitle="Puntuación calculada con base en errores, caídas, bloqueos y etapas completadas" />
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
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <SectionHeader title="Métricas Globales de la Sesión" />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <MetricCard icon="✅" value={analytics.setsCompleted} label="Etapas completadas" maxValue="4" color="green" />
                    <MetricCard icon="❌" value={analytics.totalErrors} label="Total errores" color={analytics.totalErrors === 0 ? 'green' : analytics.totalErrors <= 2 ? 'yellow' : 'red'} />
                    <MetricCard icon="👋" value={analytics.totalDrops} label="Objetos caídos" color="blue" tooltip="Veces que el paciente dejó caer objetos" />
                    <MetricCard icon="🤲" value={analytics.totalReleases} label="Objetos liberados" color="purple" tooltip="Veces que soltó objetos intencionalmente" />
                    <MetricCard icon="🚫" value={analytics.totalBlocked} label="Bloqueos" color="red" tooltip="Acciones bloqueadas por incorrectas" />
                    <MetricCard icon="⏱️" value={vrResultsService.formatDuration(analytics.avgSetDuration)} label="Prom. por etapa" color="blue" />
                </div>
            </section>

            {(session.sets && session.sets.length > 0) && (
                <section>
                    <SectionHeader title="Cronología de la Sesión" subtitle="Proporción de tiempo por cada etapa. Las barras rojas indican etapas con errores." />
                    <SessionTimeline session={session} />
                </section>
            )}
        </>
    );
};

export const TabEtapas = ({ session }) => {
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
            <SectionHeader title={`Detalle por Etapa (${sets.length} etapas)`} subtitle="Información detallada de cada etapa incluyendo duración, interacciones y errores específicos" />
            <div className="space-y-4">
                {sets.map((set, index) => (
                    <SetDetailCard key={set.id || index} set={set} index={index + 1} />
                ))}
            </div>
        </>
    );
};

export const TabErrores = ({ analytics, session }) => {
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
            <section>
                <SectionHeader title={`Errores por Tipo (${totalErrors} total)`} subtitle="Errores agrupados por tipo con frecuencia, etapas afectadas y objetos involucrados" />
                <div className="space-y-2">
                    {sortedErrors.map(([code, info]) => (
                        <div key={code} className="bg-white border border-red-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-red-500">⚠️</span>
                                        <p className="font-semibold text-red-800">{getErrorDisplayName(code)}</p>
                                    </div>
                                    {info.message && <p className="text-xs text-gray-500 mt-1 ml-7">{info.message}</p>}
                                </div>
                                <div className="ml-3 flex flex-col items-center">
                                    <span className="px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-lg font-bold min-w-[36px] text-center">{info.count}</span>
                                    <span className="text-xs text-gray-400 mt-0.5">veces</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {errorTimeline.length > 0 && (
                <section>
                    <SectionHeader title="Línea de Tiempo de Errores" subtitle="Orden cronológico de errores durante la sesión" />
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
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </>
    );
};

export const TabMotricidad = ({ analytics, session }) => {
    const sets = session.sets || [];

    return (
        <>
            <section>
                <SectionHeader title="Indicadores de Motricidad e Interacción" subtitle="Análisis de las interacciones físicas del paciente con los objetos del entorno VR" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <MetricCard icon="👋" value={analytics.totalDrops} label="Objetos caídos" color="blue" />
                    <MetricCard icon="🤲" value={analytics.totalReleases} label="Liberaciones" color="purple" />
                    <MetricCard icon="🚫" value={analytics.totalBlocked} label="Bloqueos" color="red" />
                    <MetricCard icon="📈" value={`${analytics.motorEfficiency}%`} label="Eficiencia motora" color="emerald" />
                </div>
            </section>

            {sets.length > 0 && (
                <section>
                    <SectionHeader title="Interacciones por Etapa" subtitle="Detalle de caídas, bloqueos y liberaciones en cada etapa" />
                    <div className="space-y-2">
                        {sets.map((set, idx) => {
                            const totalInteractions = (set.drops_count || 0) + (set.releases_count || 0) + (set.blocked_count || 0);
                            return (
                                <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold text-gray-800">{getSetNameSpanish(set.set_name)}</h4>
                                        <span className="text-xs text-gray-400">{totalInteractions} interacciones</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}
        </>
    );
};

export const TabEvaluacion = ({
    isReviewed,
    isEditing,
    setIsEditing,
    observaciones,
    setObservaciones,
    saving,
    handleSaveEvaluation,
    localSession,
    analytics,
    isNeverStarted = false
}) => {
    const savedObservacionesText = useMemo(() => {
        const obs = localSession.observaciones_terapeuta || '';
        return obs.replace(/\[Calificación: \d\/5 - [^\]]+\]\n?/, '').trim();
    }, [localSession.observaciones_terapeuta]);

    return (
        <>
            <section>
                <SectionHeader title="Datos de la Sesión (Automáticos)" subtitle="Información generada por el videojuego — no se puede modificar" />
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
                </div>
            </section>

            <section>
                <SectionHeader title="Observaciones Clínicas del Terapeuta" subtitle="Este es el único campo que puedes completar desde el dashboard" />

                <div className="bg-white border-2 border-[#2AA87E]/30 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${isNeverStarted ? 'bg-gray-400' : (isReviewed ? 'bg-[#2AA87E]' : 'bg-orange-400')}`}></span>
                            <span className="text-sm font-medium text-gray-700">
                                {isNeverStarted
                                    ? 'Sesión no iniciada — no requiere evaluación clínica'
                                    : isReviewed
                                        ? 'Sesión revisada — observaciones guardadas'
                                        : 'Sesión pendiente de revisión'}
                            </span>
                        </div>
                        {isReviewed && !isEditing && !isNeverStarted && (
                            <button
                                onClick={() => {
                                    setIsEditing(true);
                                    setObservaciones(savedObservacionesText);
                                }}
                                className="text-sm text-[#2AA87E] hover:text-[#239469] font-medium"
                            >
                                Editar observaciones
                            </button>
                        )}
                    </div>

                    {isNeverStarted ? (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                            <p className="text-sm text-gray-700">Esta sesión se marca como no iniciada porque no registra etapas completadas, errores ni aciertos.</p>
                        </div>
                    ) : isReviewed && !isEditing ? (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm">{savedObservacionesText || 'Sin observaciones adicionales.'}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <textarea
                                    value={observaciones}
                                    onChange={(event) => setObservaciones(event.target.value)}
                                    placeholder="Ej: El paciente mostró dificultad en la etapa de ingredientes..."
                                    className="w-full border-2 border-gray-200 rounded-xl p-4 text-sm min-h-[160px] resize-y focus:ring-2 focus:ring-[#2AA87E]/30 focus:border-[#2AA87E] outline-none transition-colors placeholder:text-gray-300"
                                    maxLength={2000}
                                />
                                <div className="flex items-center justify-between mt-1.5">
                                    <span className="text-xs text-gray-400">{observaciones.length}/2000 caracteres</span>
                                </div>
                            </div>

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
                                    disabled={saving || !observaciones.trim() || isNeverStarted}
                                    className="flex-1 px-5 py-3 bg-[#2AA87E] hover:bg-[#239469] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors"
                                >
                                    {saving ? 'Guardando...' : (isReviewed ? 'Actualizar observaciones' : 'Guardar observaciones y marcar como revisada')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
};

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
                        ></div>
                    );
                })}
            </div>
        </div>
    );
};

const SetDetailCard = ({ set, index }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const setNames = {
        Ingredients: { name: 'Ingredientes', icon: '🥄', description: 'Recolección de ingredientes necesarios' },
        Utensils: { name: 'Utensilios', icon: '🍳', description: 'Selección de utensilios de cocina' },
        Preparation: { name: 'Preparación', icon: '☕', description: 'Proceso de cocción y preparación' },
        Organization: { name: 'Organización', icon: '🧹', description: 'Limpieza y orden del espacio' }
    };

    const setInfo = setNames[set.set_name] || { name: set.set_name, icon: '📋', description: '' };
    const hasErrors = set.errors && set.errors.length > 0;
    const errorCount = set.errors?.length || set.errors_count || 0;

    const getStageStatus = () => {
        if (errorCount === 0) return { text: 'Sin errores', class: 'text-green-600 bg-green-100' };
        if (errorCount === 1) return { text: '1 error', class: 'text-yellow-600 bg-yellow-100' };
        return { text: `${errorCount} errores`, class: 'text-red-600 bg-red-100' };
    };

    const status = getStageStatus();

    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
            <div className="p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl">{setInfo.icon}</div>
                        <div>
                            <h4 className="font-semibold text-gray-900">Etapa {index}: {setInfo.name}</h4>
                            <p className="text-xs text-gray-500">{setInfo.description}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.class}`}>{status.text}</span>
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50/50">
                    {hasErrors && (
                        <div className="bg-red-50 rounded-lg p-3">
                            <p className="text-xs font-semibold text-red-700 mb-2">Errores en esta etapa:</p>
                            <ul className="space-y-2">
                                {(set.errors || []).map((error, indexError) => (
                                    <li key={indexError} className="bg-white border border-red-100 rounded-lg p-2.5">
                                        <p className="text-sm font-medium text-red-800">{getErrorDisplayName(error.code)}</p>
                                        {error.objeto_contexto && (
                                            <span className="text-xs text-gray-500">🎯 {formatObjectName(error.objeto_contexto)}</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
