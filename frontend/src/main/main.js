/**
 * ========================================
 * PROCESO PRINCIPAL DE ELECTRON
 * ========================================
 * 
 * Controla la ventana de la aplicación de escritorio.
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

const DEFAULT_RUNTIME_CONFIG = {
  apiUrl: 'https://backend-production-94b2c.up.railway.app',
  apiTimeoutMs: 15000,
  apiGetCacheTtlMs: 20000,
};
const APP_USER_MODEL_ID = 'com.cerebroalfuego.dashboardterapeuta';
const RUNTIME_CONFIG_FILE_NAME = 'runtime-config.json';

let mainWindow;
let runtimeConfigState;

function normalizeApiUrl(value, fallback) {
    if (typeof value !== 'string') {
        return fallback;
    }

    const trimmedValue = value.trim();
    if (!trimmedValue) {
        return fallback;
    }

    try {
        const normalizedUrl = new URL(trimmedValue);
        return normalizedUrl.toString().replace(/\/+$/, '');
    } catch {
        return fallback;
    }
}

function normalizePositiveInteger(value, fallback) {
    const normalizedValue = Number(value);

    if (!Number.isFinite(normalizedValue) || normalizedValue <= 0) {
        return fallback;
    }

    return Math.round(normalizedValue);
}

function sanitizeRuntimeConfig(rawConfig = {}) {
    return {
        apiUrl: normalizeApiUrl(rawConfig.apiUrl, DEFAULT_RUNTIME_CONFIG.apiUrl),
        apiTimeoutMs: normalizePositiveInteger(rawConfig.apiTimeoutMs, DEFAULT_RUNTIME_CONFIG.apiTimeoutMs),
        apiGetCacheTtlMs: normalizePositiveInteger(rawConfig.apiGetCacheTtlMs, DEFAULT_RUNTIME_CONFIG.apiGetCacheTtlMs),
    };
}

function getRuntimeConfigPath(appInstance) {
    return path.join(appInstance.getPath('userData'), RUNTIME_CONFIG_FILE_NAME);
}

function ensureRuntimeConfigFile(configPath) {
    if (fs.existsSync(configPath)) {
        return false;
    }

    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, `${JSON.stringify(DEFAULT_RUNTIME_CONFIG, null, 4)}\n`, 'utf8');
    return true;
}

function readRuntimeConfigFile(configPath) {
    try {
        const rawConfig = fs.readFileSync(configPath, 'utf8');
        return {
            config: JSON.parse(rawConfig),
            readError: null,
        };
    } catch (error) {
        return {
            config: {},
            readError: error,
        };
    }
}

function getEnvironmentOverrides() {
    const overrides = {};

    const apiUrl = process.env.API_URL || process.env.VITE_API_URL;
    const apiTimeoutMs = process.env.API_TIMEOUT_MS || process.env.VITE_API_TIMEOUT_MS;
    const apiGetCacheTtlMs = process.env.API_GET_CACHE_TTL_MS || process.env.VITE_API_GET_CACHE_TTL_MS;

    if (apiUrl) {
        overrides.apiUrl = apiUrl;
    }

    if (apiTimeoutMs) {
        overrides.apiTimeoutMs = apiTimeoutMs;
    }

    if (apiGetCacheTtlMs) {
        overrides.apiGetCacheTtlMs = apiGetCacheTtlMs;
    }

    return overrides;
}

function initializeRuntimeConfig(appInstance) {
    const configPath = getRuntimeConfigPath(appInstance);
    const createdDefaultFile = ensureRuntimeConfigFile(configPath);
    const { config: fileConfig, readError } = readRuntimeConfigFile(configPath);
    const environmentOverrides = getEnvironmentOverrides();
    const hasEnvironmentOverrides = Object.keys(environmentOverrides).length > 0;
    const runtimeConfig = sanitizeRuntimeConfig({
        ...fileConfig,
        ...environmentOverrides,
    });

    const source = hasEnvironmentOverrides
        ? 'environment'
        : createdDefaultFile
            ? 'default-file'
            : readError
                ? 'fallback'
                : 'user-file';

    process.env.API_URL = runtimeConfig.apiUrl;
    process.env.API_TIMEOUT_MS = String(runtimeConfig.apiTimeoutMs);
    process.env.API_GET_CACHE_TTL_MS = String(runtimeConfig.apiGetCacheTtlMs);
    process.env.RUNTIME_CONFIG_PATH = configPath;
    process.env.RUNTIME_CONFIG_SOURCE = source;

    return {
        config: runtimeConfig,
        configPath,
        source,
        readError,
    };
}

function getWindowIconPath() {
    if (app.isPackaged) {
        return path.join(process.resourcesPath, 'icon.ico');
    }

    return path.join(__dirname, '../../build/icons/icon.ico');
}

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
        icon: getWindowIconPath(),
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
        const apiUrl = runtimeConfigState?.config?.apiUrl || process.env.API_URL;
        mainWindow.webContents.executeJavaScript(`
            // Evitar loops infinitos de recarga
            if (!sessionStorage.getItem('__electron_cleaned__')) {
                fetch(${JSON.stringify(`${apiUrl}/api/auth/check-setup`)})
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
    app.setAppUserModelId(APP_USER_MODEL_ID);
    runtimeConfigState = initializeRuntimeConfig(app);

    if (runtimeConfigState.readError) {
        console.warn('[Electron] No se pudo leer runtime-config.json. Se usará la configuración saneada por defecto.', runtimeConfigState.readError);
    }

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

ipcMain.handle('get-runtime-config', () => {
    return {
        ...runtimeConfigState?.config,
        runtimeConfigPath: runtimeConfigState?.configPath || process.env.RUNTIME_CONFIG_PATH || null,
        runtimeConfigSource: runtimeConfigState?.source || process.env.RUNTIME_CONFIG_SOURCE || 'unknown',
    };
});
