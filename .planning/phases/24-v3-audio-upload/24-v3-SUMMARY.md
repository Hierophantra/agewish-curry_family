---
phase: 24-v3-audio-upload
plan: 24
subsystem: admin, api, ui
tags: [vercel-blob, audio-upload, crud, admin-ui, next-app-router]

# Dependency graph
requires:
  - phase: 22-v3-photo-upload
    provides: Vercel Blob upload pattern, EditPhotoForm reference, getPhotoUrl helper pattern
  - phase: 23-v3-video-crud
    provides: EditVideoForm reference, admin list page pattern
provides:
  - Audio CRUD admin UI at /admin/audio
  - getAudioUrl() helper in lib/utils.ts handling both Blob URLs and legacy /public/audio/ paths
  - EditAudioForm client component with file upload (create) and metadata editing (update)
  - POST /api/admin/audio — validates, uploads to Vercel Blob, commits to audio.json
  - POST/DELETE /api/admin/audio/[id] — update metadata or delete entry + Blob file
affects:
  - future-audio-enhancements
  - collections-admin
  - export-archive

# Tech tracking
tech-stack:
  added: []
  patterns:
    - getAudioUrl() mirrors getPhotoUrl() — hybrid URL helper handles both Blob URLs and legacy relative paths
    - Audio MIME whitelist checks both MIME type AND file extension (browsers vary for M4A)
    - Client-side Web Audio API loadedmetadata event used for duration auto-fill (best-effort)

key-files:
  created:
    - app/admin/audio/page.tsx
    - app/admin/audio/new/page.tsx
    - app/admin/audio/[id]/page.tsx
    - components/admin/EditAudioForm.tsx
    - app/api/admin/audio/route.ts
    - app/api/admin/audio/[id]/route.ts
  modified:
    - lib/utils.ts (added getAudioUrl)
    - components/audio/AudioPlayer.tsx (uses getAudioUrl)
    - app/admin/page.tsx (Audio marked live)
    - CONTENT_AUTHORING.md (audio admin upload section added)

key-decisions:
  - "4MB server-side upload limit (serverless body limit) — same as photos; document clearly and note client-side direct upload as future enhancement"
  - "MIME type AND extension checked server-side — browsers inconsistently report M4A MIME type"
  - "Duration auto-fill via Web Audio API loadedmetadata event (best-effort, non-blocking)"
  - "Blob URL stored as filename in audio.json — getAudioUrl() handles both URL and legacy paths identically to getPhotoUrl() pattern"

patterns-established:
  - "getAudioUrl(): mirrors getPhotoUrl() — filename.startsWith('http') ? filename : /audio/filename"
  - "Audio MIME validation: check both MIME type Set AND extension Set (ALLOWED_MIME_TYPES + ALLOWED_EXTENSIONS)"

requirements-completed: []

# Metrics
duration: 35min
completed: 2026-04-29
---

# Phase 24: Audio CRUD with Vercel Blob Upload Summary

**Admin audio upload pipeline — MP3/M4A/AAC/WAV files upload to Vercel Blob, auto-fill duration from metadata, and commit JSON entries to GitHub; full CRUD at /admin/audio mirroring the Phase 22 photo upload pattern**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-04-29T00:00:00Z
- **Completed:** 2026-04-29T00:35:00Z
- **Tasks:** 7
- **Files modified:** 10

## Accomplishments

- Added `getAudioUrl()` helper to `lib/utils.ts` — handles both full Vercel Blob URLs and legacy `/public/audio/` paths; `AudioPlayer.tsx` updated to use it
- Built complete audio CRUD admin UI: list page at `/admin/audio`, create at `/admin/audio/new`, edit at `/admin/audio/[id]`
- `EditAudioForm` client component with file upload (create mode) including Web Audio API duration auto-fill, file size display, MIME+extension validation, and full metadata editing (update mode)
- Server-side API routes validate MIME type AND file extension (browsers vary for M4A), upload to Vercel Blob under `audio/{id}.{ext}`, commit to `content/audio.json` via GitHub API
- DELETE handler removes from `content/audio.json` and optionally deletes Blob file if filename is a Blob URL
- `CONTENT_AUTHORING.md` updated with admin upload section including 4MB limit, compression tips, supported formats

## Task Commits

