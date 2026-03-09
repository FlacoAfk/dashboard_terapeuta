/**
 * ========================================
 * PRELOAD SCRIPT
 * ========================================
 * 
 * Expone APIs seguras al proceso renderer.
 * Este script se ejecuta en un contexto aislado.
 */

const { contextBridge, ipcRenderer } = require('electron');
const DEFAULT_RUNTIME_CONFIG = {
    apiUrl: 'https://cerebro-al-fuego-image-482550109792.us-central1.run.app',
    apiTimeoutMs: 15000,
    apiGetCacheTtlMs: 20000,
};

const runtimeConfig = {
    apiUrl: process.env.API_URL || DEFAULT_RUNTIME_CONFIG.apiUrl,
    apiTimeoutMs: Number(process.env.API_TIMEOUT_MS || DEFAULT_RUNTIME_CONFIG.apiTimeoutMs),
    apiGetCacheTtlMs: Number(process.env.API_GET_CACHE_TTL_MS || DEFAULT_RUNTIME_CONFIG.apiGetCacheTtlMs),
    runtimeConfigPath: process.env.RUNTIME_CONFIG_PATH || null,
    runtimeConfigSource: process.env.RUNTIME_CONFIG_SOURCE || 'default-file',
};

// Exponer APIs al renderer de forma segura
contextBridge.exposeInMainWorld('electronAPI', {
    // Obtener versión de la aplicación
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    getRuntimeConfig: () => ipcRenderer.invoke('get-runtime-config'),

    // Almacenamiento seguro de tokens
    setToken: (token) => {
        sessionStorage.setItem('auth_token', token);
    },
    getToken: () => {
        return sessionStorage.getItem('auth_token');
    },
    removeToken: () => {
        sessionStorage.removeItem('auth_token');
    }
});

// Exponer información del entorno
contextBridge.exposeInMainWorld('env', {
    isDevelopment: process.env.NODE_ENV === 'development',
    apiUrl: runtimeConfig.apiUrl,
    apiTimeoutMs: runtimeConfig.apiTimeoutMs,
    apiGetCacheTtlMs: runtimeConfig.apiGetCacheTtlMs,
    runtimeConfigPath: runtimeConfig.runtimeConfigPath,
    runtimeConfigSource: runtimeConfig.runtimeConfigSource,
    appVersion: require('../../package.json').version
});
