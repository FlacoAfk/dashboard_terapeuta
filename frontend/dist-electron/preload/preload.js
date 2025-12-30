"use strict";
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("electronAPI", {
  // Obtener versión de la aplicación
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  // Almacenamiento seguro de tokens
  setToken: (token) => {
    sessionStorage.setItem("auth_token", token);
  },
  getToken: () => {
    return sessionStorage.getItem("auth_token");
  },
  removeToken: () => {
    sessionStorage.removeItem("auth_token");
  }
});
contextBridge.exposeInMainWorld("env", {
  isDevelopment: process.env.NODE_ENV === "development",
  apiUrl: process.env.API_URL || "http://localhost:3001"
});
