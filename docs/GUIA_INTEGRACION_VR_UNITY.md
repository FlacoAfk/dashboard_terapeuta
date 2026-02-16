# Guía de Integración: API Backend ↔ Videojuego VR (Unity)

**Proyecto:** Cerebro al Fuego — Cocina VR  
**Última actualización:** 2026-02-14  
**URL Base del Backend:** `http://localhost:3001` (desarrollo local)

---

## Autenticación para Unity

Todos los endpoints que consume el videojuego usan **API Key** en el header HTTP.

```
Header: X-API-Key: 5f8a9b2c3d4e5f60718293a4b5c6d7e8
```

> **Importante:** Esta API Key debe estar configurada igual en ambos lados (backend `.env` y Unity).  
> Si la key es inválida o no se envía, todos los endpoints responden **401 Unauthorized**.

---

## Flujo Completo de Integración

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FLUJO COMPLETO DE UNA SESIÓN                     │
│                                                                     │
│  ┌──────────────┐                         ┌──────────────────┐      │
│  │    PANEL      │                         │   VIDEOJUEGO VR  │      │
│  │  TERAPEUTA    │                         │     (UNITY)      │      │
│  └──────┬───────┘                         └────────┬─────────┘      │
│         │                                          │                │
│    1. Terapeuta selecciona                          │                │
│       receta + participante                        │                │
│         │                                          │                │
│    2. POST /api/sessions ──────► Backend            │                │
│       (crea sesión ACTIVE)       genera            │                │
│         │                        token              │                │
│         │                        "ABC123"           │                │
│    3. Terapeuta le da el                           │                │
│       token al paciente ─────────────────────────► │                │
│       (verbal o pantalla)                          │                │
│                                               4. Paciente ingresa   │
│                                                  token "ABC123"     │
│                                                    │                │
│                                               5. GET /sessions/     │
│                                                  by-token/ABC123    │
│                                                    │                │
│                                               6. Recibe recipe_id   │
│                                                  → "tinto"          │
│                                                    │                │
│                                               7. Carga la receta    │
│                                                  dinámicamente      │
│                                                    │                │
│                                               8. Paciente juega     │
│                                                  la sesión VR       │
│                                                    │                │
│                                               9. PUT /sessions/     │
│                                                  {id}/finish        │
│                                                  (marca FINISHED)   │
│                                                    │                │
│                                              10. POST /v1/          │
│                                                  session-results    │
│                                                  (envía resultados) │
│                                                    │                │
│  ┌──────────────┐                                  │                │
│  │    PANEL      │◄──── Terapeuta revisa ───────────┘                │
│  │  TERAPEUTA    │      resultados en el                            │
│  └──────────────┘      dashboard                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Endpoints para Unity (4 endpoints)

### Resumen Rápido

| #  | Método | Endpoint                           | ¿Cuándo usarlo?                        |
|----|--------|------------------------------------|-----------------------------------------|
| 1  | GET    | `/api/sessions/by-token/{token}`   | Al inicio: paciente ingresa el token    |
| 2  | PUT    | `/api/sessions/{id}/finish`        | Al terminar la receta                   |
| 3  | POST   | `/api/v1/session-results`          | Al finalizar: enviar métricas/resultados|
| 4  | GET    | `/api/v1/patients/lookup?identificacion=X` | Opcional: verificar si el paciente existe |

---

## Endpoint 1: Consultar sesión por token

> **¿Cuándo?** Cuando el paciente ingresa el código de 6 caracteres en la pantalla de inicio del VR.

```
GET /api/sessions/by-token/{token}
```

**Headers:**
```
X-API-Key: 5f8a9b2c3d4e5f60718293a4b5c6d7e8
```

**Ejemplo de petición:**
```
GET http://localhost:3001/api/sessions/by-token/ABC123
```

**Respuesta exitosa (200):**
```json
{
  "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "participant_code": "JPPE1234",
  "recipe_id": "tinto",
  "status": "ACTIVE"
}
```

**¿Qué hacer con la respuesta?**
- Usar `recipe_id` para cargar la receta correspondiente (por ahora solo `"tinto"`)
- Guardar `session_id` en memoria para usarlo en los endpoints 2 y 3
- Guardar `participant_code` para usarlo como `participantId` en el endpoint 3

