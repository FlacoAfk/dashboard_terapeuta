# Documentación de API Endpoints

Este documento detalla todos los endpoints disponibles en el backend del Dashboard Terapeuta.

URL Base: `/api` (excepto VR Results que usa `/api/v1`)

## 1. Health / Estado

### `GET /api/status`
Verifica el estado general de la API.
- **Entradas:** Ninguna.
- **Salidas:**
  ```json
  {
      "success": true,
      "message": "API funcionando correctamente",
      "version": "1.0.0",
      "database": "Supabase PostgreSQL"
  }
  ```

### `GET /api/db-status`
Verifica la conexión con la base de datos.
- **Entradas:** Ninguna.
- **Salidas:**
  ```json
  {
      "success": true,
      "message": "Conexión a Supabase exitosa",
      "data": { ... }
  }
  ```

---

## 2. Autenticación (`/api/auth`)

### `POST /api/auth/login`
Inicia sesión de usuario.
- **Entradas (Body):**
  ```json
  {
      "email": "user@example.com",
      "password": "Password123!"
  }
  ```
- **Salidas (200 OK):**
  ```json
  {
      "success": true,
      "message": "Login exitoso",
      "data": {
          "token": "JWT_TOKEN...",
          "user": { "id": 1, "email": "...", "rol": "..." }
      }
  }
  ```
- **Salidas (Error):** 401 Credenciales inválidas, 423 Cuenta bloqueada.

### `GET /api/auth/me`
Obtiene información del usuario autenticado.
- **Headers:** `Authorization: Bearer <token>`
- **Salidas:**
  ```json
  {
      "success": true,
      "data": {
          "id": 1,
          "email": "...",
          "rol": "...",
          "nombre": "...",
          "especialidad": "...",
          "id_terapeuta": 1
      }
  }
  ```

### `POST /api/auth/setup`
Crea el Superadministrador inicial (solo una vez).
- **Entradas (Body):**
  ```json
  {
      "nombre": "Admin",
      "correo": "admin@example.com",
      "password": "SecurePassword1!"
  }
  ```

### `GET /api/auth/check-setup`
Verifica si el sistema ya está configurado.
- **Salidas:** `{ "success": true, "data": { "configured": true/false } }`

### `POST /api/auth/change-password`
Cambia la contraseña del usuario actual.
- **Entradas (Body):** `{ "currentPassword": "...", "newPassword": "..." }`

### `POST /api/auth/forgot-password`
Solicita restablecimiento de contraseña.
- **Entradas (Body):** `{ "email": "..." }`

### `POST /api/auth/reset-password`
Restablece contraseña usando un token.
- **Entradas (Body):** `{ "token": "...", "newPassword": "..." }`

### `POST /api/auth/request-verification-code`
Solicita código de verificación (alternativo al link).
- **Entradas:** Autenticación requerida.

---

## 3. Usuarios (`/api/usuarios`)
*Requiere rol SUPERADMIN*

### `GET /api/usuarios`
Lista todos los usuarios y terapeutas.
- **Salidas:** Lista de usuarios con detalles de terapeuta y conteo de pacientes.

### `POST /api/usuarios/terapeuta`
Crea un nuevo terapeuta.
- **Entradas (Body):**
  ```json
  {
      "nombre": "Dr. Juan",
      "correo": "juan@example.com",
      "password": "Password123!",
      "especialidad": "Neuropsicología",
      "telefono": "12345678"
  }
  ```

### `PUT /api/usuarios/:id`
Actualiza un usuario/terapeuta.
- **Entradas (Body):** `{ "nombre": "...", "correo": "...", "especialidad": "...", "telefono": "..." }`

### `PUT /api/usuarios/:id/toggle-estado`
Activa o desactiva un usuario.
- **Entradas:** Ninguna (ID en URL).

### `POST /api/usuarios/:id/reset-password`
Resetea la contraseña de un usuario por parte del admin.
- **Entradas (Body):** `{ "newPassword": "..." }`

---

