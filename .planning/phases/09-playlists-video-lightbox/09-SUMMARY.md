---
phase: 9
plan: 1
subsystem: video
tags: [video, playlist, lightbox, featured, client-component, server-component]
dependency_graph:
  requires: [Phase 8 — Lightbox + CollectionCard pattern, Phase 7 — Playlist schema + content loaders]
  provides: [VideoLightbox, PlaylistCard, PlaylistGrid, PlaylistVideoGrid, /videos landing, /videos/[playlistId] detail]
  affects: [VideoCard (onClick prop), next.config.mjs (img.youtube.com remotePattern)]
tech_stack:
  added: [img.youtube.com remotePattern in next.config.mjs]
  patterns: [Client/Server boundary split (PlaylistVideoGrid owns lightbox state, pages are Server), AnimatePresence lightbox with keyboard nav + scroll lock, YouTube thumbnail via next/image with external remotePattern]
key_files:
  created:
    - components/lightbox/VideoLightbox.tsx
    - components/video/PlaylistCard.tsx
    - components/video/PlaylistGrid.tsx
    - components/video/PlaylistVideoGrid.tsx
  modified:
    - components/video/VideoCard.tsx (added onClick prop, made 'use client')
    - app/(protected)/videos/page.tsx (replaced flat VideoGrid with featured + PlaylistGrid)
    - app/(protected)/videos/[playlistId]/page.tsx (replaced Phase 7 stub with full detail)
    - next.config.mjs (added img.youtube.com remotePattern)
decisions:
  - VideoCard made 'use client' to support optional onClick prop — same pattern as PhotoCard in Phase 8; backward compatibility preserved (no onClick = plain article)
  - next/image used for playlist cover thumbnails (not plain img) — added img.youtube.com to next.config.mjs remotePatterns for proper optimization
  - PlaylistVideoGrid uses 3-column grid (matching VideoGrid) rather than 4-column (matching CollectionPhotoGrid) — videos are wider 16:9 and need more room than 4:3 photos
  - VideoLightbox embeds existing VideoPlayer component (server component used in client context) — no autoplay per spec D-9.6
metrics:
  duration: ~20m
  completed: 2026-04-29
  tasks_completed: 7/7
  files_created: 4
  files_modified: 4
---

# Phase 9 Plan 1: Video Playlists + VideoLightbox + Featured Videos Summary

**One-liner:** Video playlist grid with YouTube thumbnail covers, VideoLightbox (AnimatePresence + keyboard nav + scroll lock), and featured videos section on the /videos landing page.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | VideoLightbox component — mirrors Lightbox.tsx for videos | dad409c |
| 2 | VideoCard onClick prop for lightbox integration | 7a2f60d |
| 3 | PlaylistVideoGrid Client wrapper owning lightbox state | 6d4f10f |
| 4 | PlaylistCard with YouTube thumbnail cover + next.config.mjs update | a5c3f02 |
| 5 | PlaylistGrid + /videos landing with featured + playlists | e107fca |
| 6 | /videos/[playlistId] playlist detail page with VideoLightbox | 685f4ae |
| 7 | Build verification + SUMMARY + state update | (this commit) |

## What Was Built

### VideoLightbox (`components/lightbox/VideoLightbox.tsx`)
- `'use client'` component owning keyboard listeners and body scroll lock
- AnimatePresence opacity fade (250ms backdrop, 200ms per-video cross-fade via `key={video.id}`)
- Keyboard nav: Escape → close, ArrowLeft → prev, ArrowRight → next
- Backdrop click closes; stopPropagation on video container (no accidental close)
- Embeds existing `<VideoPlayer>` — no autoplay per spec D-9.6 (user clicks play)
- Shows title, dateLabel, duration, and index counter (N / total)
- Prev/Next buttons hidden when only 1 video in playlist

### VideoCard (`components/video/VideoCard.tsx`)
- Added optional `onClick?: () => void` prop — mirrors PhotoCard Phase 8 refactor
- When present: renders as `<button>` wrapper (no Link); when absent: plain `<article>` (backward compat)
- Made `'use client'` to support the onClick function prop
- Prefers `video.dateLabel` (v2 canonical), falls back to formatting `video.date` or `video.dateTaken`
- All existing callers (VideoGrid, person pages) unaffected — no onClick = original behavior

