# Deployment Guide (Vercel + Cloud Run)

## Frontend Web (Vercel)

1. Set Vercel project root to `frontend/`.
2. Configure env vars:
   - `VITE_API_URL`
   - `VITE_API_TIMEOUT_MS`
3. Build command: `npm run build:web`
4. Output directory: `dist-web`

## Backend (Cloud Run)

1. Build image from `backend/Dockerfile`.
2. Deploy Cloud Run service with:
   - `PORT`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
   - `UNITY_API_KEY`
   - `CORS_ALLOWED_ORIGINS`
3. Validate:
   - `/health/live`
   - `/health/ready`

## GitHub Actions secrets/vars required

### Secrets
- `GCP_WORKLOAD_IDENTITY_PROVIDER`
- `GCP_SERVICE_ACCOUNT_EMAIL`
- `VERCEL_TOKEN`

### Vars
- `GCP_PROJECT_ID`
- `GCP_REGION`
- `GCP_ARTIFACT_REPO`
- `CLOUD_RUN_SERVICE`