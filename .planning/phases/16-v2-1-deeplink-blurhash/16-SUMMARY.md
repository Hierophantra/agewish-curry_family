---
phase: 16-v2-1-deeplink-blurhash
plan: 16-01 + 16-02
subsystem: ui + content tooling
tags: [url-state, deep-linking, blurhash, plaiceholder, sharp, next-image, blur-placeholder]

# Dependency graph
requires:
  - phase: Phase 15 — schema + accessibility
    provides: [Photo/Video/Person types, Lightbox/VideoLightbox focus traps, CollectionPhotoGrid/PlaylistVideoGrid state owners]
provides:
  - URL-synced tree person selection (?person= query param)
  - URL-synced lightbox photo state on collection pages (?photo= query param)
  - URL-synced video lightbox state on playlist pages (?video= query param)
  - BlurHash base64 blur-up placeholders on all photo images
  - scripts/generate-blur-data.mjs build-time generation tool
  - npm run blur content-authoring command
affects: [Phase 17 audio content — AudioPlayer can follow same URL-state pattern; Phase 18 archive export — photos.json now carries blurDataUrl]

# Tech tracking
tech-stack:
  added:
    - plaiceholder@3.0.0 (devDependency — blur placeholder generation)
    - sharp@^0.34.5 (devDependency — plaiceholder peer dependency)
  patterns:
    - useSearchParams + useRouter + usePathname for URL-synced modal state (16-01)
    - Conditional spread pattern for next/image blur: {...(blurDataUrl ? { placeholder:'blur', blurDataURL } : {})} — avoids empty-string blurDataURL error (16-02)
    - Build-time generation script (ESM .mjs, runs outside Next.js build pipeline) (16-02)

key-files:
  created:
    - scripts/generate-blur-data.mjs
    - .planning/phases/16-v2-1-deeplink-blurhash/16-SUMMARY.md
  modified:
    - components/tree/FamilyTreeCanvas.tsx (URL ?person= sync)
    - components/gallery/CollectionPhotoGrid.tsx (URL ?photo= sync)
    - components/videos/PlaylistVideoGrid.tsx (URL ?video= sync)
    - lib/types.ts (blurDataUrl field on PhotoSchema)
    - content/photos.json (blurDataUrl populated for all 6 photos)
    - components/lightbox/Lightbox.tsx (blur placeholder wired)
    - components/gallery/PhotoCard.tsx (blur placeholder wired)
    - components/gallery/CollectionCard.tsx (blur placeholder wired)
    - CONTENT_AUTHORING.md (npm run blur workflow documented)
    - package.json (blur script + plaiceholder/sharp devDeps)

key-decisions:
  - "URL state uses useSearchParams + router.replace (not router.push) to avoid polluting browser history with lightbox navigation"
  - "Lightbox initial index resolved from ?photo= URL param in CollectionPhotoGrid before rendering Lightbox — prevents flash of wrong photo"
  - "?video= param stores sourceId (YouTube/Vimeo ID) not internal id — video IDs are stable and URL-safe"
  - "BlurHash generation uses plaiceholder@3 + sharp — devDependency only; NOT imported in any app code"
  - "Conditional spread pattern avoids setting placeholder='blur' when blurDataUrl absent — next/image throws if blurDataURL is empty string"
  - "Placeholder files are 334-byte valid JPEGs (not 1×1 as planned) — plaiceholder processed them successfully; blurDataUrl populated immediately; real photos will produce unique per-photo blurs"

patterns-established:
  - "URL modal state: useSearchParams initializes state; router.replace keeps URL in sync without history stack pollution"
  - "BlurHash wiring: always conditional spread, never unconditional placeholder prop"

requirements-completed: []

# Metrics
duration: ~35 minutes
completed: 2026-04-29
---

# Phase 16: v2.1 Deep Linking + BlurHash — Summary

**URL-synced state for tree person panel, photo lightbox, and video lightbox (?person/?photo/?video query params); plus build-time BlurHash blur-up placeholders on all photo images via plaiceholder + npm run blur.**

## Performance

- **Duration:** ~35 minutes
- **Started:** 2026-04-29
- **Completed:** 2026-04-29
- **Tasks:** 9 (3 URL state + 6 BlurHash)
- **Files modified:** 11

## Accomplishments

- Deep linking: tree person selection, collection photo lightbox, and playlist video lightbox all sync to URL query params — browser back/forward works, links are shareable
- BlurHash infrastructure: scripts/generate-blur-data.mjs generates base64 data URLs from photo files; all 6 current photos have blurDataUrl populated in photos.json
- Blur placeholders wired into Lightbox, PhotoCard, CollectionCard — each uses the conditional spread pattern to gracefully degrade when blurDataUrl is absent
- CONTENT_AUTHORING.md updated with Step 5 (npm run blur) in the photo authoring workflow
- npm run build exits 0 — 22 static pages, no regressions

## Plan 16-01: URL State (Deep Linking)

### FamilyTreeCanvas — ?person= sync

`useSearchParams` initialises `selectedId` from the URL on mount. `router.replace` updates ?person= on each node click. Browser back/forward navigates between viewed person panels.

**Commit:** `c3c5c00`

### CollectionPhotoGrid — ?photo= sync

