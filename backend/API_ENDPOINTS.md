# Documentación de API Endpoints

Este documento detalla todos los endpoints disponibles en el backend del Dashboard Terapeuta.

**Versión:** 1.8.1  
**Última auditoría:** 2026-02-09  
**Total endpoints:** 35  
URL Base: `/api` (excepto VR Results que usa `/api/v1`)

## Resumen de Seguridad

| Nivel | Cant. | Middleware | Descripción |
|-------|-------|-----------|-------------|
| Público | 8 | Ninguno | Sin autenticación |
| API Key (Unity) | 2 | `validateUnityApiKey` | Header `X-API-Key` |
| JWT + Terapeuta | 14 | `authenticateToken` + `requireTerapeuta` | SUPERADMIN y TERAPEUTA (con ownership/filtrado) |
| JWT + SuperAdmin | 10 | `authenticateToken` + `requireSuperAdmin` | Solo SUPERADMIN, TERAPEUTA recibe 403 |

## Variables de Entorno Requeridas

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `PORT` | No | Puerto del servidor (default: 3001) |
| `SUPABASE_URL` | ✅ Sí | URL del proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Sí | Service Role Key de Supabase |
| `JWT_SECRET` | ✅ Sí | Clave secreta para firmar tokens JWT |
| `JWT_EXPIRES_IN` | No | Expiración del JWT (default: 24h) |
| `SMTP_HOST` | No | Host SMTP (default: smtp.gmail.com) |
| `SMTP_PORT` | No | Puerto SMTP (default: 587) |
| `SMTP_USER` | ✅ Sí | Email para envío de correos |
| `SMTP_PASS` | ✅ Sí | Contraseña de aplicación SMTP |
| `SMTP_FROM` | No | Remitente (default: SMTP_USER) |
| `SUPERADMIN_EMAIL` | No | Email del superadmin para seed |
| `SUPERADMIN_PASSWORD` | No | Password del superadmin para seed |
| `UNITY_API_KEY` | ✅ Sí | API Key para autenticación de Unity |

---

## 1. Health / Estado (Públicos)

### `GET /health`
Health check principal del servidor.
- **Seguridad:** 🟢 Pública
- **Entradas:** Ninguna
- **Salidas (200):**
  ```json
  {
    "status": "ok",
    "message": "Backend funcionando correctamente",
    "timestamp": "2026-02-09T06:11:12.980Z",
    "docs": "http://localhost:3001/api-docs"
  }
  ```

### `GET /api/status`
Verifica el estado general de la API.
- **Seguridad:** 🟢 Pública
- **Entradas:** Ninguna
- **Salidas (200):**
  ```json
  {
    "success": true,
    "message": "API funcionando correctamente",
    "version": "1.0.0",
    "database": "Supabase PostgreSQL"
  }
  ```

### `GET /api/db-status`
Verifica la conexión con la base de datos Supabase.
- **Seguridad:** 🟢 Pública
- **Entradas:** Ninguna
- **Salidas (200):**
  ```json
  {
    "success": true,
    "message": "Conexión a Supabase exitosa",
    "data": {
      "currentTime": "2026-02-09T06:11:38.023Z",
      "database": "Supabase PostgreSQL"
    }
  }
  ```

---

## 2. Autenticación (`/api/auth`)

### `GET /api/auth/check-setup`
Verifica si el sistema ya tiene un Superadministrador configurado.
- **Seguridad:** 🟢 Pública
- **Entradas:** Ninguna
- **Salidas (200):**
  ```json
  {
    "success": true,
    "data": { "configured": true, "message": "Sistema configurado. Puede iniciar sesión." }
  }
  ```

### `POST /api/auth/setup`
Crea el Superadministrador inicial. Solo puede ejecutarse una vez.
- **Seguridad:** 🟢 Pública (solo 1 vez)
- **Validación:** `validateSetup`
- **Entradas (Body):**
  ```json
  {
    "nombre": "Admin",
    "correo": "admin@example.com",
    "password": "SecurePassword1!"
  }
  ```
- **Salidas (201):** `{ "success": true, "message": "...", "data": { "usuario": {...}, "terapeuta": {...} } }`
- **Errores:** 400 `SUPERADMIN_EXISTS` si ya existe

