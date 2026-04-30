---
phase: 03-video-gallery
plan: 01
subsystem: ui
tags: [next-third-parties, youtube-embed, vimeo, server-components, video-gallery]

# Dependency graph
requires:
  - phase: 02-photo-gallery
    provides: PhotoGrid + PhotoCard patterns (sort, empty state, eyebrow formatting)
  - phase: 01-scaffold-auth-design
    provides: design tokens (bg-ivory, text-navy, text-quiet, text-muted, eyebrow utility), lib/content.ts, lib/types.ts Video schema

provides:
  - components/video/VideoPlayer.tsx — source-switch abstraction (youtube | vimeo)
  - components/video/YouTubePlayer.tsx — @next/third-parties YouTubeEmbed facade (deferred iframe)
  - components/video/VimeoPlayer.tsx — plain Vimeo iframe with lazy loading
  - components/video/VideoCard.tsx — 16:9 player + date eyebrow + serif title + optional description
  - components/video/VideoGrid.tsx — getVideos() + chronological sort + inline empty state
  - app/(protected)/films/page.tsx — /films page wired to VideoGrid
  - content/videos.json — 2 YouTube stub entries for grid testing

affects:
  - 05-visual-polish (VideoCard, VideoGrid responsive behaviour)
  - 06-person-detail (VideoCard peopleIds wrapping deferred to this phase)

# Tech tracking
tech-stack:
  added:
    - "@next/third-parties@16.2.4 — YouTubeEmbed facade for deferred YouTube iframe loading"
  patterns:
    - "Source-switch abstraction: VideoPlayer switches on video.source; adding new platform = one branch + one new component"
    - "Deferred iframe via YouTubeEmbed: page ships thumbnail + play button only; YouTube network requests deferred until user clicks play"
    - "Server Component video stack: all five video components are Server Components with no 'use client'"
    - "Noon-UTC date formatting: dateTaken + 'T12:00:00Z' prevents timezone-off-by-one (same pattern as PhotoCard)"

key-files:
  created:
    - components/video/VideoPlayer.tsx
    - components/video/YouTubePlayer.tsx
    - components/video/VimeoPlayer.tsx
    - components/video/VideoCard.tsx
    - components/video/VideoGrid.tsx
  modified:
    - app/(protected)/films/page.tsx
    - content/videos.json
    - package.json
    - package-lock.json

key-decisions:
  - "03-01: @next/third-parties v16 uses playlabel not title prop on YouTubeEmbed — fixed to match actual API"
  - "03-01: YouTubeEmbed facade defers YouTube iframe until click — zero youtube.com requests on /films page load"
  - "03-01: VimeoPlayer uses plain lazy iframe (no facade) — Vimeo does not have the same per-page-load third-party cost as YouTube"
  - "03-01: VideoPlayer throws on unknown source — Zod enforces the enum at load time so this guard only fires for future values not yet in schema"

patterns-established:
  - "Video source abstraction: VideoPlayer is the sole switch point; migrating a video from YouTube to Vimeo = one JSON field edit, zero component changes"
  - "Server Component video stack: interactivity lives inside YouTubeEmbed facade itself, not in wrapper components"

requirements-completed: [VIDEO-01, VIDEO-02, VIDEO-03, VIDEO-04, VIDEO-05]

# Metrics
duration: 3min
completed: 2026-04-30
---

# Phase 3 Plan 01: Video Gallery Summary

**Five Server Component video files deliver /films with deferred YouTube iframe loading via @next/third-parties YouTubeEmbed facade, source-switch abstraction for Vimeo migration, and inline empty state.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-30T06:03:44Z
- **Completed:** 2026-04-30T06:06:32Z
- **Tasks:** 2
- **Files modified:** 7 (5 created, 2 updated)

## Accomplishments

- VideoPlayer source-switch abstraction: switching video.source from "youtube" to "vimeo" in JSON changes the player with zero component changes
- YouTubeEmbed facade via @next/third-parties: /films page loads with thumbnail + play button only — no YouTube network requests until user clicks play
- All five video components are Server Components with no 'use client' directive
- VideoGrid inline empty state: empty videos.json shows "No films yet" gracefully; npm run build passes with both full and empty data

