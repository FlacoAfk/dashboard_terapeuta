# Dashboard Terapeuta — Documento de Requisitos

> **Versión**: 2.0 · **Fecha**: 2026-05-05 · **Autor**: Equipo Cerebro al Fuego  
> **Propósito**: Especificación formal de requerimientos funcionales y no funcionales del Dashboard de Terapeuta, la plataforma de gestión clínica para el videojuego VR "Cerebro al Fuego".

---

## Resumen Ejecutivo

El **Dashboard de Terapeuta** es una aplicación web + escritorio (Electron) que permite a terapeutas ocupacionales y neuropsicólogos gestionar pacientes adultos mayores con deterioro cognitivo, prescribir sesiones de cocina en realidad virtual, y revisar métricas de desempeño generadas por el videojuego Unity "Cerebro al Fuego".

**Stakeholders**: Terapeutas, Superadministrador, Pacientes (indirecto), Desarrolladores Unity VR.

---

## 1. Requisitos Funcionales

### 1.1 Autenticación y Roles

| ID | Título | Descripción | Prioridad | Criterios de Aceptación |
|---|---|---|---|---|
| **RF-01-01** | Login de Usuarios | Autenticación email + contraseña. Emite JWT. | 🔴 Alta | ✅ Devuelve `accessToken` (15 min) y `refreshToken` (7 días). <br>✅ Bloquea cuenta tras **5 intentos fallidos** (lock 15 min). |
| **RF-01-02** | RBAC | Control de acceso basado en roles (`SUPERADMIN`, `TERAPEUTA`). | 🔴 Alta | ✅ Backend valida rol en cada request. <br>✅ Frontend oculta menús según rol. |
| **RF-01-03** | Recuperación de Contraseña | Flujo vía email SMTP con código de 6 dígitos. | 🟡 Media | ✅ Envía código al correo registrado. <br>✅ Expira en **10 minutos**. |
| **RF-01-04** | Setup Inicial | Configuración del superadmin en primer arranque. | 🔴 Alta | ✅ Solo permitido si no existe superadmin. <br>✅ Redirige a login tras creación. |

### 1.2 Gestión de Pacientes

| ID | Título | Descripción | Prioridad | Criterios de Aceptación |
|---|---|---|---|---|
| **RF-02-01** | CRUD Pacientes | Registrar, ver, editar y archivar pacientes. | 🔴 Alta | ✅ Soft-delete (`activo=false`) en lugar de borrado físico. <br>✅ Superadmin ve todos los pacientes; terapeuta solo los asignados. |
| **RF-02-02** | Asignación Terapeuta-Paciente | Vinculación explícita con trazabilidad de fechas. | 🔴 Alta | ✅ Un paciente pertenece a un terapeuta. <br>✅ Superadmin puede reasignar. |
| **RF-02-03** | Búsqueda y Filtros | Buscar pacientes por nombre, cédula, diagnóstico, estado. | 🟡 Media | ✅ Búsqueda textual con resultados paginados. <br>✅ Filtro por terapeuta asignado. |

### 1.3 Gestión de Sesiones VR

| ID | Título | Descripción | Prioridad | Criterios de Aceptación |
|---|---|---|---|---|
| **RF-03-01** | Crear Sesión | Generar sesión VR con receta para un paciente. | 🔴 Alta | ✅ Genera `start_token` único (6 caracteres alfanuméricos). <br>✅ Estado inicial: `CREATED`. |
| **RF-03-02** | Recetas Disponibles | 9 recetas de cocina colombiana con niveles de dificultad. | 🔴 Alta | ✅ Fácil: tinto, café con leche, macchiato. <br>✅ Intermedio: arepa con huevo, panqueques, avena. <br>✅ Difícil: arroz con pollo, spaghetti, sancocho. |
| **RF-03-03** | Consulta por Token | VR consulta la sesión mediante `start_token`. | 🔴 Alta | ✅ Devuelve `participant_code`, `recipe_id`, `status`. |
| **RF-03-04** | Cierre de Sesión | Finalizar sesión manualmente o por Unity. | 🟡 Media | ✅ Cambia estado a `FINISHED`. <br>✅ Una sola sesión activa por paciente. |

### 1.4 Recepción de Resultados VR

| ID | Título | Descripción | Prioridad | Criterios de Aceptación |
|---|---|---|---|---|
| **RF-04-01** | Ingesta de Sesión Unity | Endpoint que recibe el payload completo del juego. | 🔴 Alta | ✅ Valida JSON contra schema. <br>✅ Almacena `raw_payload` como JSONB. <br>✅ Persiste sets, errores y objetos retornados. |
| **RF-04-02** | Vinculación Automática | Asociar sesión VR a paciente registrado. | 🟡 Media | ✅ Match por `participant_id` ↔ `identificacion`. |

### 1.5 Revisión Clínica

| ID | Título | Descripción | Prioridad | Criterios de Aceptación |
|---|---|---|---|---|
| **RF-05-01** | Observaciones Clínicas | El terapeuta agrega notas a sesiones completadas. | 🔴 Alta | ✅ Campo de texto libre. <br>✅ Registra autor y timestamp. |
| **RF-05-02** | Visualización de Métricas | Resumen gráfico del desempeño del paciente. | 🟡 Media | ✅ Total errores, drops, releases, sets completados. <br>✅ Detalle por set (4 etapas). |
| **RF-05-03** | Estado de Revisión | Tracking de sesiones revisadas vs pendientes. | 🟡 Media | ✅ Estados: `PENDIENTE_REVISION`, `REVISADA`. |

