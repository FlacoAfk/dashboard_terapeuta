import React, { useState, useMemo } from 'react';
import Modal from '../ui/Modal';
import sessionService from '../../services/sessionService';
import { showToast } from '../../utils/alertUtils';
import { Icons } from '../ui/Icons';
import { useSession } from '../../context/SessionContext';

/**
 * Emojis y colores por dificultad
 */
const DIFFICULTY_CONFIG = {
    facil: { label: 'Fácil', color: 'green', emoji: '🟢', badge: 'bg-green-100 text-green-700', border: 'border-green-200 hover:border-green-400', ring: 'ring-green-500' },
    intermedio: { label: 'Intermedio', color: 'yellow', emoji: '🟡', badge: 'bg-yellow-100 text-yellow-700', border: 'border-yellow-200 hover:border-yellow-400', ring: 'ring-yellow-500' },
    dificil: { label: 'Difícil', color: 'red', emoji: '🔴', badge: 'bg-red-100 text-red-700', border: 'border-red-200 hover:border-red-400', ring: 'ring-red-500' }
};

/**
 * Emojis por receta
 */
const RECIPE_EMOJIS = {
    tinto: '☕',
    cafe_con_leche: '☕',
    macchiato: '☕',
    arepa_con_huevo: '🍳',
    panqueques_con_frutas: '🥞',
    avena_con_toppings: '🥣',
    arroz_con_pollo: '🍚',
    spaghetti_bolognesa: '🍝',
    sancocho_de_res: '🍲'
};

/**
 * Card de receta seleccionable
 */
