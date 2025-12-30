import React, { useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';

/**
 * Iconos SVG
 */
const Icons = {
    Download: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
    ),
    Login: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
    ),
    Users: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    ),
    Patients: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    ),
    Swap: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
    ),
    VR: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
    ),
    Info: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    ChevronDown: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
    )
};

/**
 * Chip de evento
 */
const EventChip = ({ icon: Icon, label, active = true }) => (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
        active 
            ? 'border-gray-300 bg-white text-gray-700' 
            : 'border-gray-200 bg-gray-50 text-gray-400'
    }`}>
        <Icon />
        <span className="text-sm font-medium">{label}</span>
    </div>
);

/**
 * Meses en español
 */
const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Años disponibles
 */
const AÑOS = [2023, 2024, 2025, 2026];

/**
 * Vista de Auditoría del Sistema
 */
const Auditoria = () => {
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState(MESES[currentDate.getMonth()]);
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownloadReport = async () => {
        setIsDownloading(true);
        
        // Simular descarga
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // TODO: Implementar descarga real del reporte
        console.log(`Descargando reporte: auditoria_${selectedMonth}_${selectedYear}.csv`);
        
        setIsDownloading(false);
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Auditoría del Sistema
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Consulta y descarga los registros de actividad de la plataforma para control y seguridad.
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    {/* Período de Reporte */}
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">
                            Período de Reporte
                        </h2>
                        <p className="text-gray-500 text-sm mb-4">
                            Selecciona el mes y año para generar el archivo de auditoría.
                        </p>

                        <div className="grid grid-cols-2 gap-4 max-w-lg">
                            {/* Mes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Mes
                                </label>
                                <div className="relative">
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 pr-10 focus:ring-2 focus:ring-[#F76C6C]/20 focus:border-[#F76C6C] transition-colors"
                                    >
                                        {MESES.map(mes => (
                                            <option key={mes} value={mes}>{mes}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <Icons.ChevronDown />
                                    </div>
                                </div>
                            </div>

                            {/* Año */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Año
                                </label>
                                <div className="relative">
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                                        className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 pr-10 focus:ring-2 focus:ring-[#F76C6C]/20 focus:border-[#F76C6C] transition-colors"
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
                        </div>

                        {/* Download Button */}
                        <button
                            onClick={handleDownloadReport}
                            disabled={isDownloading}
                            className="mt-6 flex items-center gap-2 bg-[#F76C6C] hover:bg-[#E55A5A] disabled:bg-gray-300 text-white font-medium px-5 py-2.5 rounded-lg transition-colors shadow-sm"
                        >
                            {isDownloading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Generando...
                                </>
                            ) : (
                                <>
                                    <Icons.Download />
                                    Descargar Reporte CSV
                                </>
                            )}
                        </button>
                    </div>

                    {/* Eventos Incluidos + Info */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Eventos Incluidos */}
                        <div>
                            <h3 className="text-base font-semibold text-gray-900 mb-3">
                                Eventos Incluidos
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                <EventChip icon={Icons.Login} label="Login / Logout" />
                                <EventChip icon={Icons.Users} label="Gestión Terapeutas" />
                                <EventChip icon={Icons.Patients} label="Gestión Pacientes" />
                                <EventChip icon={Icons.Swap} label="Reasignaciones" />
                                <EventChip icon={Icons.VR} label="Sesiones VR" />
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <div className="text-blue-500 mt-0.5">
                                    <Icons.Info />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-blue-800 text-sm mb-2">
                                        Detalles del formato
                                    </h4>
                                    <ul className="text-sm text-blue-700 space-y-1">
                                        <li>
                                            El archivo se generará en formato <strong>.CSV</strong> (Valores separados por comas).
                                        </li>
                                        <li>
                                            El nombre del archivo seguirá el patrón: <code className="bg-blue-100 px-1 py-0.5 rounded text-xs">auditoria_[Mes]_[Año].csv</code>
                                        </li>
                                        <li>
                                            Si el mes seleccionado es el actual, se incluirán registros hasta el momento de la descarga.
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default Auditoria;
