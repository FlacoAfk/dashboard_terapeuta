-- ============================================================================
-- MIGRACIÓN: Tablas para resultados de sesiones VR
-- Recibe datos del videojuego Unity con métricas por set
-- ============================================================================
-- Instrucciones:
-- 1. Ve a tu Dashboard de Supabase (https://app.supabase.com)
-- 2. Selecciona tu proyecto: your-supabase-project-id
-- 3. Ve al "SQL Editor" en el menú lateral
-- 4. Copia y pega este script completo
-- 5. Ejecuta (Run)
-- ============================================================================

-- Extensión para generar UUIDs
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ====== 1) Sesión Principal ======
CREATE TABLE IF NOT EXISTS vr_session_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    schema_version TEXT NOT NULL,
    participant_id TEXT NOT NULL,
    activity_id TEXT NOT NULL,

    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ NOT NULL,
    total_seconds DOUBLE PRECISION NOT NULL CHECK (total_seconds >= 0),

    -- Summary global (solo terapeuta / analítica)
    summary_total_errors INT NOT NULL DEFAULT 0 CHECK (summary_total_errors >= 0),
    summary_total_drops INT NOT NULL DEFAULT 0 CHECK (summary_total_drops >= 0),
    summary_total_releases INT NOT NULL DEFAULT 0 CHECK (summary_total_releases >= 0),
    summary_sets_completed INT NOT NULL DEFAULT 0 CHECK (summary_sets_completed >= 0),

    -- Auditoría: el JSON completo tal como llegó
    raw_payload JSONB NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_vr_session_results_participant
    ON vr_session_results (participant_id);

CREATE INDEX IF NOT EXISTS ix_vr_session_results_activity
    ON vr_session_results (activity_id);

CREATE INDEX IF NOT EXISTS ix_vr_session_results_started_at
    ON vr_session_results (started_at);

-- ====== 2) Sets por sesión ======
CREATE TABLE IF NOT EXISTS vr_set_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES vr_session_results(id) ON DELETE CASCADE,

    set_name TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ NOT NULL,
    duration_seconds DOUBLE PRECISION NOT NULL CHECK (duration_seconds >= 0),

    blocked_count INT NOT NULL DEFAULT 0 CHECK (blocked_count >= 0),
    drops_count INT NOT NULL DEFAULT 0 CHECK (drops_count >= 0),
    releases_count INT NOT NULL DEFAULT 0 CHECK (releases_count >= 0),

    -- Completion (solo aplica a Preparation, nullable para otros sets)
    completion_coffee_added BOOLEAN NULL,
    completion_sugar_added BOOLEAN NULL,
    completion_cup_coffee_amount_01 DOUBLE PRECISION NULL CHECK (
        completion_cup_coffee_amount_01 IS NULL
        OR (completion_cup_coffee_amount_01 >= 0 AND completion_cup_coffee_amount_01 <= 1)
    ),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Evita duplicados del mismo set en una sesión
    CONSTRAINT uq_vr_set_results_session_set UNIQUE (session_id, set_name)
);

CREATE INDEX IF NOT EXISTS ix_vr_set_results_session
    ON vr_set_results (session_id);

CREATE INDEX IF NOT EXISTS ix_vr_set_results_set_name
    ON vr_set_results (set_name);

-- ====== 3) Errores explícitos por set ======
CREATE TABLE IF NOT EXISTS vr_set_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    set_id UUID NOT NULL REFERENCES vr_set_results(id) ON DELETE CASCADE,

    code TEXT NOT NULL,
    message TEXT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_vr_set_errors_set
    ON vr_set_errors (set_id);

CREATE INDEX IF NOT EXISTS ix_vr_set_errors_code
    ON vr_set_errors (code);

CREATE INDEX IF NOT EXISTS ix_vr_set_errors_occurred_at
    ON vr_set_errors (occurred_at);

-- ====== 4) Objetos retornados (Organization) ======
CREATE TABLE IF NOT EXISTS vr_set_returned_objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    set_id UUID NOT NULL REFERENCES vr_set_results(id) ON DELETE CASCADE,

    object_name TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_vr_returned_objects_set
    ON vr_set_returned_objects (set_id);

-- Evita repetir el mismo objeto en el mismo set
CREATE UNIQUE INDEX IF NOT EXISTS uq_vr_returned_objects_set_object
    ON vr_set_returned_objects (set_id, object_name);

-- ============================================================================
-- Verificar que se crearon correctamente
-- ============================================================================
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'vr_%'
ORDER BY table_name;

-- ============================================================================
-- FIN DE MIGRACIÓN
-- ============================================================================