## 4. Pacientes (`/api/patients`)
*Requiere rol TERAPEUTA (o SUPERADMIN para asignar)*

### `GET /api/patients`
Lista pacientes. Terapeutas solo ven los asignados.
- **Entradas (Query):** `activo` (bool), `nombre` (string), `identificacion` (string).
- **Salidas:** Lista de pacientes.

### `GET /api/patients/:id`
Obtiene detalle de un paciente.

### `POST /api/patients`
Crea un nuevo paciente.
- **Entradas (Body):**
  ```json
  {
      "identificacion": "12345",
      "nombre": "Paciente X",
      "edad": 30,
      "diagnostico": "..."
  }
  ```

### `PUT /api/patients/:id`
Actualiza datos de un paciente.
- **Entradas (Body):** Campos a actualizar (mismos que POST + `activo`).

### `PUT /api/patients/:id/toggle-status`
Activa/Desactiva un paciente.

### `POST /api/patients/:id/assign`
Asigna paciente a terapeuta (Solo Superadmin).
- **Entradas (Body):** `{ "id_terapeuta": 123 }`

### `GET /api/patients/:id/report`
Obtiene informe completo y estadísticas de sesiones.
- **Salidas:**
  ```json
  {
      "success": true,
      "data": {
          "patient": { ... },
          "stats": { "total_aciertos": 10, "tiempo_total_minutos": 5, ... },
          "sessions": [ ... ]
      }
  }
  ```

---

## 5. Sesiones VR (`/api/sessions`)

### `GET /api/sessions`
Lista sesiones VR para el dashboard.
- **Entradas (Query):**
  - `estado_revision`: 'PENDIENTE_REVISION' | 'REVISADA'
  - `pendientes`: true (solo sin paciente vinculado)
  - `id_paciente`: int
  - `limit`: int
- **Salidas:** Lista de sesiones de `vr_session_results`.

### `PUT /api/sessions/:id`
Actualiza revisión de sesión (observaciones o vinculación).
- **Entradas (Body):**
  ```json
  {
      "observaciones": "Texto...",
      "id_paciente": 123  // Opcional, para corregir vínculo
  }
  ```

---

## 6. Resultados VR / Unity (`/api/v1`)

### `POST /api/v1/session-results`
Recibe resultados desde Unity.
- **Entradas (Body):**
  ```json
  {
      "participantId": "12345",
      "activityId": "Juego1",
      "startedAtIso": "2024-01-01T10:00:00Z",
      "endedAtIso": "2024-01-01T10:10:00Z",
      "totalSeconds": 600,
      "sets": [
          {
              "setName": "Set1",
              "startedAtIso": "...",
              "endedAtIso": "...",
              "errors": [ { "code": "E1", "timeIso": "..." } ],
              "dropsCount": 1,
              "releasesCount": 5
          }
      ]
  }
  ```
- **Salidas:** `{ "id": "uuid...", "createdAtIso": "..." }`

### `GET /api/v1/session-results`
Lista historial (raw/técnico).

### `GET /api/v1/session-results/:id`
Obtiene detalle completo de sesión (incluyendo sets y errores).

### `GET /api/v1/patients/lookup`
Endpoint público para Unity (verifica existencia de paciente).
- **Headers:** `X-API-Key: <UNITY_API_KEY>`
- **Query:** `identificacion`
- **Salidas:**
  ```json
  {
      "found": true,
      "participant_id": "12345",
      "display_name": "Juan P."
  }
  ```

---

## 7. Auditoría (`/api/audit`)
*Requiere rol SUPERADMIN*

### `GET /api/audit`
Lista eventos de auditoría.
- **Query:** `limit`, `offset`, `tipo`, `mes`, `anio`.

### `GET /api/audit/user/:id`
Eventos de un usuario específico.

### `GET /api/audit/types`
Tipos de eventos disponibles.

### `GET /api/audit/export`
Descarga CSV de auditoría.
- **Query:** `mes`, `anio`.
- **Salida:** Archivo `.csv` descargable.
