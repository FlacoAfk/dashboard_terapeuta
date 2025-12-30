/**
 * ========================================
 * PROCESO PRINCIPAL DE ELECTRON
 * ========================================
 * 
 * Controla la ventana de la aplicación de escritorio.
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
        backgroundColor: '#C5CDE8',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, '../preload/preload.js'),
        },
        autoHideMenuBar: true,
        show: false, // Mostrar cuando esté listo
    });

    // En desarrollo, cargar desde el servidor de Vite
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
        mainWindow.webContents.openDevTools();
    } else {
        // En producción, cargar el archivo HTML compilado
        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    // Mostrar ventana cuando esté lista para evitar flash blanco
    mainWindow.on('ready-to-show', () => {
        mainWindow.show();
    });
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
// COMUNICACIÓN CON EL RENDERER (IPC)
// ========================================

// Obtener versión de la app
ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});
