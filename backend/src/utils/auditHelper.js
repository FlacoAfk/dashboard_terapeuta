/**
 * ========================================
 * HELPER DE AUDITORÍA
 * ========================================
 * 
 * Registro de eventos administrativos
 * Requerimiento: RF-BDD-08
 */

const { query } = require('../config/database');

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

    // Configuración
    CONFIG_UPDATED: 'CONFIG_UPDATED',

    // Exportación
    DATA_EXPORTED: 'DATA_EXPORTED'
};

/**
 * Registrar evento de auditoría
 * @param {string} tipo - Tipo de evento (usar AUDIT_TYPES)
 * @param {number|null} idActor - ID del usuario que realiza la acción
 * @param {object} detalle - Detalles adicionales del evento (JSON)
 * @param {string|null} ipOrigen - IP de origen de la petición
 */
const registrarAuditoria = async (tipo, idActor = null, detalle = {}, ipOrigen = null) => {
    try {
        await query(
            `INSERT INTO auditoria (tipo_evento, id_actor, detalle, ip_origen)
             VALUES ($1, $2, $3, $4)`,
            [tipo, idActor, JSON.stringify(detalle), ipOrigen]
        );
        console.log(`📋 Auditoría: ${tipo} por usuario ${idActor || 'sistema'}`);
    } catch (error) {
        // No fallar si la auditoría falla, solo loguear
        console.error('❌ Error registrando auditoría:', error.message);
    }
};

/**
 * Obtener IP del request
 */
const getClientIP = (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        'unknown';
};

/**
 * Helper para registrar auditoría desde un request
 */
const auditFromRequest = async (req, tipo, detalle = {}) => {
    const idActor = req.user?.id || null;
    const ip = getClientIP(req);
    await registrarAuditoria(tipo, idActor, detalle, ip);
};

module.exports = {
    AUDIT_TYPES,
    registrarAuditoria,
    getClientIP,
    auditFromRequest
};
