# Dashboard Terapeuta — Arquitectura Técnica

> **Versión**: 2.0 · **Fecha**: 2026-05-05  
> **Stack**: Express.js + React 19 + Vite + Electron 40 + Supabase PostgreSQL + Redis

---

## Resumen

Sistema distribuido con backend en **Google Cloud Run**, frontend dual-target (web en **Vercel** + desktop con **Electron**), base de datos en **Supabase PostgreSQL**, y comunicación asíncrona con el juego **Unity VR**.

---

## 1. Diagrama de Contexto (C4 Nivel 1)

```mermaid
graph TB
    TERAPEUTA[🧑‍⚕️ Terapeuta<br/>Web Browser / Electron]
    SUPERADMIN[👑 Superadmin<br/>Web Browser / Electron]
    UNITY[🎮 Unity VR<br/>Cerebro al Fuego]
    
    DASHBOARD[🖥️ Dashboard Terapeuta<br/>Sistema de gestión clínica]
    SMTP[📧 Gmail SMTP]
    
    TERAPEUTA -->|"Gestiona pacientes,<br/>crea sesiones, revisa métricas"| DASHBOARD
    SUPERADMIN -->|"Administra usuarios,<br/>audita sistema"| DASHBOARD
    UNITY -->|"Envía resultados de sesión<br/>(JSON + métricas)"| DASHBOARD
    DASHBOARD -->|"Envía emails de<br/>recuperación de contraseña"| SMTP
```

---

## 2. Diagrama de Contenedores (C4 Nivel 2)

```mermaid
graph TB
    subgraph "Cliente"
        WEB[🌐 Frontend Web<br/>Vite + React 19<br/>Vercel]
        DESKTOP[💻 Frontend Desktop<br/>Electron 40<br/>Windows / Mac]
    end
    
    subgraph "Google Cloud"
        BACKEND[⚙️ Backend API<br/>Express.js + Node.js<br/>Cloud Run]
        REDIS[🗄️ Redis Cache<br/>Memorystore]
    end
    
    subgraph "Supabase Cloud"
        DB[(🐘 PostgreSQL 17<br/>Base de datos)]
    end
    
    UNITY[🎮 Unity VR Game] -->|"POST /api/vr/sessions<br/>API Key"| BACKEND
    WEB -->|"REST API<br/>JWT Bearer"| BACKEND
    DESKTOP -->|"REST API<br/>JWT Bearer"| BACKEND
    BACKEND -->|"Supabase SDK<br/>service_role"| DB
    BACKEND -->|"Cache read/write<br/>TTL configurable"| REDIS
```

---

## 3. Backend: Arquitectura Modular

### 3.1 Estructura de Dominios

```
backend/src/
├── server.js              # Bootstrap: Express + Redis + Supabase
├── app.js                 # Configuración de Express
├── config/
│   └── supabase.js        # Cliente Supabase SDK
├── middleware/
│   ├── authMiddleware.js   # JWT verification + RBAC
│   ├── cacheMiddleware.js  # Redis TTL + bypass
│   └── requestContext.js   # requestId + logging
├── domains/
│   ├── auth/              # POST /api/auth/login, forgot-password, reset-password, register
│   ├── sessions/          # Sesiones de receta VR (CRUD, tokens)
│   ├── usuarios/          # Gestión de terapeutas (solo superadmin)
│   ├── vrResults/         # Ingesta Unity + revisión clínica
│   └── api/               # Health checks + docs
├── constants/
│   └── recipes.js         # VALID_RECIPE_IDS (9 valores)
├── utils/
│   ├── cache.js           # Cache helper (Redis wrapper)
│   ├── jwt.js             # Token generation/verification
│   ├── validators.js      # Validaciones reutilizables
│   └── hash.js            # bcrypt wrapper
└── services/              # Lógica de negocio (email, etc.)
```

### 3.2 Cadena de Middleware