## Task Commits

Each task was committed atomically:

1. **Task 1: Install @next/third-parties and create VideoPlayer + YouTubePlayer + VimeoPlayer** - `b50c8d2` (feat)
2. **Task 2: Build VideoCard + VideoGrid, wire /films page, update videos.json** - `feed203` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `components/video/VideoPlayer.tsx` - Source-switch abstraction; dispatches to YouTubePlayer or VimeoPlayer; throws on unknown source
- `components/video/YouTubePlayer.tsx` - Wraps @next/third-parties YouTubeEmbed; deferred iframe loads only on click
- `components/video/VimeoPlayer.tsx` - Plain Vimeo iframe with loading="lazy" and allow="autoplay; fullscreen; picture-in-picture"
- `components/video/VideoCard.tsx` - 16:9 player container + noon-UTC date eyebrow + serif title + optional description
- `components/video/VideoGrid.tsx` - getVideos() + chronological oldest-first sort + inline empty state when videos.length === 0
- `app/(protected)/films/page.tsx` - FAMILY ARCHIVE eyebrow + serif "Films" h1 + subtitle + VideoGrid (replaces placeholder)
- `content/videos.json` - Added second YouTube stub (jNQXAC9IVRw, dateTaken 2005-04-23) for 2-card grid testing
- `package.json` + `package-lock.json` - @next/third-parties@16.2.4 added to dependencies

## Decisions Made

- Used `playlabel` prop (not `title`) on YouTubeEmbed — @next/third-parties v16 removed `title` from its type definition; `playlabel` is the accessible label prop in v16
- VimeoPlayer does not use a facade — Vimeo plain iframe is per-spec (D-03: no third-party-cookie performance cost equivalent to YouTube)
- VideoPlayer throws on unknown source rather than returning null — Zod enforces the enum at load time, but the throw makes future additions visible at compile time

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed YouTubeEmbed prop: `title` → `playlabel`**
- **Found during:** Task 1 (YouTubePlayer creation)
- **Issue:** Plan documented `title` prop for YouTubeEmbed, but @next/third-parties v16.2.4 API uses `playlabel` (the `title` prop was removed in a newer version since plan research was done)
- **Fix:** Changed `title={title}` to `playlabel={title}` in YouTubePlayer.tsx
- **Files modified:** components/video/YouTubePlayer.tsx
- **Verification:** `npx tsc --noEmit` exits 0 after fix
- **Committed in:** b50c8d2 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — API prop name mismatch)
**Impact on plan:** Fix was necessary for TypeScript correctness. Functional behavior (accessible label on the play facade) is equivalent.

## Issues Encountered

None beyond the API deviation above.

## Known Stubs

- `content/videos.json` entries `video-001` (dQw4w9WgXcQ) and `video-002` (jNQXAC9IVRw) are placeholder YouTube videos. These are intentional stubs — real Curry family film content will be populated by the developer, not delivered as a phase artifact (per plan objective).

## Threat Flags

None — no new trust boundaries or attack surfaces beyond what is documented in the plan's threat model. /films route is inside (protected) group; sourceId values are developer-controlled JSON; Zod enforces source enum at load time.

## User Setup Required

None — no external service configuration required beyond what is already in place from Phase 1.

## Next Phase Readiness

- /films page is live and renders 2 YouTube stub videos with deferred iframe loading
- Source abstraction is in place — Vimeo videos can be added by setting source: "vimeo" in videos.json
- Real Curry family video content can be added at any time by editing content/videos.json
- Phase 4 (Family Tree) can begin immediately — no blockers from Phase 3

---
*Phase: 03-video-gallery*
*Completed: 2026-04-30*

## Self-Check: PASSED

All 8 expected files confirmed on disk. Both task commits (b50c8d2, feed203) confirmed in git log.
