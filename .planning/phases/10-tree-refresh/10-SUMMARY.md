---
phase: 10
plan: 1
subsystem: tree
tags: [panel, carousel, lightbox, prototype-fidelity, v2-schema]
dependency_graph:
  requires: [phase-7-v2-foundation, phase-8-lightbox]
  provides: [prototype-matched-panel-ux, lightbox-from-tree]
  affects: [components/tree/PersonPanel.tsx, components/tree/PhotoCarousel.tsx, components/tree/FamilyTreeCanvas.tsx]
tech_stack:
  added: []
  patterns: [css-opacity-crossfade, shared-lightbox-integration, v2-schema-fields]
key_files:
  modified:
    - components/tree/PersonPanel.tsx
    - components/tree/PhotoCarousel.tsx
    - components/tree/FamilyTreeCanvas.tsx
decisions:
  - PersonPanel reads person.eyebrow (not computed) for panel-eyebrow — v2 JSON field is source of truth
  - PhotoCarousel uses CSS opacity transition (not motion/AnimatePresence) to match prototype 1.2s ease-in-out crossfade exactly
  - PhotoCarousel images wrapped in buttons for Lightbox click; z-index ensures only active photo receives clicks
  - FamilyTreeCanvas prefers person.relationLabel over computed label (PATRIARCH vs ROOT; SON vs CHILD etc.)
  - getRelationLabel fallback updated to use childrenIds with childIds back-compat (v1/v2 dual-support)
  - Task 4 required no code changes — FamilyTreeCanvas already correctly passed photos+people from Phase 9
metrics:
  duration: "2m 14s"
  completed: "2026-04-30"
  tasks_completed: 5
  tasks_planned: 5
  files_modified: 3
---

# Phase 10 Plan 1: Tree Panel Refresh Summary

**One-liner:** Prototype-matched PersonPanel UX using v2 schema fields (eyebrow, datesLabel, spouseLabel, birthplace), 4:5 carousel with 1.2s CSS crossfade and shared Lightbox integration.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Refactor PersonPanel to prototype layout | 4401471 |
| 2 | Refactor PhotoCarousel: 4:5, 5px dots, 1.2s, Lightbox | c47ced2 |
| 3 | Use Person.relationLabel for tree node eyebrow | 2c37acf |
| 4 | Verify FamilyTreeCanvas passes photos+people to PersonPanel | (no changes needed) |
| 5 | Build verification (npm run build exits 0) | (included in docs commit) |

## What Was Built

### PersonPanel (Task 1)

Fully refactored to match the prototype's `.panel-*` CSS class structure:

- **panel-eyebrow**: `text-gold-deep uppercase tracking-[0.22em]` at `font-size: 10px` — reads `person.eyebrow` (v2), falls back to `person.relationLabel`
- **panel-name**: `font-serif text-navy` at `font-size: 30px, font-weight: 400` — matches prototype `.panel-name`
- **panel-dates**: `font-serif italic text-muted` at `font-size: 14px` — reads `person.datesLabel` (v2 display label)
- **panel-meta**: key-value rows at 13px, `hairline` top border, `padding-top: 22px`, `gap: 14px`
  - Rows: Born (formatted from `birthDate` ISO or `birthYear`), Birthplace (`person.birthplace` with `birthPlace` v1 fallback), Spouse (`person.spouseLabel`), Children (resolved names from `childrenIds`/`childIds`, shows "(none)" when empty)
  - Rows with no data are skipped
- **panel-bio**: `font-serif italic text-muted` at `14px`, `hairline` top border, `margin-top: 22px`
- **22px horizontal padding** throughout (matches prototype panel padding)
- D-16 mobile bottom-sheet + md+ right panel preserved
- Phase 6 "View full page" link preserved

### PhotoCarousel (Task 2)

