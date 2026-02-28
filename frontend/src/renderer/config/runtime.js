function getWebEnv() {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        return import.meta.env;
    }

    return {};
}

const DEFAULT_API_URL = 'https://cerebro-al-fuego-image-482550109792.us-central1.run.app';

export function isElectronRuntime() {
    return typeof window !== 'undefined' && Boolean(window.electronAPI);
}

export function getApiUrl() {
    const webEnv = getWebEnv();
    const windowEnv = typeof window !== 'undefined' ? window.env : undefined;

    return (
        windowEnv?.apiUrl ||
        webEnv.VITE_API_URL ||
        DEFAULT_API_URL
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

export function getApiGetCacheTtlMs() {
    const webEnv = getWebEnv();
    const windowEnv = typeof window !== 'undefined' ? window.env : undefined;

    const value =
        windowEnv?.apiGetCacheTtlMs ||
        webEnv.VITE_API_GET_CACHE_TTL_MS ||
        20000;

    return Number(value);
}
