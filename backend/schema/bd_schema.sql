-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.auditoria (
  id integer NOT NULL DEFAULT nextval('auditoria_id_seq'::regclass),
  id_usuario integer,
  tipo_accion character varying,
  fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  descripcion text,
  CONSTRAINT auditoria_pkey PRIMARY KEY (id),
  CONSTRAINT auditoria_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id)
);
CREATE TABLE public.pacientes (
  id integer NOT NULL DEFAULT nextval('pacientes_id_seq'::regclass),
  identificacion character varying UNIQUE,
  nombre character varying NOT NULL,
  edad integer CHECK (edad > 0),
  diagnostico text,
  fecha_registro date DEFAULT CURRENT_DATE,
  activo boolean NOT NULL DEFAULT true,
  CONSTRAINT pacientes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.password_reset_tokens (
  id integer NOT NULL DEFAULT nextval('password_reset_tokens_id_seq'::regclass),
  id_usuario integer NOT NULL,
  token character varying NOT NULL UNIQUE,
  expires_at timestamp without time zone NOT NULL,
  used boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT password_reset_tokens_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id)
);
CREATE TABLE public.terapeuta_paciente (
  id integer NOT NULL DEFAULT nextval('terapeuta_paciente_id_seq'::regclass),
  id_terapeuta integer NOT NULL,
  id_paciente integer NOT NULL,
  fecha_asignacion date DEFAULT CURRENT_DATE,
  estado character varying CHECK (estado::text = ANY (ARRAY['ACTIVO'::character varying, 'FINALIZADO'::character varying]::text[])),
  CONSTRAINT terapeuta_paciente_pkey PRIMARY KEY (id),
  CONSTRAINT terapeuta_paciente_id_terapeuta_fkey FOREIGN KEY (id_terapeuta) REFERENCES public.terapeutas(id),
  CONSTRAINT terapeuta_paciente_id_paciente_fkey FOREIGN KEY (id_paciente) REFERENCES public.pacientes(id)
);
CREATE TABLE public.terapeutas (
  id integer NOT NULL DEFAULT nextval('terapeutas_id_seq'::regclass),
  id_usuario integer NOT NULL UNIQUE,
  nombre character varying NOT NULL,
  especialidad character varying,
  correo character varying,
  telefono character varying,
  CONSTRAINT terapeutas_pkey PRIMARY KEY (id),
  CONSTRAINT terapeutas_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id)
);
CREATE TABLE public.usuarios (
  id integer NOT NULL DEFAULT nextval('usuarios_id_seq'::regclass),
  email character varying NOT NULL UNIQUE,
  password_hash text NOT NULL,
  rol character varying NOT NULL CHECK (rol::text = ANY (ARRAY['SUPERADMIN'::character varying, 'TERAPEUTA'::character varying]::text[])),
  activo boolean DEFAULT true,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  ultimo_login timestamp without time zone,
  creado_por integer,
  CONSTRAINT usuarios_pkey PRIMARY KEY (id),
  CONSTRAINT fk_usuario_creador FOREIGN KEY (creado_por) REFERENCES public.usuarios(id)
);
CREATE TABLE public.vr_session_results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  schema_version text,
  participant_id text NOT NULL,
  activity_id text NOT NULL,
  started_at timestamp with time zone NOT NULL,
  ended_at timestamp with time zone NOT NULL,
  total_seconds double precision NOT NULL CHECK (total_seconds >= 0::double precision),
  summary_total_errors integer DEFAULT 0 CHECK (summary_total_errors >= 0),
  summary_total_drops integer DEFAULT 0 CHECK (summary_total_drops >= 0),
  summary_total_releases integer DEFAULT 0 CHECK (summary_total_releases >= 0),
  summary_sets_completed integer DEFAULT 0 CHECK (summary_sets_completed >= 0),
  raw_payload jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  id_paciente_vinculado integer,
  id_terapeuta_revisor integer,
  observaciones_terapeuta text,
  estado_revision character varying DEFAULT 'PENDIENTE_REVISION'::character varying,
  CONSTRAINT vr_session_results_pkey PRIMARY KEY (id),
  CONSTRAINT vr_session_results_id_paciente_vinculado_fkey FOREIGN KEY (id_paciente_vinculado) REFERENCES public.pacientes(id),
  CONSTRAINT vr_session_results_id_terapeuta_revisor_fkey FOREIGN KEY (id_terapeuta_revisor) REFERENCES public.terapeutas(id)
);
CREATE TABLE public.vr_set_errors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  set_id uuid NOT NULL,
  code text NOT NULL,
  message text,
  occurred_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  objeto_contexto text,
  CONSTRAINT vr_set_errors_pkey PRIMARY KEY (id),
  CONSTRAINT vr_set_errors_set_id_fkey FOREIGN KEY (set_id) REFERENCES public.vr_set_results(id)
);
CREATE TABLE public.vr_set_results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  set_name text NOT NULL,
  started_at timestamp with time zone NOT NULL,
  ended_at timestamp with time zone NOT NULL,
  duration_seconds double precision NOT NULL CHECK (duration_seconds >= 0::double precision),
  blocked_count integer NOT NULL DEFAULT 0 CHECK (blocked_count >= 0),
  drops_count integer NOT NULL DEFAULT 0 CHECK (drops_count >= 0),
  releases_count integer NOT NULL DEFAULT 0 CHECK (releases_count >= 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  errors_count integer DEFAULT 0,
  CONSTRAINT vr_set_results_pkey PRIMARY KEY (id),
  CONSTRAINT vr_set_results_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.vr_session_results(id)
);