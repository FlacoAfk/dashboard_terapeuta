/**
 * ========================================
 * COMPONENTE: VRSessionCard
 * ========================================
 * 
 * Tarjeta compacta para listar sesiones VR.
 * Al hacer clic, abre un modal con el detalle completo.
 */

import React, { useState } from 'react';
import vrResultsService from '../../services/vrResultsService';

/**
 * Tarjeta de sesión VR (vista compacta para lista)
 */
const VRSessionCard = ({ session }) => {
    const [showModal, setShowModal] = useState(false);
    
    // Formatear fecha en español
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

    // Formatear hora
    const formatTime = (isoDate) => {
        if (!isoDate) return '';
        const date = new Date(isoDate);
        return date.toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    // Determinar estado general de la sesión
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

    const status = getStatusInfo();

    return (
        <>
            {/* Tarjeta compacta - clickeable */}
            <div 
                onClick={() => setShowModal(true)}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg hover:border-[#2AA87E] transition-all cursor-pointer group"
            >
                <div className="flex items-center justify-between">
                    {/* Información principal */}
                    <div className="flex items-center gap-4">
                        {/* Indicador de estado */}
                        <div className={`w-12 h-12 ${status.color} rounded-xl flex items-center justify-center text-white text-xl shadow-sm`}>
                            {status.icon}
                        </div>
                        
                        <div>
                            <h4 className="font-semibold text-gray-900 group-hover:text-[#2AA87E] transition-colors">
                                {getActivityDisplayName(session.activity_id)}
                            </h4>
                            <p className="text-sm text-gray-500">
                                📅 {formatDate(session.started_at)} • {formatTime(session.started_at)}
                            </p>
                        </div>
                    </div>

                    {/* Métricas rápidas */}
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

                        {/* Flecha indicadora */}
                        <div className="text-gray-400 group-hover:text-[#2AA87E] transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de detalle */}
            {showModal && (
                <VRSessionDetailModal 
                    session={session} 
                    onClose={() => setShowModal(false)} 
                />
            )}
        </>
    );
};

/**
 * Obtener nombre legible de la actividad en español
 * Basado en las actividades definidas en el juego VR
 */
const getActivityDisplayName = (activityId) => {
    if (!activityId) return 'Actividad VR';
    
    const names = {
        // Actividades de Tinto
        'tinto_easy_01': 'Preparar Tinto - Fácil',
        'tinto_easy_02': 'Preparar Tinto - Fácil',
        'tinto_medium_01': 'Preparar Tinto - Intermedio',
        'tinto_hard_01': 'Preparar Tinto - Difícil',
        
        // Actividades de Café
        'cafe_easy_01': 'Preparar Café - Fácil',
        'cafe_medium_01': 'Preparar Café - Intermedio',
        'cafe_hard_01': 'Preparar Café - Difícil',
        
        // Actividades de Huevos
        'huevos_easy_01': 'Preparar Huevos - Fácil',
        'huevos_medium_01': 'Preparar Huevos - Intermedio',
        'huevos_hard_01': 'Preparar Huevos - Difícil',
        
        // Actividades de Arepa
        'arepa_easy_01': 'Preparar Arepa - Fácil',
        'arepa_medium_01': 'Preparar Arepa - Intermedio',
        'arepa_hard_01': 'Preparar Arepa - Difícil',
        
        // Agua de Panela
        'agua_panela_easy': 'Agua de Panela - Fácil',
        'agua_panela_medium': 'Agua de Panela - Intermedio',
        'agua_panela_hard': 'Agua de Panela - Difícil'
    };
    
    // Si existe en el mapeo, retornar traducción
    if (names[activityId]) {
        return names[activityId];
    }
    
    // Fallback: formatear ID desconocido a formato legible
    // "some_activity_01" -> "Some Activity 01"
    return activityId
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
        .replace(/(\d+)$/, '- $1'); // Agregar guion antes de números
};

/**
 * Modal con detalle completo de la sesión VR
 */
const VRSessionDetailModal = ({ session, onClose }) => {
    // Formatear fecha completa
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

    // Calcular duración entre dos fechas
    const calculateDuration = (start, end) => {
        if (!start || !end) return '-';
        const ms = new Date(end) - new Date(start);
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes} min ${seconds} seg`;
    };

    // Obtener descripción del rendimiento
    const getPerformanceDescription = () => {
        const errors = session.summary_total_errors || 0;
        const sets = session.summary_sets_completed || 0;
        const drops = session.summary_total_drops || 0;

        if (errors === 0 && sets >= 4) {
            return {
                title: '¡Excelente desempeño!',
                description: 'El paciente completó todas las etapas sin cometer errores. Esto indica un muy buen nivel de atención y memoria de trabajo.',
                color: 'text-green-700',
                bg: 'bg-green-50',
                border: 'border-green-200'
            };
        } else if (errors <= 2 && sets >= 3) {
            return {
                title: 'Buen desempeño',
                description: 'El paciente completó la mayoría de las etapas con pocos errores. Muestra buena capacidad cognitiva con áreas menores de mejora.',
                color: 'text-emerald-700',
                bg: 'bg-emerald-50',
                border: 'border-emerald-200'
            };
        } else if (errors <= 5) {
            return {
                title: 'Desempeño regular',
                description: 'El paciente presentó algunos errores durante la sesión. Se recomienda continuar practicando para mejorar la memoria y atención.',
                color: 'text-yellow-700',
                bg: 'bg-yellow-50',
                border: 'border-yellow-200'
            };
        } else {
            return {
                title: 'Necesita práctica adicional',
                description: 'Se detectaron múltiples errores. Se sugiere revisar las etapas donde hubo más dificultad y considerar actividades de menor dificultad.',
                color: 'text-red-700',
                bg: 'bg-red-50',
                border: 'border-red-200'
            };
        }
    };

    const performance = getPerformanceDescription();

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-[#2AA87E] to-[#35C99A] p-6 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold mb-1">
                                Resumen de Sesión VR
                            </h2>
                            <p className="text-white/80">
                                {getActivityDisplayName(session.activity_id)}
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
                </div>

                {/* Contenido scrolleable */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    {/* Información general */}
                    <section className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-[#2AA87E] rounded-full"></span>
                            Información General
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-500 mb-1">📅 Fecha y hora de inicio</p>
                                <p className="font-medium text-gray-800 text-sm">{formatFullDate(session.started_at)}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-500 mb-1">⏱️ Duración total</p>
                                <p className="font-medium text-gray-800 text-sm">{vrResultsService.formatDuration(session.total_seconds)}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-500 mb-1">🎯 ID del participante</p>
                                <p className="font-medium text-gray-800 text-sm">{session.participant_id || '-'}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-500 mb-1">🎮 Actividad realizada</p>
                                <p className="font-medium text-gray-800 text-sm">{getActivityDisplayName(session.activity_id)}</p>
                            </div>
                        </div>
                    </section>

                    {/* Evaluación del desempeño */}
                    <section className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-[#2AA87E] rounded-full"></span>
                            Evaluación del Desempeño
                        </h3>
                        <div className={`${performance.bg} ${performance.border} border rounded-xl p-4`}>
                            <h4 className={`font-semibold ${performance.color} mb-2`}>{performance.title}</h4>
                            <p className="text-gray-700 text-sm">{performance.description}</p>
                        </div>
                    </section>

                    {/* Métricas detalladas */}
                    <section className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-[#2AA87E] rounded-full"></span>
                            Métricas de la Sesión
                        </h3>
                        <div className="grid grid-cols-4 gap-3">
                            <MetricCard 
                                icon="✅" 
                                value={session.summary_sets_completed || 0} 
                                label="Etapas completadas" 
                                maxValue="4"
                                color="green"
                            />
                            <MetricCard 
                                icon="❌" 
                                value={session.summary_total_errors || 0} 
                                label="Errores cometidos" 
                                color={session.summary_total_errors === 0 ? "green" : session.summary_total_errors <= 2 ? "yellow" : "red"}
                            />
                            <MetricCard 
                                icon="👋" 
                                value={session.summary_total_drops || 0} 
                                label="Objetos soltados" 
                                color="blue"
                                tooltip="Veces que el paciente dejó caer objetos"
                            />
                            <MetricCard 
                                icon="🤲" 
                                value={session.summary_total_releases || 0} 
                                label="Objetos liberados" 
                                color="purple"
                                tooltip="Veces que el paciente liberó objetos intencionalmente"
                            />
                        </div>
                    </section>

                    {/* Detalle por etapas */}
                    {session.sets && session.sets.length > 0 && (
                        <section className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-[#2AA87E] rounded-full"></span>
                                Detalle por Etapa
                            </h3>
                            <div className="space-y-3">
                                {session.sets.map((set, index) => (
                                    <SetDetailCard key={index} set={set} index={index + 1} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Explicación de las etapas */}
                    <section className="mb-4">
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
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-[#2AA87E] hover:bg-[#239469] text-white rounded-xl font-medium transition-colors"
                    >
                        Cerrar resumen
                    </button>
                </div>
            </div>
        </div>
    );
};

/**
 * Tarjeta de métrica individual
 */
const MetricCard = ({ icon, value, label, maxValue, color, tooltip }) => {
    const colorClasses = {
        green: 'bg-green-50 border-green-200',
        yellow: 'bg-yellow-50 border-yellow-200',
        red: 'bg-red-50 border-red-200',
        blue: 'bg-blue-50 border-blue-200',
        purple: 'bg-purple-50 border-purple-200'
    };

    const textColors = {
        green: 'text-green-700',
        yellow: 'text-yellow-700',
        red: 'text-red-700',
        blue: 'text-blue-700',
        purple: 'text-purple-700'
    };

    return (
        <div className={`${colorClasses[color]} border rounded-xl p-3 text-center`} title={tooltip}>
            <div className="text-2xl mb-1">{icon}</div>
            <p className={`text-xl font-bold ${textColors[color]}`}>
                {value}{maxValue && <span className="text-sm font-normal text-gray-400">/{maxValue}</span>}
            </p>
            <p className="text-xs text-gray-600">{label}</p>
        </div>
    );
};

/**
 * Tarjeta de detalle de una etapa
 */
const SetDetailCard = ({ set, index }) => {
    // Nombres en español para las etapas
    const setNames = {
        'Ingredients': { name: 'Ingredientes', icon: '🥄', description: 'Recolección de ingredientes necesarios' },
        'Utensils': { name: 'Utensilios', icon: '🍳', description: 'Selección de utensilios de cocina' },
        'Preparation': { name: 'Preparación', icon: '☕', description: 'Proceso de cocción y preparación' },
        'Organization': { name: 'Organización', icon: '🧹', description: 'Limpieza y orden del espacio' }
    };

    const setInfo = setNames[set.set_name] || { name: set.set_name, icon: '📋', description: '' };
    const hasErrors = set.errors && set.errors.length > 0;
    const errorCount = set.errors?.length || 0;

    // Determinar estado de la etapa
    const getStageStatus = () => {
        if (errorCount === 0) return { text: 'Completado sin errores', class: 'text-green-600 bg-green-100' };
        if (errorCount === 1) return { text: '1 error detectado', class: 'text-yellow-600 bg-yellow-100' };
        return { text: `${errorCount} errores detectados`, class: 'text-red-600 bg-red-100' };
    };

    const status = getStageStatus();

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between mb-2">
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
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.class}`}>
                    {status.text}
                </span>
            </div>

            {/* Métricas de la etapa */}
            <div className="flex gap-4 text-sm text-gray-600 mt-3 mb-2">
                <span className="flex items-center gap-1">
                    <span>⏱️</span>
                    {vrResultsService.formatDuration(set.duration_seconds)}
                </span>
                <span className="flex items-center gap-1">
                    <span>🚫</span>
                    {set.blocked_count || 0} bloqueos
                </span>
                <span className="flex items-center gap-1">
                    <span>👇</span>
                    {set.drops_count || 0} caídas
                </span>
            </div>

            {/* Errores específicos */}
            {hasErrors && (
                <div className="mt-3 bg-red-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-red-700 mb-2">Errores en esta etapa:</p>
                    <ul className="space-y-1">
                        {set.errors.map((error, i) => (
                            <li key={i} className="text-xs text-red-600 flex items-start gap-2">
                                <span>•</span>
                                <span>{getErrorDisplayName(error.code)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Información de preparación (si aplica) */}
            {set.set_name === 'Preparation' && (
                <div className="mt-3 bg-amber-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-amber-700 mb-2">Estado de preparación:</p>
                    <div className="flex gap-4 text-xs">
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
                <div className="mt-3 bg-green-50 rounded-lg p-3">
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
    );
};

/**
 * Obtener nombre legible de errores en español
 * Basado en códigos definidos en la documentación del juego VR
 */
const getErrorDisplayName = (errorCode) => {
    if (!errorCode) return 'Error no especificado';
    
    const errorNames = {
        // Errores de estufa y cocina
        'STOVE_ON_NO_POT': 'Encendió la estufa sin colocar la olla',
        'BURN': 'Quemó un alimento o se quemó',
        'BURNT_FOOD': 'La comida se quemó',
        
        // Errores de ingredientes
        'WRONG_INGREDIENT': 'Usó un ingrediente incorrecto',
        'FORGOT_SUGAR': 'Olvidó agregar el azúcar',
        'FORGOT_COFFEE': 'Olvidó agregar el café',
        
        // Errores de preparación del café/tinto
        'COFFEE_BEFORE_BOIL': 'Agregó café antes de hervir el agua',
        'SERVE_WITHOUT_SUGAR': 'Sirvió sin haber agregado azúcar',
        'SPILL_COFFEE': 'Derramó el café',
        'SPILL': 'Derramó líquido',
        
        // Errores de utensilios
        'WRONG_UTENSIL': 'Seleccionó un utensilio incorrecto',
        
        // Errores de orden y secuencia
        'WRONG_ORDER': 'Ejecutó los pasos en orden incorrecto',
        
        // Errores de objetos
        'DROP_ITEM': 'Dejó caer un objeto',
        
        // Errores de tiempo
        'TIME_EXCEEDED': 'Excedió el tiempo permitido',
        
        // Errores de tarea
        'INCOMPLETE_TASK': 'No completó la tarea',
        'TASK_SKIPPED': 'Omitió un paso importante'
    };
    
    // Retornar nombre traducido o formatear código si no existe
    if (errorNames[errorCode]) {
        return errorNames[errorCode];
    }
    
    // Formatear código desconocido: SOME_ERROR_CODE -> "Some error code"
    return errorCode
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/^\w/, c => c.toUpperCase());
};

/**
 * Formatear nombres de objetos del juego VR a nombres legibles en español
 */
const formatObjectName = (objectName) => {
    if (!objectName) return 'Objeto';
    
    // Mapeo de nombres técnicos a nombres en español
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
    
    if (objectNames[objectName]) {
        return objectNames[objectName];
    }
    
    // Si contiene "Meshy_AI", intentar extraer nombre útil
    if (objectName.includes('Meshy_AI')) {
        const parts = objectName.split('_');
        // Buscar palabras relevantes (ignorando Meshy, AI, números, texture)
        const relevantParts = parts.filter(p => 
            !['Meshy', 'AI', 'texture', 'Pack'].includes(p) && 
            !/^\d+$/.test(p)
        );
        if (relevantParts.length > 0) {
            return relevantParts.join(' ');
        }
    }
    
    // Fallback: retornar el nombre original limpio
    return objectName.replace(/_/g, ' ');
};

export default VRSessionCard;
