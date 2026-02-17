-- ============================================================================
-- MIGRACIÓN 06: Agregar CHECK constraint para recipe_id en tabla sessions
-- ============================================================================
-- Restringe recipe_id a los 9 valores válidos del juego VR.
-- ============================================================================
-- Instrucciones:
-- 1. Ve a tu Dashboard de Supabase (https://app.supabase.com)
-- 2. Selecciona tu proyecto
-- 3. Ve al "SQL Editor" en el menú lateral
-- 4. Copia y pega este script completo
-- 5. Ejecuta (Run)
-- ============================================================================

-- Agregar CHECK constraint para recipe_id
ALTER TABLE public.sessions
    ADD CONSTRAINT sessions_recipe_id_check
    CHECK (recipe_id IN (
        'tinto', 'cafe_con_leche', 'macchiato',
        'arepa_con_huevo', 'panqueques_con_frutas', 'avena_con_toppings',
        'arroz_con_pollo', 'spaghetti_bolognesa', 'sancocho_de_res'
    ));

-- Comentario descriptivo
COMMENT ON COLUMN public.sessions.recipe_id IS
    'Receta VR a cargar. Valores: tinto, cafe_con_leche, macchiato (fácil); arepa_con_huevo, panqueques_con_frutas, avena_con_toppings (intermedio); arroz_con_pollo, spaghetti_bolognesa, sancocho_de_res (difícil)';
