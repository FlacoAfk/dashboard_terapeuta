-- ============================================================================
-- MIGRACIÓN 00: Creación completa de todas las tablas (fresh DB)
-- Proyecto: dashboard-terapeuta-v2
-- ============================================================================

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ====== 1. USUARIOS ======
CREATE TABLE IF NOT EXISTS public.usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('SUPERADMIN', 'TERAPEUTA')),
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_login TIMESTAMP,
    creado_por INTEGER REFERENCES public.usuarios(id)
);

-- ====== 2. TERAPEUTAS ======
CREATE TABLE IF NOT EXISTS public.terapeutas (
    id SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL UNIQUE REFERENCES public.usuarios(id),
    nombre VARCHAR(255) NOT NULL,
    especialidad VARCHAR(255),
    correo VARCHAR(255),
    telefono VARCHAR(50)
);

-- ====== 3. PACIENTES ======
CREATE TABLE IF NOT EXISTS public.pacientes (
    id SERIAL PRIMARY KEY,
    identificacion VARCHAR(50) UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    edad INTEGER CHECK (edad > 0),
    diagnostico TEXT,
    fecha_registro DATE DEFAULT CURRENT_DATE,
    activo BOOLEAN NOT NULL DEFAULT true
);

-- ====== 4. TERAPEUTA_PACIENTE ======
CREATE TABLE IF NOT EXISTS public.terapeuta_paciente (
    id SERIAL PRIMARY KEY,
    id_terapeuta INTEGER NOT NULL REFERENCES public.terapeutas(id),
    id_paciente INTEGER NOT NULL REFERENCES public.pacientes(id),
    fecha_asignacion DATE DEFAULT CURRENT_DATE,
    estado VARCHAR(20) CHECK (estado IN ('ACTIVO', 'FINALIZADO'))
);

-- ====== 5. AUDITORIA ======
CREATE TABLE IF NOT EXISTS public.auditoria (
    id SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES public.usuarios(id),
    tipo_accion VARCHAR(100),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    descripcion TEXT
);

-- ====== 6. PASSWORD_RESET_TOKENS ======
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    id SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    token VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_expires ON public.password_reset_tokens(expires_at);

-- ====== 7. VR_SESSION_RESULTS ======
CREATE TABLE IF NOT EXISTS public.vr_session_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schema_version TEXT NOT NULL,
    participant_id TEXT NOT NULL,
    activity_id TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ NOT NULL,
    total_seconds DOUBLE PRECISION NOT NULL CHECK (total_seconds >= 0),
    summary_total_errors INTEGER NOT NULL DEFAULT 0 CHECK (summary_total_errors >= 0),
    summary_total_drops INTEGER NOT NULL DEFAULT 0 CHECK (summary_total_drops >= 0),
    summary_total_releases INTEGER NOT NULL DEFAULT 0 CHECK (summary_total_releases >= 0),
    summary_sets_completed INTEGER NOT NULL DEFAULT 0 CHECK (summary_sets_completed >= 0),
    raw_payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    id_paciente_vinculado INTEGER REFERENCES public.pacientes(id),
    id_terapeuta_revisor INTEGER REFERENCES public.terapeutas(id),
    observaciones_terapeuta TEXT,
    estado_revision VARCHAR(50) DEFAULT 'PENDIENTE_REVISION'
);
CREATE INDEX IF NOT EXISTS ix_vr_session_results_participant ON public.vr_session_results(participant_id);
CREATE INDEX IF NOT EXISTS ix_vr_session_results_activity ON public.vr_session_results(activity_id);
CREATE INDEX IF NOT EXISTS ix_vr_session_results_started_at ON public.vr_session_results(started_at);

-- ====== 8. VR_SET_RESULTS ======
CREATE TABLE IF NOT EXISTS public.vr_set_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.vr_session_results(id) ON DELETE CASCADE,
    set_name TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ NOT NULL,
    duration_seconds DOUBLE PRECISION NOT NULL CHECK (duration_seconds >= 0),
    blocked_count INTEGER NOT NULL DEFAULT 0 CHECK (blocked_count >= 0),
    drops_count INTEGER NOT NULL DEFAULT 0 CHECK (drops_count >= 0),
    releases_count INTEGER NOT NULL DEFAULT 0 CHECK (releases_count >= 0),
    errors_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_vr_set_results_session_set UNIQUE (session_id, set_name)
);
CREATE INDEX IF NOT EXISTS ix_vr_set_results_session ON public.vr_set_results(session_id);
CREATE INDEX IF NOT EXISTS ix_vr_set_results_set_name ON public.vr_set_results(set_name);

-- ====== 9. VR_SET_ERRORS ======
CREATE TABLE IF NOT EXISTS public.vr_set_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    set_id UUID NOT NULL REFERENCES public.vr_set_results(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    message TEXT,
    occurred_at TIMESTAMPTZ NOT NULL,
    objeto_contexto TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_vr_set_errors_set ON public.vr_set_errors(set_id);
CREATE INDEX IF NOT EXISTS ix_vr_set_errors_code ON public.vr_set_errors(code);
CREATE INDEX IF NOT EXISTS ix_vr_set_errors_occurred_at ON public.vr_set_errors(occurred_at);

-- ====== 10. VR_SET_RETURNED_OBJECTS ======
CREATE TABLE IF NOT EXISTS public.vr_set_returned_objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    set_id UUID NOT NULL REFERENCES public.vr_set_results(id) ON DELETE CASCADE,
    object_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_vr_returned_objects_set ON public.vr_set_returned_objects(set_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_vr_returned_objects_set_object ON public.vr_set_returned_objects(set_id, object_name);

-- ====== 11. SESSIONS ======
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_code VARCHAR(50) NOT NULL,
    recipe_id VARCHAR(100) NOT NULL DEFAULT 'tinto'
        CHECK (recipe_id IN (
            'tinto', 'cafe_con_leche', 'macchiato',
            'arepa_con_huevo', 'panqueques_con_frutas', 'avena_con_toppings',
            'arroz_con_pollo', 'spaghetti_bolognesa', 'sancocho_de_res'
        )),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('CREATED', 'ACTIVE', 'FINISHED')),
    start_token VARCHAR(8) NOT NULL UNIQUE,
    created_by INTEGER NOT NULL REFERENCES public.terapeutas(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_sessions_start_token ON public.sessions(start_token);
CREATE INDEX IF NOT EXISTS ix_sessions_participant_code ON public.sessions(participant_code);
CREATE INDEX IF NOT EXISTS ix_sessions_status ON public.sessions(status);
CREATE UNIQUE INDEX IF NOT EXISTS ix_sessions_one_active_per_participant ON public.sessions(participant_code) WHERE status = 'ACTIVE';