**Errores posibles:**

| Código | Significado | Qué hacer en Unity |
|--------|-------------|--------------------|
| 200 | Token válido, sesión activa | Cargar la receta |
| 401 | API Key inválida | Verificar que el header X-API-Key sea correcto |
| 404 | Token no encontrado o sesión no activa | Mostrar mensaje "Código inválido o sesión expirada" |

**Ejemplo en C# (Unity - UnityWebRequest):**
```csharp
using UnityEngine;
using UnityEngine.Networking;
using System.Collections;

[System.Serializable]
public class SessionResponse
{
    public string session_id;
    public string participant_code;
    public string recipe_id;
    public string status;
}

public IEnumerator GetSessionByToken(string token)
{
    string url = $"http://localhost:3001/api/sessions/by-token/{token}";
    
    using (UnityWebRequest request = UnityWebRequest.Get(url))
    {
        request.SetRequestHeader("X-API-Key", "5f8a9b2c3d4e5f60718293a4b5c6d7e8");
        
        yield return request.SendWebRequest();
        
        if (request.result == UnityWebRequest.Result.Success)
        {
            SessionResponse session = JsonUtility.FromJson<SessionResponse>(request.downloadHandler.text);
            Debug.Log($"Receta a cargar: {session.recipe_id}");
            Debug.Log($"Session ID: {session.session_id}");
            // Guardar session_id y participant_code para después
            // Cargar la receta según session.recipe_id
        }
        else if (request.responseCode == 404)
        {
            Debug.Log("Token inválido o sesión no activa");
            // Mostrar mensaje al usuario
        }
        else
        {
            Debug.LogError($"Error: {request.responseCode}");
        }
    }
}
```

---

## Endpoint 2: Finalizar sesión

> **¿Cuándo?** Cuando el paciente termina la receta (o sale del juego). Esto marca la sesión como `FINISHED` para que el terapeuta pueda crear una nueva.

```
PUT /api/sessions/{id}/finish
```

**Headers:**
```
X-API-Key: 5f8a9b2c3d4e5f60718293a4b5c6d7e8
Content-Type: application/json
```

**Ejemplo de petición:**
```
PUT http://localhost:3001/api/sessions/a1b2c3d4-e5f6-7890-abcd-ef1234567890/finish
```

