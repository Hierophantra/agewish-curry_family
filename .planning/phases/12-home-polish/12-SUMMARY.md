---
phase: 12
plan: 1
subsystem: home
tags: [home, preview, server-component, photos, videos, tree]
dependency_graph:
  requires: [lib/content.ts, components/gallery/PhotoCard, components/video/VideoCard, components/home/Hero]
  provides: [home-curated-previews]
  affects: [app/(protected)/page.tsx]
tech_stack:
  added: []
  patterns: [server-component, ivory-alternation, eyebrow-arrow-link]
key_files:
  created: []
  modified:
    - app/(protected)/page.tsx
  deleted:
    - components/home/SectionPreview.tsx
decisions:
  - Home page previews inlined in page.tsx (not extracted to new components) because the three sections are not reused elsewhere
  - SectionPreview.tsx deleted — replaced entirely; no other file imported it
  - Patriarch detection uses `parentIds.length === 0` generically — works with any root person, not Curry-specific
  - Videos section conditionally rendered (`featured.length > 0`) to handle empty state gracefully
  - `'use client'` not added — all three preview sections are Server Components consuming lib/content.ts loaders
metrics:
  duration: 64s
  completed: "2026-04-30"
  tasks_completed: 2
  files_changed: 2
---

# Phase 12 Plan 1: Home Polish + Curated Previews Summary

Home page rebuilt from text-only SectionPreview cards to three rich curated preview sections using real content data — tree (first generation), latest 6 photos, and 1-2 featured videos.

## What Was Built

### Task 1: Home composition with three preview sections

Replaced `<SectionPreview />` (static text, 3 cards) with three distinct, data-driven preview sections:

**Family tree preview (bg-ivory)**
- Eyebrow "FAMILY TREE" + serif h2 "The family"
- Italic serif intro sentence referencing the patriarch by name and dates
- 3-column grid of first-generation children as linked cards (eyebrow, serif name, italic dates)
- "Explore the full tree →" link to /tree

**Photographs preview (bg-white)**
- Eyebrow "PHOTOGRAPHS" + serif h2 "Recent photographs"
- 6-photo grid using `<PhotoCard />` — latest 6 photos sorted by `date` descending
- "Browse all collections →" link to /photographs
- Graceful empty state if no photos exist

**Videos preview (bg-ivory)**
- Eyebrow "VIDEOS" + serif h2 "Featured films"
- 1-2 featured videos using `<VideoCard />` (from `getFeaturedVideos()`)
- "Browse all playlists →" link to /videos
- Section conditionally rendered — omitted entirely if no featured videos

**Ivory alternation:** white (hero) → ivory (tree) → white (photos) → ivory (videos) — matches D-34.

**Star motif:** No new stars added — sections use eyebrow text only. Rule: TopNav=1, Hero=2, Footer=3.

**Two-weight rule:** Only `font-normal` and `font-medium` used throughout. No semibold/bold.

**Arrow links:** eyebrow class + text-gold-deep + hover:text-gold + transition-colors — same pattern as Phase 8 collection cards.

Deleted `components/home/SectionPreview.tsx` (no longer imported anywhere).

### Task 2: Build verification

`npm run build` exits 0. 22 pages generated. No TypeScript errors, no linting errors.

## Commits

| Hash | Type | Description |
|------|------|-------------|
| b784c30 | feat(12) | rebuild home page with curated previews from each section |

## Deviations from Plan

None — plan executed exactly as written. The `eyebrow` utility in globals.css already sets `font-size: 0.75rem` so the inline `text-[10px]` from the plan spec was omitted in favor of the standard `eyebrow` class size, keeping the design system consistent.

## Known Stubs

The photo preview section shows real stub photo data from `content/photos.json` (6 entries) but the actual image files in `/public/photos/` are minimal valid JPEGs (335-byte placeholders). When real Curry family photos are added, no code changes are needed — only JSON + image file additions.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced.

## Self-Check: PASSED

- [x] `app/(protected)/page.tsx` exists and modified
- [x] `components/home/SectionPreview.tsx` deleted (confirmed via git diff)
- [x] Commit b784c30 exists
- [x] `npm run build` exits 0, 22 pages generated
- [x] 4 lines match `getFeaturedVideos|getPhotos|getPeople` in page.tsx
- [x] No `'use client'` directive (comment mention only)
- [x] Ivory alternation: bg-ivory → bg-white → bg-ivory confirmed in file
- [x] Each section has eyebrow + serif h2 + eyebrow arrow link
