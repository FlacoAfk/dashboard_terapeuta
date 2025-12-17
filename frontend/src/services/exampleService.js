/**
 * ========================================
 * SERVICIOS DE EJEMPLO
 * ========================================
 * 
 * Este archivo muestra cómo crear servicios para llamar a la API.
 * Copia este patrón para crear tus propios servicios.
 * 
 * Uso: PatientService.getAll()
 *      SessionService.getAll()
 */

// ========================================
// SERVICIO DE PACIENTES
// ========================================

const PatientService = {
    /** Obtener todos los pacientes */
    async getAll() {
        return await window.api.get('/api/patients');
    },

    /** Crear un nuevo paciente */
    async create(patientData) {
        return await window.api.post('/api/patients', patientData);
    },

    // Agregar más métodos según sea necesario:
    // async getById(id) { ... }
    // async update(id, data) { ... }
    // async delete(id) { ... }
};

// ========================================
// SERVICIO DE SESIONES
// ========================================

const SessionService = {
    /** Obtener todas las sesiones */
    async getAll() {
        return await window.api.get('/api/sessions');
    },
};

// ========================================
// SERVICIO DE ESTADO
// ========================================

const HealthService = {
    /** Verificar si el backend está funcionando */
    async check() {
        return await window.api.get('/health');
    },

    /** Obtener estado de la API */
    async getStatus() {
        return await window.api.get('/api/status');
    },
};

// Hacer disponibles globalmente
window.PatientService = PatientService;
window.SessionService = SessionService;
window.HealthService = HealthService;
