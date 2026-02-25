const VALID_RECIPES = [
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

const VALID_RECIPE_IDS = VALID_RECIPES.map((recipe) => recipe.id);

module.exports = {
    VALID_RECIPES,
    VALID_RECIPE_IDS
};