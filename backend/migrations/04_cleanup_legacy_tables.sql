-- Migration: 04_cleanup_legacy_tables
-- Description: Elimina tablas obsoletas del esquema antiguo de sesiones y catálogos que han sido reemplazadas por la integración VR.

BEGIN;

-- 1. Eliminar restricciones de clave foránea en tabla auditoria si existen
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auditoria' AND column_name = 'id_evento') THEN
        ALTER TABLE public.auditoria DROP COLUMN id_evento;
    END IF;
END $$;

-- 2. Eliminar tablas de transacción/ejecución antiguas (con CASCADE)
DROP TABLE IF EXISTS public.evaluacion_cognitiva CASCADE;
DROP TABLE IF EXISTS public.resumen_sesion CASCADE;
DROP TABLE IF EXISTS public.eventos_interacciones CASCADE;
DROP TABLE IF EXISTS public.sesiones CASCADE;

-- 3. Eliminar tablas de catálogo antiguas (IDs enteros vs IDs texto del nuevo sistema)
DROP TABLE IF EXISTS public.accion_actividad CASCADE;
DROP TABLE IF EXISTS public.ingrediente_actividad CASCADE;
DROP TABLE IF EXISTS public.utensilio_actividad CASCADE;
DROP TABLE IF EXISTS public.accion CASCADE;
DROP TABLE IF EXISTS public.ingrediente CASCADE;
DROP TABLE IF EXISTS public.utensilio CASCADE;
DROP TABLE IF EXISTS public.actividad_juego CASCADE;

COMMIT;