> El `{id}` es el `session_id` que recibiste en el Endpoint 1.

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "FINISHED"
}
```

**Errores posibles:**

| Código | Significado | Qué hacer en Unity |
|--------|-------------|--------------------|
| 200 | Sesión finalizada correctamente | Continuar al envío de resultados |
| 401 | API Key inválida | Verificar header |
| 404 | Sesión no encontrada o ya estaba FINISHED | Ignorar (ya estaba cerrada) |

**Ejemplo en C# (Unity):**
```csharp
public IEnumerator FinishSession(string sessionId)
{
    string url = $"http://localhost:3001/api/sessions/{sessionId}/finish";
    
    using (UnityWebRequest request = UnityWebRequest.Put(url, "{}"))
    {
        request.SetRequestHeader("X-API-Key", "5f8a9b2c3d4e5f60718293a4b5c6d7e8");
        request.SetRequestHeader("Content-Type", "application/json");
        
        yield return request.SendWebRequest();
        
        if (request.result == UnityWebRequest.Result.Success)
        {
            Debug.Log("Sesión finalizada correctamente");
        }
    }
}
```

---

## Endpoint 3: Enviar resultados de la sesión VR

> **¿Cuándo?** Al finalizar la sesión, después de marcarla como FINISHED. Envía todas las métricas del juego.

```
POST /api/v1/session-results
```

**Headers:**
```
X-API-Key: 5f8a9b2c3d4e5f60718293a4b5c6d7e8
Content-Type: application/json
```

**Body completo (JSON):**
```json
{
  "schemaVersion": "1.0",
  "participantId": "JPPE1234",
  "activityId": "tinto",
  "startedAtIso": "2026-02-14T10:00:00.000Z",
  "endedAtIso": "2026-02-14T10:05:30.000Z",
  "totalSeconds": 330.5,
  "summary": {
    "totalErrors": 3,
    "totalDrops": 1,
    "totalReleases": 8,
    "setsCompleted": 4
  },
  "sets": [
    {
      "setName": "Hervir Agua",
      "startedAtIso": "2026-02-14T10:00:00.000Z",
      "endedAtIso": "2026-02-14T10:01:20.000Z",
      "durationSeconds": 80.0,
      "blockedCount": 0,
      "dropsCount": 0,
      "releasesCount": 2,
      "errorsCount": 1,
      "errors": [
        {
          "code": "WRONG_OBJECT",
          "message": "Intentó usar sal en vez de azúcar",
          "timeIso": "2026-02-14T10:00:45.000Z",
          "context": "azucarera"
        }
      ]
    },
    {
      "setName": "Agregar Café",
      "startedAtIso": "2026-02-14T10:01:20.000Z",
      "endedAtIso": "2026-02-14T10:02:50.000Z",
      "durationSeconds": 90.0,
      "blockedCount": 1,
      "dropsCount": 1,
      "releasesCount": 3,
      "errorsCount": 2,
      "errors": [
        {
          "code": "DROP",
          "message": "Se cayó la cuchara",
          "timeIso": "2026-02-14T10:02:00.000Z",
          "context": "cuchara"
        },
        {
          "code": "WRONG_SEQUENCE",
          "message": "Agregó café antes del agua",
          "timeIso": "2026-02-14T10:02:15.000Z",
          "context": "café_molido"
        }
      ]
    },
    {
      "setName": "Colar Café",
      "startedAtIso": "2026-02-14T10:02:50.000Z",
      "endedAtIso": "2026-02-14T10:04:00.000Z",
      "durationSeconds": 70.0,
      "blockedCount": 0,
      "dropsCount": 0,
      "releasesCount": 2,
      "errorsCount": 0,
      "errors": []
    },
    {
      "setName": "Servir",
      "startedAtIso": "2026-02-14T10:04:00.000Z",
      "endedAtIso": "2026-02-14T10:05:30.000Z",
      "durationSeconds": 90.5,
      "blockedCount": 0,
      "dropsCount": 0,
      "releasesCount": 1,
      "errorsCount": 0,
      "errors": []
    }
  ]
}
```

**Campos requeridos del body:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `schemaVersion` | string | No | Versión del esquema (ej: "1.0") |
| `participantId` | string | **Sí** | Código del participante (la cédula/identificación del paciente) |
| `activityId` | string | **Sí** | ID de la receta/actividad (ej: "tinto") |
| `startedAtIso` | string (ISO 8601) | **Sí** | Fecha/hora de inicio de la sesión |
| `endedAtIso` | string (ISO 8601) | **Sí** | Fecha/hora de fin de la sesión |
| `totalSeconds` | number | **Sí** | Duración total en segundos |
| `summary` | object | No | Resumen global (se calcula automáticamente si no se envía) |
| `sets` | array | **Sí** | Array de sets/etapas (mínimo 1) |

**Campos de cada set:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `setName` | string | **Sí** | Nombre de la etapa (ej: "Hervir Agua") |
| `startedAtIso` | string | **Sí** | Inicio de la etapa |
| `endedAtIso` | string | **Sí** | Fin de la etapa |
| `durationSeconds` | number | No | Duración en segundos |
| `blockedCount` | number | No | Veces que el paciente se bloqueó |
| `dropsCount` | number | No | Objetos que se le cayeron |
| `releasesCount` | number | No | Objetos soltados correctamente |
| `errorsCount` | number | No | Cantidad de errores |
| `errors` | array | No | Detalle de cada error |

**Campos de cada error:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `code` | string | **Sí** | Código del error (ej: "WRONG_OBJECT", "DROP", "WRONG_SEQUENCE") |
| `message` | string | No | Descripción legible del error |
| `timeIso` | string | **Sí** | Momento exacto del error (ISO 8601) |
| `context` | string | No | Objeto o elemento relacionado al error |

**Respuesta exitosa (201):**
```json
{
  "id": "uuid-de-la-sesion-guardada",
  "createdAtIso": "2026-02-14T10:05:31.000Z"
}
```

**Errores posibles:**

| Código | Significado | Qué hacer en Unity |
|--------|-------------|--------------------|
| 201 | Resultados guardados exitosamente | Mostrar pantalla de fin |
| 400 | Campos requeridos faltantes | Verificar que no falte `participantId`, `activityId`, etc. |
| 401 | API Key inválida | Verificar header |
| 500 | Error interno del servidor | Reintentar o guardar localmente |

**Nota sobre vinculación automática:** Si el `participantId` coincide con la `identificacion` (cédula) de un paciente en la BD, la sesión se vincula automáticamente al paciente. Esto permite que el terapeuta vea los resultados en su dashboard.

**Ejemplo en C# (Unity):**
```csharp
[System.Serializable]
public class SessionResultPayload
{
    public string schemaVersion;
    public string participantId;
    public string activityId;
    public string startedAtIso;
    public string endedAtIso;
    public float totalSeconds;
    public SummaryData summary;
    public SetData[] sets;
}

