const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Get app version
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),

    // Get app path
    getAppPath: () => ipcRenderer.invoke('get-app-path'),

    // Platform info
    platform: process.platform,

    // Add more IPC methods as needed
    // Example: sendMessage: (channel, data) => ipcRenderer.send(channel, data),
});

// Expose API configuration
contextBridge.exposeInMainWorld('appConfig', {
    apiBaseUrl: 'http://localhost:3001',
    apiVersion: 'v1',
});
