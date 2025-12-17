/**
 * ========================================
 * PROCESO PRINCIPAL DE ELECTRON
 * ========================================
 * 
 * Este archivo controla la ventana de la aplicación de escritorio.
 * No modificar a menos que necesites cambiar el comportamiento de la ventana.
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

/**
 * Crea la ventana principal de la aplicación
 */
const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 768,
        backgroundColor: '#0f172a',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
        autoHideMenuBar: true,
    });

    // Cargar la página principal
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

    // Descomentar para abrir DevTools automáticamente:
    // mainWindow.webContents.openDevTools();
};

// Iniciar cuando Electron esté listo
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Cerrar cuando todas las ventanas estén cerradas (excepto en Mac)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// ========================================
// COMUNICACIÓN CON EL RENDERER
// ========================================

// Obtener versión de la app
ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});
