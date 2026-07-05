# Dashboard Terapeuta — Documentación Técnica

> **Proyecto**: Cerebro al Fuego — Plataforma de gestión clínica  
> **Stack**: Express.js + React 19 + Electron 40 + Supabase PostgreSQL  
> **Última actualización**: 2026-07-05

---

## 📚 Índice de Documentos

### Especificación
| Documento | Contenido |
|---|---|
| [**REQUERIMIENTOS.md**](./REQUERIMIENTOS.md) | Requisitos funcionales (RF), no funcionales (RNF), reglas de negocio (RN), restricciones técnicas, matriz de trazabilidad |

### Arquitectura
| Documento | Contenido |
|---|---|
| [**ARQUITECTURA.md**](./ARQUITECTURA.md) | Diagramas C4 (contexto, contenedores), estructura modular backend, cadena de middleware, endpoints, frontend dual-target, CI/CD, decisiones técnicas |
| [**MODELO_DATOS.md**](./MODELO_DATOS.md) | Diagrama ER, diccionario de 11 tablas, CHECK constraints, índices, valores enumerados |

### Seguridad y Operaciones
| Documento | Contenido |
|---|---|
| [**SEGURIDAD.md**](./SEGURIDAD.md) | Cadena de seguridad (5 capas), flujo JWT, RBAC, Helmet, CORS, rate-limit, validación, gestión de secretos |
| [**DEPLOYMENT.md**](./DEPLOYMENT.md) | Infraestructura Cloud Run + Vercel, GitHub Actions, Docker, variables de entorno, rollback |

### Integración
| Documento | Contenido |
|---|---|
| [**INTEGRACION_VR.md**](./INTEGRACION_VR.md) | Contrato Unity ↔ Dashboard, secuencia completa, payload JSON, mapeo de datos, sets del juego, manejo offline |
| [**GUIA_INTEGRACION_VR_UNITY.md**](./GUIA_INTEGRACION_VR_UNITY.md) | Guía paso a paso para desarrolladores Unity |

---

## 🏗️ Arquitectura en 30 Segundos

```
Terapeuta (Web/Electron) ──▶ Cloud Run (Express API) ──▶ Supabase (PostgreSQL)
Unity VR (juego)         ──▶ Cloud Run (Express API) ──▶ Supabase (PostgreSQL)
                                    │
                              Redis (Cache)
```

**Backend**: 5 dominios modulares (auth, patients, sessions, vr, users) con middleware chain Helmet → CORS → RateLimit → JWT → RBAC → Validator.

**Frontend**: React 19 + Vite, misma app para web (Vercel) y escritorio (Electron). Context API para estado global, axios para API client.

**Base de Datos**: 11 tablas PostgreSQL en Supabase. Sin triggers automáticos — toda la lógica en la API.

---

## 🔑 Quick Links

- **Login terapeuta de prueba**: definido por `SEED_THERAPIST_PASSWORD` en `backend/.env`
- **Login superadmin**: definido por `SUPERADMIN_EMAIL` y `SUPERADMIN_PASSWORD` en `backend/.env`
- **API Docs local**: `http://localhost:3001/api-docs` (Swagger)
- **Health check**: `GET /health` · `GET /health/live` · `GET /health/ready`
- **Repositorio**: [GitHub Actions CI/CD](../.github/workflows/)

---

## 🧪 Testing

| Componente | Comando |
|---|---|
| Backend unit tests | `cd backend && npm test` |
| Backend coverage | `cd backend && npm run test:coverage` |
| Frontend tests | `cd frontend && npm test` |
| Lint | `npm run lint` |

---

## 📦 Stack Completo

| Capa | Tecnología |
|---|---|
| Backend Runtime | Node.js 24, Express 4 |
| Frontend | React 19, Vite 6 |
| Desktop | Electron 40 |
| Base de Datos | Supabase PostgreSQL 17 |
| ORM/SDK | @supabase/supabase-js 2.90 |
| Auth | JWT (jsonwebtoken 9) |
| Hashing | bcryptjs 3 |
| Cache | Redis 7 |
| Email | Nodemailer 7 + Gmail SMTP |
| Seguridad | Helmet 8, express-rate-limit 7, CORS |
| Validación | express-validator 7 |
| Testing | Node --test, c8, supertest, vitest |
| CI/CD | GitHub Actions → Cloud Run + Vercel |
| Infraestructura | Docker, Google Artifact Registry |