- `aspect-[4/5]` container (was `aspect-[4/3]`) — THE critical visual change
- **CSS opacity transition** at `1.2s ease-in-out` per prototype `.panel-img { transition: opacity 1.2s ease-in-out }` — replaced `motion/AnimatePresence` crossfade (was 0.6s)
- **Auto-advance**: `4000ms` per prototype `setInterval(..., 4000)` (was 6000ms)
- **Dots**: `5×5px` via `style` prop, `gap: 6px`; `bg-gold` active, `bg-stone` inactive
- **Lightbox integration**: images wrapped in `<button>` elements; click opens shared `Lightbox` component at clicked index; `lightboxIndex` state owned by PhotoCarousel
- **Empty state**: 4:5 ivory placeholder with `font-serif italic text-muted` "No photographs of this person yet"

### FamilyTreeCanvas (Task 3)

- Node labels now prefer `person?.relationLabel` from v2 JSON (e.g., "PATRIARCH", "SON", "GRANDDAUGHTER") over computed depth-based labels (was "ROOT", "CHILD", "GRANDCHILD")
- `getRelationLabel` fallback updated: traverses `childrenIds` (v2) with `childIds` (v1) fallback
- Task 4 verified: canvas already correctly passes `photos` and `people` to `PersonPanel` (implemented in Phase 9) — no changes needed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] FamilyTreeCanvas getRelationLabel used v1 childIds only**
- **Found during:** Task 3 review
- **Issue:** `getRelationLabel` traversed `person.childIds` (v1 back-compat alias) instead of `childrenIds` (v2 canonical). With v2 JSON where `childrenIds` is populated and `childIds` is identical, this worked — but would silently fail for data with only `childrenIds` set.
- **Fix:** Updated to use `childrenIds` with `childIds` fallback in both traversal paths
- **Files modified:** `components/tree/FamilyTreeCanvas.tsx`
- **Commit:** 2c37acf

**2. Task 4 required no code changes**
- **Found during:** Task 4 verification
- **Context:** `FamilyTreeCanvas` props interface already included `photos: Photo[]` and `people: Person[]` from Phase 9; tree page already called `getPhotos()` and passed both arrays. No gap existed.
- **Action:** Verified and documented, no commit needed.

## Success Criteria Verification

| Criterion | Status | Evidence |
|-----------|--------|---------|
| PersonPanel reads `person.eyebrow` | PASS | `grep -c "person.eyebrow" >= 1` |
| PersonPanel reads `person.datesLabel` | PASS | used in panel-dates section |
| PersonPanel reads `person.spouseLabel` | PASS | used in meta Spouse row |
| PersonPanel reads `person.birthplace` | PASS | used in meta Birthplace row |
| PhotoCarousel `aspect-[4/5]` | PASS | `grep -c "aspect-\[4/5\]" = 2` |
| PhotoCarousel dots 5×5px | PASS | `style={{ width: '5px', height: '5px' }}` |
| PhotoCarousel crossfade 1.2s | PASS | `CROSSFADE_MS = 1200` |
| PhotoCarousel auto-advance 4s | PASS | `AUTO_ADVANCE_MS = 4000` |
| Click carousel → shared Lightbox | PASS | imports + renders `Lightbox` from `@/components/lightbox/Lightbox` |
| Lightbox import in PhotoCarousel | PASS | `grep -c "from '@/components/lightbox/Lightbox'" = 1` |
| PersonNode reads relationLabel | PASS | reads from prop; canvas now passes v2 field |
| `npm run build` exits 0 | PASS | 22 static pages, 0 errors |
| SUMMARY.md written | PASS | this file |

## Known Stubs

None. All data fields are wired from `content/family.json` v2 JSON through the component tree. No placeholder text flows to UI rendering.

## Threat Flags

None. No new network endpoints, auth paths, file access patterns, or schema changes introduced.

## Self-Check: PASSED

- `components/tree/PersonPanel.tsx` — exists, reads v2 fields
- `components/tree/PhotoCarousel.tsx` — exists, aspect-[4/5], Lightbox import
- `components/tree/FamilyTreeCanvas.tsx` — exists, passes photos+people, uses person.relationLabel
- Commits 4401471, c47ced2, 2c37acf — all present in git log