### `POST /api/auth/login`
Inicia sesión de usuario. Incluye protección anti-brute-force (bloqueo temporal).
- **Seguridad:** 🟢 Pública
- **Validación:** `validateLogin` — email requerido y formato válido, password requerido
- **Entradas (Body):**
  ```json
  { "email": "user@example.com", "password": "Password123!" }
  ```
- **Salidas (200):**
  ```json
  {
    "success": true,
    "message": "Login exitoso",
    "data": {
      "token": "eyJhbGciOiJI...",
      "user": {
        "id": 1,
        "email": "cerebroalfuego@gmail.com",
        "rol": "SUPERADMIN",
        "nombre": "cerebroalfuego@gmail.com",
        "id_terapeuta": null
      }
    }
  }
  ```
- **Errores:**
  - 400 — Validación fallida (`email` y `password` requeridos)
  - 401 — Credenciales inválidas, usuario inactivo
  - 423 — Cuenta bloqueada temporalmente (`ACCOUNT_LOCKED`, incluye `remainingMinutes`)

### `GET /api/auth/me`
Obtiene información del usuario autenticado.
- **Seguridad:** 🔒 JWT Bearer
- **Headers:** `Authorization: Bearer <token>`
- **Entradas:** Ninguna
- **Salidas (200):**
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "email": "cerebroalfuego@gmail.com",
      "rol": "SUPERADMIN",
      "activo": true,
      "ultimo_acceso": "2026-02-09T06:11:14.704",
      "nombre": "cerebroalfuego@gmail.com"
    }
  }
  ```
- **Errores:** 401 `AUTH_REQUIRED`

### `POST /api/auth/change-password`
Cambia la contraseña del usuario autenticado. Requiere contraseña actual.
- **Seguridad:** 🔒 JWT Bearer
- **Validación:** `validateChangePassword` — currentPassword y newPassword requeridos, newPassword min 10 chars con mayúsculas, minúsculas, números y símbolos
- **Entradas (Body):**
  ```json
  { "currentPassword": "OldPass@12345", "newPassword": "NewPass@12345" }
  ```
- **Salidas (200):** `{ "success": true, "message": "Contraseña actualizada exitosamente" }`
- **Errores:** 401 `AUTH_REQUIRED`, 401 contraseña actual incorrecta, 400 validación

### `POST /api/auth/forgot-password`
Solicita restablecimiento de contraseña por email. Respuesta genérica para no revelar existencia de cuentas.
- **Seguridad:** 🟢 Pública
- **Entradas (Body):**
  ```json
  { "email": "user@example.com" }
  ```
- **Salidas (200):** Siempre devuelve:
  ```json
  { "success": true, "message": "Si el email existe, recibirá instrucciones para restablecer su contraseña" }
  ```
- **Errores:** 400 `email` requerido

### `POST /api/auth/reset-password`
Restablece contraseña usando un token recibido por email.
- **Seguridad:** 🟢 Pública (requiere token de email)
- **Entradas (Body):**
  ```json
  { "token": "abc123...", "newPassword": "NuevaPass@12345" }
  ```
- **Salidas (200):** `{ "success": true, "message": "Contraseña restablecida exitosamente" }`
- **Errores:** 400 token inválido/expirado, 400 validación de password

### `POST /api/auth/request-verification-code`
Solicita código de verificación por email (alternativo al link).
- **Seguridad:** 🔒 JWT Bearer
- **Entradas (Body):**
  ```json
  { "correo": "user@example.com" }
  ```
- **Salidas (200):** `{ "success": true, "message": "Código de verificación enviado a su correo electrónico" }`
- **Errores:** 401 `AUTH_REQUIRED`

---

## 3. Usuarios (`/api/usuarios`)

> ⚠️ Todos los endpoints de esta sección requieren **JWT + rol SUPERADMIN**.  
> Un TERAPEUTA recibe `403 SUPERADMIN_REQUIRED`.

### `GET /api/usuarios`
Lista todos los usuarios con datos de terapeuta asociado y conteo de pacientes.
- **Seguridad:** 🔴 JWT + `requireSuperAdmin`
- **Entradas:** Ninguna
- **Salidas (200):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 11,
        "username": "user@gmail.com",
        "rol": "TERAPEUTA",
        "activo": true,
        "fecha_creacion": "2026-02-09T06:05:39.358199",
        "ultimo_acceso": "2026-02-09T06:05:39.996",
        "id_terapeuta": 10,
        "nombre": "Dr. Juan",
        "correo": "user@gmail.com",
        "especialidad": "Neuropsicología",
        "telefono": "3001234567",
        "total_pacientes": 3
      }
    ]
  }
  ```