### PlaylistVideoGrid (`components/video/PlaylistVideoGrid.tsx`)
- `'use client'` component; owns `lightboxIndex: number | null` state
- Responsive grid: 1 col mobile / 2 cols SM / 3 cols XL (matches VideoGrid layout)
- Wraps VideoCard with onClick handler; opens VideoLightbox at clicked index
- Infinite prev/next navigation with modulo wrap
- Empty state with eyebrow + serif heading + helper text

### PlaylistCard (`components/video/PlaylistCard.tsx`)
- Server Component; mirrors CollectionCard but uses `aspect-video` (16:9) not `aspect-[4/3]`
- YouTube covers: `https://img.youtube.com/vi/{sourceId}/hqdefault.jpg` via `next/image`
- Vimeo covers: solid navy fallback (Vimeo thumbnail requires API call — avoided)
- Play indicator circle with gold SVG triangle centered on card
- Gradient overlay: `from-navy/85 via-navy/30 to-transparent`
- Shows title, subtitle, video count at bottom

### PlaylistGrid (`components/video/PlaylistGrid.tsx`)
- Server Component; mirrors CollectionGrid
- Reads all playlists + per-playlist video count server-side
- 1/2/3 col responsive grid; empty state when no playlists

### /videos landing (`app/(protected)/videos/page.tsx`)
- Replaced flat VideoGrid with featured section + PlaylistGrid
- Featured section: shows up to 2 featured videos (1-video = max-w-3xl single col; 2-video = 2-col grid)
- Featured section hidden entirely when `getFeaturedVideos()` returns empty array
- PlaylistGrid below with "ALL PLAYLISTS" eyebrow

### /videos/[playlistId] detail (`app/(protected)/videos/[playlistId]/page.tsx`)
- Replaced Phase 7 stub with full implementation
- Header: FAMILY ARCHIVE · PLAYLIST eyebrow, serif h1, italic subtitle, description, video count
- "← Back to all playlists" link above header
- `generateStaticParams` pre-renders 2 playlist pages (birthdays, reunions)
- PlaylistVideoGrid Client wrapper handles lightbox

## Build Verification

```
npm run build — exits 0
Static pages: 22 total
Pre-rendered playlist pages: /videos/birthdays, /videos/reunions
```

## Deviations from Plan

### Auto-additions (Rule 2)

**1. [Rule 2 - Enhancement] Used next/image instead of plain img for PlaylistCard thumbnails**
- **Found during:** Task 4
- **Issue:** Plan suggested plain `<img>` with eslint-disable comment, but noted whitelisting `img.youtube.com` as the better path
- **Fix:** Used `next/image` with proper `fill` + `sizes` attributes; added `img.youtube.com` to `next.config.mjs` `images.remotePatterns`
- **Files modified:** `components/video/PlaylistCard.tsx`, `next.config.mjs`
- **Commit:** a5c3f02
- **Rationale:** next/image gives automatic format optimization (WebP/AVIF), lazy loading, and prevents CLS — better than a plain img tag for content that matters visually

**2. [Rule 2 - Enhancement] VideoCard dateLabel fallback chain**
- **Found during:** Task 2
- **Issue:** Original VideoCard only used `video.dateTaken` for the formatted date; v2 videos.json uses `date` and `dateLabel` fields
- **Fix:** Updated to prefer `video.dateLabel` (v2 canonical display string), fall back to formatting `video.date`, then `video.dateTaken`
- **Files modified:** `components/video/VideoCard.tsx`
- **Commit:** 7a2f60d

## Known Stubs

None — all components are wired to real data from `lib/content.ts`. Playlist cover videos and featured flags are set in `content/videos.json`.

## Threat Flags

None — no new network endpoints, auth paths, or trust boundaries introduced. All pages are behind the existing `(protected)` layout auth gate.

## Self-Check: PASSED

Files exist:
- FOUND: components/lightbox/VideoLightbox.tsx
- FOUND: components/video/PlaylistCard.tsx
- FOUND: components/video/PlaylistGrid.tsx
- FOUND: components/video/PlaylistVideoGrid.tsx

Commits exist:
- dad409c: VideoLightbox
- 7a2f60d: VideoCard onClick
- 6d4f10f: PlaylistVideoGrid
- a5c3f02: PlaylistCard + next.config.mjs
- e107fca: PlaylistGrid + /videos page
- 685f4ae: /videos/[playlistId] page

Build: exits 0, 22 static pages, 2 playlist detail pages pre-rendered.
