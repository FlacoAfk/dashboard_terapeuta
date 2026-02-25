# Plan Maestro de Optimización y Robustez (Web + Electron, Vercel + Cloud Run)

## Resumen
Se ejecutará una optimización integral por fases, sin ruptura visible para usuarios ni para Unity, manteniendo compatibilidad de API al 100%.  
El resultado será: código modular sin espagueti, duplicación reducida, pruebas automáticas reales, frontend web desplegable en Vercel (manteniendo Electron), backend dockerizado y desplegable en Cloud Run, limpieza de scripts/código basura basada en evidencia y pipeline CI/CD en GitHub Actions.

Duración estimada: 4 a 6 semanas en 7 fases secuenciales con entregables verificables.

## Plan por fases

1. Fase 0: Línea base y criterios de limpieza (2-3 días)
Definir baseline técnico y métricas de éxito antes de tocar arquitectura.  
Incluye: inventario de hotspots (archivos >700 líneas), duplicación funcional, dependencias no usadas, estado de scripts, salud de build actual, mapa de endpoints y contratos.  
Incluye: regla formal de “basura” para borrar sin riesgo: no referenciado + no cubierto por flujo productivo + reemplazo definido o descarte documentado.  
Salida: backlog priorizado (alto/medio/bajo), tablero de riesgos, checklist de compatibilidad obligatoria.

2. Fase 1: Higiene de monorepo y dependencias (3-4 días)
Normalizar base de trabajo para reproducibilidad y mantenimiento.  
Incluye: corregir lockfiles versionados (reproducibilidad), estandarizar scripts `dev/build/test/lint` en raíz y workspaces, actualizar `.env.example` con variables reales requeridas (SMTP, UNITY, REDIS, CORS, URLs de frontend).  
Incluye: eliminar dependencias duplicadas o sin uso y unificar librerías equivalentes (ejemplo: una sola implementación de hash de password).  
Incluye: limpieza de referencias muertas detectadas (imports no usados, utilidades no invocadas, archivos de tipo/documentación no conectados al runtime).  
Salida: base estable para refactor sin deuda de tooling.

3. Fase 2: Refactor backend para robustez (7-10 días)
Descomponer backend monolítico en módulos mantenibles sin cambiar contratos públicos.  
Incluye: separar rutas grandes por dominio (`auth`, `patients`, `sessions`, `vr`, `users`, `audit`) con capas `controller/service/repository`.  
Incluye: centralizar validaciones repetidas (password policy, UUID, payload Unity, errores HTTP), y manejo de errores consistente con `requestId`.  
Incluye: seguridad productiva para Cloud Run: `helmet`, rate-limit configurable, CORS por entorno (sin hardcode), eliminación de secretos por defecto inseguros en runtime.  
Incluye: endurecer autenticación distribuida (evitar bloqueos en memoria por instancia para escenarios multi-replica).  
Salida: backend modular, testeable y listo para escala horizontal.

4. Fase 3: Optimización de datos, consultas y caché (4-6 días)
Reducir latencia y costos eliminando N+1 y consultas redundantes.  
Incluye: refactor de endpoints críticos para evitar consultas por elemento en loops; consultas por lotes y joins equivalentes con Supabase.  
Incluye: paginación y límites por defecto en listados pesados; filtros validados y acotados.  
Incluye: migraciones SQL seguras (sin ruptura) para índices faltantes en rutas críticas (`sessions`, `vr_session_results`, `terapeuta_paciente`, `password_reset_tokens`).  
Incluye: política de caché más predecible y barata (TTL, invalidación por dominio, bypass controlado para refresh).  
Salida: p95 menor y comportamiento estable bajo carga.

5. Fase 4: Frontend dual target (Web Vercel + Electron) (7-9 días)
Separar shell de plataforma y reutilizar una sola app UI.  
Incluye: extraer app React compartida y crear 2 entrypoints: web (BrowserRouter/Vite) y Electron (HashRouter/electron-vite).  
Incluye: adaptar configuración de entorno para web (`import.meta.env`) y Electron (preload), sin acoplar lógica de negocio a `window.electronAPI`.  
Incluye: retirar catálogos duplicados hardcodeados (recetas/labels) usando fuente única desde backend.  
Incluye: reducir bundle inicial por code splitting (rutas pesadas y componentes gigantes), memoización selectiva y eliminación de utilidades duplicadas.  
Incluye: configuración Vercel (`vercel.json` con rewrites SPA) y Docker de frontend para paridad local/CI.  
Salida: frontend desplegable en Vercel, Electron mantenido, menor peso inicial y menor acoplamiento.

