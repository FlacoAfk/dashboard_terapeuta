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
const DEFAULT_API_URL = 'https://cerebro-al-fuego-image-482550109792.us-central1.run.app';

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
        // DevTools desactivado por defecto
        // mainWindow.webContents.openDevTools({ mode: 'detach', activate: false });
    } else {
        // En producción, cargar el archivo HTML compilado
        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    // Limpiar almacenamiento al cargar para evitar problemas de estado obsoleto
    mainWindow.webContents.on('did-finish-load', () => {
        const apiUrl = process.env.API_URL || DEFAULT_API_URL;
        mainWindow.webContents.executeJavaScript(`
            // Evitar loops infinitos de recarga
            if (!sessionStorage.getItem('__electron_cleaned__')) {
                fetch('${apiUrl}/api/auth/check-setup')
                    .then(r => r.json())
                    .then(data => {
                        if (data.success && data.data && !data.data.configured) {
                            console.log('[Electron] Sistema sin configurar, limpiando storage y recargando...');
                            localStorage.clear();
                            sessionStorage.clear();
                            sessionStorage.setItem('__electron_cleaned__', 'true');
                            location.reload();
                        }
                    })
                    .catch(err => console.error('[Electron] Error checking setup:', err));
            }
        `);
    });

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
