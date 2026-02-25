# Cleanup Report

## Removed / consolidated

- Removed duplicated password regex definitions in auth and users routes.
- Removed unused `optionalAuth` import from `backend/src/routes/api.js`.
- Replaced duplicated recipe catalog in frontend service with backend-sourced catalog + local cache fallback.
- Replaced in-memory only login lock logic with Redis-backed service (fallback local map).
- Switched seed script hashing dependency from `bcrypt` to `bcryptjs` to avoid duplicated password libs.

## Technical debt intentionally kept (for compatibility)

- Legacy manual scripts in `backend/tests/*.js` remain available for ad-hoc audits.
- Legacy activity labels in some UI components are kept as fallback for historical session IDs.

## Criteria used

An item is considered safe to clean when:
1. It is not referenced by production paths, and
2. It has a replacement or fallback, and
3. It does not break API/Unity contracts.