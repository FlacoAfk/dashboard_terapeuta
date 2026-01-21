# Dashboard Terapeuta - Cerebro al Fuego 🧠🔥

Sistema de gestión de terapeutas y pacientes para el proyecto de realidad virtual "Cerebro al Fuego". Permite la administración de sesiones terapéuticas, seguimiento de pacientes y análisis de métricas cognitivas.

---

## 📋 Tabla de Contenidos

- [Requisitos del Sistema](#-requisitos-del-sistema)
- [Tecnologías](#️-tecnologías)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Instalación](#-instalación)
- [Configuración](#️-configuración)
- [Uso](#-uso)
- [Documentación del Backend](#-documentación-del-backend)
- [API Endpoints](#-api-endpoints)
- [Roles y Permisos](#-roles-y-permisos)
- [Para el Equipo de Frontend](#-para-el-equipo-de-frontend)

---

## 💻 Requisitos del Sistema

| Requisito | Versión Mínima |
|-----------|----------------|
| **Node.js** | v18.0.0+ |
| **npm** | v9.0.0+ |
| **PostgreSQL** | v14+ (o Supabase) |
| **Sistema Operativo** | Windows 10+, macOS 10.15+, Linux |

---

## 🛠️ Tecnologías

| Capa | Tecnología | Descripción |
|------|------------|-------------|
| **Backend** | Express.js + PostgreSQL | API REST con Supabase |
| **Frontend** | Electron + Tailwind CSS | Aplicación de escritorio |
| **Autenticación** | JWT (Bearer Token) | Tokens con expiración de 24h |
| **Documentación** | Swagger UI | Documentación interactiva de la API |
| **ORM/Driver** | node-postgres (pg) | Driver nativo de PostgreSQL |

---

## 📁 Estructura del Proyecto

```
dashboard_terapeuta/
├── backend/                        # API REST Express
│   ├── src/
│   │   ├── server.js               # Servidor Express (puerto 3001)
│   │   ├── config/
│   │   │   ├── database.js         # Pool de conexiones PostgreSQL
│   │   │   └── swagger.js          # Configuración Swagger/OpenAPI
│   │   ├── middleware/
│   │   │   └── authMiddleware.js   # JWT Auth & Control de Roles
│   │   ├── routes/
│   │   │   ├── api.js              # Endpoints: pacientes, sesiones, actividades
│   │   │   ├── auth.js             # Login, setup, cambio de contraseña
│   │   │   ├── usuarios.js         # CRUD de usuarios (solo Superadmin)
│   │   │   └── audit.js            # Sistema de auditoría
│   │   └── utils/
│   │       └── auditHelper.js      # Helper para registro de auditoría
│   ├── scripts/                    # Scripts de utilidad
│   ├── .env                        # Variables de entorno (no incluido)
│   └── package.json
│
├── frontend/                       # Aplicación Electron + React
│   ├── src/
│   │   ├── main/                   # Proceso principal de Electron
│   │   │   ├── main.js             # Entry point Electron
│   │   │   └── preload.js          # Script de preload (seguridad)
│   │   └── renderer/               # Interfaz de usuario (React)
│   │       ├── App.jsx             # Router principal
│   │       ├── main.jsx            # Entry point React
│   │       ├── index.css           # Estilos globales
│   │       ├── context/
│   │       │   └── AuthContext.jsx # Contexto de autenticación
│   │       ├── components/
│   │       │   ├── layout/
│   │       │   │   └── AdminLayout.jsx    # Layout del panel admin
│   │       │   ├── modals/
│   │       │   │   ├── CrearTerapeutaModal.jsx
│   │       │   │   ├── EditarTerapeutaModal.jsx
│   │       │   │   └── ReasignarPacientesModal.jsx
│   │       │   └── ui/
│   │       │       ├── Button.jsx
│   │       │       ├── Input.jsx
│   │       │       ├── Logo.jsx
│   │       │       └── Modal.jsx
│   │       ├── pages/
│   │       │   ├── Login.jsx       # Página de login
│   │       │   ├── Dashboard.jsx   # Dashboard terapeuta
│   │       │   └── admin/          # Panel de administrador
│   │       │       ├── GestionTerapeutas.jsx
│   │       │       ├── Auditoria.jsx
│   │       │       └── index.js
│   │       └── services/
│   │           ├── api.js              # Cliente HTTP base
│   │           ├── authService.js      # Servicio de autenticación
│   │           ├── therapistService.js # CRUD de terapeutas
│   │           └── auditService.js     # Consulta de auditoría
│   └── package.json
│
├── .gitignore
├── package.json                    # Workspace raíz (npm workspaces)
└── README.md
```

---

## 🚀 Instalación

### Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/dashboard_terapeuta.git
cd dashboard_terapeuta
```

### Paso 2: Instalar Dependencias

Desde la raíz del proyecto, instala todas las dependencias (backend + frontend):

```bash
npm install
```

> **Nota:** El proyecto usa npm workspaces, este comando instala las dependencias de ambos paquetes.

### Paso 3: Configurar Variables de Entorno

Crea el archivo `.env` en la carpeta `backend/`:

```bash
cd backend
copy .env.example .env   # Windows
# cp .env.example .env   # Linux/Mac
```

Edita el archivo `.env` con tus credenciales (ver sección [Configuración](#️-configuración)).

### Paso 4: Verificar Conexión a Base de Datos

```bash
cd backend
node scripts/check_db.js
```

### Paso 5: Iniciar el Backend

**Terminal 1:**
```bash
# Desde la raíz del proyecto
npm run dev:backend

# O desde la carpeta backend
cd backend
npm run dev
```

El servidor estará disponible en:
- **API:** http://localhost:3001
- **Swagger Docs:** http://localhost:3001/api-docs
- **Health Check:** http://localhost:3001/health

### Paso 6: Compilar CSS de Tailwind (Primera vez)

**Terminal 2:**
```bash
# Desde la raíz del proyecto
npm run build:css

# O desde la carpeta frontend
cd frontend
npm run build:css
```

> Este comando queda en modo watch, recompila automáticamente los cambios.

### Paso 7: Iniciar el Frontend (Electron)

**Terminal 3:**
```bash
# Desde la raíz del proyecto
npm run dev:frontend

# O desde la carpeta frontend
cd frontend
npm run dev
```

---

## ⚙️ Configuración

### Variables de Entorno del Backend

Crea el archivo `backend/.env` con las siguientes variables:

```env
# ========================================
# CONFIGURACIÓN DEL SERVIDOR
# ========================================
PORT=3001
NODE_ENV=development

# ========================================
# BASE DE DATOS - PostgreSQL (Supabase)
# ========================================
DB_HOST=db.xxxxxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=tu_password_seguro

# ========================================
# JWT - AUTENTICACIÓN
# ========================================
JWT_SECRET=tu_clave_secreta_muy_larga_y_segura_aqui_2024
JWT_EXPIRES_IN=24h

# ========================================
# CONFIGURACIÓN ADICIONAL (OPCIONAL)
# ========================================
# LOG_LEVEL=debug
# CORS_ORIGIN=http://localhost:3000
```

### Descripción de Variables

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `PORT` | No | Puerto del servidor (default: 3001) |
| `DB_HOST` | ✅ Sí | Host de PostgreSQL/Supabase |
| `DB_PORT` | ✅ Sí | Puerto de PostgreSQL (default: 5432) |
| `DB_NAME` | ✅ Sí | Nombre de la base de datos |
| `DB_USER` | ✅ Sí | Usuario de PostgreSQL |
| `DB_PASSWORD` | ✅ Sí | Contraseña de PostgreSQL |
| `JWT_SECRET` | ✅ Sí | Clave secreta para firmar tokens JWT |

---

## 📖 Uso

### Inicio Rápido

```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: CSS Watch (solo la primera vez o si editas estilos)
npm run build:css

# Terminal 3: Frontend Electron
npm run dev:frontend
```

### Primer Uso - Crear Superadministrador

1. Abre Swagger UI: http://localhost:3001/api-docs
2. Ejecuta `GET /api/auth/check-setup` para verificar si existe un superadmin
3. Si no existe, ejecuta `POST /api/auth/setup` con los datos del administrador:

```json
{
  "nombre": "Administrador",
  "correo": "admin@clinica.com",
  "username": "admin",
  "password": "TuContraseñaSegura123!@"
}
```

> **Importante:** La contraseña debe tener mínimo 10 caracteres, incluyendo mayúsculas, minúsculas, números y símbolos.

---

## 🔧 Documentación del Backend

### Arquitectura

El backend sigue una arquitectura por capas:

```
┌─────────────────────────────────────────────────────────┐
│                     server.js                           │
│              (Express App & Middlewares)                │
└───────────────────────┬─────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│   Routes      │ │  Middleware   │ │    Config     │
│ ────────────  │ │ ────────────  │ │ ────────────  │
│ • api.js      │ │ authMiddle-   │ │ • database.js │
│ • auth.js     │ │   ware.js     │ │ • swagger.js  │
│ • usuarios.js │ │ (JWT + RBAC)  │ │               │
│ • audit.js    │ │               │ │               │
└───────┬───────┘ └───────────────┘ └───────┬───────┘
        │                                   │
        └──────────────┬────────────────────┘
                       ▼
              ┌─────────────────┐
              │   PostgreSQL    │
              │   (Supabase)    │
              └─────────────────┘
```

### Módulos del Backend

#### 📂 `config/`

| Archivo | Descripción |
|---------|-------------|
| `database.js` | Pool de conexiones PostgreSQL con SSL. Exporta funciones `query()`, `testConnection()` y el pool. |
| `swagger.js` | Configuración de OpenAPI 3.0 para documentación automática de la API. |

#### 📂 `middleware/`

| Archivo | Descripción |
|---------|-------------|
| `authMiddleware.js` | Middlewares de autenticación y autorización: `authenticateToken`, `requireSuperAdmin`, `requireTerapeuta`, `generateToken`, `optionalAuth`. |

#### 📂 `routes/`

| Archivo | Endpoints | Descripción |
|---------|-----------|-------------|
| `api.js` | `/api/patients`, `/api/sessions`, `/api/actividades`, `/api/terapeutas`, `/api/dashboard` | Endpoints principales de la aplicación |
| `auth.js` | `/api/auth/*` | Login, setup, info de usuario, cambio de contraseña |
| `usuarios.js` | `/api/usuarios/*` | CRUD de usuarios (solo Superadmin) |
| `audit.js` | `/api/audit/*` | Consulta de logs de auditoría |

#### 📂 `utils/`

| Archivo | Descripción |
|---------|-------------|
| `auditHelper.js` | Función helper para registrar eventos en la tabla de auditoría. |

#### 📂 `scripts/`

| Script | Uso | Descripción |
|--------|-----|-------------|
| `check_db.js` | `node scripts/check_db.js` | Verifica conexión y lista tablas |
| `migrate_roles.js` | `node scripts/migrate_roles.js` | Migra roles de usuarios |
| `add_activo_column.js` | `node scripts/add_activo_column.js` | Agrega columna `activo` a tablas |

---

## 📡 API Endpoints

### Health & Status

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/health` | ❌ | Estado del servidor |
| GET | `/api/status` | ❌ | Estado de la API |
| GET | `/api/db-status` | ❌ | Estado de la base de datos |

### Autenticación (`/api/auth`)

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/check-setup` | ❌ | Verificar si existe superadmin |
| POST | `/setup` | ❌ | Crear superadmin inicial (solo 1 vez) |
| POST | `/login` | ❌ | Iniciar sesión |
| GET | `/me` | ✅ | Obtener usuario actual |
| POST | `/change-password` | ✅ | Cambiar contraseña |

### Usuarios (`/api/usuarios`) - Solo Superadmin

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Listar usuarios |
| POST | `/terapeuta` | Crear terapeuta |
| PUT | `/:id` | Actualizar usuario |
| PUT | `/:id/toggle-estado` | Activar/desactivar |
| POST | `/:id/reset-password` | Resetear contraseña |

### Pacientes (`/api/patients`)

| Método | Endpoint | Rol | Descripción |
|--------|----------|-----|-------------|
| GET | `/` | Terapeuta+ | Listar pacientes (filtrado por rol) |
| GET | `/:id` | Terapeuta+ | Obtener paciente |
| POST | `/` | Terapeuta+ | Crear paciente |
| PUT | `/:id` | Terapeuta+ | Actualizar paciente |
| DELETE | `/:id` | Superadmin | Eliminar paciente |
| POST | `/:id/assign` | Superadmin | Asignar a terapeuta |
| GET | `/:id/report` | Terapeuta+ | Informe completo |

### Sesiones (`/api/sessions`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Listar sesiones |
| GET | `/:id` | Obtener sesión con eventos |
| POST | `/` | Crear sesión (desde Unity) |
| PUT | `/:id/finish` | Finalizar con resumen |
| POST | `/:id/events` | Registrar evento |

### Actividades (`/api/actividades`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Listar actividades (niveles) |
| GET | `/:id` | Actividad con detalles |

### Dashboard (`/api/dashboard`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/stats` | Estadísticas generales |

### Auditoría (`/api/audit`) - Solo Superadmin

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Listar eventos (con filtros) |
| GET | `/user/:id` | Eventos de un usuario |
| GET | `/types` | Tipos de eventos |

---

## 👥 Roles y Permisos

| Rol | Permisos |
|-----|----------|
| **SUPERADMIN** | Acceso total: crear/editar terapeutas, asignar pacientes, eliminar registros, ver auditoría |
| **TERAPEUTA** | Ver/crear pacientes asignados, gestionar sesiones propias, ver informes de sus pacientes |

---

## 🔐 Autenticación

Todos los endpoints (excepto `/health`, `/login` y `/check-setup`) requieren un **Bearer Token**.

### Flujo de Autenticación

```javascript
// 1. Verificar si hay superadmin configurado
GET /api/auth/check-setup
// Respuesta: { setupComplete: true/false }

// 2. Si no hay superadmin, crear uno (solo una vez)
POST /api/auth/setup
{
  "nombre": "Administrador",
  "correo": "admin@clinica.com",
  "username": "admin",
  "password": "TuContraseñaSegura123!@"
}

// 3. Login
POST /api/auth/login
{
  "username": "admin",
  "password": "TuContraseñaSegura123!@"
}
// Respuesta: { success: true, data: { token: "eyJhbG...", user: {...} } }

// 4. Usar token en todas las peticiones
headers: {
  "Authorization": "Bearer eyJhbG..."
}
```

---

## 🔧 Para el Equipo de Frontend

### Cliente API Recomendado

```javascript
// services/api.js
const API_URL = 'http://localhost:3001/api';

const api = {
  token: null,
  
  setToken(token) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  },
  
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` })
    };
  },
  
  async get(endpoint) {
    const res = await fetch(`${API_URL}${endpoint}`, {
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  
  async post(endpoint, data) {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  
  async put(endpoint, data) {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  
  async delete(endpoint) {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    return res.json();
  }
};

export default api;
```

### Ejemplo de Login

```javascript
async function login(username, password) {
  const result = await api.post('/auth/login', { username, password });
  if (result.success) {
    api.setToken(result.data.token);
    return result.data.user;
  }
  throw new Error(result.error);
}
```

---

## 📖 Documentación Interactiva

Swagger UI disponible en: **http://localhost:3001/api-docs**

---

## 📝 Requerimientos Implementados

| Código | Descripción | Estado |
|--------|-------------|--------|
| RF-SEG-01 | Superadministrador único | ✅ |
| RF-SEG-02 | Gestión de terapeutas | ✅ |
| RF-SEG-03 | Permisos de terapeuta | ✅ |
| RF-SEG-04 | Interfaz visual terapeuta | ✅ (API lista, UI Limpia) |
| RF-BDD-01 | Estructura de usuarios | ✅ |
| RF-BDD-02 | Registro de sesiones | ✅ |
| RF-BDD-03 | Registro de acciones | ✅ |
| RF-BDD-04 | Aciertos/Errores/Omisiones | ✅ |
| RF-BDD-08 | Auditoría | ✅ |

### Mejoras Recientes (v1.3.1)
- **UI Limpia:** Se han eliminado los códigos de requerimientos técnicos (ej. RF-SEG-01) de la interfaz de usuario final para mejorar la experiencia.
- **Seguridad:** DevTools de Electron deshabilitadas/minimizadas por defecto en producción.
- **Flujo de Setup:** Validación mejorada al intentar navegar al login sin configuración previa.
- **Visibilidad Contraseña:** Agregado botón para ver/ocultar confirmación de contraseña en el setup.


---

## 🎨 Tema Visual (Tailwind)

La paleta de colores personalizada está configurada en `frontend/tailwind.config.js`:

| Clase | Uso |
|-------|-----|
| `primary-*` | Azul (botones principales) |
| `accent-*` | Púrpura (destacados) |
| `surface-*` | Grises oscuros (fondos) |

---

## 📄 Licencia

ISC

---

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request
