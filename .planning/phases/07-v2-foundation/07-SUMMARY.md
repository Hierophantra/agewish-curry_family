---
phase: "07"
plan: "01"
subsystem: "v2-foundation"
tags: ["brand", "schema", "content", "routing", "ui"]
dependency_graph:
  requires: ["Phase 6 complete — lib/content.ts, lib/types.ts, family.json, photos.json, videos.json all exist"]
  provides: ["v2 schema (CollectionSchema, PlaylistSchema, richer Person/Photo/Video)", "getCollections/getPlaylists loaders", "8-person prototype family data", "6 photos with collectionIds", "3 videos with playlistIds", "PNG brand mark", "new hero/footer copy", "films→videos rename", "dynamic route stubs"]
  affects: ["components/ui/StarMark.tsx", "components/layout/TopNav.tsx", "components/layout/Footer.tsx", "components/home/Hero.tsx", "components/home/SectionPreview.tsx", "components/layout/NavTabs.tsx", "lib/types.ts", "lib/content.ts"]
tech_stack:
  added: ["next/image (for PNG brand mark)"]
  patterns: ["collections-as-tags (Photo.collectionIds[], Video.playlistIds[])", "generateStaticParams for dynamic routes", "PNG brand assets via public/images/"]
key_files:
  created:
    - "content/collections.json — 3 stub collections (christmas-mornings, lake-house-summers, wedding-days)"
    - "content/playlists.json — 2 stub playlists (birthdays, reunions)"
    - "app/(protected)/photographs/[collectionId]/page.tsx — Phase 8 placeholder stub"
    - "app/(protected)/videos/[playlistId]/page.tsx — Phase 9 placeholder stub"
    - "public/images/aw-symbol-2x.png — real PNG brand mark (navy circle + gold 8-point star)"
    - "public/images/aw-symbol-1x.png"
    - "public/images/aw-gold-blue-2x.png"
    - "public/images/agewish-wordmark-1x.png"
  modified:
    - "lib/types.ts — CollectionSchema, PlaylistSchema, richer Person/Photo/Video fields"
    - "lib/content.ts — getCollections, getCollectionById, getPhotosInCollection, getPlaylists, getPlaylistById, getVideosInPlaylist, getFeaturedVideos, getPhotosByPersonId, getVideosByPersonId"
    - "content/family.json — prototype's 8-person tree (william-curry through thomas-walsh)"
    - "content/photos.json — 6 photos with collectionIds; placeholder JPEGs replaced"
    - "content/videos.json — 3 videos with playlistIds, featured flag"
    - "components/ui/StarMark.tsx — next/image, /images/aw-symbol-2x.png, no more inline SVG"
    - "components/layout/TopNav.tsx — brand mark size=36 + 2-line text stack"
    - "components/layout/Footer.tsx — italic serif tagline, eyebrow meta, size=28"
    - "components/home/Hero.tsx — 'A gathering of generations', italic serif subtitle, size=56"
    - "components/home/SectionPreview.tsx — Films → Videos, /films → /videos"
    - "components/layout/NavTabs.tsx — Films → Videos, /films → /videos"
    - "app/(protected)/videos/page.tsx — renamed from films/page.tsx, heading updated"
    - "CLAUDE.md — v2 architecture notes, updated build order"
decisions:
  - "D-04: PNG files renamed to URL-safe kebab-case names (aw-symbol-2x.png etc)"
  - "D-05/Task2: StarMark wraps next/image — PNG contains full mark (ring+star), no wrapper ring div needed"
  - "D-06: TopNav: PNG at 36px + eyebrow 'AgeWish · Private archive' + serif 'The Curry Family'"
  - "D-07: films→videos via git mv for clean history; no redirect (no external traffic)"
  - "D-09: Hero h1 'A gathering of generations', italic serif subtitle (prototype verbatim)"
  - "D-11: Footer tagline 'Held in trust for those who come after.' italic serif; meta eyebrow"
  - "D-24: Phase 7 stubs dynamic routes only; Phase 8/9 implement them with real content"
metrics:
  duration: "~25m"
  completed_date: "2026-04-29"
  tasks_completed: 10
  files_changed: 18
---

# Phase 7: v2 Foundation Summary

**One-liner:** v2 foundation with prototype-fidelity brand mark (PNG-backed StarMark), hero/footer copy, films-to-videos rename, 8-person family data + collections/playlists schema, and dynamic route stubs for Phase 8/9.

## What Was Built

Phase 7 was executed in two halves:

### Half 1 — Data Layer (commits 8b256cf through 7ea9d13)

1. **Schema migration** (`lib/types.ts`): Added `CollectionSchema`, `PlaylistSchema`; enriched `PersonSchema` with `relationLabel`, `eyebrow`, `birthDate`, `deathDate`, `datesLabel`, `birthplace`, `spouseId`, `parentIds`, `childrenIds`; enriched `PhotoSchema` with `collectionIds`, `dateLabel`, `location`, `notes`; enriched `VideoSchema` with `playlistIds`, `featured`, `duration`, `dateLabel`.

2. **Content stubs**: `content/collections.json` (3 collections), `content/playlists.json` (2 playlists).

3. **Family data** (`content/family.json`): Replaced v1 placeholder with prototype's 8-person tree — William Curry (1920–2008) + 3 children (Robert, Margaret, James) + 4 grandchildren (Sarah, Daniel, Emily-Walsh, Thomas-Walsh). Spouses as text in `panelMeta`, not separate records.

