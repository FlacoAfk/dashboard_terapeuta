# Changelog

All notable changes to this project will be documented in this file.

## [1.8.3] - 2026-02-27

### Added
- **CORS flexible para previews Vercel**: soporte por sufijo de proyecto con `CORS_ALLOWED_VERCEL_PROJECT_SUFFIX`.

### Changed
- **Cloud Run proxy awareness**: `app.set('trust proxy', 1)` para respetar IP real detrás de proxy.
- **Rate limit**: se excluye `OPTIONS` para evitar bloqueos de preflight CORS.
- **Deploy docs**: guía manual actualizada (Cloud Run + Vercel + Redis) sin secretos en texto plano.

### Fixed
- **Preflight intermitente**: mitigados errores `429` en `/api/auth/check-setup` bajo alta frecuencia de preflight.

## [1.8.2] - 2026-02-23

### Added
- **Redis Cache (opcional)**: Integración de cache distribuido con fallback seguro si Redis no está disponible.
- **Docker Compose**: Nuevo servicio `redis` para despliegue local junto al backend.

### Changed
- **Rutas cacheadas**:
	- `GET /api/patients`
	- `GET /api/patients/:id`
	- `GET /api/patients/:id/report`
	- `GET /api/dashboard/stats`
	- `GET /api/sessions/recipe-sessions`
	- `GET /api/sessions/recipes`
	- `GET /api/v1/session-results`
	- `GET /api/v1/session-results/:id`
	- `GET /api/v1/patients/lookup`
- **Invalidación automática**: Limpieza de cache en endpoints `POST/PUT` relacionados con pacientes, sesiones receta y recepción de resultados VR.

## [1.8.0] - 2026-02-09

### Added
- **Evaluación del Desempeño**: Soporte para calificación 1-5 en sesiones VR via `PUT /api/sessions/:id`. La calificación se almacena como prefijo `[Calificación: X/5 - Label]` en `observaciones_terapeuta`.
- **Auditoría de Sesiones**: Nuevo tipo de auditoría `SESSION_REVIEWED` registra cada revisión de sesión VR con detalles (session_id, participant_id, tiene_evaluacion).

### Security
- **Validación UUID**: `PUT /api/sessions/:id` ahora valida formato UUID del parámetro `id` → 400 `INVALID_UUID`.
- **Validación de inputs**: Observaciones limitadas a 2000 caracteres, validación de tipo string/integer → 400 `INVALID_INPUT` / `INPUT_TOO_LONG`.
- **Ownership check**: Terapeutas solo pueden actualizar sesiones de pacientes asignados a ellos (vía `terapeuta_paciente`) → 403 `ACCESS_DENIED`.
- **Verificación de existencia**: Verifica que la sesión exista antes de actualizar → 404 `SESSION_NOT_FOUND`.
- **Paciente activo**: Al vincular paciente, verifica que exista y esté activo → 404 `PATIENT_NOT_FOUND`.
- **Ownership en vinculación**: Terapeuta no puede vincular un paciente que no le esté asignado → 403 `ACCESS_DENIED`.

### Changed
- **Swagger**: Actualizado a v1.8.0 — documentación detallada de `PUT /api/sessions/:id` con todos los códigos de error, ejemplos de evaluación y descripción de seguridad.
- **API_ENDPOINTS.md**: Actualizado `PUT /api/sessions/:id` con validaciones de seguridad, formato de evaluación del desempeño, ownership check y códigos de error detallados.

## [1.7.1] - 2026-02-08

### Changed
- **Environment Variables**: Removed unused variables (`NODE_ENV`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`) from `.env`.
- **JWT Config**: `JWT_EXPIRES_IN` now reads from `process.env.JWT_EXPIRES_IN` instead of being hardcoded in `authMiddleware.js`.
- **Swagger**: Updated to v1.7.1 — removed legacy tags (`Sesiones`, `Actividades`), added missing tags (`Sesiones VR`, `Unity - Pacientes`), removed `Actividad` schema, updated contact and descriptions.
- **API_ENDPOINTS.md**: Added environment variables reference table, improved audit/export documentation.

## [1.6.1] - 2026-02-05

### Maintainance
- **Cleanup**: Removed obsolete scripts (`clear_database.js`, `test_vr_endpoint.js`, etc.) and temporary files.
- **Scripts**: Updated `seed_complete.js` to be compatible with new schema (removed `vr_set_returned_objects`).

## [1.6.0] - 2026-02-05

### Added
- **E2E Testing**: automatic validation script `tests/e2e_validation.js` covering Health, Auth, Patient, Unity, and Dashboard flows.
- **Unity Identification**: New endpoint `GET /api/v1/patients/lookup` for checking patient existence via API Key.
- **VR Session Results**: Full integration with new schema table `vr_session_results` in `vrResults.js`.

### Changed
- **Schema Synchronization**: Refactored backend to align with simplified `bd_schema.sql`.
- **Patient Reports**: Updated `/api/patients/:id/report` to query `vr_session_results` instead of deprecated `sesiones`.
- **VR Results**: Updated `POST /api/v1/session-results` to use new fields (`summary_total_errors`, `id_paciente_vinculado`, etc.) and removed dead code for `vr_set_returned_objects`.
- **Documentation**: Updated `API_ENDPOINTS.md` with current inputs/outputs and removed obsolete endpoints.

### Removed
- **Legacy Tables Support**: Removed code dependent on deleted tables: `actividades`, `sesiones`, `actividad_juego`, `resumen_sesion`, `vr_set_returned_objects`.