### 1.6 Administración

| ID | Título | Descripción | Prioridad | Criterios de Aceptación |
|---|---|---|---|---|
| **RF-06-01** | Gestión de Usuarios | CRUD de terapeutas (solo superadmin). | 🟡 Media | ✅ Crear, activar, desactivar terapeutas. <br>✅ No se puede eliminar el superadmin. |
| **RF-06-02** | Auditoría | Registro de acciones sensibles en el sistema. | 🟢 Baja | ✅ Eventos: login, creación de usuarios, revisión de sesiones. <br>✅ Almacena actor, acción, timestamp, IP. |

### 1.7 Reportes

| ID | Título | Descripción | Prioridad | Criterios de Aceptación |
|---|---|---|---|---|
| **RF-07-01** | Exportación de Datos | Exportar historial de sesiones a CSV. | 🟢 Baja | ✅ Descarga archivo con métricas tabuladas. |

---

## 2. Requisitos No Funcionales

| ID | Categoría | Descripción | Prioridad | Métrica / Verificación |
|---|---|---|---|---|
| **RNF-01** | 🔒 Seguridad | Protección de endpoints y datos. | 🔴 Alta | JWT en `Authorization: Bearer`. CORS restringido. Rate-limit 300 req/15min. Helmet activo. |
| **RNF-02** | ⚡ Rendimiento | Tiempos de respuesta consistentes. | 🔴 Alta | p95 < 200ms en endpoints críticos. Redis para caché de listados. |
| **RNF-03** | 🟢 Disponibilidad | Backend siempre accesible. | 🔴 Alta | Cloud Run con auto-scaling (min 1 instancia). Health checks. |
| **RNF-04** | 💻 Compatibilidad | Multiplataforma. | 🔴 Alta | Web responsive (Vercel). Desktop Windows/Mac (Electron). |
| **RNF-05** | 🧪 Mantenibilidad | Código evolucionable. | 🟡 Media | Arquitectura modular por dominio. Cobertura >70%. ESLint + Prettier. |

---

## 3. Reglas de Negocio

| # | Regla | Impacto |
|---|---|---|
| **RN-01** | **Superadmin único**: Solo puede existir una cuenta `SUPERADMIN` en el sistema. | Setup inicial bloquea creación si ya existe. |
| **RN-02** | **Una sesión activa por paciente**: No se puede crear una nueva sesión si el paciente ya tiene una en estado `ACTIVE` o `CREATED`. | Validación con índice único parcial en BD. |
| **RN-03** | **Privacidad clínica**: Un terapeuta solo ve pacientes y sesiones que le fueron asignados. | Superadmin ve todo. Backend filtra por `id_terapeuta` del JWT. |
| **RN-04** | **Recetas cerradas**: Solo 9 valores válidos para `recipe_id`. | CHECK constraint en BD + validación en API. |
| **RN-05** | **No eliminación física**: Pacientes y usuarios se archivan (`activo=false`), no se borran. | Preserva integridad referencial e historial clínico. |

---

## 4. Restricciones Técnicas

| Componente | Restricción |
|---|---|
| **Base de Datos** | Supabase PostgreSQL. Sin excepciones. |
| **Autenticación** | JWT propio (NO Supabase Auth). |
| **Backend Runtime** | Node.js 24+ en Google Cloud Run. |
| **Frontend Web** | Vite + React 19, deploy en Vercel. |
| **Frontend Desktop** | Electron 40, distribuible como `.exe` / `.dmg`. |
| **Cache** | Redis (opcional, con fallback graceful). |
| **Email** | SMTP Gmail con app password. |
| **CI/CD** | GitHub Actions → Artifact Registry → Cloud Run. |

---

## 5. Matriz de Trazabilidad

| RF | Módulo Backend | Endpoint(s) | Tabla(s) BD | Prioridad |
|---|---|---|---|---|
| RF-01-01 | auth | `POST /api/auth/login` | usuarios | Alta |
| RF-01-02 | auth (middleware) | Todas las rutas protegidas | usuarios.rol | Alta |
| RF-01-03 | auth | `POST /api/auth/forgot-password` | password_reset_tokens | Media |
| RF-02-01 | patients | `GET/POST/PUT /api/patients` | pacientes | Alta |
| RF-02-02 | patients | `PUT /api/patients/:id/assign` | terapeuta_paciente | Alta |
| RF-03-01 | sessions | `POST /api/sessions` | sessions | Alta |
| RF-03-03 | sessions | `GET /api/vr/sessions/:token` | sessions | Alta |
| RF-04-01 | vr | `POST /api/vr/sessions` | vr_session_results, vr_set_results, vr_set_errors | Alta |
| RF-05-01 | vr | `PUT /api/vr/sessions/:id/review` | vr_session_results | Alta |
| RF-06-01 | users | `GET/POST/PUT /api/users` | usuarios, terapeutas | Media |

---

## 📁 Documentos Relacionados

- [Arquitectura Técnica](./ARQUITECTURA.md) — Diseño del sistema, componentes y diagramas
- [Modelo de Datos](./MODELO_DATOS.md) — Esquema de base de datos y relaciones
- [Seguridad](./SEGURIDAD.md) — Modelo de autenticación, autorización y hardening
- [Integración VR](./INTEGRACION_VR.md) — Contrato de API entre Unity y el Dashboard
- [Despliegue](./DEPLOYMENT.md) — Infraestructura y CI/CD
