---
phase: 11
plan: 1
subsystem: person-pages
tags: [v2-schema, lightbox, video-integration, person-pages]
dependency_graph:
  requires: [Phase 8 CollectionPhotoGrid, Phase 9 PlaylistVideoGrid, Phase 7 v2 schema]
  provides: [/person/[id] v2 page]
  affects: [PersonPanel "View full page" link target]
tech_stack:
  added: []
  patterns: [v2 schema consumption, server-component data fetching, conditional sections]
key_files:
  created: []
  modified:
    - app/(protected)/person/[id]/page.tsx
decisions:
  - Person page v2 uses eyebrow (gold-deep) for role label and datesLabel (italic serif) for life span; no computed year formatting
  - Photo section uses CollectionPhotoGrid (Phase 8 client wrapper) so clicking a photo opens the shared Lightbox filtered to that person's photos
  - Video section uses PlaylistVideoGrid (Phase 9 client wrapper) so clicking a video opens VideoLightbox
  - Parents and children rendered as linked Person records with /person/[id] hrefs
  - spouseLabel is a plain display string from JSON, not a linked Person record
  - Combined empty state only appears when both photos AND videos are absent (not per-section)
  - PersonPanel "View full page" link unchanged — href /person/${person.id} still resolves correctly after refactor
metrics:
  duration: 74s
  completed: "2026-04-30"
  tasks_completed: 3
  files_modified: 1
---

# Phase 11 Plan 1: Person Pages Refresh Summary

**One-liner:** Person detail pages now render v2 schema fields (eyebrow, datesLabel, spouseLabel) with Lightbox-enabled photo grid and a new "Videos featuring this person" section via PlaylistVideoGrid.

## Tasks Completed

| Task | Description | Commit | Status |
|------|-------------|--------|--------|
| 1 | Refactor /person/[id]/page.tsx to consume v2 schema | 49a1d47 | Done |
| 2 | PersonPanel "View full page" link verification | (no change needed) | Skipped — link confirmed working |
| 3 | Build verification + SUMMARY + state | (docs commit) | Done |

## What Was Built

### Task 1: Person Page v2 Refactor

The `/person/[id]/page.tsx` was completely rewritten from its Phase 6 implementation:

**v2 schema fields consumed:**
- `person.eyebrow` — rendered as gold-deep eyebrow above the h1 (e.g., "Patriarch of the family")
- `person.datesLabel` — rendered as italic serif below the name (e.g., "1920 — 2008")
- `person.spouseLabel` — shown as "Spouse" row in the metadata table (plain string, no Person record)
- `person.birthplace` / `person.birthPlace` (v1 back-compat alias) — "Birthplace" row
- `person.birthDate` (ISO) — formatted as full date via locale string (noon UTC to avoid off-by-one)
- `person.parentIds` / `person.childrenIds` (with `childIds` v1 back-compat) — resolved to linked Person records

**Photo integration:**
- Replaced `PhotoGrid` (Server Component, no lightbox) with `CollectionPhotoGrid` (Phase 8 Client wrapper)
- Clicking any photo opens the shared Lightbox filtered to that person's photos only
- Photo section hidden when `photos.length === 0`

**Video integration (new in Phase 11):**
- Added "Videos featuring {name}" section using `getVideosByPersonId()` from content.ts
- Renders via `PlaylistVideoGrid` (Phase 9 Client wrapper)
- Clicking any video opens VideoLightbox filtered to that person's videos
- Video section hidden when `videos.length === 0`

**Metadata rows:**
- Flat `<dl>` of key-value pairs: Born, Birthplace, Spouse, Parents, Children
- Parents and Children each rendered as comma-separated `<Link>` elements to their `/person/[id]` pages
- Each row only included when data exists (no empty rows)

**Layout:**
- `max-w-5xl mx-auto` (was `max-w-3xl`) — wider to accommodate photo/video grids
- Header with border-b hairline separates eyebrow/name/dates from meta
- Bio section has border-t hairline and `max-w-prose`
- Combined empty state shown only when both photos AND videos are absent

### Task 2: PersonPanel "View full page" Link Verification

Confirmed `PersonPanel.tsx` line 150: `href={\`/person/${person.id}\`}` resolves to the correct page. No changes needed.

### Task 3: Build Verification

`npm run build` exits 0. 22 static pages generated including all 8 person pages:
- /person/william-curry, /person/robert-curry, /person/margaret-curry
- /person/james-curry, /person/sarah-curry, /person/daniel-curry
- /person/emily-walsh, /person/thomas-walsh

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. The page wires to real data from family.json, photos.json, and videos.json. All section content is driven by actual content records.

## Threat Flags

None. No new network endpoints, auth paths, or file access patterns introduced. Page is a read-only Server Component consuming existing content loaders.

## Self-Check: PASSED

- [x] `app/(protected)/person/[id]/page.tsx` exists and contains v2 schema fields
- [x] Commit 49a1d47 exists in git log
- [x] `grep -c "person.eyebrow\|person.datesLabel\|person.spouseLabel"` returns 4 (>= 2)
- [x] `grep -c "CollectionPhotoGrid\|PlaylistVideoGrid"` returns 6 (>= 2)
- [x] `generateStaticParams` returns 8 entries (all people in family.json)
- [x] `npm run build` exits 0, 22 pages generated
