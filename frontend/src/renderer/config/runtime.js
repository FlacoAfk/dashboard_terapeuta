function getWebEnv() {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        return import.meta.env;
    }

    return {};
}

export function isElectronRuntime() {
    return typeof window !== 'undefined' && Boolean(window.electronAPI);
}

export function getApiUrl() {
    const webEnv = getWebEnv();
    const windowEnv = typeof window !== 'undefined' ? window.env : undefined;

    return (
        windowEnv?.apiUrl ||
        webEnv.VITE_API_URL ||
        'http://localhost:3001'
    );
}

export function getApiTimeoutMs() {
    const webEnv = getWebEnv();
    const windowEnv = typeof window !== 'undefined' ? window.env : undefined;

    const value =
        windowEnv?.apiTimeoutMs ||
        webEnv.VITE_API_TIMEOUT_MS ||
        15000;

    return Number(value);
}
