# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

## [1.8.0] - 2026-02-09

### ✨ Nuevas Funcionalidades

- **Evaluación del Desempeño VR**
  - Calificación 1-5 (Muy bajo → Excelente) para cada sesión VR revisada
  - Almacenada como prefijo `[Calificación: X/5 - Label]` en `observaciones_terapeuta`
  - Panel de referencia con datos de la sesión para evaluar con contexto

- **VRSessionCard Reescrito — Vista con Pestañas**
  - **Resumen**: Score circular (0-100), 6 métricas globales, timeline, distribución de tiempo activo/inactivo
  - **Etapas**: Cards expandibles por etapa con duración, blocks, drops, releases, errores con timestamps
  - **Errores**: Agrupación por tipo, timeline cronológico visual, distribución por etapa
  - **Motricidad**: Eficiencia motora circular, análisis de interacciones por etapa con barras proporcionales
  - **Evaluación**: Escala 1-5 con botones de color, textarea de observaciones clínicas, panel de referencia

- **Service `updateSession()`**
  - Agregado método faltante en `vrResultsService.js` para actualizar sesiones VR

### 🔒 Seguridad

- **PUT `/api/sessions/:id`** — Validaciones completas:
  - Validación de formato UUID → 400 `INVALID_UUID`
  - Verificación de existencia de sesión → 404 `SESSION_NOT_FOUND`
  - Ownership check: terapeuta solo edita sesiones de sus pacientes → 403 `ACCESS_DENIED`
  - Validación de tipo (string) y longitud (2000 chars) en observaciones
  - Paciente debe existir y estar activo para vinculación
  - Terapeuta no puede vincular paciente no asignado
  - Auditoría: evento `SESSION_REVIEWED` registrado

### 🧹 Limpieza

- **Archivos eliminados**:
  - `frontend/clean_db.js` — referenciaba tablas obsoletas
  - `frontend/generate_screenshots.js` — script utilitario de desarrollo
  - `frontend/vite.config.verifier.js` — config de testing no utilizada
  - `frontend/build_final.log` — log de build
  - `backend/scripts/generate_test_token.js` — contenía credenciales hardcodeadas (riesgo de seguridad)
  - `backend/scripts/token.txt`, `token_output.txt` — archivos sensibles
  - `frontend/dist-electron/` — build output que no debe estar en repo
  - `frontend/build/`, `frontend/release/`, `frontend/playwright-report/` — artefactos de build

- **Dependencias limpiadas**:
  - Eliminado `pg` (^8.17.1) del backend — no se usa, todo utiliza Supabase SDK

- **`.gitignore` actualizado**:
  - Agregados: `dist-electron/`, `release/`
  - Limpiados patrones duplicados

### 📝 Documentación

- **README.md**: Reescrito completamente — estructura actualizada, endpoints correctos, sección de Evaluación del Desempeño, tablas de BD, seguridad, VRSessionCard tabs
- **Swagger**: v1.8.0 — documentación detallada del PUT sessions con todos los códigos de error, formato de evaluación, ownership check
- **API_ENDPOINTS.md**: v1.8.1 — PUT sessions actualizado con validaciones de seguridad, ownership, formato de evaluación y errores detallados
- **POSTMAN_API_DOCS.md**: v1.8.0 — endpoints actualizados
- **SECURITY.md**: Actualizado con nuevas características de seguridad
- **Backend CHANGELOG.md**: Agregada entrada v1.8.0

### 🔄 Versionamiento

- Root: `1.7.0` → `1.8.0`
- Backend: `1.6.1` → `1.8.0`
- Frontend: `1.5.0` → `1.8.0`
- Swagger: `1.7.1` → `1.8.0`

---

## [1.7.1] - 2026-02-08

### 🔧 Mejoras

- **Limpieza de Variables de Entorno**
  - Eliminadas variables no utilizadas del `.env`: `NODE_ENV`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
  - `JWT_EXPIRES_IN` ahora se lee desde `process.env` en vez de estar hardcodeado

- **Swagger Actualizado (v1.7.1)**
  - Eliminados tags legacy (`Sesiones`, `Actividades`) y schema `Actividad`
  - Agregados tags faltantes (`Sesiones VR`, `Unity - Pacientes`)
  - Actualizado contacto y descripciones

- **Documentación Sincronizada**
  - `API_ENDPOINTS.md` actualizado con tabla de variables de entorno
  - `README.md` actualizado: estructura del proyecto, endpoints, variables de entorno, diagrama de arquitectura
  - Eliminadas referencias a tablas/endpoints legacy

---

## [1.7.0] - 2026-02-02

### ✨ Nuevas Funcionalidades

