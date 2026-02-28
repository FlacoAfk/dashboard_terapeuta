# Deployment Manual (Vercel + Cloud Run)

Este proyecto se despliega manualmente. GitHub Actions no se usa.

## Frontend (Vercel)

### Configuracion del proyecto
1. Team/Project en Vercel.
2. Root Directory: `frontend`
3. Framework: `Other` (o `Vite`)
4. Build Command: `npm run build:web`
5. Output Directory: `dist-web`
6. Install Command: `npm install`

### Variables de entorno (Vercel)
- `VITE_API_URL=https://cerebro-al-fuego-image-482550109792.us-central1.run.app`
- `VITE_API_TIMEOUT_MS=15000`
- `VITE_API_GET_CACHE_TTL_MS=20000`

> Para builds Electron, el equivalente en runtime es `API_GET_CACHE_TTL_MS`.

### Deploy con CLI (PowerShell)
```powershell
cd frontend
vercel pull --yes --environment=production
vercel build --prod
vercel deploy --prebuilt --prod
```

Deploy rapido (sin prebuild local):
```powershell
cd frontend
vercel deploy --prod --yes
```

## Backend (Cloud Run)

### Variables runtime (no secretas)
- `NODE_ENV=production`
- `JWT_EXPIRES_IN=24h`
- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=587`
- `SMTP_USER=<placeholder>`
- `SMTP_FROM=<placeholder>`
- `SUPERADMIN_EMAIL=<placeholder>`
- `REDIS_CACHE_ENABLED=true`
- `REDIS_HOST=<memorystore_host>`
- `REDIS_PORT=6379`
- `REDIS_DB=0`
- `REDIS_CONNECT_TIMEOUT_MS=3000`
- `CORS_ALLOWED_ORIGINS=<lista_de_origenes_coma_separados>`
- `CORS_ALLOWED_VERCEL_PROJECT_SUFFIX=flacoafks-projects`

### Secretos (Secret Manager)
- `dashboard-supabase-url`
- `dashboard-supabase-service-role-key`
- `dashboard-jwt-secret`
- `dashboard-unity-api-key`
- `dashboard-smtp-pass`
- `dashboard-superadmin-password`
- `dashboard-redis-password`

### Build + push + update service (PowerShell)
```powershell
$PROJECT_ID = "cerebroalfuego"
$REGION = "us-central1"
$REPO = "dashboard-backend"
$SERVICE = "cerebro-al-fuego-image"
$TAG = "manual-" + (Get-Date -Format "yyyyMMdd-HHmmss")
$IMAGE = "$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/dashboard-backend:$TAG"

gcloud config set project $PROJECT_ID
gcloud auth configure-docker "$REGION-docker.pkg.dev" --quiet

docker build -f backend/Dockerfile -t $IMAGE backend
docker push $IMAGE

gcloud run services update $SERVICE `
  --region $REGION `
  --project $PROJECT_ID `
  --image $IMAGE
```

### Actualizar CORS para Vercel
Si quieres permitir varios dominios Vercel puntuales:
```powershell
gcloud run services update cerebro-al-fuego-image `
  --region us-central1 `
  --project cerebroalfuego `
  --update-env-vars '^##^CORS_ALLOWED_ORIGINS=https://frontend-one-gold-22.vercel.app,https://frontend-eyuloyixl-flacoafks-projects.vercel.app'
```

Con `CORS_ALLOWED_VERCEL_PROJECT_SUFFIX=flacoafks-projects`, tambien quedan permitidos previews del tipo:
`https://<preview>-flacoafks-projects.vercel.app`.

### Smoke checks
```powershell
$URL = gcloud run services describe cerebro-al-fuego-image `
  --region us-central1 `
  --project cerebroalfuego `
  --format="value(status.url)"

curl.exe -f "$URL/health"
curl.exe -f "$URL/health/live"
curl.exe -f "$URL/health/ready"
```

### Rollback
```powershell
gcloud run revisions list `
  --service cerebro-al-fuego-image `
  --region us-central1 `
  --project cerebroalfuego

gcloud run services update-traffic cerebro-al-fuego-image `
  --region us-central1 `
  --project cerebroalfuego `
  --to-revisions <REVISION>=100
```

## Seguridad minima antes de push
- No subir `backend/.env` ni `.env.local`.
- Usar placeholders en documentacion, no valores reales.
- Verificar secretos solo en Secret Manager.