- **Errores:** 401, 403

### `POST /api/usuarios/terapeuta`
Crea un nuevo terapeuta con usuario asociado.
- **Seguridad:** 🔴 JWT + `requireSuperAdmin`
- **Validación:** `validateCreateUser` — nombre, correo, password requeridos; password min 10 chars
- **Entradas (Body):**
  ```json
  {
    "nombre": "Dr. Juan",
    "correo": "juan@example.com",
    "password": "Password123!@",
    "especialidad": "Neuropsicología",
    "telefono": "3001234567"
  }
  ```
- **Salidas (201):**
  ```json
  {
    "success": true,
    "message": "Terapeuta creado exitosamente",
    "data": {
      "usuario": { "id": 12, "email": "juan@example.com", "rol": "TERAPEUTA", "username": "juan@example.com" },
      "terapeuta": { "id": 11, "id_usuario": 12, "nombre": "Dr. Juan", "especialidad": "Neuropsicología", "correo": "juan@example.com", "telefono": "3001234567" }
    }
  }
  ```
- **Errores:** 401, 403, 400 validación, 409 correo duplicado

### `PUT /api/usuarios/:id`
Actualiza datos de un usuario/terapeuta. Solo SuperAdmin puede editar.
- **Seguridad:** 🔴 JWT + `requireSuperAdmin`
- **Validación:** `validateUserUpdate`
- **Parámetro URL:** `id` — ID del usuario (de tabla `usuarios`)
- **Entradas (Body):**
  ```json
  { "nombre": "Nuevo Nombre", "correo": "nuevo@email.com", "especialidad": "Geriatría", "telefono": "3009999999" }
  ```
- **Salidas (200):**
  ```json
  {
    "success": true,
    "message": "Usuario actualizado",
    "data": { "id": 11, "id_usuario": 12, "nombre": "...", "especialidad": "...", "correo": "...", "telefono": "..." }
  }
  ```
- **Errores:** 401, 403, 404 usuario no encontrado

### `PUT /api/usuarios/:id/toggle-estado`
Activa o desactiva un usuario (alterna estado).
- **Seguridad:** 🔴 JWT + `requireSuperAdmin`
- **Parámetro URL:** `id` — ID del usuario
- **Entradas:** Ninguna (el toggle es automático)
- **Salidas (200):**
  ```json
  { "success": true, "message": "Usuario desactivado/activado exitosamente", "data": { "id": 12, "email": "...", "activo": false } }
  ```
- **Errores:** 401, 403, 404

### `POST /api/usuarios/:id/reset-password`
Resetea la contraseña de un usuario por parte del SuperAdmin.
- **Seguridad:** 🔴 JWT + `requireSuperAdmin`
- **Parámetro URL:** `id` — ID del usuario
- **Entradas (Body):**
  ```json
  { "newPassword": "NuevaPass@12345" }
  ```
- **Salidas (200):** `{ "success": true, "message": "Contraseña reseteada exitosamente" }`
- **Errores:** 401, 403, 404, 400 validación de password

---

## 4. Pacientes (`/api/patients`)

> Los endpoints de pacientes requieren **JWT + rol TERAPEUTA** (SUPERADMIN también accede).  
> Un TERAPEUTA solo ve/edita pacientes **asignados** a él (ownership check via `terapeuta_paciente`).  
> SUPERADMIN ve/edita todos los pacientes.

