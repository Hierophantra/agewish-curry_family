---
phase: "22"
plan: "v3"
subsystem: admin-photo-upload
tags: [vercel-blob, photo-upload, admin-crud, blur-hash, hybrid-storage]
dependency_graph:
  requires: [phase-21-chronicle-crud, phase-20-v3-foundation, phase-16-blurhash]
  provides: [photo-upload-admin, getPhotoUrl-helper, vercel-blob-integration]
  affects: [admin-index, photo-gallery, lightbox, slideshow, tree-carousel, chronicle-cards]
tech_stack:
  added: ["@vercel/blob", "getPhotoUrl helper (lib/utils.ts)"]
  patterns:
    - "Hybrid storage: legacy /public/photos/ paths + Vercel Blob URLs via getPhotoUrl()"
    - "Server-side blob upload: put() from API route (4MB limit)"
    - "BlurHash generation from uploaded Buffer via plaiceholder (same as Phase 16)"
    - "multipart/form-data upload: file + JSON metadata as separate fields"
key_files:
  created:
    - lib: "lib/utils.ts (getPhotoUrl added)"
    - admin-pages: "app/admin/photos/page.tsx, app/admin/photos/new/page.tsx, app/admin/photos/[id]/page.tsx"
    - api-handlers: "app/api/admin/photos/route.ts, app/api/admin/photos/[id]/route.ts"
    - form: "components/admin/EditPhotoForm.tsx"
  modified:
    - "lib/content.ts (getPhotoUrl re-export + getPhotoById loader)"
    - "next.config.mjs (Vercel Blob remotePattern)"
    - "app/admin/page.tsx (Photographs section marked live)"
    - "components/gallery/PhotoCard.tsx (getPhotoUrl)"
    - "components/gallery/CollectionCard.tsx (getPhotoUrl)"
    - "components/lightbox/Lightbox.tsx (getPhotoUrl)"
    - "components/slideshow/SlideshowPlayer.tsx (getPhotoUrl)"
    - "components/tree/PhotoCarousel.tsx (getPhotoUrl)"
    - "components/chronicles/ChronicleCard.tsx (getPhotoUrl)"
    - "app/(protected)/chronicles/[id]/page.tsx (getPhotoUrl)"
    - "CONTENT_AUTHORING.md (admin upload documented)"
decisions:
  - "getPhotoUrl lives in lib/utils.ts (not lib/content.ts) — lib/content.ts is server-only; client components need getPhotoUrl too"
  - "lib/content.ts re-exports getPhotoUrl from lib/utils so server-side callers have a single import path"
  - "Edit mode image is immutable — deleting and re-uploading is the intended workflow for photo replacement"
  - "BlurHash generation is non-fatal — upload succeeds even if plaiceholder throws; photo renders without blur placeholder"
  - "Blob DELETE in photo DELETE handler is non-fatal — commit proceeds even if blob delete fails (avoids orphaned JSON with no blob)"
  - "PhotoCarousel uses raw <img> tag (not next/image) — Blob URLs from external hostnames need unoptimized flag with next/image; the <img> already existed; kept as-is since PhotoCarousel is a tree panel component not a gallery"
metrics:
  duration: "~25 minutes"
  completed: "2026-04-29"
  tasks_completed: 8
  files_modified: 18
---

# Phase 22 (v3): Photo CRUD with Vercel Blob Upload Summary

Photo admin upload path implemented. Family members can upload real Curry family photos via /admin/photos without developer involvement. Each upload: file to Vercel Blob, BlurHash generation, JSON entry committed to GitHub, live in approximately 90 seconds.

## What was built

### getPhotoUrl helper (Task 2)

Added `getPhotoUrl({ filename })` to `lib/utils.ts` — the single function that resolves both legacy `/public/photos/` paths and new Vercel Blob URLs. Client components import from `@/lib/utils`; server components can also import from `@/lib/content` (which re-exports it). Seven components updated from direct `/photos/${filename}` string interpolation to `getPhotoUrl(photo)`.