const RecipeCard = ({ recipe, isSelected, onClick }) => {
    const diff = DIFFICULTY_CONFIG[recipe.difficulty];
    const emoji = RECIPE_EMOJIS[recipe.id] || '🍽️';

    return (
        <button
            type="button"
            onClick={onClick}
            className={`relative w-full text-left p-3 rounded-xl border-2 transition-all duration-200 ${
                isSelected
                    ? `${diff.border.split(' ')[0]} ${diff.ring} ring-2 bg-white shadow-md scale-[1.02]`
                    : `border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm`
            }`}
        >
            {isSelected && (
                <div className="absolute top-2 right-2">
                    <div className="w-5 h-5 bg-[#2AA87E] rounded-full flex items-center justify-center">
                        <Icons.Check />
                    </div>
                </div>
            )}
            <div className="flex items-center gap-3">
                <span className="text-2xl">{emoji}</span>
                <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                        {recipe.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${diff.badge}`}>
                            {diff.emoji} {diff.label}
                        </span>
                        <span className="text-xs text-gray-400">{recipe.ingredients_range} ingredientes</span>
                    </div>
                </div>
            </div>
        </button>
    );
};

/**
 * Modal para crear una sesión de receta VR
 */
const CrearSesionVRModal = ({ isOpen, onClose, onSuccess, patients = [] }) => {
    const { startSession } = useSession();
    const [selectedRecipe, setSelectedRecipe] = useState('');
    const [participantCode, setParticipantCode] = useState('');
    const [filterDifficulty, setFilterDifficulty] = useState('todas');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null); // Para mostrar el token generado

    const recipes = sessionService.getAvailableRecipes();

    const filteredRecipes = useMemo(() => {
        if (filterDifficulty === 'todas') return recipes;
        return recipes.filter(r => r.difficulty === filterDifficulty);
    }, [filterDifficulty, recipes]);

    // Pacientes activos para el select
    const activePatients = useMemo(() => {
        return patients.filter(p => p.activo !== false);
    }, [patients]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!participantCode) {
            setError('Seleccione un paciente');
            return;
        }
        if (!selectedRecipe) {
            setError('Seleccione una receta');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await sessionService.createSession({
                participant_code: participantCode,
                recipe_id: selectedRecipe
            });

            if (response.success) {
                setResult(response);
                // Obtener nombre de la receta seleccionada
                const recipeData = recipes.find(r => r.id === selectedRecipe);
                startSession({
                    session_id: response.session_id,
                    start_token: response.start_token,
                    recipe_id: response.recipe_id,
                    recipe_name: recipeData?.name || response.recipe_id,
                    participant_code: participantCode
                });
                showToast('success', 'Sesión VR creada exitosamente');
                if (onSuccess) onSuccess(response);
            } else {
                setError(response.error || 'Error al crear la sesión');
            }
        } catch (err) {
            // Manejar sesión ya activa
            if (err.message?.includes('Ya existe una sesión activa') || err.message?.includes('SESSION_ALREADY_ACTIVE')) {
                setError('Ya existe una sesión activa para este participante. Debe finalizar la sesión actual antes de crear una nueva.');
            } else {
                setError(err.message || 'Error al crear la sesión');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedRecipe('');
        setParticipantCode('');
        setFilterDifficulty('todas');
        setError('');
        setResult(null);
        onClose();
    };

    const handleCopyToken = () => {
        if (result?.start_token) {
            navigator.clipboard.writeText(result.start_token);
            showToast('success', 'Token copiado al portapapeles');
        }
    };

    const selectedRecipeData = recipes.find(r => r.id === selectedRecipe);

    // Vista de resultado exitoso con el token
    if (result) {
        const recipeData = recipes.find(r => r.id === result.recipe_id);
        const diff = recipeData ? DIFFICULTY_CONFIG[recipeData.difficulty] : null;
        const emoji = RECIPE_EMOJIS[result.recipe_id] || '🍽️';

        return (
            <Modal isOpen={isOpen} onClose={handleClose} size="md">
                <Modal.Header onClose={handleClose} icon={Icons.Check} iconBg="bg-[#2AA87E]">
                    Sesión Creada
                </Modal.Header>

                <Modal.Body>
                    <div className="text-center space-y-5">
                        {/* Ícono de éxito */}
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        {/* Info de la sesión */}
                        <div>
                            <p className="text-gray-600 text-sm mb-1">Receta seleccionada</p>
                            <p className="text-lg font-semibold text-gray-900">
                                {emoji} {recipeData?.name || result.recipe_id}
                            </p>
                            {diff && (
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium mt-1 ${diff.badge}`}>
                                    {diff.emoji} {diff.label}
                                </span>
                            )}
                        </div>

                        {/* Token grande */}
                        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-5">
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">
                                Código para el VR
                            </p>
                            <p className="text-4xl font-mono font-bold text-[#2AA87E] tracking-[0.3em] select-all">
                                {result.start_token}
                            </p>
                            <button
                                onClick={handleCopyToken}
                                className="mt-3 inline-flex items-center gap-2 text-sm text-[#2AA87E] hover:text-[#238c68] font-medium transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                                Copiar código
                            </button>
                        </div>

                        <p className="text-sm text-gray-500">
                            Dále este código al paciente para que lo ingrese en el juego VR.
                        </p>
                    </div>
                </Modal.Body>

                <Modal.Footer>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="flex items-center gap-2 bg-[#2AA87E] hover:bg-[#238c68] text-white font-medium px-5 py-2 rounded-lg transition-colors"
                    >
                        <Icons.Check />
                        Entendido
                    </button>
                </Modal.Footer>
            </Modal>
        );
    }

    // Vista del formulario
    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="lg">
            <Modal.Header onClose={handleClose} icon={Icons.Sesiones} iconBg="bg-[#2AA87E]">
                Nueva Sesión VR
            </Modal.Header>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <Modal.Body>
                    <div className="space-y-5">
                        {/* Seleccionar Paciente */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Paciente <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={participantCode}
                                onChange={(e) => { setParticipantCode(e.target.value); setError(''); }}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-shadow outline-none bg-white"
                            >
                                <option value="">Seleccione un paciente...</option>
                                {activePatients.map(p => (
                                    <option key={p.id} value={p.identificacion}>
                                        {p.nombre} — {p.identificacion}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Se usará la identificación del paciente como código de participante
                            </p>
                        </div>

                        {/* Filtro de dificultad */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Receta <span className="text-red-500">*</span>
                            </label>
                            <div className="flex bg-gray-100 rounded-lg p-1 gap-0.5 mb-3">
                                {[
                                    { id: 'todas', label: 'Todas', count: recipes.length },
                                    { id: 'facil', label: '🟢 Fácil', count: recipes.filter(r => r.difficulty === 'facil').length },
                                    { id: 'intermedio', label: '🟡 Intermedio', count: recipes.filter(r => r.difficulty === 'intermedio').length },
                                    { id: 'dificil', label: '🔴 Difícil', count: recipes.filter(r => r.difficulty === 'dificil').length }
                                ].map(btn => (
                                    <button
                                        key={btn.id}
                                        type="button"
                                        onClick={() => setFilterDifficulty(btn.id)}
                                        className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                                            filterDifficulty === btn.id
                                                ? 'bg-white shadow-sm text-[#2AA87E]'
                                                : 'text-gray-600 hover:text-gray-800'
                                        }`}
                                    >
                                        {btn.label}
                                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                            filterDifficulty === btn.id
                                                ? 'bg-[#2AA87E]/10 text-[#2AA87E]'
                                                : 'bg-gray-200 text-gray-500'
                                        }`}>
                                            {btn.count}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Grid de recetas */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-70 overflow-y-auto pr-1">
                                {filteredRecipes.map(recipe => (
                                    <RecipeCard
                                        key={recipe.id}
                                        recipe={recipe}
                                        isSelected={selectedRecipe === recipe.id}
                                        onClick={() => { setSelectedRecipe(recipe.id); setError(''); }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Resumen de selección */}
                        {selectedRecipe && participantCode && (
                            <div className="bg-[#2AA87E]/5 border border-[#2AA87E]/20 rounded-xl p-4 animate-in fade-in slide-in-from-bottom-2">
                                <p className="text-xs text-[#2AA87E] uppercase tracking-wider font-semibold mb-2">Resumen</p>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Paciente:</span>
                                    <span className="font-medium text-gray-900">
                                        {activePatients.find(p => p.identificacion === participantCode)?.nombre || participantCode}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm mt-1">
                                    <span className="text-gray-600">Receta:</span>
                                    <span className="font-medium text-gray-900">
                                        {RECIPE_EMOJIS[selectedRecipe]} {selectedRecipeData?.name}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm mt-1">
                                    <span className="text-gray-600">Dificultad:</span>
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${DIFFICULTY_CONFIG[selectedRecipeData?.difficulty]?.badge}`}>
                                        {DIFFICULTY_CONFIG[selectedRecipeData?.difficulty]?.emoji} {DIFFICULTY_CONFIG[selectedRecipeData?.difficulty]?.label}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 animate-in fade-in slide-in-from-top-1">
                                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {error}
                            </div>
                        )}
                    </div>
                </Modal.Body>

                <Modal.Footer>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading || !selectedRecipe || !participantCode}
                        className="flex items-center gap-2 bg-[#2AA87E] hover:bg-[#238c68] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-5 py-2 rounded-lg transition-colors"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Icons.Plus />
                                Crear Sesión
                            </>
                        )}
                    </button>
                </Modal.Footer>
            </form>
        </Modal>
    );
};

export default CrearSesionVRModal;
