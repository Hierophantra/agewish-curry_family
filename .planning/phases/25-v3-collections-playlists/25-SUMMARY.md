---
phase: 25
plan: 1
subsystem: admin-crud
tags: [collections, playlists, admin, crud, octokit, zod, cascade-delete]
dependency_graph:
  requires: [phase-24-audio-crud, lib/github.ts, lib/admin.ts, lib/content.ts, lib/types.ts]
  provides: [admin-collections-crud, admin-playlists-crud]
  affects: [content/collections.json, content/playlists.json, content/photos.json, content/videos.json]
tech_stack:
  added: []
  patterns: [mode-switched-form, cascade-delete-two-commits, zod-validate-before-commit, cover-picker-dropdown]
key_files:
  created:
    - app/admin/collections/page.tsx
    - app/admin/collections/new/page.tsx
    - app/admin/collections/[id]/page.tsx
    - components/admin/EditCollectionForm.tsx
    - app/api/admin/collections/route.ts
    - app/api/admin/collections/[id]/route.ts
    - app/admin/playlists/page.tsx
    - app/admin/playlists/new/page.tsx
    - app/admin/playlists/[id]/page.tsx
    - components/admin/EditPlaylistForm.tsx
    - app/api/admin/playlists/route.ts
    - app/api/admin/playlists/[id]/route.ts
  modified:
    - app/admin/page.tsx
decisions:
  - "Cascade delete as two sequential commits: first remove the record from its own file, then remove all back-references from the related file. Two commits over the Git Trees API multi-file commit for simplicity and clear audit history."
  - "Cover picker is a select dropdown of existing records (not a text input) to prevent dangling coverPhotoId / coverVideoId cross-references."
  - "Cascade is best-effort: if the second commit (photos.json or videos.json) fails, return partial success with cascadeWarning field rather than failing the entire delete (the primary record is already removed)."
metrics:
  duration: ~25m
  completed: 2026-04-29
  tasks_completed: 10
  files_created: 12
  files_modified: 1
---

# Phase 25 Plan 1: Collections + Playlists CRUD Summary

**One-liner:** Admin CRUD for Collections (photo groupings) and Playlists (video groupings), both metadata-only with cover picker dropdowns and cascade-delete that strips back-references from photos.json / videos.json in a second sequential commit.

## What Was Built

### Collections CRUD

- `/admin/collections` — list page showing all collections with title, subtitle, dateLabel, photo count, and "Edit →" link
- `/admin/collections/new` — create page (EditCollectionForm in create mode)
- `/admin/collections/[id]` — edit page (EditCollectionForm in update mode)
- `components/admin/EditCollectionForm.tsx` — mode-switched Client Component with fields: id (auto-slug from title, kebab-case, read-only in update), title (required), subtitle, description, dateLabel, date (ISO), coverPhotoId (select dropdown of all photos)
- `app/api/admin/collections/route.ts` — POST create: Zod validate CollectionSchema + coverPhotoId cross-check against photos.json + id uniqueness + commit
- `app/api/admin/collections/[id]/route.ts` — POST update (merge + Zod re-validate) + DELETE (cascade two commits)

### Playlists CRUD

- `/admin/playlists` — list page showing all playlists with title, subtitle, video count, and "Edit →" link
- `/admin/playlists/new` — create page (EditPlaylistForm in create mode)
- `/admin/playlists/[id]` — edit page (EditPlaylistForm in update mode)
- `components/admin/EditPlaylistForm.tsx` — mode-switched Client Component with fields: id (auto-slug, read-only in update), title (required), subtitle, description, coverVideoId (select dropdown of all videos with id + title + source)
- `app/api/admin/playlists/route.ts` — POST create: Zod validate PlaylistSchema + coverVideoId cross-check + id uniqueness + commit
- `app/api/admin/playlists/[id]/route.ts` — POST update + DELETE (cascade two commits)

### Admin Index

- Both Collections and Playlists sections updated from `status: 'soon'` (coming soon, href `#`) to `status: 'live'` with correct href values

