---
phase: 01-scaffold-auth-design
plan: "04"
subsystem: ui
tags: [svg, react, server-component, auth, next-auth, route-groups, tailwind]

# Dependency graph
requires:
  - phase: 01-02
    provides: auth.ts exports — auth(), signIn, signOut — used by protected layout
  - phase: 01-01
    provides: globals.css @theme tokens — text-navy, text-muted, font-serif classes used in placeholder pages
provides:
  - StarMark 7-pointed gold star inline SVG Server Component (size prop, gold fill #E8A91F, aria-hidden)
  - app/(auth)/layout.tsx — minimal wrapper layout for login page (no nav, no footer)
  - app/(protected)/layout.tsx — async Server Component auth() defence-in-depth gate (redirect /login on null session)
  - app/(protected)/tree/page.tsx — placeholder page for Phase 4 family tree
  - app/(protected)/photographs/page.tsx — placeholder page for Phase 2 photo gallery
  - app/(protected)/films/page.tsx — placeholder page for Phase 3 video gallery
  - app/(protected)/person/[id]/page.tsx — placeholder page for Phase 6 person detail (kebab-case id)
affects:
  - 01-05 (TopNav + Footer will import StarMark and plug into the protected layout shell)
  - Phase 2 (photographs page scaffold ready for gallery implementation)
  - Phase 3 (films page scaffold ready for video gallery implementation)
  - Phase 4 (tree page scaffold ready for family tree implementation)
  - Phase 6 (person/[id] scaffold ready, kebab-case id convention in place)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server Component inline SVG via generateStarPath geometry function (7-pointed heptagram)
    - Route group layouts — (auth) minimal, (protected) with auth() gate
    - Defence-in-depth: await auth() in layout independently of middleware (CVE-2025-29927)
    - Import from @/auth (not next-auth/next) — v5 API

key-files:
  created:
    - components/ui/StarMark.tsx
    - app/(auth)/layout.tsx
    - app/(protected)/layout.tsx
    - app/(protected)/tree/page.tsx
    - app/(protected)/photographs/page.tsx
    - app/(protected)/films/page.tsx
    - app/(protected)/person/[id]/page.tsx
  modified: []

key-decisions:
  - "StarMark uses inline generateStarPath geometry (no /public/brand/star.svg) — generates heptagram with outerR=size/2, innerR=outerR*0.45, starting from 12 o'clock"
  - "Protected layout is a stub shell (no TopNav/Footer yet) — Plan 05 wires nav components; TODO comments document this"
  - "(auth)/layout.tsx is a transparent fragment wrapper — no html structure that would conflict with the login page's own centered layout"

patterns-established:
  - "Pattern: StarMark Server Component with size prop and inline SVG for 7-pointed gold star"
  - "Pattern: Route group (protected)/layout.tsx always calls await auth() regardless of middleware"
  - "Pattern: Import auth from '@/auth' (not 'next-auth/next') for all Server Component auth checks"

requirements-completed:
  - DESIGN-04
  - DESIGN-05
  - DESIGN-06
  - DESIGN-07
  - AUTH-04
  - FOUND-03

# Metrics
duration: 2m 1s
completed: "2026-04-30"
---

# Phase 1 Plan 04: Components + Route Groups Summary

**Inline 7-pointed gold star SVG Server Component, (auth)/(protected) route group layouts with defence-in-depth auth() gate, and 4 placeholder pages scaffolding Phases 2-6**

## Performance

- **Duration:** 2m 1s
- **Started:** 2026-04-30T04:38:55Z
- **Completed:** 2026-04-30T04:40:56Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- StarMark Server Component renders a 7-pointed heptagram via `generateStarPath` geometry; no `'use client'`, no browser APIs, gold fill `#E8A91F`, `aria-hidden="true"`
- Protected layout calls `await auth()` independently of middleware — mitigates CVE-2025-29927; imports from `@/auth` (v5 pattern, not `next-auth/next`)
- Four placeholder pages establish the physical folder structure for route groups `/tree`, `/photographs`, `/films`, `/person/[id]`; `npm run build` exits 0 with all 8 routes generated

## Task Commits

Each task was committed atomically:

1. **Task 1: Create StarMark SVG component** - `83ea3e1` (feat)
2. **Task 2: Create route group layouts and placeholder pages** - `f6abc27` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `components/ui/StarMark.tsx` — Server Component, inline 7-pointed star SVG, size/className props, gold fill, aria-hidden
- `app/(auth)/layout.tsx` — minimal React fragment wrapper, no nav/footer
- `app/(protected)/layout.tsx` — async Server Component; await auth() gate; redirect('/login') on null; TODO comments for Plan 05 TopNav/Footer
- `app/(protected)/tree/page.tsx` — placeholder with font-serif text-navy heading, text-muted copy
- `app/(protected)/photographs/page.tsx` — placeholder with font-serif text-navy heading, text-muted copy
- `app/(protected)/films/page.tsx` — placeholder with font-serif text-navy heading, text-muted copy
- `app/(protected)/person/[id]/page.tsx` — placeholder; renders params.id from kebab-case URL segment

## Decisions Made

- Generated star path inline via `generateStarPath` (no `/public/brand/star.svg`); inner radius ratio 0.45 for balanced heptagram
- Protected layout renders a minimal shell (no TopNav/Footer) to avoid broken imports; Plan 05 wires the nav components
- `(auth)/layout.tsx` wraps with a React fragment (`<>{children}</>`) — no extra HTML that would interfere with the login page's full-screen centered layout

## Deviations from Plan

None — plan executed exactly as written. The plan explicitly specified stub layout comments (TODO Plan 05) for nav components, which were followed as specified.

## Known Stubs

| Stub | File | Reason |
|------|------|--------|
| TopNav slot (comment only) | `app/(protected)/layout.tsx:14-15` | Intentional — Plan 05 creates TopNav and wires it here |
| Footer slot (comment only) | `app/(protected)/layout.tsx:19-20` | Intentional — Plan 05 creates Footer and wires it here |

These stubs do NOT prevent the plan's goal from being achieved — the auth gate and placeholder pages compile and serve correctly without nav.

## Issues Encountered

None — TypeScript strict mode passed cleanly, build exits 0 on all 8 routes.

## Threat Surface Scan

T-04-01 mitigated: `await auth()` called in `app/(protected)/layout.tsx` independently of middleware (CVE-2025-29927 defence-in-depth).
T-04-03 mitigated: import uses `from '@/auth'` (not `next-auth/next`), confirmed in acceptance criteria.
T-04-02 accepted: `app/(protected)/person/[id]/page.tsx` renders `params.id` in a placeholder heading — Phase 6 adds proper handling.

No new security surface beyond what was planned.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- StarMark is ready for import into TopNav and Footer (Plan 05)
- Protected layout shell is ready for TopNav/Footer to be plugged in (Plan 05)
- Placeholder pages scaffold all route groups for Phases 2-6
- No blockers

---
*Phase: 01-scaffold-auth-design*
*Completed: 2026-04-30*
