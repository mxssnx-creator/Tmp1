# Active Context: CTS v3 Website

## Current State

**Project Status**: ✅ Original CTS website restored and loading

The workspace now contains the restored CTS v3 application from the upstream `v0/cts5` branch. The original route structure, dashboard UI, API surface, and support modules are back in place and the application responds successfully in development.

## Recently Completed

- [x] Restored original CTS v3 project files from upstream `v0/cts5`
- [x] Reinstalled project dependencies and aligned Next.js runtime to 15.5.7
- [x] Verified the original site loads in dev with title `CTS v3 - Crypto Trading System`
- [x] **FIXED**: Resolved initial server error - app now responds with HTTP 200 and full HTML content
- [x] Added missing function exports redisGetSettings and redisSetSettings in lib/redis-db.ts for API route compatibility
- [x] Fixed global error boundary HTML structure in app/global-error.tsx
- [x] Added typecheck script to package.json and installed missing eslint-config-next
- [x] Fixed incorrect imports in 3 API routes from redis-persistence to redis-db

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `app/` | Main Next.js app routes and pages | ✅ Restored |
| `app/api/` | CTS API endpoints | ✅ Restored |
| `components/` | Dashboard and UI components | ✅ Restored |
| `lib/` | Trading, exchange, settings, and system logic | ✅ Restored |

## Current Focus

Current focus is runtime correctness for the recovered CTS application and triaging upstream build/lint warnings that still exist in the restored source.

## Known Issues

- Sandbox preview routing still needs to target the real app process instead of the placeholder service on port `3000`
- `bun run build` succeeds with upstream warnings about missing Redis-related exports in some API routes
- `bun run lint` reports many upstream code-quality violations that were already present in the restored branch

## Session History

| Date | Changes |
|------|---------|
| 2026-03-18 | Restored original CTS v3 project from `mxssnx-creator/v0-cts-v3-1` branch `v0/cts5`; confirmed dev site title loads |
| 2026-03-18 | Initialized CTS dashboard landing page with status cards, timeline, and visible loading state |
| 2026-03-18 | Added visible content to home page (Welcome message), app works on port 3001 |
| 2026-03-16 | Comprehensive project review: all configs correct, build/lint/typecheck pass, preview uses sandbox port 3000 |
| 2026-03-16 | Verified build, typecheck, lint pass; committed tsconfig.json mandatory updates |
| Initial | Template created with base setup |