### `GET /api/patients`
Lista pacientes. Filtrado automático por terapeuta.
- **Seguridad:** 🟡 JWT + `requireTerapeuta` + filtro por rol
- **Regla de acceso:** TERAPEUTA solo ve sus pacientes asignados. SUPERADMIN ve todos.
- **Entradas (Query):** `activo` (bool), `nombre` (string para búsqueda), `identificacion` (string)
- **Salidas (200):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 14,
        "identificacion": "616165587",
        "nombre": "Paciente Test",
        "edad": 69,
        "diagnostico": "Test diagnóstico",
        "fecha_registro": "2026-02-09",
        "activo": true,
        "id_terapeuta": 2,
        "terapeuta_nombre": "Dr. Alejandro Restrepo"
      }
    ]
  }
  ```
- **Errores:** 401

### `POST /api/patients`
Crea un nuevo paciente.
- **Seguridad:** 🟡 JWT + `requireTerapeuta`
- **Validación:** `validatePatient` — identificacion, nombre, edad requeridos
- **Entradas (Body):**
  ```json
  {
    "identificacion": "12345678",
    "nombre": "Paciente Nuevo",
    "edad": 30,
    "diagnostico": "Descripción del diagnóstico"
  }
  ```
- **Salidas (201):**
  ```json
  {
    "success": true,
    "message": "Paciente creado exitosamente",
    "data": { "id": 15, "identificacion": "12345678", "nombre": "...", "edad": 30, "diagnostico": "...", "fecha_registro": "2026-02-09", "activo": true }
  }
  ```
- **Errores:** 401, 400 validación, 409 identificación duplicada

### `GET /api/patients/:id`
Obtiene detalle completo de un paciente.
- **Seguridad:** 🟡 JWT + `requireTerapeuta` + **ownership check**
- **Regla de acceso:** TERAPEUTA solo accede si el paciente le está asignado → 403 si no.
- **Parámetro URL:** `id` — ID del paciente
- **Salidas (200):**
  ```json
  {
    "success": true,
    "data": {
      "id": 15, "identificacion": "12345678", "nombre": "Paciente X",
      "edad": 30, "diagnostico": "...", "fecha_registro": "2026-02-09",
      "activo": true, "id_terapeuta": 11, "terapeuta_nombre": "Dr. Juan"
    }
  }
  ```
- **Errores:** 401, 403 `Sin acceso a este paciente`, 404

### `PUT /api/patients/:id`
Actualiza datos de un paciente.
- **Seguridad:** 🟡 JWT + `requireTerapeuta` + `validatePatient` + **ownership check**
- **Regla de acceso:** TERAPEUTA solo edita sus pacientes asignados. SUPERADMIN edita cualquiera.
- **Parámetro URL:** `id`
- **Entradas (Body):** Campos opcionales:
  ```json
  { "identificacion": "...", "nombre": "...", "edad": 30, "diagnostico": "...", "activo": true }
  ```
- **Salidas (200):**
  ```json
  { "success": true, "message": "Paciente actualizado", "data": { "id": 15, "identificacion": "...", ... } }
  ```
- **Errores:** 401, 403 (ownership), 404, 400 validación

### `PUT /api/patients/:id/toggle-status`
Activa/desactiva un paciente (alterna estado).
- **Seguridad:** 🟡 JWT + `requireTerapeuta` + **ownership check**
- **Regla de acceso:** TERAPEUTA solo alterna estado de pacientes asignados. SUPERADMIN cualquiera.
- **Parámetro URL:** `id`
- **Entradas:** Ninguna (toggle automático)
- **Salidas (200):**
  ```json
  { "success": true, "message": "Paciente desactivado exitosamente", "data": { "id": 15, ..., "activo": false } }
  ```
- **Errores:** 401, 403 (ownership), 404

### `POST /api/patients/:id/assign`
Asigna (o reasigna) un paciente a un terapeuta.
- **Seguridad:** 🔴 JWT + `requireSuperAdmin`
- **Parámetro URL:** `id` — ID del paciente
- **Entradas (Body):**
  ```json
  { "id_terapeuta": 11 }
  ```
- **Salidas (200):**
  ```json
  { "success": true, "message": "Paciente asignado a Dr. Juan", "data": { "id_paciente": 15, "id_terapeuta": 11, "terapeuta_nombre": "Dr. Juan" } }
  ```
- **Errores:** 401, 403, 404 paciente/terapeuta no encontrado

### `GET /api/patients/:id/report`
Obtiene informe completo del paciente con estadísticas de sesiones VR.
- **Seguridad:** 🟡 JWT + `requireTerapeuta` + **ownership check**
- **Regla de acceso:** TERAPEUTA solo accede si el paciente le está asignado.
- **Parámetro URL:** `id`
- **Salidas (200):**
  ```json
  {
    "success": true,
    "data": {
      "patient": { "id": 15, "nombre": "...", "id_terapeuta": 11, "terapeuta_nombre": "Dr. Juan" },
      "stats": {
        "total_sesiones": 5,
        "sesiones_completadas": 5,
        "total_aciertos": 45,
        "total_errores": 12,
        "total_drops": 3,
        "tiempo_total_minutos": 28
      },
      "sessions": [
        { "id": "uuid", "actividad": "Juego1", "fecha_inicio": "...", "total_errores": 2, "tiempo_total_seg": 120 }
      ]
    }
  }
  ```
- **Errores:** 401, 403 (ownership), 404

---

## 5. Sesiones VR — Dashboard (`/api/sessions`)

### `GET /api/sessions`
Lista sesiones VR para revisión en el dashboard. Filtrado automático por terapeuta.
- **Seguridad:** 🟡 JWT + `requireTerapeuta` + **filtro por terapeuta**
- **Regla de acceso:** TERAPEUTA solo ve sesiones de sus pacientes asignados (vía `terapeuta_paciente`). SUPERADMIN ve todas.
- **Entradas (Query):**
  - `estado_revision` — `PENDIENTE_REVISION` | `REVISADA`
  - `pendientes` — `true` (solo sesiones sin paciente vinculado)
  - `id_paciente` — int (filtrar por paciente específico)
  - `limit` — int (default: 50)
- **Salidas (200):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "111eb1d4-1201-4180-aff9-0439438ef986",
        "participant_id": "12345",
        "activity_id": "Juego1",
        "started_at": "2026-02-09T06:04:20.663+00:00",
        "ended_at": "2026-02-09T06:04:30.663+00:00",
        "total_seconds": 10,
        "summary_total_errors": 0,
        "summary_total_drops": 0,
        "summary_total_releases": 1,
        "summary_sets_completed": 1,
        "id_paciente_vinculado": 14,
        "id_terapeuta_revisor": null,
        "observaciones_terapeuta": null,
        "estado_revision": "PENDIENTE_REVISION",
        "created_at": "2026-02-09T06:04:20.663+00:00",
        "paciente_nombre": "Paciente Test"
      }
    ],
    "count": 1
  }
  ```
