# Seguridad del Proyecto

## ⚠️ Archivos Sensibles

Los siguientes archivos **NUNCA** deben subirse al repositorio:

| Archivo | Contenido |
|---------|-----------|
| `backend/.env` | Credenciales de Supabase, JWT, SMTP, API Keys |
| `*.log` | Logs que podrían contener datos sensibles |
| `*_result.json` | Outputs de scripts con datos de usuarios |
| `backend/scripts/*.txt` | Tokens de prueba generados |

## 🔐 Buenas Prácticas

### Credenciales
- Usa `.env.example` como plantilla, **nunca** con valores reales
- Genera un JWT_SECRET único con: `openssl rand -base64 64`
- Nunca hardcodear credenciales en scripts o código fuente
- La `UNITY_API_KEY` debe ser una cadena aleatoria larga

### Contraseñas de Usuario
- Mínimo 10 caracteres
- Debe incluir: mayúsculas, minúsculas, números y símbolos (`@$!%*?&`)
- Nunca hardcodear contraseñas en el código
- Validación en backend vía `express-validator`

### Git
- Verifica `.gitignore` antes de cada commit
- Usa `git status` para confirmar qué archivos se subirán
- Si accidentalmente subes credenciales, rótalas inmediatamente
- No commitear `dist-electron/`, `release/`, `build/`

## 🛡️ Características de Seguridad Implementadas

| Característica | Descripción |
|----------------|-------------|
| **JWT** | Tokens con expiración configurable (`JWT_EXPIRES_IN`), verificación de estado activo del usuario en cada request |
| **bcrypt** | Hash de contraseñas con salt de 12 rounds |
| **RBAC** | Control de acceso basado en roles: `SUPERADMIN`, `TERAPEUTA` |
| **Ownership** | Terapeutas solo acceden a datos de pacientes que les están asignados (vía `terapeuta_paciente`) |
| **API Key** | Endpoints de Unity protegidos con `X-API-Key` en header |
| **Anti-bruteforce** | Bloqueo de cuenta tras 5 intentos fallidos de login (15 min) |
| **Validación UUID** | Parámetros UUID validados contra regex antes de consultas a BD |
| **Validación de inputs** | Longitud máxima, tipos de datos, campos requeridos |
| **Auditoría** | Registro de operaciones críticas: login, CRUD, sesiones VR revisadas |
| **CORS** | Configurado para orígenes permitidos |
| **SSL/TLS** | Conexión encriptada a Supabase |

## 🔒 Niveles de Acceso por Endpoint

| Nivel | Middleware | Descripción |
|-------|-----------|-------------|
| Público | Ninguno | `/health`, `/api/auth/login`, `/api/auth/setup` |
| API Key | `validateUnityApiKey` | Endpoints de Unity (`X-API-Key` header) |
| JWT + Terapeuta | `authenticateToken` + `requireTerapeuta` | SUPERADMIN y TERAPEUTA |
| JWT + Terapeuta + Ownership | + verificación de `terapeuta_paciente` | Solo datos propios |
| JWT + SuperAdmin | `authenticateToken` + `requireSuperAdmin` | Solo SUPERADMIN |

## 📏 Validaciones en PUT `/api/sessions/:id`

| Validación | Código de Error | Status |
|------------|----------------|--------|
| UUID inválido | `INVALID_UUID` | 400 |
| Observaciones > 2000 chars | `INPUT_TOO_LONG` | 400 |
| Tipo de dato incorrecto | `INVALID_INPUT` | 400 |
| Sesión no encontrada | `SESSION_NOT_FOUND` | 404 |
| Paciente no encontrado/inactivo | `PATIENT_NOT_FOUND` | 404 |
| Terapeuta sin acceso | `ACCESS_DENIED` | 403 |

## 📞 Reporte de Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad, por favor repórtala de forma privada a: cerebroalfuego@gmail.com
