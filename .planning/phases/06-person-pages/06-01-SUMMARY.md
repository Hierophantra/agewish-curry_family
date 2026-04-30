---
phase: 06-person-pages
plan: 01
subsystem: person-pages
tags: [person-detail, static-generation, photo-grid, navigation]
dependency_graph:
  requires: [05-03]
  provides: [person-detail-page, photo-grid-prop-variant, person-panel-link]
  affects: [app/(protected)/person/[id]/page.tsx, components/gallery/PhotoGrid.tsx, components/tree/PersonPanel.tsx]
tech_stack:
  added: []
  patterns: [generateStaticParams, notFound, optional-prop-fallback]
key_files:
  created: []
  modified:
    - app/(protected)/person/[id]/page.tsx
    - components/gallery/PhotoGrid.tsx
    - components/tree/PersonPanel.tsx
decisions:
  - photo-filter-uses-peopleIds: Photos filtered by photo.peopleIds.includes(person.id) not person.photoIds — photos tag people, not the reverse
  - photogrid-optional-prop: PhotoGrid accepts optional photos prop; absent = getPhotos() fallback preserves /photographs page without changes
  - view-full-page-eyebrow: "View full page" link styled as eyebrow utility with hover:text-gold — subtle accent consistent with design system
  - link-client-compatible: next/link Link import is fully compatible with 'use client' PersonPanel component
metrics:
  duration: 2m 15s
  completed: 2026-04-30T07:28:02Z
  tasks_completed: 2
  files_modified: 3
requirements_covered:
  - PERSON-01
  - PERSON-02
  - PERSON-03
---

# Phase 6 Plan 1: Person Detail Page + PersonPanel "View Full Page" Link Summary

**One-liner:** Full async person detail page with generateStaticParams (6 pre-rendered routes), notFound() guard, bidirectional relation links, and PhotoGrid prop refactor for filtered photo sets.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Person detail page + PhotoGrid props refactor | 1123a1c | app/(protected)/person/[id]/page.tsx, components/gallery/PhotoGrid.tsx |
| 1b | Comment cleanup (grep-c=1 compliance) | 655d011 | app/(protected)/person/[id]/page.tsx |
| 2 | "View full page" link in PersonPanel + build verification | acf2ee8 | components/tree/PersonPanel.tsx |

## Implementation Notes

### Person Detail Page (app/(protected)/person/[id]/page.tsx)

- `generateStaticParams()` returns `getPeople().map(p => ({ id: p.id }))` — 6 entries, all pre-rendered as static HTML at build time
- `dynamicParams = true` (default) allows new persons to be served on first request without rebuild
- `notFound()` called at async Server Component top level when `getPersonById(params.id)` returns null — proper Next.js 404, not a crash
- Layout sections in order: back link to /tree, "FAMILY ARCHIVE" eyebrow, h1 name, date eyebrow (1920–1998 or b. 1920 format), birthplace italic, bio paragraph, relations section (spouses/children/parents each with Link to /person/{id}), photo grid section
- Relations section only rendered when at least one of spouses/children/parents is non-empty (D-14)
- Photo filter: `getPhotos().filter(p => p.peopleIds.includes(person.id))` — photos tag people, not person.photoIds (D-03)
- All design system constraints respected: eyebrow utility, two-weight rule (font-serif/font-sans, 400/500 only), sentence case, no dynamic Tailwind class interpolation

### PhotoGrid (components/gallery/PhotoGrid.tsx)

- Added optional `photos?: Photo[]` prop via `PhotoGridProps` interface
- Parameter default `= {}` allows `<PhotoGrid />` call (no prop) without TypeScript error
- When `photos` prop provided: uses it directly (person-specific filtered set)
- When `photos` absent: falls back to `getPhotos()` — /photographs page unchanged, no prop required
- Empty state renders "No photographs yet" message (used when person has no tagged photos)

### PersonPanel (components/tree/PersonPanel.tsx)

- Added `import Link from 'next/link'` — compatible with 'use client' components
- "View full page →" link appended as last child of details `<div>` using `mt-auto pt-3` wrapper
- Styled as `eyebrow text-quiet hover:text-gold transition-colors` — subtle accent, consistent with design system
- Uses `→` (U+2192 right arrow) literal character, not HTML entity
- motion import and 'use client' directive preserved

## Build Verification

```
Route (app)                              Size     First Load JS
├ ● /person/[id]                         188 B           101 kB
├   ├ /person/william-curry
├   ├ /person/mary-curry
├   ├ /person/margaret-doe
└   └ [+3 more paths]
```

6 pre-rendered person routes confirmed. `npm run build` exits 0. `npx tsc --noEmit` exits 0.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] File header comment referenced generateStaticParams, causing grep -c to return 2 instead of 1**
- **Found during:** Post-task verification
- **Issue:** Success criteria specified `grep -c "generateStaticParams" ... returns 1`; original file header comment mentioned the function by name, giving count of 2
- **Fix:** Rewrote header comment to avoid the function name; now exactly 1 occurrence (the export declaration)
- **Files modified:** app/(protected)/person/[id]/page.tsx
- **Commit:** 655d011

## Known Stubs

None. All data is wired from family.json via lib/content.ts loaders. Photo filtering uses real data. Relation links navigate to live /person/[id] routes.

## Threat Flags

None. All new surface is inside the (protected) route group with auth() guard from protected layout. params.id is used only as a lookup key against in-memory array — no filesystem path construction, no SQL.

## Self-Check: PASSED

Files exist:
- app/(protected)/person/[id]/page.tsx: FOUND
- components/gallery/PhotoGrid.tsx: FOUND
- components/tree/PersonPanel.tsx: FOUND

Commits exist:
- 1123a1c: FOUND (feat(06-01): implement person detail page + refactor PhotoGrid)
- acf2ee8: FOUND (feat(06-01): add View full page link to PersonPanel)
- 655d011: FOUND (style(06-01): comment cleanup)

grep -c "generateStaticParams": 1 (PASS)
grep -c "notFound": 3 (>= 1, PASS)
grep -c "View full page": 2 (>= 1, PASS)
npm run build: exits 0, 6 pre-rendered /person/[id] routes (PASS)
