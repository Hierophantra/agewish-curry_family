---
phase: "08"
plan: "08"
subsystem: "gallery"
tags: ["lightbox", "collections", "photographs", "client-component", "animation"]
dependency_graph:
  requires: ["07-v2-foundation"]
  provides: ["lightbox", "collection-grid", "collection-detail"]
  affects: ["photographs-page", "collection-detail-page", "photo-card"]
tech_stack:
  added: []
  patterns: ["AnimatePresence-lightbox", "server-client-boundary-split", "conditional-render-prop"]
key_files:
  created:
    - components/lightbox/Lightbox.tsx
    - components/gallery/CollectionCard.tsx
    - components/gallery/CollectionGrid.tsx
    - components/gallery/CollectionPhotoGrid.tsx
  modified:
    - components/gallery/PhotoCard.tsx
    - app/(protected)/photographs/page.tsx
    - app/(protected)/photographs/[collectionId]/page.tsx
decisions:
  - "PhotoCard became 'use client' to accept onClick function prop (backward compat preserved)"
  - "CollectionPhotoGrid owns lightbox state; Lightbox is pure presentational"
  - "Photo index counter shown in lightbox (1 / N) per Claude's discretion"
  - "Wrap-around navigation at first/last photo"
metrics:
  duration: "~30 minutes"
  completed: "2026-04-30T08:29:00Z"
  tasks_completed: 7
  files_changed: 7
---

# Phase 8 Plan 08: Photo Collections + Lightbox Summary

**One-liner:** Collection-grid photographs landing + per-collection lightbox using AnimatePresence, keyboard nav, and scroll lock.

## What Was Built

Phase 8 transforms `/photographs` from a flat photo grid into a curator-style collection browser and introduces the shared `<Lightbox />` component.

### Components Created

**`components/lightbox/Lightbox.tsx`** (`'use client'`)
- Full-screen overlay at `rgba(15, 24, 64, 0.95)` (navy-derived dark)
- AnimatePresence opacity fade 250ms; per-photo crossfade via `key={photo.id}`
- Keyboard handlers: Escape → close, ArrowLeft → prev, ArrowRight → next
- Body scroll lock via `useEffect` with cleanup on unmount
- Backdrop click closes; `stopPropagation` on image container prevents accidental close
- Prev/Next/Close buttons in gold (`text-gold`), wrap-around at boundaries
- Caption + dateLabel + photo index counter below image

**`components/gallery/CollectionCard.tsx`** (Server Component)
- 4:3 aspect card with `next/image` cover photo
- Gradient overlay `from-navy/80` for text legibility on any image
- Serif title + italic subtitle + eyebrow dateLabel + photo count
- Hover: `-translate-y-0.5` lift + `shadow-md`, image `scale-[1.02]`

**`components/gallery/CollectionGrid.tsx`** (Server Component)
- Reads all collections via `getCollections()`
- Responsive: 1 col mobile / 2 cols tablet / 3 cols desktop
- Per-card photo count via `getPhotosInCollection(c.id).length`
- Empty state if no collections

**`components/gallery/CollectionPhotoGrid.tsx`** (`'use client'`)
- Owns `lightboxIndex: number | null` state
- Each `PhotoCard` receives `onClick={() => setLightboxIndex(i)}`
- Renders `<Lightbox>` conditionally with wrap-around prev/next
- Empty state if collection has no photos

### Components Modified

**`components/gallery/PhotoCard.tsx`**
- Added `'use client'` directive (required to accept function prop)
- Added optional `onClick?: () => void` prop
- When `onClick` present: renders as `<button>`, no Link navigation
- When `onClick` absent: original Link/article behavior fully preserved
- All existing callers (PhotoGrid → person pages) pass no onClick — unaffected

### Pages Updated

**`app/(protected)/photographs/page.tsx`**
- Replaced flat `<PhotoGrid />` with `<CollectionGrid />`
- Header updated to "Collected memories, organized by theme."

**`app/(protected)/photographs/[collectionId]/page.tsx`**
- Replaced Phase 7 placeholder stub
- Server Component fetches collection + photos, renders header (D-05)
- Delegates interactive photo grid to `CollectionPhotoGrid`
- `generateStaticParams` pre-renders all 3 collection pages

## Build Output

`npm run build` exits 0. Static pages generated:
- `/photographs/christmas-mornings`
- `/photographs/lake-house-summers`
- `/photographs/wedding-days`

## Deviations from Plan

None — plan executed exactly as written.

The only notable implementation detail: `PhotoCard` needed `'use client'` added when the `onClick` prop was introduced. This was anticipated in the context (`D-20..D-22`) and is not a deviation.

## Known Stubs

Photo files referenced in `content/photos.json` (`*.jpg`) are 1×1 placeholder images — per Phase 13 scope. The lightbox and collection cards will render correctly once real photos are added in Phase 13.

## Threat Flags

None. No new network endpoints, auth paths, or schema changes introduced.

## Self-Check

- [x] `components/lightbox/Lightbox.tsx` created
- [x] `components/gallery/CollectionCard.tsx` created
- [x] `components/gallery/CollectionGrid.tsx` created
- [x] `components/gallery/CollectionPhotoGrid.tsx` created
- [x] `components/gallery/PhotoCard.tsx` updated with onClick prop
- [x] `app/(protected)/photographs/page.tsx` updated
- [x] `app/(protected)/photographs/[collectionId]/page.tsx` updated
- [x] `npm run build` exits 0
- [x] 3 collection detail pages pre-rendered
- [x] AnimatePresence present in Lightbox.tsx (count: 4)
- [x] ArrowLeft/ArrowRight/Escape keyboard handlers present
- [x] document.body.style.overflow scroll lock present
- [x] stopPropagation on image container present
- [x] motion/react import present

## Self-Check: PASSED