4. **Photo data** (`content/photos.json`): 6 photos across 3 collections with `collectionIds[]` (proves tag-based architecture). Some photos cross multiple collections.

5. **Video data** (`content/videos.json`): 3 videos across 2 playlists, one with `featured: true`.

6. **Content loaders** (`lib/content.ts`): Added `getCollections()`, `getCollectionById()`, `getPhotosInCollection()`, `getPlaylists()`, `getPlaylistById()`, `getVideosInPlaylist()`, `getFeaturedVideos()`, `getPhotosByPersonId()`, `getVideosByPersonId()`. Extended bidirectional validator to check `collectionIds`, `playlistIds`, `Collection.coverPhotoId`, `Playlist.coverVideoId`.

### Half 2 — UI Layer (commits 7a4918e through 9190595)

7. **PNG logo files** renamed to URL-safe names: `aw-symbol-2x.png`, `aw-symbol-1x.png`, `aw-gold-blue-2x.png`, `agewish-wordmark-1x.png`.

8. **StarMark** (`components/ui/StarMark.tsx`): Replaced inline 7-pointed heptagram SVG with `next/image` pointing to `/images/aw-symbol-2x.png`. The PNG contains the complete brand mark (navy circle border + gold 8-pointed star) — no wrapper ring div needed.

9. **TopNav** (`components/layout/TopNav.tsx`): Brand mark updated to `<StarMark size={36} />` + 2-line text stack: eyebrow "AgeWish · Private archive" at 9px + serif "The Curry Family" at lg. Brand wrapped in `Link href="/"`.

10. **NavTabs** (`components/layout/NavTabs.tsx`): "Films" → "Videos", `/films` → `/videos`.

11. **Hero** (`components/home/Hero.tsx`): h1 changed to "A gathering of generations"; subtitle changed to prototype's italic serif copy; StarMark updated to size=56.

12. **Footer** (`components/layout/Footer.tsx`): Tagline changed to "Held in trust for those who come after." in italic serif; metadata changed to "A private archive · AgeWish" using `.eyebrow` utility; StarMark updated to size=28.

13. **Films → Videos rename**: `app/(protected)/films/` → `app/(protected)/videos/` via `git mv` (preserves history). `SectionPreview.tsx` updated. No redirect needed (no external traffic on /films).

14. **Dynamic route stubs**:
    - `app/(protected)/photographs/[collectionId]/page.tsx` — shows collection title + "Coming in Phase 8"; includes `generateStaticParams()` pre-rendering 3 collection paths.
    - `app/(protected)/videos/[playlistId]/page.tsx` — shows playlist title + "Coming in Phase 9"; includes `generateStaticParams()` pre-rendering 2 playlist paths.

15. **CLAUDE.md**: Added v2 architecture section (collections-as-tags, section rename, PNG brand mark, prototype-fidelity UX, lightbox dependency, dynamic route stubs); updated build order to list v2 phases 7-13.

## Build Verification

`npm run build` exits 0. Static params pre-rendered:
- `/photographs/christmas-mornings`, `/photographs/lake-house-summers`, `/photographs/wedding-days`
- `/videos/birthdays`, `/videos/reunions`
- `/person/william-curry` through `/person/thomas-walsh` (8 paths)
- Total: 22 static pages

## Deviations from Plan

### Auto-adjusted: StarMark ring decision

The plan's Task 2 correctly anticipated this: the aw-symbol-2x.png PNG already contains the full navy circle border + star. Rather than wrapping `<StarMark>` in a separate ring div (as the CONTEXT.md D-06 suggested before visual inspection of the PNG), the PNG is rendered directly at 36px. This produces the correct result without double-ringing.

Otherwise: plan executed exactly as written.

## Known Stubs

All stubs are intentional and documented:

| Stub | File | Reason |
|------|------|---------|
| Collection detail page | `app/(protected)/photographs/[collectionId]/page.tsx` | Phase 8 placeholder — photo grid coming in Phase 8 |
| Playlist detail page | `app/(protected)/videos/[playlistId]/page.tsx` | Phase 9 placeholder — video list coming in Phase 9 |
| Photo placeholder JPEGs | `public/photos/*.jpg` | Stub images — real Curry photos in Phase 13 |
| Video YouTube IDs | `content/videos.json` | Stub video IDs — real recordings in Phase 13 |

## Threat Flags

No new security-relevant surface introduced. All new routes are behind the existing auth middleware. No new network endpoints, no new auth paths, no file access patterns beyond existing `lib/content.ts` reads.

## Self-Check: PASSED

All files created and verified:
- `public/images/aw-symbol-2x.png` — FOUND
- `components/ui/StarMark.tsx` — uses next/image — FOUND
- `components/layout/TopNav.tsx` — StarMark size=36, 2-line text stack — FOUND
- `components/layout/NavTabs.tsx` — Videos tab, /videos href — FOUND
- `components/home/Hero.tsx` — "A gathering of generations" — FOUND
- `components/layout/Footer.tsx` — "Held in trust for those who come after." — FOUND
- `app/(protected)/videos/` — exists (renamed from films) — FOUND
- `app/(protected)/photographs/[collectionId]/page.tsx` — FOUND
- `app/(protected)/videos/[playlistId]/page.tsx` — FOUND
- `npm run build` exits 0 — VERIFIED

Commits verified: 7a4918e, 43593a7, cbdb365, 00e9409, 697c7f8, fd046bf, aaf7aed, 2954d7c, 9190595
