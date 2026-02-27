# Cleanup Report

## Removed / consolidated

- Removed duplicated password regex definitions in auth and users routes.
- Removed unused `optionalAuth` import from `backend/src/routes/api.js`.
- Replaced duplicated recipe catalog in frontend service with backend-sourced catalog + local cache fallback.
- Replaced in-memory only login lock logic with Redis-backed service (fallback local map).
- Switched seed script hashing dependency from `bcrypt` to `bcryptjs` to avoid duplicated password libs.

## Technical debt intentionally kept (for compatibility)

- Legacy activity labels in some UI components are kept as fallback for historical session IDs.

## Removed in this cleanup pass

- Deleted ad-hoc manual scripts that were not part of runtime/CI:
  - `backend/tests/e2e_validation.js`
  - `backend/tests/full_endpoint_audit.js`
  - `backend/tests/security_validation.js`
- Removed local-only Vercel artifacts from project tree:
  - `frontend/.vercel` is now ignored via root `.gitignore`
  - `frontend/.env.production` is now ignored via root `.gitignore`

## Criteria used

An item is considered safe to clean when:
1. It is not referenced by production paths, and
2. It has a replacement or fallback, and
3. It does not break API/Unity contracts.
