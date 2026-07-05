# Dashboard Terapeuta - Cerebro al Fuego 🧠🔥

Sistema de gestión clínica para el proyecto de realidad virtual "Cerebro al Fuego". Permite la administración de terapeutas, pacientes, sesiones VR con evaluación del desempeño, y auditoría del sistema.

**Versión:** 1.8.6  
**Última actualización:** 2026-07-05

---

## 📋 Tabla de Contenidos

- [Inicio Rápido para el Equipo](#-inicio-rápido-para-el-equipo)
- [Requisitos del Sistema](#-requisitos-del-sistema)
- [Tecnologías](#️-tecnologías)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Instalación](#-instalación)
- [Configuración](#️-configuración)
- [Uso](#-uso)
- [Documentación del Backend](#-documentación-del-backend)
- [API Endpoints](#-api-endpoints)
- [Integración con Unity](#-integración-con-videojuego-vr-unity)
- [Evaluación del Desempeño](#-evaluación-del-desempeño)
- [Roles y Permisos](#-roles-y-permisos)
- [Seguridad](#-seguridad)

---

## ✅ Inicio Rápido para el Equipo

Si alguien del equipo clona el proyecto hoy, este es el camino corto:

```bash
git clone https://github.com/FlacoAfk/dashboard_terapeuta.git
cd dashboard_terapeuta
npm install
copy backend/.env.example backend/.env
copy frontend/.env.example frontend/.env
```

Luego:

1. Completa `backend/.env` con credenciales reales.
2. Ajusta `frontend/.env` solo si vas a correr el frontend web contra otra API.
3. Inicia backend: `npm run dev:backend`
4. Inicia frontend web: `npm run dev:web` o desktop: `npm run dev:frontend`
5. Verifica:
   - API: `http://localhost:3001/health`
   - Swagger: `http://localhost:3001/api-docs`

### Bootstrap de base de datos

Si el equipo necesita levantar una base limpia:

- esquema base: `backend/migrations/00_create_all_tables.sql`
- seed inicial: `node backend/scripts/seed_v2.js`

### Documentación técnica

- Índice maestro: [`docs/README.md`](docs/README.md)
- Requisitos: [`docs/REQUERIMIENTOS.md`](docs/REQUERIMIENTOS.md)
- Arquitectura: [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md)
- Seguridad: [`docs/SEGURIDAD.md`](docs/SEGURIDAD.md)

---

## 💻 Requisitos del Sistema

| Requisito | Versión Mínima |
|-----------|----------------|
| **Node.js** | v18.0.0+ |
| **npm** | v9.0.0+ |
| **PostgreSQL** | Supabase (cloud) |
| **Sistema Operativo** | Windows 10+ |

---

## 🛠️ Tecnologías

| Capa | Tecnología | Descripción |
|------|------------|-------------|
| **Backend** | Express.js + Supabase | API REST con PostgreSQL en la nube |
| **Frontend** | Electron + React + Tailwind CSS v4 | Aplicación de escritorio |
| **Autenticación** | JWT (Bearer Token) | Tokens con expiración configurable |
| **Unity API** | API Key (X-API-Key) | Autenticación para videojuego VR |
| **Documentación** | Swagger UI | Documentación interactiva en `/api-docs` |
| **Despliegue** | Docker + Google Cloud Run | Contenedor para producción |

---

## 📁 Estructura del Proyecto

```
dashboard_terapeuta/
├── backend/                        # API REST Express
│   ├── src/
│   │   ├── server.js               # Servidor Express (puerto 3001)
│   │   ├── config/
│   │   │   ├── supabase.js         # Cliente SDK Supabase
│   │   │   └── swagger.js          # Configuración Swagger/OpenAPI
│   │   ├── middleware/
│   │   │   └── authMiddleware.js   # JWT Auth & Control de Roles
│   │   ├── routes/
│   │   │   ├── api.js              # Pacientes, sesiones VR, dashboard, terapeutas
│   │   │   ├── auth.js             # Login, setup, recuperación de contraseña
│   │   │   ├── usuarios.js         # CRUD de usuarios (solo Superadmin)
│   │   │   ├── audit.js            # Sistema de auditoría
│   │   │   └── vrResults.js        # Resultados VR desde Unity (API Key)
│   │   ├── services/
│   │   │   └── emailService.js     # Envío de emails SMTP
│   │   ├── validators/
│   │   │   ├── authValidator.js    # Validación de autenticación
│   │   │   ├── patientValidator.js # Validación de pacientes
│   │   │   └── userValidator.js    # Validación de usuarios
│   │   ├── utils/
│   │   │   ├── auditHelper.js      # Helper de auditoría (SESSION_REVIEWED, etc.)
│   │   │   └── validationUtils.js  # Utilidades de validación
│   │   └── types/
│   │       └── database.js         # Tipos de datos de BD
│   ├── migrations/                 # Migraciones SQL
│   ├── schema/
│   │   └── bd_schema.sql           # Esquema completo de la BD
│   ├── scripts/
│   │   └── seed_complete.js        # Poblar BD con datos iniciales
│   ├── tests/
│   │   ├── app.test.js             # Smoke tests locales del backend
│   │   ├── integration/            # Pruebas de contrato contra API desplegada
│   │   └── performance_p95.js      # Baseline de latencia p95
│   ├── Dockerfile                  # Imagen Docker para Cloud Run
│   ├── docker-compose.yml          # Docker Compose para desarrollo
│   ├── API_ENDPOINTS.md            # Documentación detallada de endpoints
│   └── CHANGELOG.md                # Changelog del backend
│
├── frontend/                       # Aplicación Electron + React
│   ├── src/
│   │   ├── main/
│   │   │   ├── main.js             # Proceso principal Electron
│   │   │   └── preload.js          # Script de preload (seguridad)
│   │   ├── preload/
│   │   │   └── preload.js          # Preload para renderer
│   │   └── renderer/               # Interfaz de usuario (React)
│   │       ├── App.jsx             # Router principal
│   │       ├── main.jsx            # Entry point React
│   │       ├── index.css           # Estilos globales (Tailwind v4)
│   │       ├── context/
│   │       │   └── AuthContext.jsx  # Contexto de autenticación global
│   │       ├── components/
│   │       │   ├── layout/
│   │       │   │   ├── AdminLayout.jsx      # Layout panel administrador
│   │       │   │   └── TherapistLayout.jsx  # Layout panel terapeuta
│   │       │   ├── modals/
│   │       │   │   ├── CrearPacienteModal.jsx
│   │       │   │   ├── EditarPacienteModal.jsx
│   │       │   │   ├── CrearTerapeutaModal.jsx
│   │       │   │   ├── EditarTerapeutaModal.jsx
│   │       │   │   ├── ReasignarPacientesModal.jsx
│   │       │   │   ├── ResetPasswordModal.jsx
│   │       │   │   └── VerificarCorreoModal.jsx
│   │       │   └── ui/
│   │       │       ├── Button.jsx
│   │       │       ├── Input.jsx
│   │       │       ├── Logo.jsx
│   │       │       ├── Modal.jsx
│   │       │       ├── PasswordStrengthIndicator.jsx
│   │       │       └── VRSessionCard.jsx    # Card de sesión VR con tabs y evaluación
│   │       ├── pages/
│   │       │   ├── Login.jsx
│   │       │   ├── Dashboard.jsx
│   │       │   ├── ForgotPassword.jsx
│   │       │   ├── ResetPassword.jsx
│   │       │   ├── SetupPage.jsx
│   │       │   ├── admin/
│   │       │   │   ├── GestionTerapeutas.jsx
│   │       │   │   └── Auditoria.jsx
│   │       │   └── terapeuta/
│   │       │       ├── DashboardTerapeuta.jsx
│   │       │       ├── DetallePaciente.jsx
│   │       │       └── ConfiguracionTerapeuta.jsx
│   │       ├── services/
│   │       │   ├── api.js               # Cliente HTTP base (Axios)
│   │       │   ├── authService.js       # Servicio de autenticación
│   │       │   ├── patientService.js    # CRUD de pacientes
│   │       │   ├── therapistService.js  # CRUD de terapeutas
│   │       │   ├── vrResultsService.js  # Sesiones VR + evaluación
│   │       │   └── auditService.js      # Consulta de auditoría
│   │       └── utils/
│   │           └── alertUtils.js        # Utilidades de alertas (SweetAlert2)
│   ├── electron.vite.config.js     # Config de electron-vite
│   ├── tailwind.config.js          # Config de Tailwind CSS
│   └── package.json
│
├── docs/
│   ├── POSTMAN_API_DOCS.md         # Documentación completa para Postman
│   └── manual_screenshots/         # Screenshots del manual de usuario
│
├── mockups/                        # Mockups de diseño UI
├── .gitignore
├── package.json                    # Workspace raíz (npm workspaces)
├── CHANGELOG.md                    # Changelog global del proyecto
├── SECURITY.md                     # Guía de seguridad
└── README.md
```

---

## 🚀 Instalación

### Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/FlacoAfk/dashboard_terapeuta.git
cd dashboard_terapeuta
```

### Paso 2: Instalar Dependencias

```bash
npm install
```

> El proyecto usa npm workspaces — instala dependencias de backend y frontend automáticamente.

### Paso 3: Configurar Variables de Entorno

```bash
cd backend
copy .env.example .env
```

Edita `backend/.env` con tus credenciales (ver [Configuración](#️-configuración)).

### Paso 4: Iniciar Backend

```bash
# Desde la raíz
npm run dev:backend
```

- **API:** http://localhost:3001
- **Swagger:** http://localhost:3001/api-docs
- **Health:** http://localhost:3001/health

### Paso 5: Iniciar Frontend (Electron)

```bash
# Desde la raíz (en otra terminal)
npm run dev:frontend
```

La app de escritorio crea un archivo `runtime-config.json` en la carpeta `userData` del sistema operativo. Ese archivo define la URL del backend, timeout HTTP y TTL del caché GET para Electron sin necesidad de recompilar.

### Frontend Web (Vercel / navegador)

```bash
# Desde la raíz
npm run dev:web         # Solo frontend web
npm run dev:web:full    # Backend + frontend web
npm run build:web       # Build web para despliegue
```

### Desarrollo Simultáneo

```bash
npm run dev    # Inicia backend + frontend con concurrently
```

---

## ⚙️ Configuración

### Variables de Entorno (`backend/.env`)

```env
# Servidor
PORT=3001

# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# JWT
JWT_SECRET=tu_clave_secreta_muy_larga
JWT_EXPIRES_IN=24h

# Email SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_app_password
SMTP_FROM=tu_email@gmail.com

# Superadmin (para seed)
SUPERADMIN_EMAIL=admin@tudominio.com
SUPERADMIN_PASSWORD=TuPassword@Seguro123

# Unity
UNITY_API_KEY=tu_api_key_para_unity
```

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `PORT` | No | Puerto del servidor (default: 3001) |
| `SUPABASE_URL` | ✅ | URL del proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service Role Key de Supabase |
| `JWT_SECRET` | ✅ | Clave secreta para tokens JWT |
| `JWT_EXPIRES_IN` | No | Duración del token (default: 24h) |
| `SMTP_USER` | ✅ | Email para envío de correos |
| `SMTP_PASS` | ✅ | Contraseña de aplicación SMTP |
| `UNITY_API_KEY` | ✅ | API Key para autenticación de Unity |
| `REDIS_CACHE_ENABLED` | No | Habilita/deshabilita caché Redis (`true` por defecto) |
| `REDIS_URL` | No | URL completa de Redis (ej: `redis://localhost:6379/0`) |
| `REDIS_HOST` | No | Host de Redis (si no usas `REDIS_URL`) |
| `REDIS_PORT` | No | Puerto Redis (default `6379`) |
| `REDIS_DB` | No | Índice de DB Redis (default `0`) |
| `REDIS_PASSWORD` | No | Password Redis (si aplica) |
| `REDIS_CONNECT_TIMEOUT_MS` | No | Timeout de conexión a Redis en milisegundos |

### Redis cache (local y producción)

- Local (Docker Compose raíz): `docker compose up -d redis backend`
- Local (solo backend): `cd backend && docker compose up -d redis backend`
- Producción: configurar `REDIS_URL` apuntando a tu instancia administrada (ej. `redis://:<password>@host:6379/0`)
- Fallback seguro: si Redis no está disponible, el backend sigue funcionando sin caché distribuida

### Variables Frontend (`frontend/.env` o Vercel)

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `VITE_API_URL` | ✅ | URL pública del backend |
| `VITE_API_TIMEOUT_MS` | No | Timeout HTTP global en ms (default `15000`) |
| `VITE_API_GET_CACHE_TTL_MS` | No | TTL del caché GET en frontend para listados (default `20000`) |

### Runtime Config de Electron

Electron usa este formato para `runtime-config.json`:

```json
{
  "apiUrl": "https://dashboard-terapeuta-backend-858026487030.us-central1.run.app",
  "apiTimeoutMs": 15000,
  "apiGetCacheTtlMs": 20000
}
```

Si defines `API_URL`, `API_TIMEOUT_MS` o `API_GET_CACHE_TTL_MS` en el entorno, esos valores tienen prioridad sobre el archivo. Esto sirve para desarrollo, CI y empaquetado.

### Builds Desktop

```bash
npm run dist:frontend
npm run dist:frontend:win
npm run dist:frontend:win:release
npm run dist:frontend:mac
npm run dist:frontend:linux
```

En Windows, el instalador y el ejecutable usan el mismo icono base del frontend web, generado desde el diseño del componente `Logo` hacia `frontend/build/icons/icon.ico`.

### Firma Windows

El workflow de release Windows espera estos secretos para firmar el instalador:

| Secreto | Descripción |
|---------|-------------|
| `WINDOWS_CERTIFICATE_BASE64` | Certificado `.pfx` codificado en base64 |
| `WINDOWS_CERTIFICATE_PASSWORD` | Password del certificado |

Variables opcionales:

| Variable | Descripción |
|----------|-------------|
| `WINDOWS_SIGNING_TIMESTAMP_URL` | URL del servidor de timestamp, por ejemplo `http://timestamp.digicert.com` |

---

## 📖 Uso

### Primer Uso — Crear Superadministrador

1. Inicia el backend: `npm run dev:backend`
2. Inicia el frontend: `npm run dev:frontend`
3. La app detecta que no hay superadmin y muestra la página de Setup
4. Crea el superadmin con email, nombre y contraseña segura

> **Contraseña:** mínimo 10 caracteres con mayúsculas, minúsculas, números y símbolos.

### Despliegue con Docker

```bash
cd backend
docker build -t cerebro-al-fuego .
docker run -p 3001:3001 --env-file .env cerebro-al-fuego
```

---

## 🔧 Documentación del Backend

### Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                     server.js                           │
│              (Express App & Middlewares)                 │
└───────────────────────┬─────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│   Routes      │ │  Middleware   │ │    Config      │
│ ────────────  │ │ ────────────  │ │ ────────────   │
│ • api.js      │ │ authMiddle-   │ │ • supabase.js  │
│ • auth.js     │ │   ware.js     │ │ • swagger.js   │
│ • usuarios.js │ │ (JWT + RBAC)  │ └───────┬────────┘
│ • audit.js    │ │               │         │
│ • vrResults.js│ └───────────────┘         │
└───────┬───────┘                           │
        └──────────────┬────────────────────┘
                       ▼
              ┌─────────────────┐
              │   PostgreSQL    │
              │   (Supabase)    │
              └─────────────────┘
```

### Módulos

| Carpeta | Archivos | Descripción |
|---------|----------|-------------|
| `config/` | `supabase.js`, `swagger.js` | Clientes de Supabase y OpenAPI |
| `middleware/` | `authMiddleware.js` | JWT, `requireSuperAdmin`, `requireTerapeuta`, `optionalAuth` |
| `routes/` | `api.js`, `auth.js`, `usuarios.js`, `audit.js`, `vrResults.js` | Todos los endpoints |
| `validators/` | `authValidator.js`, `patientValidator.js`, `userValidator.js` | express-validator chains |
| `utils/` | `auditHelper.js`, `validationUtils.js` | Helpers reutilizables |
| `services/` | `emailService.js` | SMTP con nodemailer |

---

## 📡 API Endpoints — Resumen (35 endpoints)

> Documentación completa en [`backend/API_ENDPOINTS.md`](backend/API_ENDPOINTS.md) y en Swagger: `http://localhost:3001/api-docs`

### Health & Status (3 — Públicos)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/health` | Estado del servidor |
| GET | `/api/status` | Estado de la API |
| GET | `/api/db-status` | Conexión a BD |

### Autenticación (8 — `/api/auth`)

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/check-setup` | ❌ | Verificar si existe superadmin |
| POST | `/setup` | ❌ | Crear superadmin (1 vez) |
| POST | `/login` | ❌ | Iniciar sesión |
| GET | `/me` | JWT | Info del usuario actual |
| POST | `/change-password` | JWT | Cambiar contraseña |
| POST | `/forgot-password` | ❌ | Solicitar recuperación |
| POST | `/reset-password` | ❌ | Restablecer con token |
| POST | `/request-verification-code` | JWT | Código por email |

### Usuarios (5 — Solo Superadmin)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/usuarios` | Listar usuarios |
| POST | `/api/usuarios/terapeuta` | Crear terapeuta |
| PUT | `/api/usuarios/:id` | Actualizar usuario |
| PUT | `/api/usuarios/:id/toggle-estado` | Activar/desactivar |
| POST | `/api/usuarios/:id/reset-password` | Reset de contraseña |

### Pacientes (7 — JWT + Terapeuta)

| Método | Endpoint | Ownership | Descripción |
|--------|----------|-----------|-------------|
| GET | `/api/patients` | Filtrado | Listar pacientes |
| POST | `/api/patients` | — | Crear paciente |
| GET | `/api/patients/:id` | ✅ | Detalle de paciente |
| PUT | `/api/patients/:id` | ✅ | Actualizar paciente |
| PUT | `/api/patients/:id/toggle-status` | ✅ | Activar/desactivar |
| POST | `/api/patients/:id/assign` | SuperAdmin | Asignar terapeuta |
| GET | `/api/patients/:id/report` | ✅ | Informe con sesiones VR |

### Sesiones VR Dashboard (2 — JWT + Terapeuta)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/sessions` | Listar sesiones (filtro por ownership) |
| PUT | `/api/sessions/:id` | **Evaluación + observaciones** (ownership check) |

### Unity / VR Results (4 — API Key + JWT)

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/api/v1/session-results` | API Key | Recibir datos desde Unity |
| GET | `/api/v1/session-results` | JWT | Listar sesiones (raw) |
| GET | `/api/v1/session-results/:id` | JWT | Detalle con sets + errores |
| GET | `/api/v1/patients/lookup` | API Key | Verificar paciente (Unity) |

### Dashboard & Terapeutas (2 — JWT)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Estadísticas generales |
| GET | `/api/terapeutas` | Listar terapeutas |

### Auditoría (4 — Solo Superadmin)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/audit` | Eventos con paginación |
| GET | `/api/audit/types` | Tipos de eventos |
| GET | `/api/audit/user/:id` | Eventos de un usuario |
| GET | `/api/audit/export` | Exportar CSV |

---

## 🎮 Integración con Videojuego VR (Unity)

```
┌────────────────────────┐     POST JSON      ┌────────────────────────┐
│    VIDEOJUEGO VR       │ ─────────────────> │  DASHBOARD BACKEND     │
│       (Unity)          │    X-API-Key       │    (Express.js)        │
│                        │                    │         │              │
│  Sets: Ingredients     │ <───────────────── │         ▼              │
│        Utensils        │   GET /patients/   │ ┌──────────────────┐   │
│        Preparation     │     lookup         │ │    SUPABASE      │   │
│        Organization    │                    │ │  (PostgreSQL)    │   │
└────────────────────────┘                    │ └──────────────────┘   │
                                              └────────────────────────┘
```

### JSON de Sesión VR

```json
{
  "schemaVersion": "1.0",
  "participantId": "CEDULA_PACIENTE",
  "activityId": "tinto_easy_01",
  "startedAtIso": "2026-01-21T05:13:26.428Z",
  "endedAtIso": "2026-01-21T05:19:21.598Z",
  "totalSeconds": 355.17,
  "summary": {
    "totalErrors": 3,
    "totalDrops": 2,
    "totalReleases": 5,
    "setsCompleted": 4
  },
  "sets": [
    {
      "setName": "Ingredients",
      "startedAtIso": "2026-01-21T05:13:26.428Z",
      "endedAtIso": "2026-01-21T05:15:00.000Z",
      "durationSeconds": 93.57,
      "blockedCount": 1,
      "dropsCount": 0,
      "releasesCount": 1,
      "errors": [
        {
          "code": "STOVE_ON_NO_POT",
          "message": "Estufa encendida sin olla",
          "timeIso": "2026-01-21T05:14:12.000Z",
          "context": "Olla"
        }
      ]
    }
  ]
}
```

### Tablas de BD

| Tabla | Descripción |
|-------|-------------|
| `usuarios` | Usuarios del sistema (login, roles) |
| `terapeutas` | Datos de terapeutas |
| `pacientes` | Datos de pacientes |
| `terapeuta_paciente` | Relación terapeuta↔paciente |
| `vr_session_results` | Sesión principal con métricas y evaluación |
| `vr_set_results` | Resultados por etapa (set) |
| `vr_set_errors` | Errores con código, timestamp y contexto |
| `auditoria` | Registro de eventos del sistema |
| `password_reset_tokens` | Tokens de recuperación de contraseña |

---

## ⭐ Evaluación del Desempeño

El terapeuta puede asignar una calificación de desempeño (1-5) a cada sesión VR revisada:

| Valor | Etiqueta | Descripción |
|-------|----------|-------------|
| 1 | Muy bajo | Dificultades significativas en la mayoría de las áreas |
| 2 | Bajo | Desempeño por debajo de lo esperado con errores frecuentes |
| 3 | Aceptable | Desempeño adecuado con áreas de mejora identificables |
| 4 | Bueno | Buen desempeño con errores menores o esporádicos |
| 5 | Excelente | Desempeño sobresaliente con mínimos errores |

La calificación se almacena como prefijo en `observaciones_terapeuta`:
```
[Calificación: 4/5 - Bueno]
Paciente mostró mejoría en tiempo de reacción y coordinación motora.
```

### VRSessionCard — Vista Detallada

El componente `VRSessionCard.jsx` presenta la información en 5 pestañas:

| Pestaña | Contenido |
|---------|-----------|
| **Resumen** | Score circular (0-100), métricas globales, timeline, distribución de tiempo |
| **Etapas** | Cards expandibles por etapa con métricas, errores y timestamps |
| **Errores** | Agrupación por tipo, timeline cronológico, distribución por etapa |
| **Motricidad** | Eficiencia motora, análisis de drops/releases/blocks por etapa |
| **Evaluación** | Escala 1-5, observaciones clínicas, datos de referencia |

---

## 👥 Roles y Permisos

| Rol | Permisos |
|-----|----------|
| **SUPERADMIN** | Acceso total: CRUD terapeutas, asignar pacientes, ver auditoría, gestionar todos los datos |
| **TERAPEUTA** | Ver/crear pacientes asignados, revisar y evaluar sesiones VR de sus pacientes, configurar perfil |

---

## 🔐 Seguridad

| Característica | Implementación |
|----------------|----------------|
| **JWT** | Tokens con expiración configurable, verificación de estado activo |
| **bcrypt** | Hash de contraseñas con salt de 12 rounds |
| **RBAC** | `requireSuperAdmin`, `requireTerapeuta` + ownership checks |
| **API Key** | Header `X-API-Key` para endpoints de Unity |
| **Validación** | UUID, longitud, tipos de datos en todos los inputs |
| **Ownership** | Terapeutas solo acceden a datos de pacientes asignados |
| **Anti-bruteforce** | Bloqueo temporal tras 5 intentos fallidos de login |
| **Auditoría** | Registro de todas las operaciones críticas (SESSION_REVIEWED, etc.) |
| **CORS** | Configurado para orígenes permitidos |

> Ver [`SECURITY.md`](SECURITY.md) para guía completa de seguridad.

---

## 📝 Requerimientos Implementados

### Módulo de Seguridad (RF-SEG)

| Código | Descripción | Estado |
|--------|-------------|--------|
| RF-SEG-01 | Superusuario único | ✅ |
| RF-SEG-02 | Gestión de roles Superadmin | ✅ |
| RF-SEG-03 | Gestión de roles Terapeuta | ✅ |
| RF-SEG-04 | Interfaz visual terapeuta | ✅ |

### Base de Datos (RF-BDD)

| Código | Descripción | Estado |
|--------|-------------|--------|
| RF-BDD-01 | Estructura central de usuarios | ✅ |
| RF-BDD-02 | Registro de sesiones clínicas | ✅ |
| RF-BDD-03 | Registro detallado de acciones | ✅ |
| RF-BDD-04 | Registro de aciertos/errores/omisiones | ✅ |
| RF-BDD-08 | Control de auditoría con exportación | ✅ |

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
