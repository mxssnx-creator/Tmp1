# Dashboard Backup System

## Critical Files Backed Up
- `dashboard-page.backup.tsx` - Main dashboard page route
- `dashboard-layout.tsx` - Dashboard layout with providers
- `dashboard-component.backup.tsx` - Dashboard component with all sections

## Important: Dashboard Pages Protected Against Overwriting

The following files should NEVER be auto-generated or overwritten:
1. `app/(dashboard)/page.tsx` - Entry point for dashboard
2. `app/(dashboard)/layout.tsx` - Providers and layout
3. `components/dashboard/dashboard.tsx` - Main dashboard UI

If these files are accidentally deleted or modified:
1. Check .kilo/backups/ for latest backup copies
2. Restore from git history: `git checkout <commit> -- app/(dashboard)/ components/dashboard/`
3. Test with `bun dev` to ensure styling and all sections load

## Dashboard Sections (All Should Load)
- Global Coordinator Status
- System Overview (Smart Overview)
- Trade Engine Controls
- Main Connections (Active Connections Manager)
- Intervals & Strategies Overview
- Statistics Overview V2
- System Monitoring Panel

## Build & Deploy Notes
- CSS/Tailwind loads automatically - check `.next/static/` for CSS chunks
- Pre-startup uses dynamic imports to avoid crypto/fs build errors
- All pages use `export const dynamic = "force-dynamic"` for proper rendering
- No internal server errors when styling loads correctly