- **Errores:** 401

### `PUT /api/sessions/:id`
Actualiza evaluación del desempeño, observaciones clínicas y/o vinculación de paciente de una sesión VR.
- **Seguridad:** 🟡 JWT + `requireTerapeuta` + **ownership check** + validación de inputs
- **Regla de acceso:** TERAPEUTA solo puede actualizar sesiones de pacientes asignados a él (vía `terapeuta_paciente`). SUPERADMIN puede actualizar cualquier sesión. Si la sesión no tiene paciente vinculado, cualquier terapeuta puede revisarla.
- **Validaciones de seguridad:**
  - UUID: formato válido requerido para el parámetro `id`
  - Existencia: verifica que la sesión exista antes de actualizar
  - Ownership: TERAPEUTA solo edita sesiones de sus pacientes asignados → 403 si no
  - Longitud: `observaciones` máximo 2000 caracteres
  - Tipo: `observaciones` debe ser string, `id_paciente` debe ser entero positivo
  - Paciente activo: si se vincula un paciente, debe existir y estar activo
  - Auditoría: registra evento `SESSION_REVIEWED` con detalles
- **Parámetro URL:** `id` — UUID de la sesión
- **Entradas (Body):**
  ```json
  {
    "observaciones": "[Calificación: 4/5 - Bueno]\nPaciente mostró mejoría en tiempo de reacción y coordinación motora.",
    "id_paciente": 14
  }
  ```
  > **Formato de Evaluación del Desempeño:** El campo `observaciones` puede incluir un prefijo de calificación con formato `[Calificación: X/5 - Label]` donde X es un valor de 1 a 5 y Label es: Muy bajo, Bajo, Aceptable, Bueno o Excelente. Seguido por las observaciones clínicas del terapeuta.