6. Fase 5: Robustez verificable con testing y calidad (5-7 días)
Reemplazar scripts ad-hoc por suite automatizada mantenible.  
Incluye: stack de pruebas moderna en JS (backend + frontend), lint y formateo obligatorios en CI.  
Incluye: convertir scripts manuales actuales de validación en pruebas automatizadas con assertions reproducibles y datos controlados.  
Incluye: smoke tests de contratos críticos (auth, sesiones, VR ingest, reportes, roles).  
Incluye: cobertura mínima objetivo y gates en PR para evitar regresiones.  
Salida: calidad continua y no dependiente de ejecución manual.

7. Fase 6: Dockerización final + despliegue (Vercel/Cloud Run) + observabilidad (4-6 días)
Cerrar ciclo Dev→Prod con rollback claro.  
Incluye: Docker backend multi-stage, imagen mínima, non-root, healthcheck y configuración `PORT` de Cloud Run.  
Incluye: pipeline GitHub Actions con jobs de lint/test/build, build/push de imagen a Artifact Registry y deploy a Cloud Run por ambiente.  
Incluye: deploy frontend a Vercel con previews por PR y promoción a producción en merge.  
Incluye: logs estructurados, métricas de salud, alertas básicas y estrategia de rollback (revisión previa de Cloud Run + rollback de Vercel).  
Salida: operación productiva confiable y auditable.

## Cambios importantes en interfaces públicas (sin ruptura)

| Área | Cambio | Compatibilidad |
|---|---|---|
| API REST actual | Se conservan rutas, métodos, payloads y códigos esperados | 100% compatible |
| Endpoints de salud | Se agregan checks de readiness/liveness (aditivos) | No rompe clientes |
| Errores/diagnóstico | Se agrega `requestId` en respuesta/log para trazabilidad | Aditivo |
| Configuración backend | Variables nuevas de despliegue/seguridad (`CORS_ALLOWED_ORIGINS`, límites rate-limit, URLs públicas, toggles cache) | Aditivo |
| Frontend config | Variables web para Vercel y adaptación de entorno Electron/Web | Aditivo |
| Docker | Dockerfile frontend + endurecimiento Docker backend | No afecta contrato API |

## Casos de prueba y escenarios obligatorios

1. Auth completo: setup, login, refresh de sesión, cambio/reset password, bloqueo de intentos y comportamiento multi-instancia.
2. RBAC/ownership: SUPERADMIN y TERAPEUTA con acceso correcto a pacientes/sesiones/auditoría.
3. Flujo de sesión receta: crear sesión, lookup por token, activación, cierre por Unity y cierre manual.
4. Ingesta VR Unity: payload válido/inválido, persistencia de sets/errores, vinculación automática de paciente.
5. Endpoints críticos de listado: paginación, filtros, rendimiento con dataset amplio.
6. Frontend web: navegación SPA profunda, refresh en ruta interna, guardas de sesión y setup guard.
7. Frontend Electron: login, persistencia de token, rutas y acciones principales sin regresión.
8. Compatibilidad contractual: snapshots de respuestas clave comparadas contra baseline.
9. Deploy smoke: Vercel preview y Cloud Run staging con healthchecks y rollback probado.
10. Seguridad básica: cabeceras, CORS por entorno, ausencia de secretos hardcodeados, dependencias sin vulnerabilidades críticas.

## Criterios de aceptación

1. Sin ruptura funcional visible en dashboard ni en integración Unity.
2. Reducción de complejidad: componentes/rutas monolíticas divididas con límites de tamaño y responsabilidades claras.
3. Reducción de duplicación de reglas de negocio (recetas, validaciones, errores, auth handling).
4. Bundle frontend inicial reducido al menos 30% respecto al baseline actual.
5. Latencia p95 mejorada en endpoints de mayor uso (pacientes/sesiones/reportes) con dataset de prueba.
6. Pipeline CI/CD verde en PR y en `main` con despliegue automatizado por ambiente.
7. Scripts “basura” removidos con evidencia y registro de lo eliminado/retirado.

## Supuestos y defaults explícitos
Se usarán los defaults que definimos: Web + Electron, estrategia por fases, limpieza con evidencia, Cloud Run para backend, compatibilidad API 100%, gate de calidad alto pragmático, mantener JavaScript, cero ruptura visible, GitHub Actions, IaC ligero y suficiente, Vite SPA compartida para Vercel, migraciones de BD seguras, integración sobre el estado Git actual sin revertir tus cambios locales.
