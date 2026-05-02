---
phase: 21
plan: 1
subsystem: admin
tags: [admin, chronicles, crud, octokit, github-api]
dependency_graph:
  requires: [phase-19-chronicles, phase-20-admin-foundation]
  provides: [admin-chronicle-list, admin-chronicle-create, admin-chronicle-edit, admin-chronicle-delete, api-chronicles-create, api-chronicles-update, api-chronicles-delete]
  affects: [app/admin, app/api/admin/chronicles, components/admin]
tech_stack:
  added: []
  patterns: [octokit-json-commit, zod-api-validation, server-component-auth-gate, shared-form-mode-switch]
key_files:
  created:
    - app/admin/chronicles/page.tsx
    - app/admin/chronicles/new/page.tsx
    - app/admin/chronicles/[id]/page.tsx
    - components/admin/EditChronicleForm.tsx
    - app/api/admin/chronicles/route.ts
    - app/api/admin/chronicles/[id]/route.ts
  modified:
    - app/admin/page.tsx
decisions:
  - EditChronicleForm is one shared component used in both create and update modes via a `mode` prop — avoids duplication
  - Auto-suggest chronicle ID from title via slugify() in create mode; user can override before submitting
  - coverPhotoId rendered as a `<select>` dropdown of all photos (id + caption + dateLabel) — v1 approach; typeahead is future polish
  - peopleIds/collectionIds rendered as checkbox lists — simple v1 approach; autocomplete is future polish
  - audioFilename is a plain text input; binary upload deferred to Phase 22
  - validateCrossRefs() helper is duplicated in both API route files (not extracted to lib) — keeps each route file self-contained; the shared helper is small
  - Delete requires window.confirm() before firing DELETE request
  - Zod parse on merged object (not just changed fields) ensures full schema validity on every update commit
metrics:
  duration: ~25m
  completed_date: "2026-04-29"
  tasks_completed: 7
  files_created: 6
  files_modified: 1
---

# Phase 21 Plan 1: Chronicle CRUD admin UI summary

Chronicle CRUD admin UI in /admin — list page, create page, edit page, and three API route handlers (POST create, POST update, DELETE) — following the Phase 20 person-editor pattern with octokit GitHub commits triggering Vercel rebuilds.

## What was built

**Admin index** (`app/admin/page.tsx`): Chronicles card added, marked live, linking to /admin/chronicles.

**List page** (`app/admin/chronicles/page.tsx`): Server Component listing all chronicles sorted newest-first, with dateLabel eyebrow, title, subtitle, audioDuration, and an "Edit →" link. "+ New chronicle" button at top-right links to /admin/chronicles/new.

**EditChronicleForm** (`components/admin/EditChronicleForm.tsx`): Single Client Component handling both create and update modes via a `mode` prop. Fields: id (editable in create, read-only in update), title, subtitle, date, dateLabel, body (textarea, monospace), peopleIds (checkbox list), collectionIds (checkbox list), coverPhotoId (select dropdown), audioFilename (text), audioDuration (text). Delete button (update mode only) with window.confirm guard. Status states: idle / saving / saved / error / deleting. On create: redirects to /admin/chronicles. On update: router.refresh(). ID auto-suggests from title via slugify() until user manually edits it.

**New page** (`app/admin/chronicles/new/page.tsx`): Server Component; requireAdminOrRedirect; fetches getPeople, getCollections, getPhotos; renders EditChronicleForm mode="create" with empty initial values.

**Edit page** (`app/admin/chronicles/[id]/page.tsx`): Server Component; requireAdminOrRedirect; getChronicleById → notFound if absent; renders EditChronicleForm mode="update" with current chronicle values pre-populated.

**Create API** (`app/api/admin/chronicles/route.ts`): POST handler; validates via ChronicleSchema (Zod); checks id uniqueness; cross-validates peopleIds/collectionIds/coverPhotoId; appends to chronicles.json; commits with message `admin: add chronicle "{title}"`.

**Update + Delete API** (`app/api/admin/chronicles/[id]/route.ts`): POST merges body into existing record, validates merged result via ChronicleSchema, commits with `admin: update chronicle "{title}"`. DELETE removes by id, commits with `admin: remove chronicle "{title}"`. Both handlers require admin and GitHub access token from session.

## Deviations from plan

### Auto-fixed issues

**1. [Rule 1 - Bug] Unescaped quotes in JSX help text**
- **Found during:** Task 7 (npm run build)
- **Issue:** Two `<span>` help text nodes contained literal `"` characters in JSX which ESLint's `react/no-unescaped-entities` rule rejects at build time.
- **Fix:** Replaced literal `"` with `&ldquo;` / `&rdquo;` HTML entities in the two offending lines.
- **Files modified:** `components/admin/EditChronicleForm.tsx`
- **Commit:** fff0168

## Known stubs

- `audioFilename` and `audioDuration` are plain text inputs. The audio file must be manually added to /public/audio/ via a repo commit — admin binary upload is deferred to Phase 22 (Vercel Blob).

## Threat flags

None. All new routes are in /admin (requireAdminOrRedirect) or /api/admin (getAdminUser + 403). No new public-facing surface added.

## Self-Check: PASSED

Files exist:
- app/admin/chronicles/page.tsx — FOUND
- app/admin/chronicles/new/page.tsx — FOUND
- app/admin/chronicles/[id]/page.tsx — FOUND
- components/admin/EditChronicleForm.tsx — FOUND
- app/api/admin/chronicles/route.ts — FOUND
- app/api/admin/chronicles/[id]/route.ts — FOUND

Commits: 99e7223, b3b958b, b5de03e, 7b4fc1c, 1198776, 96eb679, fff0168

Build: npm run build exits 0 — 34 pages generated. Admin chronicles routes pre-rendered:
- /admin/chronicles (dynamic)
- /admin/chronicles/[id] (dynamic)
- /admin/chronicles/new (dynamic)
- /api/admin/chronicles (dynamic)
- /api/admin/chronicles/[id] (dynamic)
