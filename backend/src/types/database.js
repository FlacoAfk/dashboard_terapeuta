/**
 * ========================================
 * TIPOS DE BASE DE DATOS - Cerebro al Fuego
 * ========================================
 * 
 * Generado desde: backend/schema/bd_schema.sql
 * Fecha: 2026-02-04
 * 
 * Estas definiciones JSDoc proporcionan autocompletado
 * e IntelliSense para las tablas de Supabase.
 */

// ========================================
// USUARIOS Y AUTENTICACIÓN
// ========================================

/**
 * @typedef {Object} Usuario
 * @property {number} id - ID autoincremental
 * @property {string} email - Email único del usuario
 * @property {string} password_hash - Hash de la contraseña
 * @property {'SUPERADMIN'|'TERAPEUTA'} rol - Rol del usuario
 * @property {boolean} activo - Estado activo/inactivo
 * @property {Date} fecha_creacion - Fecha de creación
 * @property {Date|null} ultimo_login - Último acceso
 * @property {number|null} creado_por - ID del usuario que lo creó
 */

/**
 * @typedef {Object} Terapeuta
 * @property {number} id - ID autoincremental
 * @property {number} id_usuario - FK a usuarios
 * @property {string} nombre - Nombre completo
 * @property {string|null} especialidad - Especialidad médica
 * @property {string|null} correo - Correo de contacto
 * @property {string|null} telefono - Teléfono de contacto
 */

/**
 * @typedef {Object} PasswordResetToken
 * @property {number} id
 * @property {number} id_usuario - FK a usuarios
 * @property {string} token - Token único
 * @property {Date} expires_at - Fecha de expiración
 * @property {boolean} used - Si ya fue usado
 * @property {Date} created_at
 */

// ========================================
// PACIENTES
// ========================================

/**
 * @typedef {Object} Paciente
 * @property {number} id - ID autoincremental
 * @property {string|null} identificacion - Cédula/documento único
 * @property {string} nombre - Nombre completo
 * @property {number|null} edad - Edad (debe ser > 0)
 * @property {string|null} diagnostico - Diagnóstico clínico
 * @property {Date} fecha_registro - Fecha de registro
 * @property {boolean} activo - Estado activo/inactivo
 */

/**
 * @typedef {Object} TerapeutaPaciente
 * @property {number} id
 * @property {number} id_terapeuta - FK a terapeutas
 * @property {number} id_paciente - FK a pacientes
 * @property {Date} fecha_asignacion
 * @property {'ACTIVO'|'FINALIZADO'} estado
 */

// ========================================
// AUDITORÍA
// ========================================

/**
 * @typedef {Object} Auditoria
 * @property {number} id
 * @property {number|null} id_usuario - FK a usuarios
 * @property {string|null} tipo_accion - Tipo de evento
 * @property {Date} fecha
 * @property {string|null} descripcion - Detalles del evento
 */

// ========================================
// SESIONES VR (desde Unity)
// ========================================

/**
 * @typedef {Object} VRSessionResult
 * @property {string} id - UUID
 * @property {string|null} schema_version - Versión del esquema JSON
 * @property {string} participant_id - ID del participante (desde Unity)
 * @property {string} activity_id - ID de la actividad en Unity
 * @property {Date} started_at - Inicio de sesión
 * @property {Date} ended_at - Fin de sesión
 * @property {number} total_seconds - Duración total (>= 0)
 * @property {number} summary_total_errors - Total de errores
 * @property {number} summary_total_drops - Total de drops
 * @property {number} summary_total_releases - Total de releases
 * @property {number} summary_sets_completed - Sets completados
 * @property {Object} raw_payload - JSON completo de Unity
 * @property {Date} created_at - Fecha de creación
 * @property {number|null} id_paciente_vinculado - FK a pacientes (asignado por terapeuta)
 * @property {number|null} id_terapeuta_revisor - FK a terapeutas (quien revisó)
 * @property {string|null} observaciones_terapeuta - Notas clínicas
 * @property {'PENDIENTE_REVISION'|'REVISADA'} estado_revision - Estado de revisión
 */

/**
 * @typedef {Object} VRSetResult
 * @property {string} id - UUID
 * @property {string} session_id - FK a vr_session_results
 * @property {string} set_name - Nombre del set (Ingredients, Utensils, Preparation, Organization)
 * @property {Date} started_at
 * @property {Date} ended_at
 * @property {number} duration_seconds - Duración (>= 0)
 * @property {number} blocked_count - Veces bloqueado
 * @property {number} drops_count - Objetos soltados
 * @property {number} releases_count - Objetos liberados
 * @property {number} errors_count - Conteo de errores
 * @property {Date} created_at
 */

/**
 * @typedef {Object} VRSetError
 * @property {string} id - UUID
 * @property {string} set_id - FK a vr_set_results
 * @property {string} code - Código de error (ej: MOTOR_DROP)
 * @property {string|null} message - Mensaje descriptivo
 * @property {Date} occurred_at - Momento del error
 * @property {Date} created_at
 * @property {string|null} objeto_contexto - Objeto relacionado al error
 */

// ========================================
// PAYLOAD DE UNITY (para referencia)
// ========================================

/**
 * JSON que envía Unity al endpoint POST /api/v1/session-results
 * @typedef {Object} UnitySessionPayload
 * @property {string} participantId - ID del participante
 * @property {string} activityId - ID de la actividad
 * @property {string} startedAtIso - ISO timestamp de inicio
 * @property {string} endedAtIso - ISO timestamp de fin
 * @property {number} totalSeconds - Duración total
 * @property {UnitySetPayload[]} sets - Array de sets
 */

/**
 * @typedef {Object} UnitySetPayload
 * @property {string} setName - Nombre del set
 * @property {string} startedAtIso
 * @property {string} endedAtIso
 * @property {number} durationSeconds
 * @property {number} errorsCount
 * @property {UnityErrorPayload[]} errors
 * @property {number} blockedCount
 * @property {number} releasesCount
 * @property {number} dropsCount
 */

/**
 * @typedef {Object} UnityErrorPayload
 * @property {string} timeIso - Timestamp del error
 * @property {string} code - Código de error (ej: MOTOR_DROP)
 * @property {string} message - Mensaje descriptivo
 * @property {string} context - Objeto relacionado
 * @property {string} setName - Set donde ocurrió
 */

// ========================================
// EXPORTS (para compatibilidad CommonJS)
// ========================================

/**
 * Módulo de definiciones de tipos de Base de Datos.
 * No contiene lógica de ejecución.
 * @module DatabaseTypes
 */
module.exports = {
    // Este archivo solo contiene tipos JSDoc
    // No hay exports de runtime
};