- **Toggle de Visibilidad de Contraseña**
  - Icono de ojo en campos de contraseña en Reset Password
  - Permite ver/ocultar contraseña mientras se escribe
  - Mejora la experiencia de usuario en formularios de seguridad

- **Script de Seed Mejorado**
  - `seed_complete.js` usa variables de entorno para credenciales
  - Lee `SUPERADMIN_EMAIL` y `SUPERADMIN_PASSWORD` desde `.env`
  - Limpia usuarios existentes antes de crear nuevos (evita duplicados)

- **Script de Limpieza de BD**
  - Nuevo `clear_database.js` para resetear datos de prueba
  - Limpia todas las tablas en orden correcto de dependencias

### 🔧 Mejoras

- **Limpieza del Proyecto**
  - Eliminados archivos temporales y de desarrollo
  - Actualizado `.gitignore` con exclusiones comprehensivas
  - Excluidos: `.env`, logs, test-results, artefactos de AI

- **Documentación**
  - `.env.example` actualizado con todas las variables necesarias
  - Estructura de proyecto limpia para producción

### 🧪 Testing

- **QA Browser Testing Completo**
  - Todas las funcionalidades probadas via UI
  - Autenticación, Admin, Terapeuta, Pacientes, Sesiones VR
  - Documentados 24+ casos de prueba exitosos

---

## [1.6.0] - 2026-02-02

### ✨ Nuevas Funcionalidades

- **Integración VR Completa**
  - Nuevo endpoint `/api/v1/session-results` para recibir datos de Unity
  - Servicio `vrResultsService.js` para consumir API de sesiones VR
  - Vista detallada de sesiones VR con sets, errores y objetos retornados

- **Visualización de Sesiones VR**
  - Componente `VRSessionCard.jsx` con sets expandibles
  - Traducción de códigos de error a español
  - Métricas visuales: errores, drops, releases por set

### 🎨 Mejoras de UI/UX

- **Diseño Responsivo**
  - Frontend adaptable a diferentes tamaños de pantalla desktop
  - Breakpoints optimizados para resoluciones 1024px+
  - Layouts flexibles en AdminLayout y TerapeutaLayout

- **Modal de Reasignación de Pacientes**
  - Nuevo tamaño `2xl` para modales grandes
  - Filas de pacientes expandibles con información detallada
  - Selector de terapeuta con indicador visual de asignación
  - Panel de información del terapeuta seleccionado

- **Vista Detalle de Paciente**
  - Enfocada exclusivamente en sesiones VR
  - Eliminada pestaña de sesiones del sistema

### 🔧 Refactorización

- **Limpieza de Código Backend**
  - Eliminadas rutas obsoletas: `sesiones.js`, `eventos.js`, `evaluacion.js`, `metricas.js`
  - Actualizado `server.js` para remover imports legacy
  - Extracción de utilidad compartida `validationUtils.js`

- **Limpieza de Código Frontend**
  - Eliminado servicio obsoleto `sessionService.js`
  - Refactorizado `DashboardTerapeuta.jsx` para usar `vrResultsService`

### 📝 Documentación

- Actualizado esquema de base de datos en requerimientos
- Documentadas tablas VR: `vr_session_results`, `vr_set_results`, `vr_set_errors`, `vr_set_returned_objects`
- Actualizada tabla de requerimientos implementados en README

---

## [1.4.0] - 2026-01-22

### ✨ Nuevas Funcionalidades

- **Panel de Configuración del Terapeuta** (`/terapeuta/configuracion`)
  - Nueva página ConfiguracionTerapeuta.jsx
  - Terapeutas pueden editar su perfil (nombre, correo)
  - Cambio de contraseña seguro desde el panel

- **Modal Editar Terapeuta Mejorado**
  - Estructura unificada con el modal de creación
  - Eliminado campo "Usuario" redundante
  - Orden de campos: Nombre, Email, Contraseña

- **Validación de Seguridad Reforzada**
  - Backend valida estado activo del terapeuta antes de asignar pacientes
  - Previene auto-asignación por terapeutas desactivados
  - Frontend filtra terapeutas inactivos de selectores

### 🔧 Mejoras

- **Reasignación de Pacientes**
  - Modal de reasignación no reactiva accidentalmente al terapeuta desactivado
  - Flujo de seguridad para inconsistencias de estado

- **Navegación del Terapeuta**
  - Fix: "Pacientes" ya no permanece activo al visitar "Configuración"
  - Layout de página de configuración responsivo (ancho completo)

### 🐛 Correcciones

- Corregido: Sidebar de terapeuta mostraba ambos ítems activos simultáneamente
- Corregido: Cards de perfil con ancho máximo muy estrecho

---

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
