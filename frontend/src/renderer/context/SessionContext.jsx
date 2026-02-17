import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * Contexto para manejar la sesión VR activa.
 * Permite que cualquier componente inicie/detenga el reloj flotante
 * sin acoplar la lógica al layout.
 */
const SessionContext = createContext(null);

export const useSession = () => {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error('useSession debe usarse dentro de un SessionProvider');
    }
    return context;
};

export const SessionProvider = ({ children }) => {
    const [activeSession, setActiveSession] = useState(null);

    /**
     * Inicia la sesión activa (muestra el reloj flotante)
     * @param {{ session_id, start_token, recipe_id, recipe_name, participant_code }} sessionData
     */
    const startSession = useCallback((sessionData) => {
        setActiveSession({
            ...sessionData,
            started_at: Date.now()
        });
    }, []);

    /**
     * Cierra/descarta la sesión activa (oculta el reloj)
     */
    const dismissSession = useCallback(() => {
        setActiveSession(null);
    }, []);

    return (
        <SessionContext.Provider value={{ activeSession, startSession, dismissSession }}>
            {children}
        </SessionContext.Provider>
    );
};

export default SessionContext;
