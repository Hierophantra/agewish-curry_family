---
phase: 01-scaffold-auth-design
plan: 01
subsystem: scaffold
tags: [next.js, tailwind, typography, design-system, dependencies]
dependency_graph:
  requires: []
  provides:
    - package.json with all pinned dependencies
    - tsconfig.json with strict mode
    - app/globals.css with full AgeWish @theme palette
    - app/layout.tsx with Inter font variable
    - postcss.config.mjs with Tailwind v4 bridge
  affects:
    - All subsequent plans (foundation layer)
tech_stack:
  added:
    - next@14.2.35
    - next-auth@5.0.0-beta.31
    - tailwindcss@4.2.4
    - "@tailwindcss/postcss@4.2.4"
    - bcryptjs@3.0.3
    - zod@3.25.76
    - clsx@2.1.1
    - tailwind-merge@3.5.0
    - motion@12.38.0
    - relatives-tree@3.2.2
    - react-family-tree@3.2.0
  patterns:
    - Tailwind v4 CSS-first config via @theme {} in globals.css
    - next/font/google with CSS variable injection for @theme reference
    - TypeScript strict mode with noImplicitAny and strictNullChecks
key_files:
  created:
    - package.json
    - package-lock.json
    - tsconfig.json
    - next.config.mjs
    - postcss.config.mjs
    - app/globals.css
    - app/layout.tsx
    - app/page.tsx
    - app/favicon.ico
    - .gitignore
    - .eslintrc.json
  modified: []
decisions:
  - next.config.mjs not next.config.ts — Next.js 14 does not support TypeScript config files (15+ feature)
  - bcryptjs@3.0.3 (not 2.4.3) — v3 is the current latest; plan assumption A1 was outdated
  - zod@3.x pinned — zod v4 released since research; v3 used per plan spec to avoid API changes
  - token names --color-muted/--color-quiet (not --color-text-muted/--color-text-quiet) — avoids Tailwind double-prefix (text-text-muted)
metrics:
  duration: 8m 13s
  completed: 2026-04-30
  tasks_completed: 2
  tasks_total: 2
  files_created: 11
  files_modified: 0
---

# Phase 1 Plan 01: Scaffold + Dependencies + Design Tokens Summary

**One-liner:** Next.js 14.2.35 scaffolded with Tailwind v4 CSS-first @theme palette (8 AgeWish brand tokens), Inter font via next/font CSS variable, all Phase 1 dependencies at pinned versions.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Scaffold project and install all dependencies | 67e053b | package.json, tsconfig.json, next.config.mjs, .gitignore |
| 2 | Configure PostCSS, globals.css @theme block, root layout | 2185f25 | postcss.config.mjs, app/globals.css, app/layout.tsx |

## Decisions Made

1. **next.config.mjs (not .ts):** Next.js 14 does not support TypeScript config files — that is a Next.js 15+ feature. Using `next.config.ts` caused an immediate build error. Auto-fixed by reverting to `.mjs` format.

2. **bcryptjs@3.0.3:** The plan specified `^2.4.3` but bcryptjs v3 is the current latest stable. The research assumption A1 was outdated. bcryptjs v3 has the same API; no code changes needed.

3. **zod@3.x:** npm defaulted to installing zod@4.4.1, but the plan explicitly requires 3.x (to match the Zod schema patterns in the research and avoid breaking API changes). Pinned back to v3.

4. **Token naming — --color-muted / --color-quiet:** Per research Open Questions §1 resolution and PLAN Task 2 instructions, using `--color-muted` (not `--color-text-muted`) to generate `text-muted` (clean) instead of `text-text-muted` (double-prefix). This is locked for all component plans.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] next.config.ts not supported in Next.js 14**
- **Found during:** Task 2, first build attempt
- **Issue:** `next.config.ts` caused build error: "Configuring Next.js via 'next.config.ts' is not supported"
- **Fix:** Replaced with `next.config.mjs` using JSDoc type annotation (standard Next.js 14 pattern)
- **Files modified:** Deleted `next.config.ts`, created `next.config.mjs`
- **Commit:** 2185f25 (included in Task 2 commit)

**2. [Rule 1 - Bug] bcryptjs version mismatch**
- **Found during:** Task 1 npm install
- **Issue:** Plan specified `^2.4.3` but npm installed v3.0.3 (latest). Research assumption A1 was outdated.
- **Fix:** Kept v3.0.3 (same API, newer version). No code changes needed. Documented as decision.
- **Files modified:** package.json records `^3.0.3`
- **Impact:** None — bcryptjs v3 is backward-compatible

**3. [Rule 1 - Bug] zod version mismatch**
- **Found during:** Task 1 npm install
- **Issue:** npm defaulted to zod@4.4.1; plan requires 3.x
- **Fix:** Ran `npm install zod@^3` to pin to v3 (installed 3.25.76)
- **Files modified:** package.json records `^3.25.76`

## Build Verification

```
npm run build → EXIT 0
tsc --noEmit  → EXIT 0 (no TypeScript errors)
```

Build output:
```
Route (app)                              Size     First Load JS
┌ ○ /                                    138 B          87.4 kB
└ ○ /_not-found                          873 B          88.1 kB
```

## Known Stubs

- `app/page.tsx`: temporary root page placeholder — will be replaced by `app/(protected)/page.tsx` in Plan 01-04/01-05

## Threat Surface

No new network endpoints created in this plan. Threat mitigations from T-01-01 and T-01-02 are implemented:
- T-01-01: `@tailwindcss/postcss` (not `tailwindcss` v3 plugin) is confirmed in postcss.config.mjs
- T-01-02: `robots: 'noindex, nofollow'` is set in app/layout.tsx metadata

## Self-Check: PASSED
