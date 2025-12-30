/**
 * ========================================
 * PRELOAD SCRIPT
 * ========================================
 * 
 * Expone APIs seguras al proceso renderer.
 * Este script se ejecuta en un contexto aislado.
 */

const { contextBridge, ipcRenderer } = require('electron');

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
    apiUrl: process.env.API_URL || 'http://localhost:3001'
});