[System.Serializable]
public class SummaryData
{
    public int totalErrors;
    public int totalDrops;
    public int totalReleases;
    public int setsCompleted;
}

[System.Serializable]
public class SetData
{
    public string setName;
    public string startedAtIso;
    public string endedAtIso;
    public float durationSeconds;
    public int blockedCount;
    public int dropsCount;
    public int releasesCount;
    public int errorsCount;
    public ErrorData[] errors;
}

[System.Serializable]
public class ErrorData
{
    public string code;
    public string message;
    public string timeIso;
    public string context;
}

public IEnumerator SendSessionResults(SessionResultPayload payload)
{
    string url = "http://localhost:3001/api/v1/session-results";
    string jsonBody = JsonUtility.ToJson(payload);
    
    using (UnityWebRequest request = new UnityWebRequest(url, "POST"))
    {
        byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(jsonBody);
        request.uploadHandler = new UploadHandlerRaw(bodyRaw);
        request.downloadHandler = new DownloadHandlerBuffer();
        request.SetRequestHeader("Content-Type", "application/json");
        request.SetRequestHeader("X-API-Key", "5f8a9b2c3d4e5f60718293a4b5c6d7e8");
        
        yield return request.SendWebRequest();
        
        if (request.result == UnityWebRequest.Result.Success)
        {
            Debug.Log($"Resultados enviados: {request.downloadHandler.text}");
        }
        else
        {
            Debug.LogError($"Error enviando resultados: {request.responseCode}");
            // Considerar guardar localmente para reintento
        }
    }
}
```

---

## Endpoint 4: Verificar si un paciente existe (opcional)

> **¿Cuándo?** Antes de iniciar la sesión, si se quiere validar que la cédula del paciente es válida.

```
GET /api/v1/patients/lookup?identificacion={cedula}
```

**Headers:**
```
X-API-Key: 5f8a9b2c3d4e5f60718293a4b5c6d7e8
```

**Ejemplo de petición:**
```
GET http://localhost:3001/api/v1/patients/lookup?identificacion=1234567890
```

**Respuesta si existe (200):**
```json
{
  "found": true,
  "participant_id": "1234567890",
  "display_name": "Juan P.",
  "internal_id": 14
}
```

**Respuesta si NO existe (200):**
```json
{
  "found": false,
  "participant_id": null,
  "display_name": null
}
```

> **Nota de privacidad:** El `display_name` solo muestra el primer nombre y la inicial del segundo para proteger la identidad del paciente.

---

## Flujo Recomendado en Unity (Paso a Paso)

```
┌─────────────────────────────────────────────────────┐
│              INICIO DEL JUEGO VR                     │
│                                                      │
│  1. Mostrar campo de texto: "Ingrese código de       │
│     sesión" (el token de 6 caracteres)               │
│                                                      │
│  2. El paciente escribe: ABC123                      │
│                                                      │
│  3. Llamar: GET /api/sessions/by-token/ABC123        │
│     ├─ 200 OK → Guardar session_id, recipe_id       │
│     │           → Cargar la receta según recipe_id   │
│     │           → Empezar a registrar métricas       │
│     └─ 404 → Mostrar "Código inválido"              │
│                                                      │
│  4. El paciente realiza la actividad de cocina       │
│     → Registrar: errores, drops, tiempos, etc.       │
│                                                      │
│  5. Al terminar la receta:                           │
│     a) Llamar: PUT /api/sessions/{session_id}/finish │
│     b) Llamar: POST /api/v1/session-results          │
│        con todos los datos recopilados               │
│                                                      │
│  6. Mostrar pantalla de fin:                         │
│     "¡Sesión completada! Resultados enviados."       │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## Recetas Disponibles

