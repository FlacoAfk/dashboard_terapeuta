/**
 * ========================================
 * SERVICIO DE AUDITORÍA
 * ========================================
 * 
 * Servicio para consulta de eventos de auditoría
 * y descarga de reportes.
 * 
 * RF-BDD-08: Bitácora de actividad del sistema
 */

import api from './api';

const auditService = {
    /**
     * Obtener eventos de auditoría
     * GET /api/audit
     */
    async getEvents({ limit = 50, offset = 0, tipo, desde, hasta } = {}) {
        try {
            let endpoint = `/api/audit?limit=${limit}&offset=${offset}`;
            if (tipo) endpoint += `&tipo=${tipo}`;
            if (desde) endpoint += `&desde=${desde}`;
            if (hasta) endpoint += `&hasta=${hasta}`;

            const response = await api.get(endpoint);
            return { success: true, data: response.data, pagination: response.pagination };
        } catch (error) {
            console.error('[AuditService] getEvents error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Obtener tipos de eventos disponibles
     * GET /api/audit/types
     */
    async getEventTypes() {
        try {
            const response = await api.get('/api/audit/types');
            return { success: true, data: response.data };
        } catch (error) {
            console.error('[AuditService] getEventTypes error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Obtener eventos de un usuario específico
     * GET /api/audit/user/:id
     */
    async getEventsByUser(userId, limit = 50) {
        try {
            const response = await api.get(`/api/audit/user/${userId}?limit=${limit}`);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('[AuditService] getEventsByUser error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Generar CSV de eventos de auditoría
     */
    generateCSV(events) {
        const headers = ['Fecha', 'Tipo de Evento', 'Usuario', 'IP', 'Detalle'];
        const rows = events.map(e => [
            new Date(e.timestamp).toLocaleString(),
            e.tipo_evento,
            e.actor_username || 'Sistema',
            e.ip_origen || 'N/A',
            JSON.stringify(e.detalle || {}).replace(/"/g, '""')
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        return csvContent;
    },

    /**
     * Descargar reporte CSV
     */
    downloadCSV(events, filename = 'auditoria') {
        const csv = this.generateCSV(events);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};

export default auditService;