- **Salidas (200):**
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid...",
      "observaciones_terapeuta": "[Calificación: 4/5 - Bueno]\nPaciente mostró mejoría...",
      "id_paciente_vinculado": 14,
      "id_terapeuta_revisor": 2,
      "estado_revision": "REVISADA"
    }
  }
  ```
- **Errores:**
  - 400 `INVALID_UUID` — Formato UUID inválido
  - 400 `INVALID_INPUT` — Tipo de dato incorrecto en observaciones o id_paciente
  - 400 `INPUT_TOO_LONG` — Observaciones exceden 2000 caracteres
  - 401 `AUTH_REQUIRED` — Token no proporcionado o inválido
  - 403 `ACCESS_DENIED` — Terapeuta no tiene acceso a esta sesión/paciente
  - 404 `SESSION_NOT_FOUND` — Sesión VR no encontrada
  - 404 `PATIENT_NOT_FOUND` — Paciente no encontrado o inactivo

---

## 6. Resultados VR / Unity (`/api/v1`)

### `POST /api/v1/session-results`
Recibe y persiste el resultado completo de una sesión VR desde Unity.
- **Seguridad:** 🔵 API Key — Header `X-API-Key`
- **Headers:** `X-API-Key: <UNITY_API_KEY>`
- **Vinculación automática:** Si `participantId` coincide con una `identificacion` en la tabla `pacientes`, se vincula automáticamente.
- **Entradas (Body):**
  ```json
  {
    "schemaVersion": "1.0",
    "participantId": "12345",
    "activityId": "Juego1",
    "startedAtIso": "2026-02-09T10:00:00Z",
    "endedAtIso": "2026-02-09T10:10:00Z",
    "totalSeconds": 600,
    "sets": [
      {
        "setName": "Set1",
        "errors": [
          { "errorType": "wrong_placement", "timestamp": "2026-02-09T10:02:00Z" }
        ],
        "completion": { "completedAt": "2026-02-09T10:05:00Z" },
        "returnedObjects": [
          { "objectName": "item1", "returnedAt": "2026-02-09T10:03:00Z" }
        ]
      }
    ]
  }
  ```
- **Salidas (201):**
  ```json
  { "id": "d5fd39cb-8771-4935-a761-6474315351cb", "createdAtIso": "2026-02-09T06:11:35.443019+00:00" }
  ```
- **Errores:**
  - 401 `UNAUTHORIZED` — API Key inválida o no proporcionada
  - 500 `CONFIG_ERROR` — UNITY_API_KEY no configurada en servidor
  - 400 — Campos requeridos faltantes

### `GET /api/v1/session-results`
Lista todas las sesiones VR (vista raw/técnica, distinta al dashboard).
- **Seguridad:** 🟡 JWT + `requireTerapeuta`
- **Entradas (Query):** `participantId` (string), `activityId` (string)
- **Salidas (200):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "schema_version": "1.0",
        "participant_id": "12345",
        "activity_id": "Juego1",
        "started_at": "...",
        "ended_at": "...",
        "total_seconds": 600,
        "summary_total_errors": 1,
        "summary_total_drops": 0,
        "summary_total_releases": 5,
        "summary_sets_completed": 1,
        "id_paciente_vinculado": 14,
        "estado_revision": "PENDIENTE_REVISION",
        "created_at": "..."
      }
    ],
    "count": 10
  }
  ```
- **Errores:** 401

### `GET /api/v1/session-results/:id`
Obtiene una sesión VR completa con todos sus sets, errores y objetos retornados.
- **Seguridad:** 🟡 JWT + `requireTerapeuta`
- **Parámetro URL:** `id` — UUID de la sesión
- **Salidas (200):**
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid", "schema_version": "1.0", "participant_id": "12345",
      "activity_id": "Juego1", "started_at": "...", "ended_at": "...",
      "total_seconds": 600, "summary_total_errors": 1,
      "sets": [
        {
          "set": { "id": "uuid", "set_name": "Set1", "set_index": 0 },
          "errors": [{ "id": "uuid", "error_type": "wrong_placement", "timestamp": "..." }],
          "returned_objects": [{ "id": "uuid", "object_name": "item1", "returned_at": "..." }]
        }
      ]
    }
  }
  ```
- **Errores:** 401, 404

### `GET /api/v1/patients/lookup`
Endpoint para que Unity verifique si un paciente existe antes de iniciar sesión VR.
- **Seguridad:** 🔵 API Key — Header `X-API-Key`
- **Headers:** `X-API-Key: <UNITY_API_KEY>`
- **Entradas (Query):** `identificacion` — Número de cédula/identificación del paciente
- **Salidas (200 — encontrado):**
  ```json
  { "found": true, "participant_id": "12345678", "display_name": "Patient A.", "internal_id": 15 }
  ```
- **Salidas (404 — no encontrado):**
  ```json
  { "found": false, "message": "No se encontró paciente con esa identificación" }
  ```
- **Errores:** 401 `UNAUTHORIZED` — API Key inválida

---

## 7. Terapeutas (`/api/terapeutas`)

### `GET /api/terapeutas`
Lista todos los terapeutas con su estado.
- **Seguridad:** 🟡 JWT + `requireTerapeuta`
- **Entradas:** Ninguna
- **Salidas (200):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 2,
        "nombre": "Dr. Alejandro Restrepo",
        "especialidad": "Geriatría",
        "correo": "alejandro@hospital.com",
        "telefono": "3001234567",
        "email": "alejandro@hospital.com",
        "activo": true
      }
    ]
  }
  ```
