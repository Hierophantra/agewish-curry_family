---
phase: 18-v2-1-export-slideshow
plan: 18-01 + 18-02
subsystem: ui, api
tags: [jszip, next-api-route, ambient-slideshow, framer-motion, animation, archive-export]

requires:
  - phase: 17-v2-1-audio
    provides: AudioSchema, audio content type, Phase 17 build baseline
  - phase: 16-v2-1-deeplink-blurhash
    provides: blurDataUrl on PhotoSchema, URL-synced state patterns
  - phase: 15-v2-1-schema-a11y
    provides: useReducedMotion pattern, focus trap, ARIA patterns
  - phase: 08-collections-lightbox
    provides: getPhotosInCollection, getCollectionById, Photo type

provides:
  - /api/archive route handler generating manifest.zip (all content JSON + index.html + photos)
  - /slideshow ambient mode: shuffle, 8s auto-advance, 1.2s crossfade, keyboard nav
  - SlideshowPlayer client component
  - Slideshow links from /photographs and collection detail pages
  - Footer "Download the archive" link

affects: [v2.2-planning, tv-deployment, content-authoring]

tech-stack:
  added:
    - jszip (zip generation in /api/archive)
  patterns:
    - Server Component fetches + passes to Client player (SlideshowPlayer pattern)
    - fixed inset-0 z-50 for full-screen overlay covering protected layout chrome
    - useRef for stable mutable state across renders (shuffled photos array)
    - prefers-reduced-motion + AnimatePresence for ambient crossfade (Phase 15 standard maintained)
    - Auto-hide controls via setTimeout ref pattern

key-files:
  created:
    - app/(protected)/slideshow/page.tsx
    - components/slideshow/SlideshowPlayer.tsx
    - app/api/archive/route.ts
    - lib/archive-template.ts
  modified:
    - app/(protected)/photographs/page.tsx
    - app/(protected)/photographs/[collectionId]/page.tsx
    - components/layout/Footer.tsx
    - CONTENT_AUTHORING.md
    - README.md

key-decisions:
  - "SlideshowPlayer uses fixed inset-0 z-50 to cover protected layout TopNav/Footer — no dedicated layout.tsx needed"
  - "Shuffle on mount via useRef<Photo[]> — mutable ref avoids re-render on shuffle; currentIndex state drives display"
  - "useReducedMotion() from motion/react respects OS preference — crossfade duration 0 when reduced motion active"
  - "Controls counter uses shuffled.current.length with fallback to photos.length for pre-shuffle render"
  - "/api/archive generates zip on demand (no build-time artifact) — simpler than static export; acceptable for infrequent use"

requirements-completed: []

duration: ~20min
completed: 2026-04-29
---

# Phase 18: v2.1 Archive Export + Slideshow Summary

**On-demand manifest.zip archive export via /api/archive and full-screen ambient /slideshow with 8s shuffle, 1.2s crossfade, keyboard nav, and collection filtering**

## Performance

- **Duration:** ~20 min (18-01 archive export + 18-02 slideshow)
- **Started:** 2026-04-29
- **Completed:** 2026-04-29
- **Tasks:** 7 (4 in 18-01 + 3 in 18-02)
- **Files created/modified:** ~10

## Accomplishments

### Plan 18-01: Archive Export

- `/api/archive` route handler: generates `manifest.zip` on demand using jszip
- Zip includes all `content/*.json` files + `index.html` static viewer + all `/public/photos/*`
- `lib/archive-template.ts`: generates a self-contained HTML viewer with embedded family data
- Footer "Download the archive" link exposed to family members
- `CONTENT_AUTHORING.md` updated with archive workflow documentation

### Plan 18-02: Slideshow / Ambient Mode

- `/slideshow` route: Server Component fetches photos (optionally filtered by `?collection=`), passes to `SlideshowPlayer`
- `SlideshowPlayer`: shuffle on mount, 8s auto-advance via `setInterval`, 1.2s `AnimatePresence` crossfade
- Keyboard `←`/`→` navigation while auto-advance runs simultaneously
- Controls overlay auto-hides after 3s of mouse inactivity (ambient feel)
- Caption + date always visible at bottom (informational, not purely decorative)
- `prefers-reduced-motion` respected: crossfade duration collapses to 0
- `blurDataUrl` placeholder flows naturally from Phase 16 `PhotoSchema`
- Empty state when no photos available
- Slideshow links added to `/photographs` header and collection detail page headers

## Task Commits

### 18-01 commits

1. **chore(18-01): add jszip** - `dfcdb6b`
2. **feat(18-01): archive HTML template generator** - `0c8952b`
3. **feat(18-01): /api/archive route** - `dca2bc9`
4. **feat(18-01): Footer download link** - `22ad5a7`
5. **docs(18-01): CONTENT_AUTHORING + README** - `971ac53`

### 18-02 commits

1. **feat(18-02): /slideshow page + SlideshowPlayer** - `b05fb1c`
2. **feat(18-02): slideshow links from /photographs and collection detail** - `984ad0c`

## Files Created/Modified

- `app/(protected)/slideshow/page.tsx` - Server Component: fetch photos by collection filter, pass to player
- `components/slideshow/SlideshowPlayer.tsx` - Client component: shuffle, auto-advance, crossfade, keyboard, controls
- `app/api/archive/route.ts` - API route: generate and stream manifest.zip
- `lib/archive-template.ts` - Generate self-contained HTML viewer
- `app/(protected)/photographs/page.tsx` - Added "Play ambient slideshow →" link
- `app/(protected)/photographs/[collectionId]/page.tsx` - Added "Play this collection as a slideshow →" link
- `components/layout/Footer.tsx` - Added "Download the archive" link
- `CONTENT_AUTHORING.md` - Archive workflow documentation
- `README.md` - Updated with v2.1 status

## Decisions Made

- `SlideshowPlayer` uses `fixed inset-0 z-50` to cover the protected layout's `TopNav`/`Footer` without needing a special `layout.tsx` wrapper — cleaner solution as both components render above normal flow
- Shuffle stored in `useRef<Photo[]>` not state, so the shuffle happens once on mount without triggering a re-render
- `?collection=` filtering handled server-side (Server Component) — same pattern as `/photographs/[collectionId]`
- Auto-advance interval is not reset on manual keyboard nav — interval continues in background, manual nudge is additive. Simpler logic, acceptable UX for ambient mode.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. Build passed first attempt: `npm run build` → 24 pages, exit 0. `/slideshow` appears in route table.

## Threat Flags

None - slideshow is read-only, no new network endpoints beyond those documented in 18-01. No trust boundary changes.

## Known Stubs

None. All data flows through `getPhotos()` / `getPhotosInCollection()` from live `photos.json`. No hardcoded values.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 18 is the final phase of v2.1. The v2.1 milestone is now complete.

**v2.1 delivered:**
- Phase 14: Nav upgrade, panel restructure, fonts/colors, relation labels, custom 404
- Phase 15: Provenance metadata, focus traps, prefers-reduced-motion, keyboard tree nav
- Phase 16: URL-synced deep links, BlurHash blur-up placeholders
- Phase 17: Audio as first-class content type (AudioSchema, AudioPlayer, person page integration)
- Phase 18: Archive manifest.zip export + /slideshow ambient mode

**For v2.2 consideration:**
- Slideshow play/pause/progress control bar (intentionally deferred)
- TV/Firestick deployment optimization
- Decade timeline view, print stylesheet, sharable single-item URLs with auth tokens (declined in v2.1 scope)

---
*Phase: 18-v2-1-export-slideshow*
*Completed: 2026-04-29*
