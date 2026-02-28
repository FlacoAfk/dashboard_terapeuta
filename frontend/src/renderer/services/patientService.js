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
    buildQueryString(filters = {}) {
        const params = new URLSearchParams();

        if (filters.page) params.append('page', String(filters.page));
        if (filters.limit) params.append('limit', String(filters.limit));
        if (filters.activo !== undefined && filters.activo !== '') params.append('activo', String(filters.activo));
        if (filters.nombre) params.append('nombre', String(filters.nombre));
        if (filters.identificacion) params.append('identificacion', String(filters.identificacion));
        if (filters.id_terapeuta) params.append('id_terapeuta', String(filters.id_terapeuta));
        if (filters.search) params.append('search', String(filters.search));
        if (filters.sort) params.append('sort', String(filters.sort));

        const serialized = params.toString();
        return serialized ? `?${serialized}` : '';
    },

    /**
     * Obtener lista de pacientes
     * GET /api/patients
     */
    async getAll(filters = {}) {
        try {
            const { skipCache = false, forceRefresh = false, ...queryFilters } = filters;
            const endpoint = `/api/patients${this.buildQueryString(queryFilters)}`;
            const response = await api.get(endpoint, { skipCache, forceRefresh });
            return {
                success: true,
                data: response?.data || [],
                count: response?.count ?? (response?.data || []).length,
                pagination: response?.pagination || null
            };
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
            const [totalResult, activeResult, inactiveResult] = await Promise.all([
                this.getAll({ page: 1, limit: 1 }),
                this.getAll({ page: 1, limit: 1, activo: true }),
                this.getAll({ page: 1, limit: 1, activo: false })
            ]);

            if (!totalResult.success || !activeResult.success || !inactiveResult.success) {
                return { success: false, error: totalResult.error || activeResult.error || inactiveResult.error };
            }

            const total = totalResult.pagination?.total ?? totalResult.count ?? 0;
            const activos = activeResult.pagination?.total ?? activeResult.count ?? 0;
            const inactivos = inactiveResult.pagination?.total ?? inactiveResult.count ?? Math.max(0, total - activos);

            return {
                success: true,
                data: {
                    total,
                    activos,
                    inactivos
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

export default patientService;
