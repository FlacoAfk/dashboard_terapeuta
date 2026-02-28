export const DEFAULT_RECIPES = [
    { id: 'tinto', name: 'Tinto', difficulty: 'facil', ingredients_range: '3-5' },
    { id: 'cafe_con_leche', name: 'Café con leche', difficulty: 'facil', ingredients_range: '3-5' },
    { id: 'macchiato', name: 'Macchiato / Café manchado', difficulty: 'facil', ingredients_range: '3-5' },
    { id: 'arepa_con_huevo', name: 'Arepa con huevo', difficulty: 'intermedio', ingredients_range: '6-10' },
    { id: 'panqueques_con_frutas', name: 'Panqueques con frutas', difficulty: 'intermedio', ingredients_range: '6-10' },
    { id: 'avena_con_toppings', name: 'Avena caliente con toppings', difficulty: 'intermedio', ingredients_range: '6-10' },
    { id: 'arroz_con_pollo', name: 'Arroz con pollo', difficulty: 'dificil', ingredients_range: '11-15' },
    { id: 'spaghetti_bolognesa', name: 'Spaghetti a la boloñesa', difficulty: 'dificil', ingredients_range: '11-15' },
    { id: 'sancocho_de_res', name: 'Sancocho de res', difficulty: 'dificil', ingredients_range: '11-15' }
];

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

const LEGACY_LABELS = {
    tinto_easy_01: 'Tinto - Fácil',
    tinto_easy_02: 'Tinto - Fácil',
    tinto_medium_01: 'Tinto - Intermedio',
    tinto_hard_01: 'Tinto - Difícil',
    cafe_easy_01: 'Café - Fácil',
    cafe_medium_01: 'Café - Intermedio',
    cafe_hard_01: 'Café - Difícil',
    huevos_easy_01: 'Huevos - Fácil',
    huevos_medium_01: 'Huevos - Intermedio',
    huevos_hard_01: 'Huevos - Difícil',
    arepa_easy_01: 'Arepa - Fácil',
    arepa_medium_01: 'Arepa - Intermedio',
    arepa_hard_01: 'Arepa - Difícil',
    agua_panela_easy: 'Agua de Panela - Fácil',
    agua_panela_medium: 'Agua de Panela - Intermedio',
    agua_panela_hard: 'Agua de Panela - Difícil'
};

function normalizeRecipes(payload) {
    const list = Array.isArray(payload?.data) ? payload.data : payload;
    if (!Array.isArray(list) || list.length === 0) return DEFAULT_RECIPES;

    return list.map((recipe) => ({
        id: recipe.id,
        name: recipe.name,
        difficulty: recipe.difficulty,
        ingredients_range: recipe.ingredients_range
    }));
}

export function findRecipeById(recipeId, recipes = DEFAULT_RECIPES) {
    return recipes.find((recipe) => recipe.id === recipeId) || null;
}

export function getRecipeDifficulty(activityId, recipes = DEFAULT_RECIPES) {
    if (!activityId) return null;

    const normalized = String(activityId).toLowerCase();
    const recipe = recipes.find((item) => item.id === normalized);

    if (recipe) return recipe.difficulty;

    if (normalized.includes('easy')) return 'facil';
    if (normalized.includes('medium')) return 'intermedio';
    if (normalized.includes('hard')) return 'dificil';

    return null;
}

export function getRecipeDisplayName(activityId, recipes = DEFAULT_RECIPES) {
    if (!activityId) return 'Actividad VR';

    const normalized = String(activityId).toLowerCase();
    const recipe = recipes.find((item) => item.id === normalized);

    if (recipe) return recipe.name;
    if (LEGACY_LABELS[normalized]) return LEGACY_LABELS[normalized];

    if (normalized.includes('tinto')) return 'Tinto';
    if (normalized.includes('cafe')) return 'Café';
    if (normalized.includes('huevos')) return 'Huevos';
    if (normalized.includes('arepa')) return 'Arepa';
    if (normalized.includes('agua_panela')) return 'Agua de Panela';

    return String(activityId)
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function getActivityLabelWithEmoji(activityId, recipes = DEFAULT_RECIPES) {
    const name = getRecipeDisplayName(activityId, recipes);
    const normalized = String(activityId || '').toLowerCase();

    const emoji = RECIPE_EMOJIS[normalized]
        || (normalized.includes('tinto') ? '☕' : null)
        || (normalized.includes('cafe') ? '☕' : null)
        || (normalized.includes('huevos') ? '🍳' : null)
        || (normalized.includes('arepa') ? '🫓' : null)
        || (normalized.includes('agua_panela') ? '🍯' : null)
        || '🎮';

    return `${emoji} ${name}`;
}