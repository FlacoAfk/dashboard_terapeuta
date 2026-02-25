# Optimization Baseline Snapshot

## Baseline findings before implementation

- Hotspots >700 LOC:
  - `frontend/src/renderer/components/ui/VRSessionCard.jsx`
  - `backend/src/routes/api.js`
  - `backend/src/routes/auth.js`
  - `frontend/src/renderer/pages/terapeuta/SesionesVR.jsx`
- Frontend renderer bundle observed around 1.18MB (pre-optimization split).
- No standardized lint/test scripts in root and workspaces.
- Frontend deploy target was Electron-first without dedicated Vercel web build.
- Health endpoint existed, but no explicit live/ready separation.

## Implemented in this iteration

- Backend app bootstrap modularized (`app.js` + `server.js`).
- Security baseline added (helmet, rate-limit, configurable CORS).
- Request tracing via `x-request-id` added globally.
- Live/ready endpoints added.
- Recipe catalog centralization started (backend constants + frontend API-driven loading).
- CI/CD workflow scaffolding added for quality and deploy pipelines.
- Web bundle split into manual chunks (`react`, `alerts`) reducing primary chunk size to ~409 kB.
