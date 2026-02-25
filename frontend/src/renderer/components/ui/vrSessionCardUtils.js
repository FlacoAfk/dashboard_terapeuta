export const isSessionNeverStarted = (sessionData) => {
    const setsCompleted = sessionData.summary_sets_completed || 0;
    const totalErrors = sessionData.summary_total_errors || 0;
    const totalAciertos = sessionData.summary_total_releases || 0;

    return setsCompleted === 0 && totalErrors === 0 && totalAciertos === 0;
};

export const getActivityDisplayName = (activityId) => {
    if (!activityId) return 'Actividad VR';

    const names = {
        'tinto': 'Preparar Tinto',
        'cafe_con_leche': 'Preparar Café con leche',
        'macchiato': 'Preparar Macchiato',
        'arepa_con_huevo': 'Preparar Arepa con huevo',
        'panqueques_con_frutas': 'Preparar Panqueques con frutas',
        'avena_con_toppings': 'Preparar Avena con toppings',
        'arroz_con_pollo': 'Preparar Arroz con pollo',
        'spaghetti_bolognesa': 'Preparar Spaghetti a la boloñesa',
        'sancocho_de_res': 'Preparar Sancocho de res',
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
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
        .replace(/(\d+)$/, '- $1');
};

export const getDifficultyInfo = (activityId) => {
    if (!activityId) return { label: 'N/A', color: 'gray', icon: '⚪' };
    const lower = activityId.toLowerCase();
    const easyRecipes = ['tinto', 'cafe_con_leche', 'macchiato'];
    const mediumRecipes = ['arepa_con_huevo', 'panqueques_con_frutas', 'avena_con_toppings'];
    const hardRecipes = ['arroz_con_pollo', 'spaghetti_bolognesa', 'sancocho_de_res'];

    if (easyRecipes.includes(lower)) return { label: 'Fácil', color: 'green', icon: '🟢' };
    if (mediumRecipes.includes(lower)) return { label: 'Intermedio', color: 'yellow', icon: '🟡' };
    if (hardRecipes.includes(lower)) return { label: 'Difícil', color: 'red', icon: '🔴' };
    if (lower.includes('easy')) return { label: 'Fácil', color: 'green', icon: '🟢' };
    if (lower.includes('medium')) return { label: 'Intermedio', color: 'yellow', icon: '🟡' };
    if (lower.includes('hard')) return { label: 'Difícil', color: 'red', icon: '🔴' };

    return { label: 'N/A', color: 'gray', icon: '⚪' };
};

export const getRecipeName = (activityId) => {
    if (!activityId) return 'Actividad VR';
    const lower = activityId.toLowerCase();
    const recipeNames = {
        'tinto': 'Tinto',
        'cafe_con_leche': 'Café con leche',
        'macchiato': 'Macchiato',
        'arepa_con_huevo': 'Arepa con huevo',
        'panqueques_con_frutas': 'Panqueques con frutas',
        'avena_con_toppings': 'Avena con toppings',
        'arroz_con_pollo': 'Arroz con pollo',
        'spaghetti_bolognesa': 'Spaghetti a la boloñesa',
        'sancocho_de_res': 'Sancocho de res'
    };

    if (recipeNames[lower]) return recipeNames[lower];
    if (lower.includes('tinto')) return 'Tinto';
    if (lower.includes('cafe')) return 'Café';
    if (lower.includes('huevos')) return 'Huevos';
    if (lower.includes('arepa')) return 'Arepa';
    if (lower.includes('agua_panela')) return 'Agua de Panela';

    return activityId;
};

export const getErrorDisplayName = (errorCode) => {
    if (!errorCode) return 'Error no especificado';

    const errorNames = {
        'STOVE_ON_NO_POT': 'Encendió la estufa sin colocar la olla',
        'BURN': 'Quemó un alimento o se quemó',
        'BURNT_FOOD': 'La comida se quemó',
        'WRONG_INGREDIENT': 'Usó un ingrediente incorrecto',
        'FORGOT_SUGAR': 'Olvidó agregar el azúcar',
        'FORGOT_COFFEE': 'Olvidó agregar el café',
        'FORGOT_STEP': 'Omitió un paso',
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
        .replace(/^\w/, (character) => character.toUpperCase());
};

export const formatObjectName = (objectName) => {
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
        const relevantParts = parts.filter((part) =>
            !['Meshy', 'AI', 'texture', 'Pack'].includes(part) &&
            !/^\d+$/.test(part)
        );
        if (relevantParts.length > 0) return relevantParts.join(' ');
    }

    return objectName.replace(/_/g, ' ');
};

export const getSetNameSpanish = (setName) => {
    const names = {
        'Recognition': 'Reconocimiento',
        'Collection': 'Recolección',
        'Ingredients': 'Ingredientes',
        'Utensils': 'Utensilios',
        'Preparation': 'Preparación',
        'Organization': 'Organización',
        'Reconocimiento': 'Reconocimiento',
        'Recoleccion': 'Recolección',
        'Recolección': 'Recolección',
        'Preparacion': 'Preparación',
        'Preparación': 'Preparación',
        'Organizacion': 'Organización',
        'Organización': 'Organización'
    };

    return names[setName] || setName;
};

export const formatDurationDetailed = (seconds) => {
    if (!seconds || seconds < 0) return '0 min 0 seg';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins === 0) return `${secs} seg`;
    return `${mins} min ${secs} seg`;
};

export const formatTimestamp = (isoDate) => {
    if (!isoDate) return '-';
    const date = new Date(isoDate);
    return date.toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
};
