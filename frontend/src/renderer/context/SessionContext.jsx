import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * Contexto para manejar la sesión VR activa.
 * Permite que cualquier componente inicie/detenga el reloj flotante
 * sin acoplar la lógica al layout.
 */
const SessionContext = createContext(null);
const SESSION_STORAGE_KEY = 'active_recipe_session';

export const useSession = () => {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error('useSession debe usarse dentro de un SessionProvider');
    }
    return context;
};

export const SessionProvider = ({ children }) => {
    const [activeSession, setActiveSession] = useState(() => {
        try {
            const saved = localStorage.getItem(SESSION_STORAGE_KEY);
            if (!saved) return null;
            const parsed = JSON.parse(saved);
            return parsed?.session_id ? parsed : null;
        } catch {
            return null;
        }
    });

    /**
     * Inicia la sesión activa (muestra el reloj flotante)
     * @param {{ session_id, start_token, recipe_id, recipe_name, participant_code }} sessionData
     */
    const startSession = useCallback((sessionData) => {
        const nextSession = {
            ...sessionData,
            started_at: sessionData.started_at || Date.now()
        };

        setActiveSession(nextSession);
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
    }, []);

    /**
     * Sincroniza sesión activa desde backend sin reiniciar el reloj
     */
    const syncSession = useCallback((sessionData) => {
        if (!sessionData?.session_id) {
            setActiveSession(null);
            localStorage.removeItem(SESSION_STORAGE_KEY);
            return;
        }

        setActiveSession((prev) => {
            const startedAt = sessionData.started_at || prev?.started_at || Date.now();
            const nextSession = { ...sessionData, started_at: startedAt };
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
            return nextSession;
        });
    }, []);

    /**
     * Cierra/descarta la sesión activa (oculta el reloj)
     */
    const dismissSession = useCallback(() => {
        setActiveSession(null);
        localStorage.removeItem(SESSION_STORAGE_KEY);
    }, []);

    return (
        <SessionContext.Provider value={{ activeSession, startSession, syncSession, dismissSession }}>
            {children}
        </SessionContext.Provider>
    );
};

export default SessionContext;
