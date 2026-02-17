/**
 * ========================================
 * SERVICIO DE PACIENTES
 * ========================================
 * 
 * Servicio para comunicación con el backend
 * para operaciones de pacientes.
 * 
 * RF-SEG-03: Gestión de pacientes por Terapeuta
 */

import api from './api';

const patientService = {
    /**
     * Obtener lista de pacientes
     * GET /api/patients
     */
    async getAll(filters = {}) {
        try {
            let endpoint = '/api/patients';
            const params = [];

            if (filters.activo !== undefined && filters.activo !== '') {
                params.push(`activo=${filters.activo}`);
            }
            if (filters.nombre) {
                params.push(`nombre=${encodeURIComponent(filters.nombre)}`);
            }

            if (params.length > 0) {
                endpoint += '?' + params.join('&');
            }

            const response = await api.get(endpoint);
            return { success: true, data: response.data || [] };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Obtener un paciente por ID
     * GET /api/patients/:id
     */
    async getById(id) {
        try {
            const response = await api.get(`/api/patients/${id}`);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Crear nuevo paciente
     * POST /api/patients
     */
    async create(data) {
        try {
            const response = await api.post('/api/patients', {
                identificacion: data.identificacion,
                nombre: `${data.nombre} ${data.apellido || ''}`.trim(),
                edad: parseInt(data.edad) || null,
                diagnostico: data.condicion || data.diagnostico
            });
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Actualizar paciente
     * PUT /api/patients/:id
     */
    async update(id, data) {
        try {
            const updateData = {};
            if (data.identificacion) updateData.identificacion = data.identificacion;
            if (data.nombre) {
                updateData.nombre = data.apellido
                    ? `${data.nombre} ${data.apellido}`.trim()
                    : data.nombre;
            }
            if (data.edad !== undefined) updateData.edad = parseInt(data.edad) || null;
            if (data.diagnostico !== undefined) updateData.diagnostico = data.diagnostico;
            if (data.condicion !== undefined) updateData.diagnostico = data.condicion;
            if (data.activo !== undefined) updateData.activo = data.activo;

            const response = await api.put(`/api/patients/${id}`, updateData);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Cambiar estado activo/inactivo de un paciente
     * PUT /api/patients/:id
     */
    async toggleStatus(id, currentStatus) {
        try {
            const response = await api.put(`/api/patients/${id}/toggle-status`, {});
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },



    /**
     * Obtener estadísticas del terapeuta
     */
    async getStats() {
        try {
            const patientsResult = await this.getAll();
            if (!patientsResult.success) {
                return { success: false, error: patientsResult.error };
            }

            const patients = patientsResult.data || [];
            const activePatients = patients.filter(p => p.activo !== false);

            return {
                success: true,
                data: {
                    total: patients.length,
                    activos: activePatients.length,
                    inactivos: patients.length - activePatients.length
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

export default patientService;
