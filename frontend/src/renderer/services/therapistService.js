/**
 * ========================================
 * SERVICIO DE GESTIÓN DE TERAPEUTAS
 * ========================================
 * 
 * Servicio para comunicación con el backend
 * para operaciones CRUD de terapeutas.
 * 
 * RF-SEG-02: Gestión de terapeutas por Superadmin
 */

import api from './api';

const therapistService = {
    /**
     * Obtener lista de terapeutas
     * GET /api/usuarios
     */
    async getAll() {
        try {
            const response = await api.get('/api/usuarios');
            // Filtrar solo usuarios con rol TERAPEUTA
            const therapists = response.data
                .filter(u => u.rol === 'TERAPEUTA')
                .map(u => ({
                    id: u.id,
                    id_terapeuta: u.id_terapeuta,
                    email: u.email,
                    nombre: u.nombre || 'Sin nombre',
                    correo: u.correo || u.email,
                    especialidad: u.especialidad || '',
                    telefono: u.telefono || '',
                    activo: u.activo,
                    pacientes: u.pacientes_count || 0,
                    fecha_creacion: u.fecha_creacion
                }));
            return { success: true, data: therapists };
        } catch (error) {
            console.error('[TherapistService] getAll error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Crear nuevo terapeuta
     * POST /api/usuarios/terapeuta
     */
    async create(data) {
        try {
            const response = await api.post('/api/usuarios/terapeuta', {
                nombre: data.nombre,
                correo: data.correo,
                password: data.password,
                especialidad: data.especialidad || 'General'
            });
            return { success: true, data: response.data };
        } catch (error) {
            console.error('[TherapistService] create error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Actualizar terapeuta
     * PUT /api/usuarios/:id
     */
    async update(id, data) {
        try {
            const response = await api.put(`/api/usuarios/${id}`, {
                nombre: data.nombre,
                correo: data.correo,
                especialidad: data.especialidad,
                telefono: data.telefono
            });
            return { success: true, data: response.data };
        } catch (error) {
            console.error('[TherapistService] update error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Cambiar estado (activar/desactivar)
     * PUT /api/usuarios/:id/toggle-estado
     */
    async toggleStatus(id) {
        try {
            const response = await api.put(`/api/usuarios/${id}/toggle-estado`);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('[TherapistService] toggleStatus error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Resetear contraseña de terapeuta
     * POST /api/usuarios/:id/reset-password
     */
    async resetPassword(id, newPassword) {
        try {
            const response = await api.post(`/api/usuarios/${id}/reset-password`, {
                newPassword
            });
            return { success: true, data: response.data };
        } catch (error) {
            console.error('[TherapistService] resetPassword error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Obtener pacientes de un terapeuta
     * GET /api/patients (filtrado por terapeuta)
     */
    async getPatients(therapistId) {
        try {
            const response = await api.get('/api/patients');
            // Filtrar pacientes del terapeuta específico
            const patients = response.data
                .filter(p => p.id_terapeuta === therapistId)
                .map(p => ({
                    id: p.id,
                    nombre: p.nombre,
                    identificacion: p.identificacion,
                    edad: p.edad,
                    diagnostico: p.diagnostico
                }));
            return { success: true, data: patients };
        } catch (error) {
            console.error('[TherapistService] getPatients error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Reasignar pacientes a otros terapeutas
     * POST /api/patients/:id/assign
     */
    async reassignPatients(assignments) {
        try {
            const results = [];
            for (const { patientId, therapistId } of assignments) {
                const response = await api.post(`/api/patients/${patientId}/assign`, {
                    id_terapeuta: therapistId
                });
                results.push(response);
            }
            return { success: true, data: results };
        } catch (error) {
            console.error('[TherapistService] reassignPatients error:', error);
            return { success: false, error: error.message };
        }
    }
};

export default therapistService;