### Vercel Blob integration (Tasks 1, 7)

`@vercel/blob` installed. The POST handler at `/api/admin/photos`:
- Parses multipart/form-data (`file` Blob + `metadata` JSON string)
- Validates MIME type (jpeg/png/webp) and file size (<4MB) server-side
- Uploads to Vercel Blob via `put(blobFilename, buffer, { access: 'public' })`
- Generates BlurHash via `getPlaiceholder(buffer, { size: 10 })` (same plaiceholder call as the existing `npm run blur` script)
- Commits the new Photo entry to `content/photos.json` via GitHub API

The DELETE handler calls `del(blobUrl)` when removing a Blob-hosted photo (skipped for legacy `/public/photos/` entries).

### Admin UI (Tasks 3, 4, 5, 6)

- `/admin` index: Photographs section now shows "live" (was "coming soon")
- `/admin/photos`: Thumbnail grid of all photos, sorted by date desc, with "+ Upload photo" button
- `/admin/photos/new`: Upload form — file picker with client-side preview, auto-slugified id, all metadata fields
- `/admin/photos/[id]`: Edit form — shows current image, all editable metadata fields; file is immutable after upload
- `EditPhotoForm`: Client Component, mode-switched create/update. Create uses multipart POST; update uses JSON POST. Delete button in update mode with JS confirm.

### Hybrid storage pattern

Photos have two kinds of `filename` values:
- Legacy: bare relative name (`1953-wedding-01.jpg`) → resolved to `/photos/1953-wedding-01.jpg`
- New: full Vercel Blob URL (`https://abc.public.blob.vercel-storage.com/photos/wedding-2024.jpg`) → used as-is

`getPhotoUrl(photo)` detects the difference via `photo.filename.startsWith('http')`. Both work transparently alongside each other.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing] getPhotoUrl extracted to lib/utils.ts, not lib/content.ts**
- **Found during:** Task 2
- **Issue:** The plan specified adding `getPhotoUrl` to `lib/content.ts`, which has `import 'server-only'`. Client components (Lightbox, SlideshowPlayer, PhotoCard, PhotoCarousel) cannot import from server-only modules — build would fail.
- **Fix:** Added `getPhotoUrl` to `lib/utils.ts` (no server-only constraint). Added `export { getPhotoUrl } from './utils'` re-export in `lib/content.ts` so server-side code can import from either.
- **Files modified:** `lib/utils.ts`, `lib/content.ts`

**2. [Rule 1 - Bug] Removed leftover debug expression in route.ts**
- **Found during:** Task 8 (npm run build)
- **Issue:** ESLint `@typescript-eslint/no-unused-expressions` error on a void-expression stub left in the POST handler
- **Fix:** Removed the dead code; removed unused `getPhotos` import
- **Commit:** Folded into the route handler commit

## Known Stubs

None. All photos in the admin list render via `getPhotoUrl`, which correctly resolves both legacy stubs in `/public/photos/` and new Blob URLs. The 6 existing stub entries continue to render with their tiny placeholder JPEGs.

## Self-Check: PASSED

Files verified:
- `lib/utils.ts` — FOUND, contains `getPhotoUrl`
- `components/admin/EditPhotoForm.tsx` — FOUND
- `app/admin/photos/page.tsx` — FOUND
- `app/admin/photos/new/page.tsx` — FOUND
- `app/admin/photos/[id]/page.tsx` — FOUND
- `app/api/admin/photos/route.ts` — FOUND
- `app/api/admin/photos/[id]/route.ts` — FOUND
- `next.config.mjs` — FOUND, contains `*.public.blob.vercel-storage.com`
- `npm run build` exits 0, 37 static pages

Commits in this phase: 294417d, 8e8b7d8, bd7e59c, e33e98d, 62641cb, 2e0ed24, a7485e9 (+ final docs commit)
