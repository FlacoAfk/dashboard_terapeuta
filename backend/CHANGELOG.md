# Changelog

All notable changes to this project will be documented in this file.

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
