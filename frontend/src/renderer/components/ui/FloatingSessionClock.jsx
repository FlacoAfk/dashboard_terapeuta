import React, { useState, useEffect } from 'react';
import { useSession } from '../../context/SessionContext';
import { Icons } from './Icons';
import sessionService from '../../services/sessionService';
import { showToast } from '../../utils/alertUtils';

/**
 * Formatea milisegundos a HH:MM:SS
 */
const formatElapsed = (ms) => {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

/**
 * Reloj flotante que aparece solo cuando hay una sesión VR activa.
 * Se posiciona en la esquina inferior derecha, discreto pero visible.
 */
const FloatingSessionClock = () => {
    const { activeSession, dismissSession } = useSession();
    const [elapsed, setElapsed] = useState(0);
    const [minimized, setMinimized] = useState(false);
    const [closing, setClosing] = useState(false);

    useEffect(() => {
        if (!activeSession) {
            // Batch reset
            setElapsed(0);
            setMinimized(false);
            return;
        }

        // Initialize and start timer
        setElapsed(Date.now() - activeSession.started_at);
        const timer = setInterval(() => setElapsed(Date.now() - activeSession.started_at), 1000);
        return () => clearInterval(timer);
    }, [activeSession]);

    if (!activeSession) return null;

    const isWaitingStart = activeSession.status === 'CREATED';

    const handleCloseSession = async () => {
        if (!activeSession?.session_id || closing) return;

        setClosing(true);
        try {
            await sessionService.closeSession(activeSession.session_id);
            dismissSession();
            showToast('success', 'Sesión finalizada desde el dashboard');
        } catch (error) {
            showToast('error', error.message || 'No se pudo finalizar la sesión');
        } finally {
            setClosing(false);
        }
    };

    // Vista minimizada: solo un pill pequeño
    if (minimized) {
        return (
            <button
                onClick={() => setMinimized(false)}
                className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-[#2AA87E] text-white px-3 py-2 rounded-full shadow-lg hover:bg-[#238c68] transition-all animate-in fade-in slide-in-from-bottom-2 duration-300"
                title="Sesión VR activa — clic para expandir"
            >
                <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                </span>
                <span className="text-sm font-mono font-semibold">{formatElapsed(elapsed)}</span>
            </button>
        );
    }

    // Vista expandida
    return (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden w-64">
                {/* Header verde */}
                <div className="bg-[#2AA87E] px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                        </span>
                        <span className="text-white text-xs font-semibold uppercase tracking-wider">Sesión activa</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setMinimized(true)}
                            className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors"
                            title="Minimizar"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="px-4 py-3 space-y-2.5">
                    <div className={`text-xs font-medium rounded-lg px-2.5 py-1 ${isWaitingStart ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                        {isWaitingStart ? 'Esperando inicio en VR' : 'Iniciada por VR'}
                    </div>

                    {/* Timer */}
                    <div className="flex items-center justify-center gap-2">
                        <Icons.Clock />
                        <span className="text-2xl font-mono font-bold text-gray-900 tracking-wider">
                            {formatElapsed(elapsed)}
                        </span>
                    </div>

                    {/* Info */}
                    <div className="space-y-1 text-xs">
                        {activeSession.recipe_name && (
                            <div className="flex items-center justify-between text-gray-600">
                                <span>Receta</span>
                                <span className="font-medium text-gray-900 truncate ml-2 max-w-35">
                                    {activeSession.recipe_name}
                                </span>
                            </div>
                        )}
                        {activeSession.start_token && (
                            <div className="flex items-center justify-between text-gray-600">
                                <span>Token</span>
                                <span className="font-mono font-bold text-[#2AA87E] tracking-wider">
                                    {activeSession.start_token}
                                </span>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleCloseSession}
                        disabled={closing}
                        className="w-full mt-1 inline-flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg py-2 text-xs font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {closing ? 'Finalizando...' : 'Finalizar sesión'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FloatingSessionClock;
