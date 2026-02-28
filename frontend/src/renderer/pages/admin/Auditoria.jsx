import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import auditService from '../../services/auditService';
import { Icons } from '../../components/ui/Icons';

/**
 * Meses en español
 */
const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Generar rango de años dinámicamente desde 2024 hasta el año actual + 1
const currentYear = new Date().getFullYear();
const AÑOS = Array.from({ length: currentYear - 2024 + 2 }, (_, i) => 2024 + i);

/**
 * Badge de tipo de evento
 */
const EventTypeBadge = ({ type, label }) => {
    const colors = {
        LOGIN_SUCCESS: 'bg-green-100 text-green-700',
        LOGIN_FAILED: 'bg-red-100 text-red-700',
        LOGOUT: 'bg-gray-100 text-gray-700',
        TERAPEUTA_CREATED: 'bg-blue-100 text-blue-700',
        TERAPEUTA_UPDATED: 'bg-blue-100 text-blue-700',
        USER_CREATED: 'bg-blue-100 text-blue-700',
        USER_UPDATED: 'bg-blue-100 text-blue-700',
        USER_ACTIVATED: 'bg-green-100 text-green-700',
        USER_DEACTIVATED: 'bg-amber-100 text-amber-700',
        PASSWORD_RESET: 'bg-purple-100 text-purple-700',
        PASSWORD_CHANGE: 'bg-purple-100 text-purple-700',
        PATIENT_CREATED: 'bg-teal-100 text-teal-700',
        PATIENT_UPDATED: 'bg-teal-100 text-teal-700',
        PATIENT_ASSIGNED: 'bg-indigo-100 text-indigo-700',
        PATIENT_REASSIGNED: 'bg-indigo-100 text-indigo-700',
        SESSION_STARTED: 'bg-cyan-100 text-cyan-700',
        SESSION_FINISHED: 'bg-cyan-100 text-cyan-700',
        SUPERADMIN_CREATED: 'bg-purple-100 text-purple-700',
        default: 'bg-gray-100 text-gray-600'
    };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[type] || colors.default}`}>
            {label || type}
        </span>
    );
};

/**
 * Vista de Auditoría del Sistema
 */
const Auditoria = () => {
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1); // 1-12
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isDownloading, setIsDownloading] = useState(false);

    // Cargar eventos al montar y cuando cambian los filtros
    useEffect(() => {
        fetchEvents();
    }, [selectedMonth, selectedYear]);

    const fetchEvents = async () => {
        setLoading(true);
        setError('');
        try {
            const result = await auditService.getEvents({
                mes: selectedMonth,
                anio: selectedYear,
                limit: 100
            });

            if (result.success) {
                setEvents(result.data);
            } else {
                setError(result.error || 'Error al cargar eventos');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadReport = async () => {
        setIsDownloading(true);
        try {
            const filename = `auditoria_${MESES[selectedMonth - 1]}_${selectedYear}`;
            auditService.downloadCSV(events, filename);
        } catch (err) {
            alert('Error al descargar el reporte');
        } finally {
            setIsDownloading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('es-CO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
                        Auditoría del Sistema
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm lg:text-base">
                        Registros de actividad de la plataforma para control y seguridad.
                    </p>
                </div>

                {/* Filtros */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
                    <div className="flex flex-wrap items-end gap-4 mb-6">
                        {/* Mes */}
                        <div className="flex-1 min-w-[150px] sm:flex-none">
                            <label htmlFor="auditoria-field-131" className="block text-sm font-medium text-gray-700 mb-2">Mes</label>
                            <div className="relative">
                                <select id="auditoria-field-131"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 pr-10 focus:ring-2 focus:ring-[#F76C6C]/20 focus:border-[#F76C6C]"
                                >
                                    {MESES.map((mes, idx) => (
                                        <option key={mes} value={idx + 1}>{mes}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <Icons.ChevronDown />
                                </div>
                            </div>
                        </div>

                        {/* Año */}
                        <div className="flex-1 min-w-[100px] sm:flex-none">
                            <label htmlFor="auditoria-field-150" className="block text-sm font-medium text-gray-700 mb-2">Año</label>
                            <div className="relative">
                                <select id="auditoria-field-150"
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 pr-10 focus:ring-2 focus:ring-[#F76C6C]/20 focus:border-[#F76C6C]"
                                >
                                    {AÑOS.map(año => (
                                        <option key={año} value={año}>{año}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <Icons.ChevronDown />
                                </div>
                            </div>
                        </div>

                        {/* Refresh */}
                        <button
                            onClick={fetchEvents}
                            disabled={loading}
                            className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                            title="Recargar"
                        >
                            <Icons.Refresh />
                        </button>

                        {/* Download */}
                        <button
                            onClick={handleDownloadReport}
                            disabled={isDownloading || events.length === 0}
                            className="flex items-center gap-2 bg-[#F76C6C] hover:bg-[#E55A5A] disabled:bg-gray-300 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
                        >
                            {isDownloading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Generando...
                                </>
                            ) : (
                                <>
                                    <Icons.Download />
                                    Descargar CSV
                                </>
                            )}
                        </button>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    {/* Loading */}
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#F76C6C] border-t-transparent"></div>
                        </div>
                    ) : events.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            No hay eventos para el período seleccionado.
                        </div>
                    ) : (
                        /* Events Table */
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                        <th className="pb-3 pr-4">Fecha</th>
                                        <th className="pb-3 pr-4">Tipo</th>
                                        <th className="pb-3 pr-4">Usuario</th>
                                        <th className="pb-3 pr-4">IP</th>
                                        <th className="pb-3">Detalles</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {events.map((event, index) => (
                                        <tr key={event.id || index} className="hover:bg-gray-50">
                                            <td className="py-3 pr-4 text-sm text-gray-600">
                                                {formatDate(event.timestamp)}
                                            </td>
                                            <td className="py-3 pr-4">
                                                <EventTypeBadge
                                                    type={event.tipo_evento}
                                                    label={event.tipo_label}
                                                />
                                            </td>
                                            <td className="py-3 pr-4 text-sm text-gray-900">
                                                {event.actor_email || 'sistema'}
                                            </td>
                                            <td className="py-3 pr-4 text-sm text-gray-500 font-mono">
                                                {event.ip_origen || 'localhost'}
                                            </td>
                                            <td className="py-3 text-sm text-gray-500 max-w-xs truncate">
                                                {event.detalle_texto || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Total */}
                    {!loading && events.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-500">
                            Total: {events.length} eventos
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default Auditoria;
