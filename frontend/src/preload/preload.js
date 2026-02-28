/**
 * ========================================
 * PRELOAD SCRIPT
 * ========================================
 * 
 * Expone APIs seguras al proceso renderer.
 * Este script se ejecuta en un contexto aislado.
 */

const { contextBridge, ipcRenderer } = require('electron');
const DEFAULT_API_URL = 'https://cerebro-al-fuego-image-482550109792.us-central1.run.app';

// Exponer APIs al renderer de forma segura
contextBridge.exposeInMainWorld('electronAPI', {
    // Obtener versión de la aplicación
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),

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
    apiUrl: process.env.API_URL || DEFAULT_API_URL,
    apiTimeoutMs: Number(process.env.API_TIMEOUT_MS || 15000),
    apiGetCacheTtlMs: Number(process.env.API_GET_CACHE_TTL_MS || 20000),
    appVersion: require('../../package.json').version
});
