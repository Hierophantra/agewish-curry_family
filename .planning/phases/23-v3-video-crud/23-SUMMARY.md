---
phase: 23
plan: 1
subsystem: admin
tags: [admin, video, crud, github-octokit, zod, v3]
dependency_graph:
  requires: [lib/content.ts, lib/types.ts (VideoSchema), lib/admin.ts, lib/github.ts, content/videos.json, content/family.json, content/playlists.json]
  provides: [/admin/videos, /admin/videos/new, /admin/videos/[id], /api/admin/videos, /api/admin/videos/[id], components/admin/EditVideoForm.tsx]
  affects: [app/admin/page.tsx, lib/content.ts]
tech_stack:
  added: []
  patterns: [Chronicle CRUD mirror pattern, Zod validate-before-commit, mode-switched form, kebab-case auto-slugify, cross-ref validation]
key_files:
  created:
    - app/admin/videos/page.tsx
    - app/admin/videos/new/page.tsx
    - app/admin/videos/[id]/page.tsx
    - components/admin/EditVideoForm.tsx
    - app/api/admin/videos/route.ts
    - app/api/admin/videos/[id]/route.ts
  modified:
    - app/admin/page.tsx
    - lib/content.ts
decisions:
  - "Mirrored Phase 21 (Chronicle CRUD) architecture exactly — same three-file page pattern, same API flow, same Zod validate-before-commit"
  - "source field is a select dropdown limited to 'youtube' | 'vimeo' enforced both in VideoSchema (Zod enum) and form UI"
  - "Featured checkbox defaults to false on create; surfaces in list as FEATURED badge"
  - "getVideoById() added to lib/content.ts (Rule 2 — required for edit page; missing from Phase 3 content loader)"
  - "peopleIds/playlistIds cross-ref validated via getPeople()/getPlaylists() in both create and update handlers"
metrics:
  duration: "~12 minutes"
  completed: "2026-04-29"
  tasks_completed: 6
  files_created: 6
  files_modified: 2
---

# Phase 23 Plan 1: Video CRUD Summary

Video CRUD admin UI — YouTube/Vimeo URL references with title, date, people, playlist tagging, and featured flag. Six files created, two modified, `npm run build` exits 0 (40 pages, up from 37).

## Tasks Completed

| Task | Description | Commit | Key Files |
|------|-------------|--------|-----------|
| 1 | Admin index — mark Videos live | 9486d47 | app/admin/page.tsx |
| 2 | /admin/videos list page | c7e6498 | app/admin/videos/page.tsx |
| 3 | EditVideoForm client component | 3809fa9 | components/admin/EditVideoForm.tsx |
| 4 | /admin/videos/new + /admin/videos/[id] pages | 1acafc2 | app/admin/videos/new/page.tsx, app/admin/videos/[id]/page.tsx, lib/content.ts |
| 5 | API route handlers (create + update + delete) | 8ac604f | app/api/admin/videos/route.ts, app/api/admin/videos/[id]/route.ts |
| 6 | Build verification + SUMMARY | (this commit) | .planning/phases/23-v3-video-crud/23-SUMMARY.md |

## Architecture

Mirrors Phase 21 (Chronicle CRUD) exactly:

- **List page** (`/admin/videos`): Server Component, auth-gated, date-sorted, featured badge, "+ New video" button
- **New page** (`/admin/videos/new`): Server Component, empty initial values, create mode
- **Edit page** (`/admin/videos/[id]`): Server Component, loads by id via getVideoById(), update mode with pre-populated values
- **EditVideoForm** (`components/admin/EditVideoForm.tsx`): Client Component, mode-switched (create/update), all 10 fields, auto-slugify id, delete button in update mode
- **Create API** (`/api/admin/videos`): Auth → Zod validate → id uniqueness → cross-ref validate → GitHub commit
- **Update/delete API** (`/api/admin/videos/[id]`): Auth → merge → Zod validate → cross-ref validate → GitHub commit (or splice for DELETE)

## Form Fields

| Field | Type | Notes |
|-------|------|-------|
| id | text (kebab-case) | Auto-slugified from title in create mode; read-only in update |
| title | text, required | |
| description | textarea, optional | |
| source | select (youtube/vimeo) | Zod enum enforced at both form and API layers |
| sourceId | text, required | Help text: YouTube ID from watch?v=, Vimeo numeric ID |
| date | text (ISO YYYY-MM-DD) | |
| dateLabel | text | Display string e.g. "April 2000" |
| duration | text | Display string e.g. "12:34" |
| featured | checkbox | Defaults false; featured videos surface on home + /videos top section |
| peopleIds | multi-select checkboxes | From family.json |
| playlistIds | multi-select checkboxes | From playlists.json |

## Deviations from Plan

### Auto-added Missing Critical Functionality

**1. [Rule 2 - Missing critical function] Added getVideoById() to lib/content.ts**
- **Found during:** Task 4
- **Issue:** The edit page `/admin/videos/[id]` needs to look up a video by ID. lib/content.ts had getPersonById(), getPhotoById(), getChronicleById(), but no getVideoById(). The Phase 3 content loader never added it (video pages didn't need it at the time).
- **Fix:** Added `export function getVideoById(id: string): Video | null` alongside getVideos() in lib/content.ts
- **Files modified:** lib/content.ts
- **Commit:** 1acafc2

## Known Stubs

None. All fields are wired to real data sources (videos.json for values, family.json for people picker, playlists.json for playlist picker).

## Threat Flags

No new network endpoints, auth paths, or schema changes beyond the admin-gated API routes, which mirror the existing Phase 21 + 22 pattern (getAdminUser() auth check + GitHub access token required). All new routes are under `/api/admin/` — same threat surface as Phase 21/22.

## Self-Check

- [x] `app/admin/videos/page.tsx` — exists
- [x] `app/admin/videos/new/page.tsx` — exists
- [x] `app/admin/videos/[id]/page.tsx` — exists
- [x] `components/admin/EditVideoForm.tsx` — exists
- [x] `app/api/admin/videos/route.ts` — exists
- [x] `app/api/admin/videos/[id]/route.ts` — exists
- [x] `lib/content.ts` has getVideoById()
- [x] `npm run build` exits 0 (40 pages)
- [x] `grep -r "EditVideoForm" components/ app/` — 3 files
- [x] Admin index Videos href = '/admin/videos', status = 'live'

## Self-Check: PASSED