1. **Task 1: getAudioUrl helper + AudioPlayer update** - `6b5c160` (feat)
2. **Task 2: Admin index Audio marked live** - `416f06e` (feat)
3. **Task 3: /admin/audio list page** - `c91b842` (feat)
4. **Task 4: EditAudioForm client component** - `1d511c2` (feat)
5. **Task 5: /admin/audio/new + /admin/audio/[id] pages** - `81239ab` (feat)
6. **Task 6: API route handlers** - `d2e9ec0` (feat)
7. **Task 7: CONTENT_AUTHORING.md update** - `932465a` (docs)
8. **Build fix: JSX entity escaping** - `3440231` (fix — deviation Rule 1)

## Files Created/Modified

- `lib/utils.ts` — added `getAudioUrl()` helper
- `components/audio/AudioPlayer.tsx` — uses `getAudioUrl(audio)` instead of hardcoded template literal
- `app/admin/page.tsx` — Audio section changed from 'soon' to 'live' with href `/admin/audio`
- `app/admin/audio/page.tsx` — list page, sorted by date desc, compact row layout
- `app/admin/audio/new/page.tsx` — create page wrapping EditAudioForm
- `app/admin/audio/[id]/page.tsx` — edit page wrapping EditAudioForm with pre-populated values
- `components/admin/EditAudioForm.tsx` — mode-switched create/update form (524 lines)
- `app/api/admin/audio/route.ts` — POST handler: validate, Blob upload, commit JSON
- `app/api/admin/audio/[id]/route.ts` — POST (update metadata) + DELETE (remove + Blob cleanup)
- `CONTENT_AUTHORING.md` — new admin upload section for audio

## Decisions Made

- **4MB limit preserved:** Audio can be larger than photos, but serverless body limit applies equally. Documented clearly with compression guidance. Client-side Blob direct upload noted as a future Phase 27+ enhancement.
- **MIME type AND extension check:** Browsers (especially Safari) inconsistently report MIME for M4A files (`audio/x-m4a` vs `audio/mp4` vs `audio/m4a`). Checking both MIME type Set and extension Set catches all variants.
- **Duration auto-fill via Web Audio API:** `loadedmetadata` event reads duration after file selection. Non-blocking — if it doesn't fire (some codecs), the field stays empty and the user fills it manually. No dependency added.
- **Blob path: `audio/{id}.{ext}`:** Stable, predictable paths. Extension derived from original file, falling back to `mp3`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed unescaped double-quote characters in JSX (build failure)**
- **Found during:** Build verification after Task 7
- **Issue:** Duration help text contained literal `"0:47"` and `"12:34"` strings in JSX — violates `react/no-unescaped-entities` ESLint rule, causing build failure
- **Fix:** Replaced with `&ldquo;` / `&rdquo;` HTML entities
- **Files modified:** `components/admin/EditAudioForm.tsx`
- **Verification:** `npm run build` exits 0
- **Committed in:** `3440231` (separate fix commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — build-breaking JSX entity error)
**Impact on plan:** Minor. Build fix is a correctness requirement. No scope change.

## Issues Encountered

None beyond the JSX entity escape caught by the ESLint build check.

## Known Stubs

None. The admin UI is fully wired — it uploads real files to Vercel Blob and commits real JSON entries to GitHub. The three existing stub entries in `content/audio.json` reference `*.mp3` filenames (legacy relative paths) which `getAudioUrl()` correctly resolves to `/audio/{filename}`.

## Threat Flags

None. Audio upload endpoints follow the identical auth pattern established in Phase 22 (photos): `getAdminUser()` allowlist check + GitHub access token verification before any write operations. MIME validation and size limits are enforced server-side.

## Next Phase Readiness

- Audio CRUD is feature-complete and follows the established admin pattern
- `getAudioUrl()` is ready for any future component that renders audio players
- Collections and Playlists admin editors are the remaining "coming soon" sections on `/admin`

## Self-Check

All files verified present:

- `lib/utils.ts` — FOUND (getAudioUrl exported)
- `components/audio/AudioPlayer.tsx` — FOUND (uses getAudioUrl)
- `app/admin/audio/page.tsx` — FOUND
- `app/admin/audio/new/page.tsx` — FOUND
- `app/admin/audio/[id]/page.tsx` — FOUND
- `components/admin/EditAudioForm.tsx` — FOUND
- `app/api/admin/audio/route.ts` — FOUND
- `app/api/admin/audio/[id]/route.ts` — FOUND

All commits verified in git log: 6b5c160, 416f06e, c91b842, 1d511c2, 81239ab, d2e9ec0, 932465a, 3440231 — all present.

`npm run build` exits 0 with 43 static pages generated, all new routes listed.

## Self-Check: PASSED

---
*Phase: 24-v3-audio-upload*
*Completed: 2026-04-29*
