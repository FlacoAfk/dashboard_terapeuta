# Dashboard Terapeuta

Aplicación de escritorio para gestión de pacientes y sesiones de terapia.

## �️ Tecnologías

| Capa | Tecnología |
|------|------------|
| Backend | Express.js + CORS |
| Frontend | Electron + Tailwind CSS |
| API Client | Fetch (servicios en `/services`) |

## 📁 Estructura

```
dashboard_terapeuta/
├── backend/                    # API REST
│   └── src/
│       ├── server.js           # Servidor Express (puerto 3001)
│       └── routes/api.js       # Endpoints de la API
│
├── frontend/                   # Aplicación de escritorio
│   └── src/
│       ├── main/               # Proceso Electron
│       │   ├── main.js         # Ventana principal
│       │   └── preload.js      # Bridge seguro
│       ├── renderer/           # Interfaz de usuario
│       │   ├── index.html      # Página principal
│       │   ├── pages/          # Otras páginas
│       │   └── components/     # Componentes reutilizables
│       └── services/           # Llamadas a la API
│           ├── api.js          # Cliente HTTP base
│           └── exampleService.js
│
└── package.json                # Workspace raíz
```

## � Inicio Rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar backend (Terminal 1)
npm run dev:backend

# 3. Iniciar Electron (Terminal 2)
npm run dev:frontend
```

## 📡 Endpoints API

```
GET  /health          → Estado del servidor
GET  /api/status      → Versión de la API
GET  /api/patients    → Lista de pacientes
POST /api/patients    → Crear paciente
GET  /api/sessions    → Lista de sesiones
```

## 👥 Guía para el Equipo

### Agregar una nueva página

1. Crea el archivo en `frontend/src/renderer/pages/mi-pagina.html`
2. Usa la misma estructura que las páginas existentes
3. Agrega el link en el sidebar de `index.html`

### Agregar un nuevo endpoint en la API

1. Abre `backend/src/routes/api.js`
2. Agrega tu ruta siguiendo el patrón existente:

```javascript
router.get('/mi-endpoint', (req, res) => {
  res.json({ success: true, data: [...] });
});
```

### Agregar un nuevo servicio en el frontend

1. Crea archivo en `frontend/src/services/miServicio.js`
2. Sigue el patrón de `exampleService.js`:

```javascript
const MiServicio = {
  async getAll() {
    return await window.api.get('/api/mi-endpoint');
  }
};
window.MiServicio = MiServicio;
```

3. Importa el script en tu HTML

## 🎨 Colores Tailwind

- `primary-*` → Azul (botones principales)
- `accent-*` → Púrpura (destacados)
- `surface-*` → Grises oscuros (fondos)

## 📝 Scripts NPM

| Comando | Descripción |
|---------|-------------|
| `npm run dev:backend` | Inicia el servidor Express |
| `npm run dev:frontend` | Inicia la app Electron |
| `npm run build:css` | Compila Tailwind CSS |