### Cascade Delete Implementation

When a collection is deleted:
1. Commit 1: Remove the collection from `content/collections.json`
2. Commit 2: Read `content/photos.json`, filter out the deleted collectionId from every photo's `collectionIds[]`, commit updated `content/photos.json`

When a playlist is deleted:
1. Commit 1: Remove the playlist from `content/playlists.json`
2. Commit 2: Read `content/videos.json`, filter out the deleted playlistId from every video's `playlistIds[]`, commit updated `content/videos.json`

If cascade commit fails, the handler returns `{ ok: true, deleted, cascadeWarning }` — partial success. The primary record is already gone; the back-reference cleanup failure is logged server-side and surfaced in the API response for client inspection.

## Deviations from Plan

None. Plan executed exactly as written.

## Commits

| Hash | Message |
|------|---------|
| 614a628 | feat(25-v3): mark Collections and Playlists live in admin index |
| 504ef8c | feat(25-v3): add /admin/collections list page |
| 7f0f430 | feat(25-v3): add EditCollectionForm client component |
| fe5233b | feat(25-v3): add /admin/collections/new and /admin/collections/[id] pages |
| 2d552dd | feat(25-v3): add /api/admin/collections route handlers |
| 69a962e | feat(25-v3): add /admin/playlists list page |
| 05fd610 | feat(25-v3): add EditPlaylistForm client component |
| 09ad5a6 | feat(25-v3): add /admin/playlists/new and /admin/playlists/[id] pages |
| 069bfbe | feat(25-v3): add /api/admin/playlists route handlers |

## Build Verification

`npm run build` exits 0. 49 static/dynamic pages compiled. All new routes appear in the output table:

```
ƒ /admin/collections
ƒ /admin/collections/[id]
ƒ /admin/collections/new
ƒ /admin/playlists
ƒ /admin/playlists/[id]
ƒ /admin/playlists/new
ƒ /api/admin/collections
ƒ /api/admin/collections/[id]
ƒ /api/admin/playlists
ƒ /api/admin/playlists/[id]
```

## Success Criteria Check

- [x] Admin index has both Collections AND Playlists marked live
- [x] /admin/collections list, /admin/collections/new, /admin/collections/[id] all exist
- [x] /admin/playlists list, /admin/playlists/new, /admin/playlists/[id] all exist
- [x] components/admin/EditCollectionForm.tsx + EditPlaylistForm.tsx — both mode-switched
- [x] /api/admin/collections + [id] handlers (POST/POST+DELETE) with cascade-remove on DELETE
- [x] /api/admin/playlists + [id] handlers (POST/POST+DELETE) with cascade-remove on DELETE
- [x] All API handlers Zod-validate before commit
- [x] All API handlers auth-gated
- [x] grep -c "EditCollectionForm" = 9 references (>= 3)
- [x] grep -c "EditPlaylistForm" = 9 references (>= 3)
- [x] `npm run build` exits 0 (49 pages)
- [x] SUMMARY.md written
- [x] ROADMAP.md Phase 25 to be added + checked off

## Known Stubs

None. All form fields map directly to real data from content JSON files. Cover pickers fetch live photo/video arrays at server render time.

## Threat Flags

None. New routes are all auth-gated via `getAdminUser()`. API handlers follow the same auth pattern as Phases 21-24. No new public-facing endpoints introduced. No new trust boundaries opened.

## Self-Check: PASSED

Files created confirmed present:
- app/admin/collections/page.tsx
- app/admin/collections/new/page.tsx
- app/admin/collections/[id]/page.tsx
- components/admin/EditCollectionForm.tsx
- app/api/admin/collections/route.ts
- app/api/admin/collections/[id]/route.ts
- app/admin/playlists/page.tsx
- app/admin/playlists/new/page.tsx
- app/admin/playlists/[id]/page.tsx
- components/admin/EditPlaylistForm.tsx
- app/api/admin/playlists/route.ts
- app/api/admin/playlists/[id]/route.ts

All 9 task commits verified in git log. Build exits 0 with 49 pages.