```mermaid
graph LR
    REQ[HTTP Request] --> HELMET[Helmet<br/>Security Headers]
    HELMET --> CORS[CORS<br/>Origin Check]
    CORS --> RATELIMIT[Rate Limit<br/>300 req/15min]
    RATELIMIT --> BODY[Body Parser<br/>JSON 2MB limit]
    BODY --> AUTH{Auth Middleware<br/>JWT Valid?}
    AUTH -->|✅ Yes| RBAC{RBAC Check<br/>Role Allowed?}
    AUTH -->|❌ No| E401[401 Unauthorized]
    RBAC -->|✅ Yes| VALIDATE[Express Validator<br/>Input Sanitization]
    RBAC -->|❌ No| E403[403 Forbidden]
    VALIDATE --> CONTROLLER[Domain Controller]
    CONTROLLER --> RESPONSE[JSON Response]
```

### 3.3 Endpoints por Dominio

#### Auth (`/api/auth`)
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/login` | No | Inicio de sesión. Retorna `accessToken` + `refreshToken`. |
| `POST` | `/register` | No (setup) | Registro del superadmin. Solo una vez. |
| `GET` | `/status` | No | Verifica si el sistema ya tiene superadmin. |
| `POST` | `/forgot-password` | No | Solicita código de recuperación por email. |
| `POST` | `/reset-password` | No | Cambia contraseña con código válido. |
| `POST` | `/refresh` | No (refreshToken) | Renueva accessToken. |

#### Usuarios (`/api/users` — solo SUPERADMIN)
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/` | JWT + SUPERADMIN | Listar todos los usuarios (paginado). |
| `POST` | `/` | JWT + SUPERADMIN | Crear nuevo terapeuta. |
| `PUT` | `/:id` | JWT + SUPERADMIN | Actualizar usuario (activo, rol). |
| `DELETE` | `/:id` | JWT + SUPERADMIN | Desactivar usuario (soft). |

#### Pacientes (`/api/patients` — TERAPEUTA o SUPERADMIN)
| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/` | Listar pacientes del terapeuta (o todos si superadmin). |
| `GET` | `/:id` | Detalle de paciente con sesiones vinculadas. |
| `POST` | `/` | Crear paciente. |
| `PUT` | `/:id` | Actualizar datos del paciente. |
| `DELETE` | `/:id` | Archivar paciente (`activo=false`). |
| `PUT` | `/:id/assign` | Asignar paciente a terapeuta. |

#### Sesiones de Receta (`/api/sessions`)
| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/` | Crear sesión de receta (genera `start_token`). |
| `GET` | `/` | Listar sesiones (filtro por paciente, estado). |
| `GET` | `/:id` | Detalle de sesión. |
| `PUT` | `/:id/close` | Cerrar sesión manualmente. |

#### VR Results (`/api/vr/sessions`)
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/:token` | No (token) | VR consulta sesión por `start_token`. |
| `POST` | `/` | API Key (Unity) | Unity envía resultados de sesión completos. |
| `GET` | `/` | JWT | Terapeuta lista sesiones VR (filtro por paciente, estado revisión). |
| `GET` | `/:id` | JWT | Detalle de sesión VR con sets y errores. |
| `PUT` | `/:id/review` | JWT | Terapeuta agrega observaciones clínicas. |

---

## 4. Frontend: Dual-Target Architecture

### 4.1 Estructura

```
frontend/src/
├── renderer/              # App React compartida
│   ├── App.jsx            # Router + providers
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── SetupPage.jsx       # Primer arranque superadmin
│   │   ├── ForgotPassword.jsx
│   │   ├── ResetPassword.jsx
│   │   ├── Dashboard.jsx       # Home con KPIs
│   │   ├── admin/              # Gestión de usuarios (superadmin)
│   │   └── terapeuta/          # Pacientes, sesiones, revisión
│   ├── components/
│   │   ├── layout/        # Navbar, Sidebar, Layout wrapper
│   │   ├── modals/        # Modales reutilizables
│   │   └── ui/            # Botones, inputs, cards
│   ├── context/           # AuthContext, ThemeContext
│   ├── services/          # api.js (axios client)
│   ├── constants/         # Rutas, labels de recetas
│   └── utils/             # Helpers, formatters
├── main/                  # Electron main process
├── preload/               # Electron preload scripts
├── web/                   # Entry point para Vercel/Vite

├── shared/                 # Tipos y utilidades compartidos
└── web/                    # Entry point para Vercel/Vite

