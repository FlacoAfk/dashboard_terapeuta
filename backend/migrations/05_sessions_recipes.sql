-- ============================================================================
-- MIGRACIÓN 05: Tabla sessions para gestión de sesiones de recetas VR
-- ============================================================================
-- Flujo: Terapeuta crea sesión con receta → VR consulta por token → Carga receta
-- ============================================================================
-- Instrucciones:
-- 1. Ve a tu Dashboard de Supabase (https://app.supabase.com)
-- 2. Selecciona tu proyecto: your-supabase-project-id
-- 3. Ve al "SQL Editor" en el menú lateral
-- 4. Copia y pega este script completo
-- 5. Ejecuta (Run)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Código del participante (ej: "JPPE1234", coincide con identificacion de pacientes)
    participant_code VARCHAR(50) NOT NULL,

    -- Receta a cargar en VR (ej: "tinto")
    recipe_id VARCHAR(100) NOT NULL DEFAULT 'tinto'
        CHECK (recipe_id IN (
            'tinto', 'cafe_con_leche', 'macchiato',
            'arepa_con_huevo', 'panqueques_con_frutas', 'avena_con_toppings',
            'arroz_con_pollo', 'spaghetti_bolognesa', 'sancocho_de_res'
        )),

    -- Estado de la sesión
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('CREATED', 'ACTIVE', 'FINISHED')),

    -- Token corto único que el VR ingresa para cargar la sesión (6 chars alfanuméricos)
    start_token VARCHAR(8) NOT NULL UNIQUE,

    -- Terapeuta que creó la sesión (FK a terapeutas.id)
    created_by INTEGER NOT NULL,

    -- Timestamp de creación
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Foreign key al terapeuta creador
    CONSTRAINT sessions_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES public.terapeutas(id)
);

-- Índice para búsqueda rápida por token (endpoint VR)
CREATE INDEX IF NOT EXISTS ix_sessions_start_token
    ON public.sessions (start_token);

-- Índice para búsqueda por participante
CREATE INDEX IF NOT EXISTS ix_sessions_participant_code
    ON public.sessions (participant_code);

-- Índice para filtrar por estado
CREATE INDEX IF NOT EXISTS ix_sessions_status
    ON public.sessions (status);

-- REGLA: Solo puede existir UNA sesión ACTIVE por participante
CREATE UNIQUE INDEX IF NOT EXISTS ix_sessions_one_active_per_participant
    ON public.sessions (participant_code)
    WHERE status = 'ACTIVE';

