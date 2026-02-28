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
    async fetchAllPages(endpoint, baseFilters = {}, requestOptions = {}) {
        const pageSize = baseFilters.limit || 100;
        let page = 1;
        let totalPages = 1;
        const aggregated = [];

        while (page <= totalPages) {
            const params = new URLSearchParams();
            params.append('page', String(page));
            params.append('limit', String(pageSize));

            Object.entries(baseFilters).forEach(([key, value]) => {
                if (key === 'limit') return;
                if (value !== undefined && value !== null && value !== '') {
                    params.append(key, String(value));
                }
            });

            const response = await api.get(`${endpoint}?${params.toString()}`, requestOptions);
            const currentData = response?.data || [];
            aggregated.push(...currentData);

            totalPages = response?.pagination?.totalPages || 1;
            page += 1;
        }

        return aggregated;
    },

    /**
     * Obtener lista de terapeutas
     * GET /api/usuarios
     */
    async getAll(options = {}) {
        try {
            const {
                fetchAll = false,
                skipCache = false,
                forceRefresh = false,
                page = 1,
                limit = 10,
                search,
                activo,
                sort = 'fecha_creacion:desc'
            } = options;

            if (!fetchAll) {
                const params = new URLSearchParams();
                params.append('rol', 'TERAPEUTA');
                params.append('page', String(page));
                params.append('limit', String(limit));
                params.append('sort', String(sort));
                if (search) params.append('search', String(search));
                if (activo !== undefined && activo !== null && activo !== '') params.append('activo', String(activo));

                const response = await api.get(`/api/usuarios?${params.toString()}`, { skipCache, forceRefresh });
                const pagedUsers = response?.data || [];

                const therapists = pagedUsers
                    .filter(u => u.rol === 'TERAPEUTA')
                    .map(u => ({
                        id: u.id,
                        id_terapeuta: u.id_terapeuta,
                        email: u.username || u.email || u.correo,
                        usuario: u.username || u.email || u.correo,
                        nombre: u.nombre || 'Sin nombre',
                        correo: u.correo || u.username || u.email,
                        especialidad: u.especialidad || '',
                        telefono: u.telefono || '',
                        activo: u.activo,
                        pacientes: u.pacientes_count || 0,
                        fecha_creacion: u.fecha_creacion
                    }));

                return {
                    success: true,
                    data: therapists,
                    pagination: response?.pagination || null,
                    count: response?.count ?? therapists.length
                };
            }

            const users = await this.fetchAllPages('/api/usuarios', {
                rol: 'TERAPEUTA',
                sort,
                search,
                activo,
                limit: 100
            }, { skipCache, forceRefresh });

            // Filtrar solo usuarios con rol TERAPEUTA
            const therapists = users
                .filter(u => u.rol === 'TERAPEUTA')
                .map(u => ({
                    id: u.id,
                    id_terapeuta: u.id_terapeuta,
                    email: u.username || u.email || u.correo,
                    usuario: u.username || u.email || u.correo,
                    nombre: u.nombre || 'Sin nombre',
                    correo: u.correo || u.username || u.email,
                    especialidad: u.especialidad || '',
                    telefono: u.telefono || '',
                    activo: u.activo,
                    pacientes: u.pacientes_count || 0,
                    fecha_creacion: u.fecha_creacion
                }));
            return {
                success: true,
                data: therapists,
                pagination: {
                    page: 1,
                    limit: therapists.length || 1,
                    total: therapists.length,
                    totalPages: therapists.length > 0 ? 1 : 0,
                    hasNextPage: false,
                    hasPrevPage: false
                },
                count: therapists.length
            };
        } catch (error) {
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
                especialidad: data.especialidad || 'General',
                telefono: data.telefono || null
            });
            return { success: true, data: response.data };
        } catch (error) {
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
            return { success: false, error: error.message };
        }
    },

    /**
     * Obtener pacientes de un terapeuta
     * GET /api/patients (filtrado por terapeuta)
     */
    async getPatients(therapistId) {
        try {
            const pageSize = 100;
            let page = 1;
            let totalPages = 1;
            const allPatients = [];

            while (page <= totalPages) {
                const params = new URLSearchParams();
                params.append('id_terapeuta', String(therapistId));
                params.append('page', String(page));
                params.append('limit', String(pageSize));

                const response = await api.get(`/api/patients?${params.toString()}`);
                const currentData = response?.data || [];
                allPatients.push(...currentData);
                totalPages = response?.pagination?.totalPages || 1;
                page += 1;
            }

            // Filtrar pacientes del terapeuta específico
            const patients = allPatients
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
            return { success: false, error: error.message };
        }
    }
};

export default therapistService;