### 4.2 Flujo de Autenticación

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Backend
    participant Supabase
    
    User->>Frontend: Email + Password
    Frontend->>Backend: POST /api/auth/login
    Backend->>Supabase: SELECT usuario WHERE email
    Supabase-->>Backend: {id, password_hash, rol}
    Backend->>Backend: bcrypt.compare()
    Backend-->>Frontend: {accessToken, refreshToken}
    Frontend->>Frontend: localStorage.setItem()
    Frontend->>Backend: GET /api/patients (Authorization: Bearer)
    Backend->>Backend: jwt.verify() + RBAC check
    Backend->>Supabase: SELECT pacientes WHERE id_terapeuta
    Supabase-->>Backend: [pacientes]
    Backend-->>Frontend: JSON response
```

### 4.3 Páginas y Rutas

| Ruta | Página | Auth Requerida | Descripción |
|---|---|---|---|
| `/login` | Login.jsx | No | Inicio de sesión |
| `/setup` | SetupPage.jsx | No (solo si no hay superadmin) | Configuración inicial |
| `/forgot-password` | ForgotPassword.jsx | No | Solicitar recuperación |
| `/reset-password` | ResetPassword.jsx | No (con token válido) | Nueva contraseña |
| `/dashboard` | Dashboard.jsx | JWT | Inicio con KPIs |
| `/patients` | terapeuta/ | JWT (TERAPEUTA+) | Lista de pacientes |
| `/patients/:id` | terapeuta/ | JWT | Detalle de paciente |
| `/sessions` | terapeuta/ | JWT | Sesiones de receta |
| `/vr-sessions` | terapeuta/ | JWT | Sesiones VR (revisión) |
| `/vr-sessions/:id` | terapeuta/ | JWT | Detalle con métricas |
| `/users` | admin/ | JWT (solo SUPERADMIN) | Gestión de terapeutas |

---

## 5. Infraestructura y Despliegue

### 5.1 CI/CD Pipeline

```mermaid
graph LR
    PUSH[Push to master] --> CI[GitHub Actions: CI]
    CI --> LINT[ESLint + Prettier]
    CI --> TEST[node --test + vitest]
    LINT --> DEPLOY{Deploy}
    TEST --> DEPLOY
    DEPLOY --> BACKEND[Cloud Run Deploy]
    DEPLOY --> FRONTEND[Vercel Deploy]
    BACKEND --> ARTIFACT[Artifact Registry<br/>Docker Image]
    ARTIFACT --> CLOUDRUN[Cloud Run Service<br/>cerebro-al-fuego-image]
    FRONTEND --> VERCEL[Vercel Production]
```

### 5.2 Docker

```dockerfile
# Backend (Multi-stage)
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY src/ ./src/
# Runtime
FROM node:24-alpine
COPY --from=builder /app /app
USER node
EXPOSE 3001
CMD ["node", "src/server.js"]
```

---

## 6. Decisiones Técnicas

| Decisión | Razón | Alternativa Considerada |
|---|---|---|
| **Supabase SDK** (no ORM) | Simplicidad, baja latencia, API REST nativa | Prisma, Knex, pg |
| **JWT propio** (no Supabase Auth) | Control total del flujo, evitar vendor lock-in | Supabase Auth, Auth0 |
| **bcryptjs** (no argon2) | Compatibilidad universal, sin dependencias nativas | argon2, scrypt |
| **Modular por dominio** | Escalabilidad, testabilidad, límites claros | Monolítico en server.js |
| **Dual-target frontend** | Misma app para web + escritorio sin duplicación | Apps separadas, PWA |
| **Redis opcional** | Cache sin punto único de fallo; fallback graceful | Solo Redis, sin caché |
| **Cloud Run** (no EC2/VM) | Serverless, auto-scale, zero idle cost | EC2, DigitalOcean, Railway |

---

## 📁 Documentos Relacionados

- [Requerimientos](./REQUERIMIENTOS.md) — Especificación funcional y no funcional
- [Modelo de Datos](./MODELO_DATOS.md) — Esquema y relaciones
- [Seguridad](./SEGURIDAD.md) — Auth, autorización, hardening
- [Integración VR](./INTEGRACION_VR.md) — Contrato Unity ↔ Dashboard
- [Despliegue](./DEPLOYMENT.md) — Infraestructura y CI/CD