Por ahora solo hay una receta. Cuando se agreguen más, el campo `recipe_id` tendrá otros valores.

| recipe_id | Nombre | Descripción |
|-----------|--------|-------------|
| `tinto` | Tinto (Café) | Preparación de café tinto colombiano |

> **Para agregar nuevas recetas:** Solo es necesario que Unity soporte el nuevo `recipe_id` como string. No se requiere cambio en el backend. El terapeuta seleccionará la receta desde el panel y el `recipe_id` llegará automáticamente al VR.

---

## Códigos de Error Universales

Todos los endpoints para Unity pueden devolver estos errores generales:

| HTTP Code | Cuándo ocurre | Qué hacer |
|-----------|---------------|-----------|
| **401** | API Key faltante o incorrecta | Verificar el header `X-API-Key` |
| **400** | Datos faltantes o inválidos | Revisar el body/parámetros enviados |
| **404** | Recurso no encontrado | El token/sesión no existe o ya no está activa |
| **500** | Error interno del servidor | Reintentar después de unos segundos |

**Formato estándar de error:**
```json
{
  "error": {
    "code": "NOMBRE_DEL_ERROR",
    "message": "Descripción legible del error"
  }
}
```

---

## Pruebas Rápidas con cURL

Puedes probar los endpoints desde la terminal antes de implementarlos en Unity:

**1. Consultar sesión por token:**
```bash
curl -H "X-API-Key: 5f8a9b2c3d4e5f60718293a4b5c6d7e8" \
  http://localhost:3001/api/sessions/by-token/ABC123
```

**2. Finalizar sesión:**
```bash
curl -X PUT \
  -H "X-API-Key: 5f8a9b2c3d4e5f60718293a4b5c6d7e8" \
  -H "Content-Type: application/json" \
  http://localhost:3001/api/sessions/{session_id}/finish
```

**3. Enviar resultados:**
```bash
curl -X POST \
  -H "X-API-Key: 5f8a9b2c3d4e5f60718293a4b5c6d7e8" \
  -H "Content-Type: application/json" \
  -d '{
    "participantId": "JPPE1234",
    "activityId": "tinto",
    "startedAtIso": "2026-02-14T10:00:00Z",
    "endedAtIso": "2026-02-14T10:05:00Z",
    "totalSeconds": 300,
    "sets": [{
      "setName": "Hervir Agua",
      "startedAtIso": "2026-02-14T10:00:00Z",
      "endedAtIso": "2026-02-14T10:05:00Z",
      "durationSeconds": 300,
      "errors": []
    }]
  }' \
  http://localhost:3001/api/v1/session-results
```

**4. Verificar paciente:**
```bash
curl -H "X-API-Key: 5f8a9b2c3d4e5f60718293a4b5c6d7e8" \
  "http://localhost:3001/api/v1/patients/lookup?identificacion=1234567890"
```

---

## Notas Importantes

1. **El `participantId` del endpoint 3 debe ser la cédula/identificación del paciente** para que se vincule automáticamente en el dashboard del terapeuta.

2. **El `activityId` del endpoint 3 debería coincidir con el `recipe_id`** de la sesión para mantener consistencia.

3. **Las fechas siempre en formato ISO 8601** con timezone: `"2026-02-14T10:00:00.000Z"` (la Z indica UTC).

4. **El token de sesión es case-insensitive** — si el paciente escribe `abc123` o `ABC123`, funciona igual.

5. **Solo puede existir una sesión ACTIVE por participante.** Si el terapeuta intenta crear otra, el backend responde 409 con el token existente.

6. **El backend está en el puerto 3001.** Para producción la URL cambiará — se coordinará cuando sea el momento del deploy.
