# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

## [1.3.0] - 2026-01-20

### ✨ Nuevas Funcionalidades

- **Página de Recuperación de Contraseña** (`/forgot-password`)
  - Nueva página ForgotPassword.jsx
  - Endpoint POST `/api/auth/forgot-password`
  - Link "¿Olvidó su contraseña?" en Login

- **Bloqueo de Cuenta por Seguridad**
  - Bloqueo automático tras 5 intentos fallidos
  - Tiempo de bloqueo: 15 minutos
  - Mensaje informativo con tiempo restante

- **Página de Configuración Inicial** (`/setup`)
  - SetupPage.jsx para crear superadmin inicial
  - Verificación automática de configuración

- **Indicador de Fortaleza de Contraseña**
  - Componente PasswordStrengthIndicator.jsx
  - Integrado en Login, Setup y CrearTerapeutaModal

### 🔒 Seguridad
- Validación de contraseñas (10+ chars, mayúsculas, minúsculas, números, símbolos)
- Protección contra ataques de fuerza bruta
- No revelación de existencia de emails

---

## [1.1.0] - 2026-01-18

### ✨ Nuevas Funcionalidades

- **Migración completa a Supabase SDK** - Eliminada dependencia de `pg Pool` en todas las rutas API
- **Auditoría mejorada** - Ahora registra usuario, IP y detalles completos
- **Descarga CSV de auditoría** - Export funcional en Electron

### 🔧 Cambios

#### Backend
- `api.js` - Reescrito completamente para usar Supabase SDK
- `auth.js` - Actualizado registro de auditoría con `auditLogin` y `auditWithUser`
- `audit.js` - Nuevo endpoint de exportación CSV, filtrado por mes/año
- `auditHelper.js` - Nuevos helpers para registro con username e IP

#### Frontend
- `Auditoria.jsx` - Muestra todos los campos: Usuario, IP, Detalles
- `auditService.js` - Descarga CSV compatible con Electron
- `GestionTerapeutas.jsx` - UI mejorada según mockups

### 🐛 Correcciones

- Corregido: Campos de auditoría mostraban "-" en lugar de valores
- Corregido: Descarga de CSV no funcionaba en Electron

### 📝 Requerimientos Completados

| Código | Descripción | Estado |
|--------|-------------|--------|
| RF-SEG-01 | Superadministrador único | ✅ |
| RF-SEG-02 | Gestión de terapeutas con reasignación | ✅ |
| RF-BDD-08 | Bitácora de auditoría con exportación | ✅ |

---

## [1.0.0] - 2026-01-15

### 🎉 Lanzamiento Inicial

- Sistema de autenticación con JWT
- Gestión de terapeutas (CRUD)
- Panel de administración con sidebar
- Integración con Supabase
- Documentación Swagger