- **Errores:** 401

---

## 8. Dashboard (`/api/dashboard`)

### `GET /api/dashboard/stats`
Obtiene estadísticas generales del sistema.
- **Seguridad:** 🟡 JWT + `requireTerapeuta`
- **Entradas:** Ninguna
- **Salidas (200):**
  ```json
  {
    "success": true,
    "data": {
      "stats": {
        "total_pacientes": 15,
        "total_sesiones_vr": 54,
        "total_terapeutas": 11,
        "total_actividades": 7
      },
      "recentSessions": [
        {
          "id": "uuid",
          "activity_id": "Juego1",
          "participant_id": "12345",
          "fecha_inicio": "2026-02-09T06:11:34.611+00:00",
          "duracion_segundos": 15,
          "estado_revision": "PENDIENTE_REVISION",
          "paciente_nombre": null
        }
      ]
    }
  }
  ```
- **Errores:** 401

---

## 9. Auditoría (`/api/audit`)

> ⚠️ Todos los endpoints de auditoría requieren **JWT + rol SUPERADMIN**.  
> Un TERAPEUTA recibe `403 SUPERADMIN_REQUIRED`.

### `GET /api/audit`
Lista eventos de auditoría con paginación.
- **Seguridad:** 🔴 JWT + `requireSuperAdmin`
- **Entradas (Query):** `limit` (int), `offset` (int), `tipo` (string), `mes` (int), `anio` (int)
- **Salidas (200):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 48,
        "tipo_evento": "PATIENT_ASSIGNED",
        "tipo_label": "Paciente asignado",
        "id_usuario": 1,
        "actor_email": "cerebroalfuego@gmail.com",
        "actor_nombre": null,
        "ip_origen": "::1",
        "detalle": { "id_paciente": "15", "terapeuta_nombre": "Dr. Juan" },
        "timestamp": "2026-02-09T06:11:31.000Z"
      }
    ],
    "pagination": { "total": 48, "limit": 50, "offset": 0 }
  }
  ```
- **Errores:** 401, 403

### `GET /api/audit/types`
Lista tipos de eventos de auditoría con conteo.
- **Seguridad:** 🔴 JWT + `requireSuperAdmin`
- **Salidas (200):**
  ```json
  {
    "success": true,
    "data": [
      { "tipo_evento": "LOGIN_SUCCESS", "tipo_label": "Login exitoso", "count": 13 },
      { "tipo_evento": "TERAPEUTA_CREATED", "tipo_label": "Terapeuta creado", "count": 8 },
      { "tipo_evento": "PATIENT_UPDATED", "tipo_label": "Paciente actualizado", "count": 7 },
      { "tipo_evento": "LOGIN_FAILED", "tipo_label": "Login fallido", "count": 2 }
    ]
  }
  ```
- **Errores:** 401, 403

### `GET /api/audit/user/:id`
Eventos de auditoría de un usuario específico.
- **Seguridad:** 🔴 JWT + `requireSuperAdmin`
- **Parámetro URL:** `id` — ID del usuario
- **Salidas (200):**
  ```json
  {
    "success": true,
    "data": [
      { "id": 48, "tipo_evento": "PATIENT_ASSIGNED", "tipo_label": "Paciente asignado", "ip_origen": "::1", "detalle": {...}, "timestamp": "..." }
    ]
  }
  ```
- **Errores:** 401, 403

### `GET /api/audit/export`
Descarga registros de auditoría en formato CSV.
- **Seguridad:** 🔴 JWT + `requireSuperAdmin`
- **Entradas (Query):** `mes` (int), `anio` (int), `tipo` (string)
- **Salida:** Archivo CSV
- **Content-Type:** `text/csv; charset=utf-8`
- **Columnas CSV:** `ID, Fecha, Tipo, Usuario, IP, Detalles`
- **Ejemplo:** `GET /api/audit/export?mes=2&anio=2026`
- **Errores:** 401, 403

---

## Tabla Resumen — 35 Endpoints

| # | Método | Endpoint | Seguridad | Sin Auth | Con Auth |
|---|--------|----------|-----------|----------|----------|
| 1 | GET | `/health` | Pública | 200 | — |
| 2 | GET | `/api/status` | Pública | 200 | — |
| 3 | GET | `/api/db-status` | Pública | 200 | — |
| 4 | GET | `/api/auth/check-setup` | Pública | 200 | — |
| 5 | POST | `/api/auth/setup` | Pública (1 vez) | 201/400 | — |
| 6 | POST | `/api/auth/login` | Pública | 200/401/423 | — |
| 7 | POST | `/api/auth/forgot-password` | Pública | 200 | — |
| 8 | POST | `/api/auth/reset-password` | Pública (token email) | 200/400 | — |
| 9 | GET | `/api/auth/me` | JWT | 401 | 200 |
| 10 | POST | `/api/auth/change-password` | JWT | 401 | 200 |
| 11 | POST | `/api/auth/request-verification-code` | JWT | 401 | 200 |
| 12 | POST | `/api/v1/session-results` | API Key | 401 | 201 |
| 13 | GET | `/api/v1/patients/lookup` | API Key | 401 | 200/404 |
| 14 | GET | `/api/patients` | JWT + Terapeuta | 401 | 200 (filtrado) |
| 15 | POST | `/api/patients` | JWT + Terapeuta | 401 | 201 |
| 16 | GET | `/api/patients/:id` | JWT + Terapeuta + Ownership | 401 | 200/403 |
| 17 | PUT | `/api/patients/:id` | JWT + Terapeuta + Ownership | 401 | 200/403 |
| 18 | PUT | `/api/patients/:id/toggle-status` | JWT + Terapeuta + Ownership | 401 | 200/403 |
| 19 | GET | `/api/patients/:id/report` | JWT + Terapeuta + Ownership | 401 | 200/403 |
| 20 | GET | `/api/sessions` | JWT + Terapeuta + Filtro | 401 | 200 (filtrado) |
| 21 | PUT | `/api/sessions/:id` | JWT + Terapeuta + Ownership | 401 | 200/403/404 |
| 22 | GET | `/api/v1/session-results` | JWT + Terapeuta | 401 | 200 |
| 23 | GET | `/api/v1/session-results/:id` | JWT + Terapeuta | 401 | 200 |
| 24 | GET | `/api/terapeutas` | JWT + Terapeuta | 401 | 200 |
| 25 | GET | `/api/dashboard/stats` | JWT + Terapeuta | 401 | 200 |
| 26 | POST | `/api/patients/:id/assign` | JWT + SuperAdmin | 401 | 200 |
| 27 | GET | `/api/usuarios` | JWT + SuperAdmin | 401 | 200 |
| 28 | POST | `/api/usuarios/terapeuta` | JWT + SuperAdmin | 401 | 201 |
| 29 | PUT | `/api/usuarios/:id` | JWT + SuperAdmin | 401 | 200 |
| 30 | PUT | `/api/usuarios/:id/toggle-estado` | JWT + SuperAdmin | 401 | 200 |
| 31 | POST | `/api/usuarios/:id/reset-password` | JWT + SuperAdmin | 401 | 200 |
| 32 | GET | `/api/audit` | JWT + SuperAdmin | 401 | 200 |
| 33 | GET | `/api/audit/types` | JWT + SuperAdmin | 401 | 200 |
| 34 | GET | `/api/audit/user/:id` | JWT + SuperAdmin | 401 | 200 |
| 35 | GET | `/api/audit/export` | JWT + SuperAdmin | 401 | 200 (CSV) |