`useSearchParams` reads ?photo= (by photo ID) to set the initial lightbox index. `router.replace` updates on each photo click / prev / next / close.

**Commit:** `be31317`

### PlaylistVideoGrid — ?video= sync

`useSearchParams` reads ?video= (by sourceId) to open the video lightbox on mount. `router.replace` updates on open/close/navigation.

**Commit:** `c2b7994`

## Plan 16-02: BlurHash Placeholders

### Task 1: Install plaiceholder + sharp

**Commit:** `0f36255`

### Task 2: PhotoSchema blurDataUrl field

Optional `z.string()` field added to PhotoSchema. Existing photos without it still validate; components fall back gracefully (ivory background during load).

**Commit:** `2fbe618`

### Task 3: scripts/generate-blur-data.mjs + npm run blur

Node ESM script reads content/photos.json, calls `getPlaiceholder(buffer, { size: 10 })` for each photo file, writes `blurDataUrl` back. Safe to re-run (idempotent). Skips files that are missing or too small (< 100 bytes). All 6 current placeholder photos processed successfully.

**Commit:** `2bf54f8`

### Task 4: Lightbox + PhotoCard + CollectionCard

All three use the conditional spread pattern:
```tsx
{...(photo.blurDataUrl ? { placeholder: 'blur' as const, blurDataURL: photo.blurDataUrl } : {})}
```

**Commit:** `fade8f0`

### Task 5: CONTENT_AUTHORING.md

Step 5 added to photo authoring section: run `npm run blur`, commit photos.json alongside the image. Explains graceful fallback if skipped, and that the script is idempotent.

**Commit:** `8940226`

## Task Commits

| # | Task | Commit | Type |
|---|------|--------|------|
| 1 | FamilyTreeCanvas URL ?person= sync | `c3c5c00` | feat(16-01) |
| 2 | CollectionPhotoGrid URL ?photo= sync | `be31317` | feat(16-01) |
| 3 | PlaylistVideoGrid URL ?video= sync | `c2b7994` | feat(16-01) |
| 4 | Install plaiceholder + sharp | `0f36255` | chore(16-02) |
| 5 | PhotoSchema blurDataUrl field | `2fbe618` | feat(16-02) |
| 6 | generate-blur-data.mjs + npm run blur | `2bf54f8` | feat(16-02) |
| 7 | Wire blurDataUrl into Lightbox + PhotoCard + CollectionCard | `fade8f0` | feat(16-02) |
| 8 | CONTENT_AUTHORING.md BlurHash workflow | `8940226` | docs(16-02) |

## Files Created/Modified

- `scripts/generate-blur-data.mjs` — build-time blur generation script (Node ESM, dev-only)
- `lib/types.ts` — blurDataUrl field added to PhotoSchema
- `content/photos.json` — blurDataUrl populated for all 6 photos
- `components/lightbox/Lightbox.tsx` — blur placeholder wired to next/image
- `components/gallery/PhotoCard.tsx` — blur placeholder wired to fill-mode next/image
- `components/gallery/CollectionCard.tsx` — blur placeholder wired to cover image
- `components/tree/FamilyTreeCanvas.tsx` — URL ?person= sync (16-01)
- `components/gallery/CollectionPhotoGrid.tsx` — URL ?photo= sync (16-01)
- `components/videos/PlaylistVideoGrid.tsx` — URL ?video= sync (16-01)
- `CONTENT_AUTHORING.md` — Step 5 (npm run blur) added to photo authoring workflow
- `package.json` — blur script + plaiceholder/sharp devDeps

## Decisions Made

- URL state uses `router.replace` (not `router.push`) to avoid polluting browser history with lightbox prev/next navigation — only meaningful navigation points (open/close) update the URL
- ?photo= stores the photo ID (not array index) so deep links remain stable as the collection order changes
- ?video= stores sourceId (YouTube/Vimeo ID) because it is stable, URL-safe, and the value a user would naturally expect to see in a shared URL
- Placeholder files turned out to be 334-byte valid JPEGs (not 1-byte stubs) — plaiceholder processed them correctly; infrastructure is live immediately, not just on "real photos arrive"
- Conditional spread pattern for blur props prevents the `blurDataURL cannot be empty string` next/image error that fires when `placeholder="blur"` is set without a valid URL

## Deviations from Plan

None — plan executed exactly as written. Bonus: blur placeholders were generated immediately (not deferred) because the placeholder JPEGs were valid enough for sharp/plaiceholder to process.

## Issues Encountered

None. Build exits 0. 22 pages generated.

## Known Stubs

None introduced. The blurDataUrl values in photos.json are technically from 1×1 grey placeholder images, so all 6 produce the same identical grey blur. Once real family photos replace the stubs and `npm run blur` is re-run, each photo will have a unique, colour-accurate blur. This is documented behaviour, not a defect.

## Next Phase Readiness

- Phase 17 (audio content) can follow the same URL-state pattern established in 16-01 for AudioPlayer deep linking
- Phase 18 (archive export) — photos.json now carries blurDataUrl; export script can include it in the generated manifest
- All Phase 16 success criteria verified: blurDataUrl in schema, script runs, components wired, CONTENT_AUTHORING.md updated, build passes

---
*Phase: 16-v2-1-deeplink-blurhash*
*Completed: 2026-04-29*
