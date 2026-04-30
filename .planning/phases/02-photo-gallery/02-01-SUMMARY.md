---
phase: 02-photo-gallery
plan: 01
subsystem: ui
tags: [next/image, server-components, photo-gallery, tailwind-v4]

# Dependency graph
requires:
  - phase: 01-scaffold-auth
    provides: lib/content.ts getPhotos(), lib/types.ts Photo type, app/(protected) route group with auth layout, globals.css eyebrow utility and Tailwind v4 tokens
provides:
  - PhotoCard Server Component (components/gallery/PhotoCard.tsx)
  - PhotoGrid Server Component (components/gallery/PhotoGrid.tsx)
  - /photographs page wired to real content (app/(protected)/photographs/page.tsx)
  - Stub JPEG files for all content/photos.json entries (public/photos/placeholder-*.jpg)
affects: [03-video-gallery, 06-person-detail]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server Component data fetching: PhotoGrid calls getPhotos() directly (no async needed — content.ts is synchronous fs.readFileSync)"
    - "Inline date formatting: dateTaken ISO 8601 string formatted to 'MONTH YYYY' uppercase via toLocaleDateString with timeZone UTC at noon to avoid off-by-one"
    - "Conditional Link wrapping: PhotoCard wraps article in Link only when peopleIds.length > 0 (per D-20)"
    - "Chronological sort: localeCompare on ISO date strings (lexicographic == chronological for YYYY-MM-DD); missing dateTaken sorts last"

key-files:
  created:
    - components/gallery/PhotoCard.tsx
    - components/gallery/PhotoGrid.tsx
    - public/photos/placeholder-001.jpg
    - public/photos/placeholder-002.jpg
  modified:
    - app/(protected)/photographs/page.tsx

key-decisions:
  - "dateTaken formatted inline in PhotoCard with toLocaleDateString — no dateLabel field on Photo type; no preprocessing in PhotoGrid"
  - "Stub images written as minimal valid JPEG (335 bytes) using hardcoded byte sequence — avoids ImageMagick/sharp dependency at dev time"
  - "No location field rendered — Photo type does not include location (per plan constraint)"
  - "New filenames in content/photos.json require a matching file in public/photos/ or next/image throws at request time — documented warning"

patterns-established:
  - "Gallery Server Component pattern: fetch in grid component, pass individual items to card component, no props drilling of array"
  - "Empty state inline in grid component — no separate EmptyState component needed at this scale"

requirements-completed: [PHOTO-01, PHOTO-02, PHOTO-03, PHOTO-04]

# Metrics
duration: 8min
completed: 2026-04-29
---

# Phase 2 Plan 01: PhotoCard + PhotoGrid Server Components Summary

**Photo gallery built end-to-end: two Server Components (PhotoGrid + PhotoCard) wire /photographs to real content with chronological sort, graceful empty state, and stub images for all content/photos.json entries.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-29T00:00:00Z
- **Completed:** 2026-04-29T00:08:00Z
- **Tasks:** 2 completed
- **Files modified:** 5 (3 created, 1 replaced, 2 new binary stubs)

## Accomplishments

- PhotoCard Server Component renders 4:3 aspect image via next/image fill, date eyebrow (formatted inline from dateTaken), caption, and conditional Link wrapper for person-linked photos
- PhotoGrid Server Component fetches via getPhotos(), sorts chronologically oldest-first (missing dates last), renders responsive 1→2→3→4 column grid, and falls back to a centered empty-state message
- /photographs page replaced from "Coming in Phase 2" placeholder to FAMILY ARCHIVE eyebrow + serif h1 + PhotoGrid
- Stub JPEG files written for all filenames in content/photos.json so next/image resolves without 404
- npm run build exits 0 with both full and empty photos.json

## Task Commits

1. **Task 1: Build PhotoCard + PhotoGrid components and wire the photographs page** - `1bc5948` (feat)
2. **Task 2: Create stub photo files in /public/photos/** - `9bd0540` (feat)

## Files Created/Modified

- `components/gallery/PhotoCard.tsx` - Server Component; 4:3 image container, date eyebrow (MONTH YYYY format), caption, conditional Link to /person/[id] when peopleIds present
- `components/gallery/PhotoGrid.tsx` - Server Component; calls getPhotos(), sorts chronologically, renders grid or empty state
- `app/(protected)/photographs/page.tsx` - Replaced placeholder; FAMILY ARCHIVE eyebrow, "Photographs" h1, subtitle, PhotoGrid
- `public/photos/placeholder-001.jpg` - Minimal valid JPEG (335 bytes) stub for photo-001
- `public/photos/placeholder-002.jpg` - Minimal valid JPEG (335 bytes) stub for photo-002

## Decisions Made

- **dateTaken formatted inline:** Photo type has no dateLabel field. PhotoCard calls `new Date(dateTaken + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).toUpperCase()` — noon UTC prevents timezone-off-by-one for YYYY-MM-DD strings.
- **Stub images as JPEG binary:** Minimal 335-byte JPEG written with Node.js Buffer from hardcoded byte sequence. No external tool dependency (ImageMagick, sharp) needed at dev time.
- **No location field:** Photo type does not include location — skip render as specified.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

| Stub | File | Line | Reason |
|------|------|------|--------|
| placeholder-001.jpg | public/photos/placeholder-001.jpg | — | 1x1 JPEG placeholder; real photo to be added when digitised |
| placeholder-002.jpg | public/photos/placeholder-002.jpg | — | 1x1 JPEG placeholder; real photo to be added when digitised |

These stubs are intentional. The plan goal (render photo cards without 404 errors) is achieved. Actual photographs replace these files without code changes.

**Warning for future content editors:** Any new filename added to `content/photos.json` must have a matching file in `public/photos/` before running `npm run dev` or `npm run build`, or next/image will throw at request time.

## Self-Check: PASSED

- `components/gallery/PhotoCard.tsx` — FOUND
- `components/gallery/PhotoGrid.tsx` — FOUND
- `app/(protected)/photographs/page.tsx` — FOUND (contains PhotoGrid)
- `public/photos/placeholder-001.jpg` — FOUND (335 bytes)
- `public/photos/placeholder-002.jpg` — FOUND (335 bytes)
- Commit `1bc5948` — FOUND
- Commit `9bd0540` — FOUND
- No `'use client'` directive in components/gallery/*.tsx — VERIFIED
- `npm run build` exits 0 (full and empty photos.json) — VERIFIED
