# 📬 Cerebro al Fuego - Documentación de API para Postman

> **Versión:** 1.8.6  
> **Base URL (Cloud Run):** `https://dashboard-terapeuta-backend-858026487030.us-central1.run.app`  
> **Base URL (Local):** `http://localhost:3001`  
> **Swagger UI:** `{BASE_URL}/api-docs`  
> **Swagger JSON:** `{BASE_URL}/api-docs.json`

---

## 📋 Índice

1. [Configuración de Postman](#1-configuración-de-postman)
2. [Health & Status](#2-health--status)
3. [Autenticación](#3-autenticación)
4. [Usuarios (Solo Superadmin)](#4-usuarios-solo-superadmin)
5. [Pacientes](#5-pacientes)
6. [Sesiones VR - Dashboard](#6-sesiones-vr---dashboard)
7. [Terapeutas](#7-terapeutas)
8. [Dashboard - Estadísticas](#8-dashboard---estadísticas)
9. [VR Results - Unity](#9-vr-results---unity)
10. [Auditoría (Solo Superadmin)](#10-auditoría-solo-superadmin)
11. [Códigos de Error](#11-códigos-de-error)
12. [Credenciales de Prueba](#12-credenciales-de-prueba)

---

## 1. Configuración de Postman

### Variables de Entorno (Environment)

Crea un Environment en Postman con estas variables:

| Variable | Valor Inicial | Descripción |
|---|---|---|
| `base_url` | `https://dashboard-terapeuta-backend-858026487030.us-central1.run.app` | URL base de la API |
| `token_admin` | *(se obtiene al hacer login)* | JWT del Superadmin |
| `token_terapeuta` | *(se obtiene al hacer login)* | JWT del Terapeuta |
| `unity_api_key` | `YOUR_UNITY_API_KEY` | API Key para endpoints de Unity |

### Headers Comunes

Todos los endpoints que requieren autenticación JWT usan:

```
Authorization: Bearer {{token_admin}}
Content-Type: application/json
```

Los endpoints de Unity usan:

```
X-API-Key: {{unity_api_key}}
Content-Type: application/json
```

### Script de Auto-guardado de Token

En la pestaña **Tests** del endpoint de Login, agrega:

```javascript
if (pm.response.code === 200) {
    var json = pm.response.json();
    if (json.data && json.data.token) {
        pm.environment.set("token_admin", json.data.token);
        // o "token_terapeuta" según el login
    }
}
```

---

## 2. Health & Status

### 2.1 GET `/health`

> Verificar que el servidor está funcionando.

- **Auth:** Ninguna
- **URL:** `{{base_url}}/health`

**Response 200:**
```json
{
    "status": "ok",
    "message": "Backend funcionando correctamente",
    "timestamp": "2026-02-08T10:00:00.000Z",
    "docs": "http://localhost:3001/api-docs"
}
```

---

### 2.2 GET `/api/status`

> Estado general de la API.

- **Auth:** Ninguna
- **URL:** `{{base_url}}/api/status`

**Response 200:**
```json
{
    "success": true,
    "message": "API funcionando correctamente",
    "version": "1.0.0",
    "database": "Supabase PostgreSQL"
}
```

---

### 2.3 GET `/api/db-status`

> Verificar conexión a la base de datos Supabase.

- **Auth:** Ninguna
- **URL:** `{{base_url}}/api/db-status`

**Response 200:**
```json
{
    "success": true,
    "message": "Conexión a Supabase exitosa",
    "data": {
        "currentTime": "2026-02-08T10:00:00.000Z",
        "database": "Supabase PostgreSQL"
    }
}
```

---

## 3. Autenticación

### 3.1 POST `/api/auth/login`

> Iniciar sesión. Devuelve JWT token.

- **Auth:** Ninguna
- **URL:** `{{base_url}}/api/auth/login`

**Body (JSON):**
```json
{
    "email": "admin@example.com",
    "password": "ReplaceWithStrongPassword123!"
}
```

**Response 200:**
```json
{
    "success": true,
    "message": "Login exitoso",
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIs...",
        "user": {
            "id": 1,
            "email": "admin@example.com",
            "rol": "SUPERADMIN",
            "nombre": "Administrador Principal",
            "id_terapeuta": 1
        }
    }
}
```

**Response 401 – Credenciales inválidas:**
```json
{
    "success": false,
    "error": "Credenciales inválidas"
}
```

**Response 423 – Cuenta bloqueada (5+ intentos fallidos):**
```json
{
    "success": false,
    "error": "Cuenta bloqueada por demasiados intentos fallidos. Intente nuevamente en 15 minutos.",
    "code": "ACCOUNT_LOCKED",
    "remainingMinutes": 15
}
```

---

### 3.2 GET `/api/auth/check-setup`

> Verificar si ya existe un Superadministrador configurado.

- **Auth:** Ninguna
- **URL:** `{{base_url}}/api/auth/check-setup`

**Response 200:**
```json
{
    "success": true,
    "data": {
        "configured": true,
        "message": "Sistema configurado. Puede iniciar sesión."
    }
}
```

---

### 3.3 POST `/api/auth/setup`

> Crear Superadministrador inicial. Solo funciona UNA VEZ.

- **Auth:** Ninguna
- **URL:** `{{base_url}}/api/auth/setup`

**Body (JSON):**
```json
{
    "nombre": "Administrador Principal",
    "correo": "admin@clinica.com",
    "password": "Contraseña123!@"
}
```

> **Política de contraseña:** Mínimo 10 caracteres, al menos 1 mayúscula, 1 minúscula, 1 número, 1 símbolo (`@$!%*?&`).

**Response 201:**
```json
{
    "success": true,
    "message": "Superadministrador creado exitosamente",
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIs...",
        "user": {
            "id": 1,
            "email": "admin@clinica.com",
            "rol": "SUPERADMIN",
            "nombre": "Administrador Principal"
        }
    }
}
```

**Response 400 – Ya existe superadmin:**
```json
{
    "success": false,
    "error": "Ya existe un Superadministrador. Esta operación solo puede realizarse una vez.",
    "code": "SUPERADMIN_EXISTS"
}
```

---

### 3.4 GET `/api/auth/me`

> Obtener información del usuario autenticado.

- **Auth:** `Bearer {{token_admin}}` o `Bearer {{token_terapeuta}}`
- **URL:** `{{base_url}}/api/auth/me`

**Response 200:**
```json
{
    "success": true,
    "data": {
        "id": 1,
        "email": "admin@example.com",
        "rol": "SUPERADMIN",
        "activo": true,
        "ultimo_acceso": "2026-02-08T10:00:00.000Z",
        "nombre": "Administrador Principal",
        "correo": "admin@example.com",
        "especialidad": "Administración",
        "id_terapeuta": 1
    }
}
```

**Response 401:**
```json
{
    "success": false,
    "error": "Token no proporcionado"
}
```

---

### 3.5 POST `/api/auth/change-password`

> Cambiar contraseña del usuario autenticado.

- **Auth:** `Bearer {{token_admin}}`
- **URL:** `{{base_url}}/api/auth/change-password`

**Body (JSON):**
```json
{
    "currentPassword": "ReplaceWithStrongPassword123!",
    "newPassword": "NuevaPass@12345"
}
```

**Response 200:**
```json
{
    "success": true,
    "message": "Contraseña actualizada exitosamente"
}
```

**Response 401 – Contraseña actual incorrecta:**
```json
{
    "success": false,
    "error": "Contraseña actual incorrecta"
}
```

---

### 3.6 POST `/api/auth/forgot-password`

> Solicitar recuperación de contraseña. Envía código de 6 dígitos al email.

- **Auth:** Ninguna
- **URL:** `{{base_url}}/api/auth/forgot-password`

**Body (JSON):**
```json
{
    "email": "admin@example.com"
}
```

**Response 200 (siempre, por seguridad):**
```json
{
    "success": true,
    "message": "Si el email existe, recibirá instrucciones para restablecer su contraseña"
}
```

---

### 3.7 POST `/api/auth/reset-password`

> Restablecer contraseña usando el token/código recibido por email.

- **Auth:** Ninguna
- **URL:** `{{base_url}}/api/auth/reset-password`

**Body (JSON):**
```json
{
    "token": "123456",
    "newPassword": "NuevaPass@12345"
}
```

**Response 200:**
```json
{
    "success": true,
    "message": "Contraseña restablecida exitosamente. Ahora puede iniciar sesión."
}
```

**Response 400 – Token inválido:**
```json
{
    "success": false,
    "error": "Token inválido o no encontrado"
}
```

**Response 400 – Token expirado:**
```json
{
    "success": false,
    "error": "Este enlace ha expirado. Solicite uno nuevo."
}
```

---

### 3.8 POST `/api/auth/request-verification-code`

> Solicitar código de verificación (usuario ya autenticado).

- **Auth:** `Bearer {{token_admin}}`
- **URL:** `{{base_url}}/api/auth/request-verification-code`

**Body:** Ninguno (usa el email del token JWT)

**Response 200:**
```json
{
    "success": true,
    "message": "Código de verificación enviado a su correo electrónico"
}
```

---

## 4. Usuarios (Solo Superadmin)

### 4.1 GET `/api/usuarios`

> Listar todos los usuarios del sistema.

- **Auth:** `Bearer {{token_admin}}` (requiere rol SUPERADMIN)
- **URL:** `{{base_url}}/api/usuarios`

**Response 200:**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "username": "admin@example.com",
            "rol": "SUPERADMIN",
            "activo": true,
            "fecha_creacion": "2026-02-08T10:00:00.000Z",
            "ultimo_acceso": "2026-02-08T12:00:00.000Z",
            "id_terapeuta": 1,
            "nombre": "Administrador Principal",
            "correo": "admin@example.com",
            "especialidad": "Administración",
            "telefono": null,
            "pacientes_count": 0
        },
        {
            "id": 2,
            "username": "carolina.mejia@cerebroalfuego.com",
            "rol": "TERAPEUTA",
            "activo": true,
            "fecha_creacion": "2026-02-08T10:00:00.000Z",
            "ultimo_acceso": null,
            "id_terapeuta": 2,
            "nombre": "Carolina Mejía Restrepo",
            "correo": "carolina.mejia@cerebroalfuego.com",
            "especialidad": "Neuropsicología",
            "telefono": "3001234567",
            "pacientes_count": 4
        }
    ]
}
```

**Response 403 – No es Superadmin:**
```json
{
    "success": false,
    "error": "Acceso denegado. Se requiere rol de Superadministrador"
}
```

---

### 4.2 POST `/api/usuarios/terapeuta`

> Crear un nuevo terapeuta.

- **Auth:** `Bearer {{token_admin}}`
- **URL:** `{{base_url}}/api/usuarios/terapeuta`

**Body (JSON):**
```json
{
    "nombre": "Dr. Juan García López",
    "correo": "juan.garcia@clinica.com",
    "password": "Terapeuta@2026!",
    "especialidad": "Neuropsicología",
    "telefono": "3009876543"
}
```

**Response 201:**
```json
{
    "success": true,
    "message": "Terapeuta creado exitosamente",
    "data": {
        "usuario": {
            "id": 6,
            "email": "juan.garcia@clinica.com",
            "rol": "TERAPEUTA",
            "username": "juan.garcia@clinica.com"
        },
        "terapeuta": {
            "id": 6,
            "nombre": "Dr. Juan García López",
            "correo": "juan.garcia@clinica.com",
            "especialidad": "Neuropsicología",
            "telefono": "3009876543",
            "id_usuario": 6
        }
    }
}
```

**Response 400 – Email duplicado:**
```json
{
    "success": false,
    "error": "El correo electrónico ya está registrado"
}
```

**Response 400 – Contraseña débil:**
```json
{
    "success": false,
    "error": "La contraseña debe tener mínimo 10 caracteres, mayúsculas, minúsculas, números y símbolos"
}
```

---

### 4.3 PUT `/api/usuarios/:id`

> Actualizar datos de un usuario/terapeuta.

- **Auth:** `Bearer {{token_admin}}`
- **URL:** `{{base_url}}/api/usuarios/2`

**Body (JSON):**
```json
{
    "nombre": "Carolina Mejía R.",
    "especialidad": "Neuropsicología Clínica",
    "telefono": "3001112233"
}
```

**Response 200:**
```json
{
    "success": true,
    "message": "Usuario actualizado",
    "data": {
        "id": 2,
        "nombre": "Carolina Mejía R.",
        "correo": "carolina.mejia@cerebroalfuego.com",
        "especialidad": "Neuropsicología Clínica",
        "telefono": "3001112233",
        "id_usuario": 2
    }
}
```

---

### 4.4 PUT `/api/usuarios/:id/toggle-estado`

> Activar o desactivar un usuario.

- **Auth:** `Bearer {{token_admin}}`
- **URL:** `{{base_url}}/api/usuarios/3`

**Body:** Ninguno

**Response 200:**
```json
{
    "success": true,
    "message": "Usuario desactivado",
    "data": {
        "id": 3,
        "email": "alejandro.restrepo@cerebroalfuego.com",
        "activo": false,
        "username": "alejandro.restrepo@cerebroalfuego.com"
    }
}
```

**Response 400 – Terapeuta con pacientes:**
```json
{
    "success": false,
    "error": "No se puede desactivar un terapeuta con pacientes asignados. Reasígnelos primero.",
    "code": "THERAPIST_HAS_PATIENTS"
}
```

**Response 403 – Intentar desactivar Superadmin:**
```json
{
    "success": false,
    "error": "No se puede desactivar al Superadministrador"
}
```

---

### 4.5 POST `/api/usuarios/:id/reset-password`

> Resetear la contraseña de un usuario (forzado por Superadmin).

- **Auth:** `Bearer {{token_admin}}`
- **URL:** `{{base_url}}/api/usuarios/3/reset-password`

**Body (JSON):**
```json
{
    "newPassword": "NuevaPass@12345"
}
```

**Response 200:**
```json
{
    "success": true,
    "message": "Contraseña reseteada exitosamente"
}
```

---

## 5. Pacientes

### 5.1 GET `/api/patients`

> Listar pacientes. Superadmin ve todos, terapeutas solo los asignados.

- **Auth:** `Bearer {{token_admin}}` o `Bearer {{token_terapeuta}}`
- **URL:** `{{base_url}}/api/patients`

**Query Params (opcionales):**

| Param | Tipo | Descripción |
|---|---|---|
| `activo` | boolean | Filtrar por estado (`true`/`false`) |
| `nombre` | string | Búsqueda parcial por nombre |
| `identificacion` | string | Búsqueda parcial por cédula |

**Ejemplo:** `{{base_url}}/api/patients?activo=true&nombre=Juan`

**Response 200:**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "identificacion": "1098765432",
            "nombre": "María Elena Rodríguez",
            "edad": 72,
            "diagnostico": "Deterioro Cognitivo Leve",
            "activo": true,
            "fecha_registro": "2026-02-08T10:00:00.000Z",
            "id_terapeuta": 2,
            "terapeuta_nombre": "Carolina Mejía Restrepo"
        }
    ]
}
```

---

### 5.2 POST `/api/patients`

> Crear un nuevo paciente. Si es terapeuta, se asigna automáticamente.

- **Auth:** `Bearer {{token_terapeuta}}`
- **URL:** `{{base_url}}/api/patients`

**Body (JSON):**
```json
{
    "identificacion": "1234567890",
    "nombre": "Carlos Alberto Gómez",
    "edad": 68,
    "diagnostico": "Deterioro Cognitivo Leve"
}
```

**Response 201:**
```json
{
    "success": true,
    "message": "Paciente creado exitosamente",
    "data": {
        "id": 14,
        "identificacion": "1234567890",
        "nombre": "Carlos Alberto Gómez",
        "edad": 68,
        "diagnostico": "Deterioro Cognitivo Leve",
        "activo": true,
        "fecha_registro": "2026-02-08T10:00:00.000Z"
    }
}
```

---

### 5.3 GET `/api/patients/:id`

> Obtener un paciente por ID.

- **Auth:** `Bearer {{token_terapeuta}}`
- **URL:** `{{base_url}}/api/patients/1`

**Response 200:**
```json
{
    "success": true,
    "data": {
        "id": 1,
        "identificacion": "1098765432",
        "nombre": "María Elena Rodríguez",
        "edad": 72,
        "diagnostico": "Deterioro Cognitivo Leve",
        "activo": true,
        "fecha_registro": "2026-02-08T10:00:00.000Z",
        "id_terapeuta": 2,
        "terapeuta_nombre": "Carolina Mejía Restrepo"
    }
}
```

**Response 403 – Terapeuta sin acceso:**
```json
{
    "success": false,
    "error": "Sin acceso a este paciente"
}
```

---

### 5.4 PUT `/api/patients/:id`

> Actualizar datos de un paciente.

- **Auth:** `Bearer {{token_terapeuta}}`
- **URL:** `{{base_url}}/api/patients/1`

**Body (JSON):**
```json
{
    "nombre": "María Elena Rodríguez P.",
    "edad": 73,
    "diagnostico": "DCL - Amnésico"
}
```

**Response 200:**
```json
{
    "success": true,
    "message": "Paciente actualizado",
    "data": {
        "id": 1,
        "identificacion": "1098765432",
        "nombre": "María Elena Rodríguez P.",
        "edad": 73,
        "diagnostico": "DCL - Amnésico",
        "activo": true,
        "fecha_registro": "2026-02-08T10:00:00.000Z"
    }
}
```

---

### 5.5 PUT `/api/patients/:id/toggle-status`

> Activar o desactivar un paciente (eliminación lógica).

- **Auth:** `Bearer {{token_terapeuta}}`
- **URL:** `{{base_url}}/api/patients/1/toggle-status`

**Body:** Ninguno

**Response 200:**
```json
{
    "success": true,
    "message": "Paciente desactivado exitosamente",
    "data": {
        "id": 1,
        "nombre": "María Elena Rodríguez",
        "activo": false
    }
}
```

---

### 5.6 POST `/api/patients/:id/assign`

> Asignar/reasignar paciente a un terapeuta.

- **Auth:** `Bearer {{token_admin}}` (solo Superadmin)
- **URL:** `{{base_url}}/api/patients/1/assign`

**Body (JSON):**
```json
{
    "id_terapeuta": 3
}
```

**Response 200:**
```json
{
    "success": true,
    "message": "Paciente reasignado a Alejandro Restrepo",
    "data": {
        "id_paciente": 1,
        "id_terapeuta": 3,
        "terapeuta_nombre": "Alejandro Restrepo"
    }
}
```

**Response 400 – Terapeuta inactivo:**
```json
{
    "success": false,
    "error": "No se puede asignar a un terapeuta inactivo"
}
```

---

### 5.7 GET `/api/patients/:id/report`

> Obtener informe completo del paciente con estadísticas y sesiones VR.

- **Auth:** `Bearer {{token_terapeuta}}`
- **URL:** `{{base_url}}/api/patients/1/report`

**Response 200:**
```json
{
    "success": true,
    "data": {
        "patient": {
            "id": 1,
            "identificacion": "1098765432",
            "nombre": "María Elena Rodríguez",
            "edad": 72,
            "diagnostico": "Deterioro Cognitivo Leve",
            "activo": true,
            "id_terapeuta": 2,
            "terapeuta_nombre": "Carolina Mejía Restrepo"
        },
        "stats": {
            "total_sesiones": 5,
            "sesiones_completadas": 5,
            "total_aciertos": 12,
            "total_errores": 8,
            "total_drops": 3,
            "tiempo_total_minutos": 25
        },
        "sessions": [
            {
                "id": "uuid-sesion",
                "actividad": "tinto_easy_01",
                "fecha_inicio": "2026-02-08T09:00:00.000Z",
                "fecha_fin": "2026-02-08T09:05:00.000Z",
                "estado": "REVISADA",
                "total_aciertos": 3,
                "total_errores": 2,
                "total_drops": 1,
                "tiempo_total_seg": 300,
                "observaciones": "Buen desempeño en Ingredientes"
            }
        ]
    }
}
```

---

## 6. Sesiones VR - Dashboard

### 6.1 GET `/api/sessions`

> Listar sesiones VR para revisión en el dashboard.

- **Auth:** `Bearer {{token_admin}}`
- **URL:** `{{base_url}}/api/sessions`

**Query Params (opcionales):**

| Param | Tipo | Descripción |
|---|---|---|
| `estado_revision` | string | `PENDIENTE_REVISION` o `REVISADA` |
| `pendientes` | boolean | `true` = solo sin paciente vinculado |
| `id_paciente` | integer | Filtrar por paciente vinculado |
| `limit` | integer | Límite de resultados (default: 50) |

**Ejemplo:** `{{base_url}}/api/sessions?estado_revision=PENDIENTE_REVISION&limit=10`

**Response 200:**
```json
{
    "success": true,
    "data": [
        {
            "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            "participant_id": "1098765432",
            "activity_id": "tinto_easy_01",
            "started_at": "2026-02-08T09:00:00.000Z",
            "ended_at": "2026-02-08T09:05:00.000Z",
            "total_seconds": 300,
            "summary_total_errors": 2,
            "summary_total_drops": 1,
            "summary_total_releases": 3,
            "summary_sets_completed": 4,
            "id_paciente_vinculado": 1,
            "id_terapeuta_revisor": null,
            "observaciones_terapeuta": null,
            "estado_revision": "PENDIENTE_REVISION",
            "created_at": "2026-02-08T09:05:01.000Z",
            "paciente_nombre": "María Elena Rodríguez"
        }
    ],
    "count": 1
}
```

---

### 6.2 PUT `/api/sessions/:id`

> Agregar evaluación del desempeño, observaciones clínicas y/o corregir paciente vinculado a una sesión VR.

- **Auth:** `Bearer {{token_terapeuta}}`
- **URL:** `{{base_url}}/api/sessions/a1b2c3d4-e5f6-7890-abcd-ef1234567890`

**Seguridad:**
- Validación de formato UUID en el parámetro `id`
- Ownership check: TERAPEUTA solo puede actualizar sesiones de sus pacientes asignados
- SUPERADMIN puede actualizar cualquier sesión
- Observaciones limitadas a 2000 caracteres
- Registro de auditoría (`SESSION_REVIEWED`)

**Body (JSON) — Con evaluación:**
```json
{
    "observaciones": "[Calificación: 4/5 - Bueno]\nPaciente mostró buen desempeño en la fase de ingredientes. Dificultad con utensilios.",
    "id_paciente": 1
}
```

**Body (JSON) — Solo observaciones:**
```json
{
    "observaciones": "Paciente mostró mejoría en tiempo de reacción.",
    "id_paciente": 1
}
```

> `id_paciente` es opcional. Solo enviar si se necesita corregir/vincular manualmente.
>
> **Formato de Evaluación:** El campo `observaciones` puede incluir un prefijo `[Calificación: X/5 - Label]` donde X es 1-5 y Label es: Muy bajo, Bajo, Aceptable, Bueno o Excelente.

**Response 200:**
```json
{
    "success": true,
    "data": {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "observaciones_terapeuta": "[Calificación: 4/5 - Bueno]\nPaciente mostró buen desempeño...",
        "id_terapeuta_revisor": 2,
        "estado_revision": "REVISADA",
        "id_paciente_vinculado": 1
    }
}
```

**Response 400 — UUID inválido:**
```json
{
    "success": false,
    "error": "El ID de sesión debe ser un UUID válido",
    "code": "INVALID_UUID"
}
```

**Response 403 — Sin acceso:**
```json
{
    "success": false,
    "error": "Sin acceso a esta sesión. El paciente no está asignado a usted.",
    "code": "ACCESS_DENIED"
}
```

**Response 404 — Sesión no encontrada:**
```json
{
    "success": false,
    "error": "Sesión VR no encontrada",
    "code": "SESSION_NOT_FOUND"
}
```
```

---

## 7. Terapeutas

### 7.1 GET `/api/terapeutas`

> Obtener lista de todos los terapeutas.

- **Auth:** `Bearer {{token_terapeuta}}`
- **URL:** `{{base_url}}/api/terapeutas`

**Response 200:**
```json
{
    "success": true,
    "data": [
        {
            "id": 2,
            "nombre": "Carolina Mejía Restrepo",
            "especialidad": "Neuropsicología",
            "correo": "carolina.mejia@cerebroalfuego.com",
            "telefono": "3001234567",
            "email": "carolina.mejia@cerebroalfuego.com",
            "activo": true
        }
    ]
}
```

---

## 8. Dashboard - Estadísticas

### 8.1 GET `/api/dashboard/stats`

> Estadísticas generales del sistema.

- **Auth:** `Bearer {{token_terapeuta}}`
- **URL:** `{{base_url}}/api/dashboard/stats`

**Response 200:**
```json
{
    "success": true,
    "data": {
        "stats": {
            "total_pacientes": 13,
            "total_sesiones_vr": 51,
            "total_terapeutas": 5,
            "total_actividades": 3
        },
        "recentSessions": [
            {
                "id": "uuid",
                "activity_id": "tinto_easy_01",
                "participant_id": "1098765432",
                "fecha_inicio": "2026-02-08T09:00:00.000Z",
                "duracion_seg": 300,
                "errores": 2
            }
        ]
    }
}
```

---

## 9. VR Results - Unity

> Estos endpoints son utilizados por el videojuego Unity para enviar y consultar resultados de sesiones VR.

### 9.1 POST `/api/v1/session-results`

> Recibir y persistir el resultado completo de una sesión VR.

- **Auth:** `X-API-Key: {{unity_api_key}}`
- **URL:** `{{base_url}}/api/v1/session-results`

**Body (JSON):**
```json
{
    "schemaVersion": "1.0",
    "participantId": "1098765432",
    "activityId": "tinto_easy_01",
    "startedAtIso": "2026-02-08T09:00:00.000Z",
    "endedAtIso": "2026-02-08T09:05:00.000Z",
    "totalSeconds": 300,
    "summary": {
        "totalErrors": 2,
        "totalDrops": 1,
        "totalReleases": 3,
        "setsCompleted": 4
    },
    "sets": [
        {
            "setName": "Ingredients",
            "startedAtIso": "2026-02-08T09:00:00.000Z",
            "endedAtIso": "2026-02-08T09:01:15.000Z",
            "durationSeconds": 75,
            "blockedCount": 0,
            "dropsCount": 1,
            "releasesCount": 2,
            "errors": [
                {
                    "code": "WRONG_INGREDIENT",
                    "message": "Seleccionó ingrediente incorrecto",
                    "timestampIso": "2026-02-08T09:00:30.000Z"
                }
            ],
            "completion": {
                "coffeeAdded": false,
                "sugarAdded": false,
                "cupCoffeeAmount01": 0
            }
        },
        {
            "setName": "Utensils",
            "startedAtIso": "2026-02-08T09:01:15.000Z",
            "endedAtIso": "2026-02-08T09:02:30.000Z",
            "durationSeconds": 75,
            "blockedCount": 1,
            "dropsCount": 0,
            "releasesCount": 1,
            "errors": [
                {
                    "code": "STOVE_ON_NO_POT",
                    "message": "Encendió estufa sin olla",
                    "timestampIso": "2026-02-08T09:01:45.000Z"
                }
            ],
            "completion": {
                "coffeeAdded": false,
                "sugarAdded": false,
                "cupCoffeeAmount01": 0
            }
        },
        {
            "setName": "Preparation",
            "startedAtIso": "2026-02-08T09:02:30.000Z",
            "endedAtIso": "2026-02-08T09:03:45.000Z",
            "durationSeconds": 75,
            "blockedCount": 0,
            "dropsCount": 0,
            "releasesCount": 0,
            "errors": [],
            "completion": {
                "coffeeAdded": true,
                "sugarAdded": true,
                "cupCoffeeAmount01": 0.85
            }
        },
        {
            "setName": "Organization",
            "startedAtIso": "2026-02-08T09:03:45.000Z",
            "endedAtIso": "2026-02-08T09:05:00.000Z",
            "durationSeconds": 75,
            "blockedCount": 0,
            "dropsCount": 0,
            "releasesCount": 0,
            "errors": [],
            "completion": {
                "coffeeAdded": false,
                "sugarAdded": false,
                "cupCoffeeAmount01": 0
            }
        }
    ]
}
```

**Response 201:**
```json
{
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "createdAtIso": "2026-02-08T09:05:01.000Z"
}
```

**Response 400 – Campo faltante:**
```json
{
    "error": {
        "code": "MISSING_FIELD",
        "message": "Campo requerido faltante: participantId"
    }
}
```

**Response 401 – API Key inválida:**
```json
{
    "error": {
        "code": "UNAUTHORIZED",
        "message": "API Key inválida o no proporcionada"
    }
}
```

---

### 9.2 GET `/api/v1/session-results`

> Listar todas las sesiones VR almacenadas.

- **Auth:** `Bearer {{token_admin}}`
- **URL:** `{{base_url}}/api/v1/session-results`

**Query Params (opcionales):**

| Param | Tipo | Descripción |
|---|---|---|
| `participantId` | string | Filtrar por cédula del participante |
| `activityId` | string | Filtrar por ID de actividad |

**Response 200:**
```json
{
    "success": true,
    "data": [
        {
            "id": "uuid",
            "schema_version": "1.0",
            "participant_id": "1098765432",
            "activity_id": "tinto_easy_01",
            "started_at": "2026-02-08T09:00:00.000Z",
            "ended_at": "2026-02-08T09:05:00.000Z",
            "total_seconds": 300,
            "summary_total_errors": 2,
            "summary_total_drops": 1,
            "summary_total_releases": 3,
            "summary_sets_completed": 4,
            "id_paciente_vinculado": 1,
            "estado_revision": "PENDIENTE_REVISION",
            "created_at": "2026-02-08T09:05:01.000Z"
        }
    ],
    "count": 1
}
```

---

### 9.3 GET `/api/v1/session-results/:id`

> Obtener detalle completo de una sesión VR con todos sus sets y errores.

- **Auth:** `Bearer {{token_admin}}`
- **URL:** `{{base_url}}/api/v1/session-results/a1b2c3d4-e5f6-7890-abcd-ef1234567890`

**Response 200:**
```json
{
    "success": true,
    "data": {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "participant_id": "1098765432",
        "activity_id": "tinto_easy_01",
        "started_at": "2026-02-08T09:00:00.000Z",
        "ended_at": "2026-02-08T09:05:00.000Z",
        "total_seconds": 300,
        "summary_total_errors": 2,
        "summary_total_drops": 1,
        "summary_total_releases": 3,
        "summary_sets_completed": 4,
        "raw_payload": { "...payload original completo..." },
        "sets": [
            {
                "id": 1,
                "session_id": "a1b2c3d4-...",
                "set_name": "Ingredients",
                "started_at": "2026-02-08T09:00:00.000Z",
                "ended_at": "2026-02-08T09:01:15.000Z",
                "duration_seconds": 75,
                "blocked_count": 0,
                "drops_count": 1,
                "releases_count": 2,
                "errors_count": 1,
                "errors": [
                    {
                        "id": 1,
                        "set_id": 1,
                        "code": "WRONG_INGREDIENT",
                        "message": "Seleccionó ingrediente incorrecto",
                        "occurred_at": "2026-02-08T09:00:30.000Z",
                        "objeto_contexto": null
                    }
                ],
                "returnedObjects": []
            },
            {
                "set_name": "Utensils",
                "...": "..."
            },
            {
                "set_name": "Preparation",
                "...": "..."
            },
            {
                "set_name": "Organization",
                "...": "..."
            }
        ]
    }
}
```

**Response 404:**
```json
{
    "error": {
        "code": "NOT_FOUND",
        "message": "Sesión no encontrada"
    }
}
```

---

### 9.4 GET `/api/v1/patients/lookup`

> Buscar paciente por cédula (usado por Unity antes de iniciar sesión VR).

- **Auth:** `X-API-Key: {{unity_api_key}}`
- **URL:** `{{base_url}}/api/v1/patients/lookup?identificacion=1098765432`

**Query Params:**

| Param | Tipo | Requerido | Descripción |
|---|---|---|---|
| `identificacion` | string | Sí | Cédula/número de identificación |

**Response 200 – Encontrado:**
```json
{
    "found": true,
    "participant_id": "1098765432",
    "display_name": "María E.",
    "internal_id": 1
}
```

**Response 200 – No encontrado:**
```json
{
    "found": false,
    "participant_id": null,
    "display_name": null
}
```

**Response 401 – Sin API Key:**
```json
{
    "error": {
        "code": "UNAUTHORIZED",
        "message": "API Key inválida o no proporcionada"
    }
}
```

---

## 10. Auditoría (Solo Superadmin)

### 10.1 GET `/api/audit`

> Listar eventos de auditoría con paginación y filtros.

- **Auth:** `Bearer {{token_admin}}`
- **URL:** `{{base_url}}/api/audit`

**Query Params (opcionales):**

| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `limit` | integer | 50 | Cantidad de resultados |
| `offset` | integer | 0 | Posición de inicio |
| `tipo` | string | — | Filtrar por tipo de evento |
| `mes` | integer | — | Mes (1-12) |
| `anio` | integer | — | Año |

**Ejemplo:** `{{base_url}}/api/audit?tipo=LOGIN_SUCCESS&mes=2&anio=2026&limit=20`

**Response 200:**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "tipo_evento": "LOGIN_SUCCESS",
            "tipo_label": "Inicio de sesión exitoso",
            "id_usuario": 1,
            "actor_email": "admin@example.com",
            "actor_nombre": null,
            "ip_origen": "::1",
            "detalle": {
                "email": "admin@example.com"
            },
            "detalle_texto": "email: admin@example.com",
            "timestamp": "2026-02-08T10:00:00.000Z"
        }
    ],
    "pagination": {
        "total": 45,
        "limit": 50,
        "offset": 0
    }
}
```

---

### 10.2 GET `/api/audit/user/:id`

> Obtener eventos de auditoría de un usuario específico.

- **Auth:** `Bearer {{token_admin}}`
- **URL:** `{{base_url}}/api/audit/user/1`

**Query Params:**

| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `limit` | integer | 50 | Cantidad de resultados |

**Response 200:**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "tipo_evento": "LOGIN_SUCCESS",
            "tipo_label": "Inicio de sesión exitoso",
            "ip_origen": "::1",
            "detalle": { "email": "admin@example.com" },
            "timestamp": "2026-02-08T10:00:00.000Z"
        }
    ]
}
```

---

### 10.3 GET `/api/audit/types`

> Obtener todos los tipos de eventos registrados con su conteo.

- **Auth:** `Bearer {{token_admin}}`
- **URL:** `{{base_url}}/api/audit/types`

**Response 200:**
```json
{
    "success": true,
    "data": [
        { "tipo_evento": "LOGIN_SUCCESS", "tipo_label": "Inicio de sesión exitoso", "count": 15 },
        { "tipo_evento": "LOGIN_FAILED", "tipo_label": "Intento de inicio de sesión fallido", "count": 8 },
        { "tipo_evento": "PATIENT_CREATED", "tipo_label": "Paciente creado", "count": 5 },
        { "tipo_evento": "TERAPEUTA_CREATED", "tipo_label": "Terapeuta creado", "count": 3 },
        { "tipo_evento": "PASSWORD_CHANGE", "tipo_label": "Cambio de contraseña", "count": 2 },
        { "tipo_evento": "USER_UPDATED", "tipo_label": "Usuario actualizado", "count": 2 },
        { "tipo_evento": "USER_DEACTIVATED", "tipo_label": "Usuario desactivado", "count": 1 },
        { "tipo_evento": "USER_ACTIVATED", "tipo_label": "Usuario activado", "count": 1 },
        { "tipo_evento": "PATIENT_UPDATED", "tipo_label": "Paciente actualizado", "count": 3 },
        { "tipo_evento": "PATIENT_ASSIGNED", "tipo_label": "Paciente asignado", "count": 2 },
        { "tipo_evento": "PATIENT_REASSIGNED", "tipo_label": "Paciente reasignado", "count": 1 }
    ]
}
```

---

### 10.4 GET `/api/audit/export`

> Exportar eventos de auditoría en formato CSV.

- **Auth:** `Bearer {{token_admin}}`
- **URL:** `{{base_url}}/api/audit/export?mes=2&anio=2026`

**Query Params (opcionales):**

| Param | Tipo | Descripción |
|---|---|---|
| `mes` | integer | Mes (1-12) |
| `anio` | integer | Año |

**Response 200:**

- **Content-Type:** `text/csv; charset=utf-8`
- **Content-Disposition:** `attachment; filename="auditoria_2_2026.csv"`

```csv
"ID","Fecha","Tipo","Usuario","IP","Detalles"
"1","8/2/2026, 10:00:00 a. m.","Inicio de sesión exitoso","admin@example.com","::1","{""email"":""admin@example.com""}"
```

> **Nota:** En Postman, guardar la respuesta como archivo `.csv` usando "Save Response > Save to File".

---

## 11. Códigos de Error

### Códigos HTTP

| Código | Descripción |
|---|---|
| `200` | Operación exitosa |
| `201` | Recurso creado |
| `400` | Datos inválidos / Validación fallida |
| `401` | No autenticado / Token inválido |
| `403` | Sin permisos (rol insuficiente) |
| `404` | Recurso no encontrado |
| `422` | Validación semántica fallida |
| `423` | Cuenta bloqueada |
| `500` | Error interno del servidor |

### Códigos de Error Personalizados

| Código | Contexto | Descripción |
|---|---|---|
| `ACCOUNT_LOCKED` | Login | Cuenta bloqueada por intentos fallidos |
| `SUPERADMIN_EXISTS` | Setup | Ya existe un Superadmin |
| `THERAPIST_HAS_PATIENTS` | Toggle estado | No se puede desactivar terapeuta con pacientes |
| `MISSING_FIELD` | VR Results | Campo requerido faltante |
| `INVALID_SETS` | VR Results | Array de sets inválido |
| `UNAUTHORIZED` | Unity | API Key inválida |
| `NOT_FOUND` | VR Results | Sesión no encontrada |
| `DB_ERROR` | General | Error de base de datos |
| `CONFIG_ERROR` | Unity | API Key no configurada en servidor |

---

## 12. Credenciales de Prueba

### Superadmin
```
Email:    admin@example.com
Password: ReplaceWithStrongPassword123!
```

### Terapeutas
```
Email:    carolina.mejia@cerebroalfuego.com
Password: Terapeuta@123

Email:    alejandro.restrepo@cerebroalfuego.com
Password: Terapeuta@123

Email:    valentina.castro@cerebroalfuego.com
Password: Terapeuta@123
```

### API Key de Unity
```
Header:   X-API-Key
Value:    YOUR_UNITY_API_KEY
```

### Política de Contraseña
- Mínimo **10 caracteres**
- Al menos **1 mayúscula** (A-Z)
- Al menos **1 minúscula** (a-z)
- Al menos **1 número** (0-9)
- Al menos **1 símbolo** (`@$!%*?&`)

---

## Resumen de Endpoints

| # | Método | Endpoint | Auth | Rol |
|---|---|---|---|---|
| 1 | GET | `/health` | — | — |
| 2 | GET | `/api/status` | — | — |
| 3 | GET | `/api/db-status` | — | — |
| 4 | POST | `/api/auth/login` | — | — |
| 5 | GET | `/api/auth/check-setup` | — | — |
| 6 | POST | `/api/auth/setup` | — | — |
| 7 | GET | `/api/auth/me` | JWT | Cualquiera |
| 8 | POST | `/api/auth/change-password` | JWT | Cualquiera |
| 9 | POST | `/api/auth/forgot-password` | — | — |
| 10 | POST | `/api/auth/reset-password` | — | — |
| 11 | POST | `/api/auth/request-verification-code` | JWT | Cualquiera |
| 12 | GET | `/api/usuarios` | JWT | SUPERADMIN |
| 13 | POST | `/api/usuarios/terapeuta` | JWT | SUPERADMIN |
| 14 | PUT | `/api/usuarios/:id` | JWT | SUPERADMIN* |
| 15 | PUT | `/api/usuarios/:id/toggle-estado` | JWT | SUPERADMIN |
| 16 | POST | `/api/usuarios/:id/reset-password` | JWT | SUPERADMIN |
| 17 | GET | `/api/patients` | JWT | TERAPEUTA+ |
| 18 | POST | `/api/patients` | JWT | TERAPEUTA+ |
| 19 | GET | `/api/patients/:id` | JWT | TERAPEUTA+ |
| 20 | PUT | `/api/patients/:id` | JWT | TERAPEUTA+ |
| 21 | PUT | `/api/patients/:id/toggle-status` | JWT | TERAPEUTA+ |
| 22 | POST | `/api/patients/:id/assign` | JWT | SUPERADMIN |
| 23 | GET | `/api/patients/:id/report` | JWT | TERAPEUTA+ |
| 24 | GET | `/api/sessions` | JWT | TERAPEUTA+ |
| 25 | PUT | `/api/sessions/:id` | JWT | TERAPEUTA+ (ownership) |
| 26 | GET | `/api/terapeutas` | — | — |
| 27 | GET | `/api/dashboard/stats` | — | — |
| 28 | GET | `/api/audit` | JWT | SUPERADMIN |
| 29 | GET | `/api/audit/user/:id` | JWT | SUPERADMIN |
| 30 | GET | `/api/audit/types` | JWT | SUPERADMIN |
| 31 | GET | `/api/audit/export` | JWT | SUPERADMIN |
| 32 | POST | `/api/v1/session-results` | API Key | Unity |
| 33 | GET | `/api/v1/session-results` | JWT | Cualquiera |
| 34 | GET | `/api/v1/session-results/:id` | JWT | Cualquiera |
| 35 | GET | `/api/v1/patients/lookup` | API Key | Unity |

> **SUPERADMIN***: También permite al propio usuario editar su perfil.  
> **TERAPEUTA+**: SUPERADMIN también tiene acceso, pero el terapeuta solo ve sus pacientes asignados.

---

*Actualizado el 5 de julio de 2026 — Versión 1.8.6*


