/**
 * ========================================
 * HELPER DE AUDITORÍA
 * ========================================
 * 
 * Registro de eventos administrativos
 * Requerimiento: RF-BDD-08
 */

const { supabase } = require('../config/supabase');

/**
 * Tipos de eventos de auditoría
 */
const AUDIT_TYPES = {
    // Autenticación
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILED: 'LOGIN_FAILED',
    LOGOUT: 'LOGOUT',
    PASSWORD_CHANGE: 'PASSWORD_CHANGE',

    // Usuarios
    USER_CREATED: 'USER_CREATED',
    USER_UPDATED: 'USER_UPDATED',
    USER_ACTIVATED: 'USER_ACTIVATED',
    USER_DEACTIVATED: 'USER_DEACTIVATED',
    SUPERADMIN_CREATED: 'SUPERADMIN_CREATED',

    // Terapeutas
    TERAPEUTA_CREATED: 'TERAPEUTA_CREATED',
    TERAPEUTA_UPDATED: 'TERAPEUTA_UPDATED',

    // Pacientes
    PATIENT_CREATED: 'PATIENT_CREATED',
    PATIENT_UPDATED: 'PATIENT_UPDATED',
    PATIENT_DELETED: 'PATIENT_DELETED',
    PATIENT_ASSIGNED: 'PATIENT_ASSIGNED',
    PATIENT_REASSIGNED: 'PATIENT_REASSIGNED',

    // Sesiones
    SESSION_STARTED: 'SESSION_STARTED',
    SESSION_FINISHED: 'SESSION_FINISHED',
    SESSION_ABANDONED: 'SESSION_ABANDONED',
    SESSION_REVIEWED: 'SESSION_REVIEWED',

    // Configuración
    CONFIG_UPDATED: 'CONFIG_UPDATED',

    // Exportación
    DATA_EXPORTED: 'DATA_EXPORTED'
};

/**
 * Mapeo de tipos de evento a nombres legibles en español
 */
const AUDIT_TYPE_LABELS = {
    LOGIN_SUCCESS: 'Login exitoso',
    LOGIN_FAILED: 'Login fallido',
    LOGOUT: 'Cierre de sesión',
    PASSWORD_CHANGE: 'Cambio de contraseña',
    USER_CREATED: 'Usuario creado',
    USER_UPDATED: 'Usuario actualizado',
    USER_ACTIVATED: 'Usuario activado',
    USER_DEACTIVATED: 'Usuario desactivado',
    SUPERADMIN_CREATED: 'Superadmin creado',
    TERAPEUTA_CREATED: 'Terapeuta creado',
    TERAPEUTA_UPDATED: 'Terapeuta actualizado',
    PATIENT_CREATED: 'Paciente creado',
    PATIENT_UPDATED: 'Paciente actualizado',
    PATIENT_DELETED: 'Paciente eliminado',
    PATIENT_ASSIGNED: 'Paciente asignado',
    PATIENT_REASSIGNED: 'Paciente reasignado',
    SESSION_STARTED: 'Sesión iniciada',
    SESSION_FINISHED: 'Sesión finalizada',
    SESSION_ABANDONED: 'Sesión abandonada',
    SESSION_REVIEWED: 'Sesión VR revisada',
    CONFIG_UPDATED: 'Configuración actualizada',
    DATA_EXPORTED: 'Datos exportados'
};

/**
 * Obtener IP del request
 */
const getClientIP = (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        req.ip ||
        'localhost';
};

/**
 * Registrar evento de auditoría con todos los campos
 * @param {string} tipo - Tipo de evento (usar AUDIT_TYPES)
 * @param {number|null} idActor - ID del usuario que realiza la acción
 * @param {string|null} actorEmail - Email del actor
 * @param {object} detalle - Detalles adicionales del evento
 * @param {string|null} ipOrigen - IP de origen
 */
const registrarAuditoria = async (tipo, idActor = null, actorEmail = null, detalle = {}, ipOrigen = null) => {
    try {
        // Crear objeto de descripción completo
        const descripcionCompleta = {
            ...detalle,
            _actor_email: actorEmail || 'sistema',
            _ip_origen: ipOrigen || 'localhost',
            _tipo_label: AUDIT_TYPE_LABELS[tipo] || tipo
        };

        const { error } = await supabase
            .from('auditoria')
            .insert({
                tipo_accion: tipo,
                id_usuario: idActor,
                descripcion: JSON.stringify(descripcionCompleta),
                fecha: new Date().toISOString()
            });

        if (error) {
            throw error;
        }

        console.log(`📋 Auditoría: ${AUDIT_TYPE_LABELS[tipo] || tipo} por ${actorEmail || 'sistema'} desde ${ipOrigen || 'localhost'}`);
    } catch (error) {
        // No fallar si la auditoría falla, solo loguear
        console.error('❌ Error registrando auditoría:', error.message);
    }
};

/**
 * Helper para registrar auditoría desde un request
 * Extrae automáticamente usuario e IP del request
 */
const auditFromRequest = async (req, tipo, detalle = {}) => {
    const idActor = req.user?.id || null;
    const actorEmail = req.user?.email || null;
    const ip = getClientIP(req);
    await registrarAuditoria(tipo, idActor, actorEmail, detalle, ip);
};

/**
 * Helper para registrar login (incluye email del intento)
 */
const auditLogin = async (req, tipo, email, detalle = {}) => {
    const ip = getClientIP(req);
    await registrarAuditoria(tipo, null, email, detalle, ip);
};

/**
 * Helper para registrar evento con usuario autenticado
 */
const auditWithUser = async (req, tipo, user, detalle = {}) => {
    const ip = getClientIP(req);
    await registrarAuditoria(tipo, user.id, user.email, detalle, ip);
};

module.exports = {
    AUDIT_TYPES,
    AUDIT_TYPE_LABELS,
    registrarAuditoria,
    getClientIP,
    auditFromRequest,
    auditLogin,
    auditWithUser
};
