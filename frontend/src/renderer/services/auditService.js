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
    async getEvents({ limit = 50, offset = 0, tipo, mes, anio } = {}) {
        try {
            let endpoint = `/api/audit?limit=${limit}&offset=${offset}`;
            if (tipo) endpoint += `&tipo=${tipo}`;
            if (mes) endpoint += `&mes=${mes}`;
            if (anio) endpoint += `&anio=${anio}`;

            const response = await api.get(endpoint);
            return { success: true, data: response.data || [], pagination: response.pagination };
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
        if (!events || events.length === 0) {
            return 'No hay datos para exportar';
        }

        const headers = ['ID', 'Fecha', 'Tipo', 'Usuario', 'IP', 'Detalles'];

        const escapeCSV = (value) => {
            if (value === null || value === undefined) return '';
            const str = String(value);
            // Escape quotes and wrap in quotes if contains comma, newline or quote
            if (str.includes(',') || str.includes('\n') || str.includes('"')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const rows = events.map(e => {
            const fecha = e.timestamp ? new Date(e.timestamp).toLocaleString('es-CO') : '';
            const tipo = e.tipo_label || e.tipo_evento || '';
            const usuario = e.actor_username || 'sistema';
            const ip = e.ip_origen || 'localhost';
            const detalles = e.detalle_texto || '';

            return [
                e.id || '',
                fecha,
                tipo,
                usuario,
                ip,
                detalles
            ].map(escapeCSV).join(',');
        });

        // BOM + headers + rows
        return '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
    },

    /**
     * Descargar reporte CSV - Compatible con Electron
     */
    downloadCSV(events, filename = 'auditoria') {
        try {
            const csvContent = this.generateCSV(events);

            // Create blob
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

            // Create download URL
            const url = window.URL.createObjectURL(blob);

            // Create hidden link element
            const link = document.createElement('a');
            link.style.display = 'none';
            link.href = url;
            link.download = `${filename}.csv`;

            // Append to body, click, and cleanup
            document.body.appendChild(link);

            // Use setTimeout to ensure the click happens
            setTimeout(() => {
                link.click();

                // Cleanup after a delay
                setTimeout(() => {
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                }, 100);
            }, 0);

            console.log('[AuditService] CSV download initiated:', filename);
            return true;
        } catch (error) {
            console.error('[AuditService] Error downloading CSV:', error);

            // Fallback: Try opening in new window
            try {
                const csvContent = this.generateCSV(events);
                const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
                window.open(dataUri);
                return true;
            } catch (fallbackError) {
                console.error('[AuditService] Fallback also failed:', fallbackError);
                throw error;
            }
        }
    }
};

export default auditService;
