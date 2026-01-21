"use strict";
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
let mainWindow;
const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    backgroundColor: "#C5CDE8",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "../preload/preload.js")
    },
    autoHideMenuBar: true,
    show: false
    // Mostrar cuando esté listo
  });
  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
    mainWindow.webContents.openDevTools({ mode: "detach", activate: false });
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.webContents.executeJavaScript(`
            // Evitar loops infinitos de recarga
            if (!sessionStorage.getItem('__electron_cleaned__')) {
                fetch('http://localhost:3001/api/auth/check-setup')
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
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });
};
app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});
