-- ============================================================================
-- MIGRACIÓN MANUAL: Agregar columna total_omisiones (RF-UNT-08)
-- ============================================================================
-- Instrucciones:
-- 1. Ve a tu Dashboard de Supabase (https://app.supabase.com)
-- 2. Selecciona tu proyecto: vtspkfdwhazxrigihdto
-- 3. Ve al "SQL Editor" en el menú lateral.
-- 4. Copia y pega este script.
-- 5. Ejecuta (Run).
-- ============================================================================

-- 1. Agregar la columna si no existe
ALTER TABLE public.resumen_sesion 
ADD COLUMN IF NOT EXISTS total_omisiones INTEGER DEFAULT 0;

-- 2. Actualizar las políticas de RLS si es necesario (opcional)
-- (Si ya tienes políticas para UPDATE/SELECT, esto se heredará automáticamente)

-- 3. Verificar que se agregó
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'resumen_sesion' AND column_name = 'total_omisiones';

-- ============================================================================
-- FIN
-- ============================================================================
