/**
 * ========================================
 * SERVICIO DE SESIONES VR
 * ========================================
 * 
 * Servicio para consulta de sesiones de terapia.
 * 
 * RF-SEG-04: Visualización de informes de pacientes
 */

import api from './api';

const sessionService = {
    /**
     * Obtener sesiones de un paciente
     * GET /api/sessions?id_paciente=X
     */
    async getByPatient(patientId, limit = 50) {
        try {
            const response = await api.get(`/api/sessions?id_paciente=${patientId}&limit=${limit}`);
            return { success: true, data: response.data || [] };
        } catch (error) {
            console.error('[SessionService] getByPatient error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Obtener detalle de una sesión específica
     * GET /api/sessions/:id
     */
    async getById(id) {
        try {
            const response = await api.get(`/api/sessions/${id}`);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('[SessionService] getById error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Obtener estadísticas de sesiones para el terapeuta
     */
    async getStats() {
        try {
            const response = await api.get('/api/sessions?limit=100');
            const sessions = response.data || [];

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            weekAgo.setHours(0, 0, 0, 0);

            const sessionsToday = sessions.filter(s => {
                const sessionDate = new Date(s.fecha_inicio);
                return sessionDate >= today;
            });

            const sessionsThisWeek = sessions.filter(s => {
                const sessionDate = new Date(s.fecha_inicio);
                return sessionDate >= weekAgo;
            });

            // Calcular rendimiento promedio
            const completedSessions = sessions.filter(s => s.estado === 'COMPLETADA');
            let rendimientoPromedio = 0;

            if (completedSessions.length > 0) {
                const totalAciertos = completedSessions.reduce((sum, s) => sum + (s.total_aciertos || 0), 0);
                const totalErrores = completedSessions.reduce((sum, s) => sum + (s.total_errores || 0), 0);
                const total = totalAciertos + totalErrores;
                rendimientoPromedio = total > 0 ? Math.round((totalAciertos / total) * 100) : 0;
            }

            return {
                success: true,
                data: {
                    hoy: sessionsToday.length,
                    semana: sessionsThisWeek.length,
                    rendimientoPromedio
                }
            };
        } catch (error) {
            console.error('[SessionService] getStats error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Calcular rendimiento de una sesión
     */
    calculateRendimiento(session) {
        const aciertos = session.total_aciertos || 0;
        const errores = session.total_errores || 0;
        const total = aciertos + errores;

        if (total === 0) return { porcentaje: 0, label: 'Sin datos', color: 'gray' };

        const porcentaje = Math.round((aciertos / total) * 100);

        if (porcentaje >= 90) return { porcentaje, label: 'Excelente', color: 'green' };
        if (porcentaje >= 75) return { porcentaje, label: 'Muy Bueno', color: 'emerald' };
        if (porcentaje >= 60) return { porcentaje, label: 'Bueno', color: 'amber' };
        if (porcentaje >= 40) return { porcentaje, label: 'Regular', color: 'orange' };
        return { porcentaje, label: 'Bajo', color: 'red' };
    },

    /**
     * Formatear dificultad
     */
    formatDificultad(nivel) {
        const niveles = {
            'FACIL': { label: 'Fácil', color: 'green' },
            'MEDIO': { label: 'Medio', color: 'amber' },
            'DIFICIL': { label: 'Difícil', color: 'red' }
        };
        return niveles[nivel?.toUpperCase()] || { label: nivel || 'N/A', color: 'gray' };
    },

    /**
     * Formatear tiempo en minutos y segundos
     */
    formatTiempo(segundos) {
        if (!segundos) return '0 min';
        const mins = Math.floor(segundos / 60);
        const secs = segundos % 60;
        if (mins === 0) return `${secs} seg`;
        if (secs === 0) return `${mins} min`;
        return `${mins} min ${secs} seg`;
    }
};

export default sessionService;
