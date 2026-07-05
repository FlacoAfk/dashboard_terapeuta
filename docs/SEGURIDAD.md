# Dashboard Terapeuta — Modelo de Seguridad

> **Versión**: 2.0 · **Fecha**: 2026-05-05

---

## Resumen

El sistema implementa **defensa en profundidad** con 5 capas: transporte, autenticación, autorización, hardening HTTP, y validación de entrada. No se delega autenticación a Supabase Auth — se usa JWT propio para control total.

---

## 1. Cadena de Seguridad

```
Capa 1: Transporte        → HTTPS (TLS 1.3) en Cloud Run y Vercel
Capa 2: Cabeceras HTTP    → Helmet (CSP, HSTS, X-Frame-Options, etc.)
Capa 3: Autenticación     → JWT con accessToken (15 min) + refreshToken (7 días)
Capa 4: Autorización      → RBAC (SUPERADMIN, TERAPEUTA) + property-level ownership
Capa 5: Validación        → express-validator en cada endpoint
```

---

## 2. Autenticación

### 2.1 Flujo JWT

1. **Login**: Cliente envía `{ email, password }` a `POST /api/auth/login`
2. **Verificación**: Backend busca usuario por email, compara bcrypt hash
3. **Emisión**: Backend firma `accessToken` (15 min) y `refreshToken` (7 días)
4. **Uso**: Cliente incluye `Authorization: Bearer <accessToken>` en cada request
5. **Refresh**: Cuando accessToken expira, `POST /api/auth/refresh` con refreshToken

### 2.2 Estructura del JWT

| Campo | Valor |
|---|---|
| `iss` | `dashboard-terapeuta` |
| `sub` | `usuario.id` |
| `rol` | `SUPERADMIN` o `TERAPEUTA` |
| `iat` | Fecha de emisión |
| `exp` | Fecha de expiración |

### 2.3 Protección contra Ataques

| Ataque | Defensa |
|---|---|
| **Fuerza Bruta** | Bloqueo de cuenta tras **5 intentos fallidos** en ventana de 15 minutos |
| **Token Robado** | accessToken de corta duración (15 min); refreshToken con rotación |
| **Timing Attack** | bcrypt.compare() es time-constant |
| **Rainbow Tables** | bcrypt con salt único por contraseña (10 rounds) |

---

## 3. Autorización (RBAC)

### 3.1 Matriz de Permisos

| Acción | SUPERADMIN | TERAPEUTA |
|---|---|---|
| Ver todos los pacientes | ✅ | ❌ (solo asignados) |
| Crear pacientes | ✅ | ✅ |
| Editar pacientes | ✅ | ✅ (solo propios) |
| Archivar pacientes | ✅ | ✅ (solo propios) |
| Asignar pacientes | ✅ | ❌ |
| Crear sesiones VR | ✅ | ✅ |
| Revisar sesiones VR | ✅ | ✅ (solo de sus pacientes) |
| Gestionar terapeutas | ✅ | ❌ |
| Ver auditoría | ✅ | ❌ |

### 3.2 Propiedad a Nivel de Datos

El backend aplica **property-level filtering**: aunque un TERAPEUTA intente acceder al endpoint de un paciente que no le pertenece, el middleware resuelve el ID del terapeuta desde el JWT y filtra las queries:

```javascript
// Pacientes de un terapeuta
const pacientes = await supabase
    .from('pacientes')
    .select('*, terapeuta_paciente!inner(*)')
    .eq('terapeuta_paciente.id_terapeuta', req.user.terapeutaId);
```

---

## 4. Hardening HTTP

### 4.1 Helmet Configuration

| Cabecera | Valor | Propósito |
|---|---|---|
| `Content-Security-Policy` | `default-src 'self'` | Previene XSS |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Fuerza HTTPS |
| `X-Frame-Options` | `DENY` | Previene clickjacking |
| `X-Content-Type-Options` | `nosniff` | Previene MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controla fuga de referrer |

### 4.2 Rate Limiting

| Ruta | Límite | Ventana |
|---|---|---|
| `/api/auth/login` | 10 req | 15 min |
| Resto de endpoints | 300 req | 15 min |
| Health checks | Sin límite | - |

### 4.3 CORS

```javascript
cors({
    origin: [
        'https://frontend-one-gold-22.vercel.app',
        'https://*.flacoafks-projects.vercel.app',  // previews de Vercel
        'http://localhost:5173',                     // desarrollo local
        'http://localhost:5174',
        'app://.'                                     // Electron
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
});
```

---

## 5. Validación de Entrada

### 5.1 Express Validator

Cada endpoint declara reglas de validación explícitas:

```javascript
router.post('/login', [
    body('email').isEmail().normalizeEmail().trim(),
    body('password').isLength({ min: 8 }).trim()
], validate, controller.login);
```

### 5.2 Sanitización

- `normalizeEmail()` en emails
- `trim()` en todos los strings
- Límite de tamaño: `express.json({ limit: '2mb' })`
- Escape HTML en descripciones (JSON.stringify en lugar de HTML rendering)

---

## 6. Unity VR API Key

El endpoint de ingesta VR (`POST /api/vr/sessions`) no usa JWT. En su lugar, requiere:

```
X-API-Key: <UNITY_API_KEY>
```

Esta key se almacena como variable de entorno en Cloud Run y se valida en cada request. Si la key no coincide, se retorna `401 Unauthorized`.

---

## 7. Gestión de Secretos

| Secreto | Ubicación |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Cloud Run Secret Manager |
| `JWT_SECRET` | Cloud Run Secret Manager |
| `UNITY_API_KEY` | Cloud Run Secret Manager |
| `SMTP_PASS` | Cloud Run Secret Manager |
| `SUPERADMIN_PASSWORD` | Cloud Run Secret Manager |
| `REDIS_PASSWORD` | Cloud Run Secret Manager |

**Regla**: NUNCA en código fuente ni en `docker-compose.yml`. Solo `.env.example` con placeholders.

---

## 8. Seguridad en la Base de Datos

- **Row Level Security (RLS)**: Desactivada. Toda la lógica de acceso se controla desde la API con el service_role key.
- **Conexión**: Solo a través del SDK de Supabase con HTTPS.
- **Backups**: Automáticos en Supabase (gratuito: 7 días de PITR en plan free).
- **No exposición directa**: La API REST de Supabase no se expone al frontend. Todo pasa por el backend de Cloud Run.

---

## 📁 Documentos Relacionados

- [Requerimientos](./REQUERIMIENTOS.md)
- [Arquitectura Técnica](./ARQUITECTURA.md)
- [Modelo de Datos](./MODELO_DATOS.md)
- [Integración VR](./INTEGRACION_VR.md)
