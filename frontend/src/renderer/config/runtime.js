import defaultRuntimeConfig from '../../shared/defaultRuntimeConfig.json';

function getWebEnv() {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        return import.meta.env;
    }

    return {};
}

const DEFAULT_RUNTIME_CONFIG = defaultRuntimeConfig;

export function isElectronRuntime() {
    return typeof window !== 'undefined' && Boolean(window.electronAPI);
}

export function getApiUrl() {
    const webEnv = getWebEnv();
    const windowEnv = typeof window !== 'undefined' ? window.env : undefined;

    return (
        windowEnv?.apiUrl ||
        webEnv.VITE_API_URL ||
        DEFAULT_RUNTIME_CONFIG.apiUrl
    );
}

export function getApiTimeoutMs() {
    const webEnv = getWebEnv();
    const windowEnv = typeof window !== 'undefined' ? window.env : undefined;

    const value =
        windowEnv?.apiTimeoutMs ||
        webEnv.VITE_API_TIMEOUT_MS ||
        DEFAULT_RUNTIME_CONFIG.apiTimeoutMs;

    return Number(value);
}

export function getApiGetCacheTtlMs() {
    const webEnv = getWebEnv();
    const windowEnv = typeof window !== 'undefined' ? window.env : undefined;

    const value =
        windowEnv?.apiGetCacheTtlMs ||
        webEnv.VITE_API_GET_CACHE_TTL_MS ||
        DEFAULT_RUNTIME_CONFIG.apiGetCacheTtlMs;

    return Number(value);
}

export function getRuntimeConfigPath() {
    return typeof window !== 'undefined' ? window.env?.runtimeConfigPath || null : null;
}

export function getRuntimeConfigSource() {
    return typeof window !== 'undefined' ? window.env?.runtimeConfigSource || null : null;
}
