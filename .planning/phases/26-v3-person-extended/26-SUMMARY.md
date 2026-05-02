---
phase: 26
plan: 1
subsystem: admin-people-crud
tags: [admin, people, crud, relationships, cascade-delete, bidirectional-sync]
dependency_graph:
  requires: [phase-25-collections-playlists, phase-20-v3-foundation]
  provides: [full-people-crud, bidirectional-relationship-sync, cascade-delete]
  affects: [family-tree, person-pages, all-content-types]
tech_stack:
  added: []
  patterns: [bidirectional-relationship-sync, cascade-delete-sequential-commits, array-field-allowlist]
key_files:
  created:
    - app/admin/people/new/page.tsx
    - app/api/admin/people/route.ts
  modified:
    - app/admin/people/page.tsx
    - app/admin/people/[id]/EditPersonForm.tsx
    - app/admin/people/[id]/page.tsx
    - app/api/admin/people/[id]/route.ts
    - CONTENT_AUTHORING.md
    - README.md
decisions:
  - Bidirectional sync on create: new person's parentIds cause the parent's childrenIds to be updated atomically in the same family.json commit
  - Bidirectional sync on update: old parents/children removed, new ones added (diffing oldParentIds vs newParentIds)
  - childIds v1 alias kept in sync alongside childrenIds everywhere (create, update-add, update-remove, delete)
  - Cascade delete uses sequential commits (one per content file that actually changed) for cleaner git history
  - Self-reference guard: server rejects parentIds/childrenIds that include the person's own id
  - ID auto-slugify in create mode fires on name blur/change; overridable by editing the id field directly
  - allPeople filtered to exclude current person in update mode (prevents self as parent/child)
  - Edit page now passes id in PersonFormValues so the form has access to it for the self-filter
metrics:
  duration: ~25m
  completed: 2026-04-29
  tasks_completed: 6
  files_created: 2
  files_modified: 6
---

# Phase 26 Plan 1: Person CRUD Extension Summary

Person create, delete, and relationship editing for the admin UI. Closes the v3 milestone.

## What was built

**New page: /admin/people/new**
- Server Component page with `requireAdminOrRedirect()` auth gate
- Fetches `getPeople()` for the relationship pickers
- Renders `EditPersonForm` in create mode with empty initial values

**Updated page: /admin/people**
- Added `+ New person` button in the page header linking to `/admin/people/new`
- Removed outdated "later phase" placeholder note at the bottom

**Extended form: EditPersonForm**
- New `mode: 'create' | 'update'` prop (breaking change in a good way — update page updated simultaneously)
- New `PersonFormValues` interface exported (used by both the create and update pages)
- ID field: editable in create mode (with auto-slug from name), read-only in update mode
- Name change in create mode triggers auto-slug update unless user has manually edited the id
- `parentIds` multi-select checkbox picker: all people listed with name + relation label; filtered to exclude self in update mode
- `childrenIds` multi-select checkbox picker: same pattern
- Help text explains bidirectional sync ("selecting a parent here will also add this person to that parent's children list")
- Delete button in update mode: strong confirmation prompt naming the person and listing all cascade targets (photos, videos, audio, chronicles, family members)
- On create success: `router.push('/admin/people')` then `router.refresh()`
- On update success: `router.refresh()` only (stay on page)
- On delete success: `router.push('/admin/people')` then `router.refresh()`

**Updated page: /admin/people/[id]**
- Fetches `getPeople()` and passes as `allPeople` prop
- Passes `mode="update"` and `personId={person.id}` explicitly
- Includes `parentIds` and `childrenIds` in the `initial` values (was previously omitted)
- Imports `PersonFormValues` type for typed initial construction

**New API route: POST /api/admin/people**
- Validates `id` (required, kebab-case `/^[a-z][a-z0-9-]*[a-z0-9]$|^[a-z]$/`, unique)
- Validates `name` (required, non-empty)
- Validates `parentIds` + `childrenIds` all resolve to existing person IDs
- Builds new person object (all optional scalar fields preserved if provided)
- Sets `photoIds: []`, `spouseIds: []` as defaults on new persons
- Keeps `childIds` in sync with `childrenIds` (v1 alias)
- Bidirectional sync: for each parentId, adds new person's id to that parent's `childrenIds` and `childIds`; for each childId, adds new person's id to that child's `parentIds`
- Single atomic commit: `admin: add person {name}`

**Extended API route: POST /api/admin/people/[id]**
- Added `parentIds` and `childrenIds` to the editable field surface
- Type-safe array handling: validates array of strings separately from scalar string fields
- Bidirectional sync on update:
  - Removed parents: strips this person from their `childrenIds` and `childIds`
  - Added parents: adds this person to their `childrenIds` and `childIds`
  - Removed children: strips this person from their `parentIds`
  - Added children: adds this person to their `parentIds`
  - Also syncs `childIds` alias whenever `childrenIds` changes
- Self-reference guard: rejects if parentIds or childrenIds include the person's own id

**New API route: DELETE /api/admin/people/[id]**
- Auth check (same pattern as all other admin routes)
- Reads family.json, confirms person exists (404 if not)
- Cascade within family.json: strips deleted person's id from all other people's `parentIds`, `childrenIds`, `childIds`, `spouseIds`
- Removes the person from the array
- Commits family.json: `admin: delete person {name}`
- Sequential cascade commits for each content file that had references:
  - `content/photos.json` — strips from `peopleIds[]`
  - `content/videos.json` — strips from `peopleIds[]`
  - `content/audio.json` — strips from `peopleIds[]`
  - `content/chronicles.json` — strips from `peopleIds[]`
  - Each file is only committed if it actually contained references (non-fatal skip if file missing or no refs found)
  - Commit message: `admin: clean up peopleIds references for deleted person {name}`

**Docs updates**
- `CONTENT_AUTHORING.md`: updated "Adding a person" section with admin UI option, bidirectional sync explanation, ID immutability note, cascade delete warning; updated "What you can edit" to list all 7 content types as fully available
- `README.md`: changed v3 status from "in progress" to "complete"; listed all 6 content type admin capabilities with key features

## Build result

`npm run build` exits 0. 51 static pages (up from 49 in Phase 25 — added `/admin/people/new`).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] childIds v1 alias kept in sync**
- Found during: Task 4 (POST create)
- Issue: The PersonSchema has both `childrenIds` (canonical) and `childIds` (v1 back-compat alias). Not syncing `childIds` would cause tree rendering to break for records updated via admin
- Fix: All write paths (create, update-add, update-remove, delete cascade) now sync both `childrenIds` and `childIds`
- Files modified: app/api/admin/people/route.ts, app/api/admin/people/[id]/route.ts

**2. [Rule 2 - Missing Critical Functionality] Self-reference guard**
- Found during: Task 4 (POST [id])
- Issue: Without a server-side guard, a person could be set as their own parent or child — this would cause an infinite loop in the family tree renderer
- Fix: Server rejects parentIds/childrenIds that include the person's own id with a clear error message
- Files modified: app/api/admin/people/[id]/route.ts

None — plan executed as designed for all other aspects.

## Known Stubs

None. All data flows through live JSON content.

## Threat Flags

None. All new endpoints follow the established auth pattern (getAdminUser() + session githubAccessToken check). No new trust boundaries introduced.

## Self-Check: PASSED

Files exist:
- app/admin/people/new/page.tsx: FOUND
- app/api/admin/people/route.ts: FOUND
- app/admin/people/[id]/EditPersonForm.tsx: FOUND (modified)

Commits exist:
- bbf91ce: feat(26-v3): add /admin/people/new page + new person button
- c369966: feat(26-v3): extend EditPersonForm with create mode, parent/child pickers, delete button
- a12e24c: feat(26-v3): wire allPeople to EditPersonForm in update page
- 06b1486: feat(26-v3): add /api/admin/people POST (create) + DELETE handler with cascade cleanup
- 13b5b7a: docs(26-v3): update CONTENT_AUTHORING + README for person create/delete

Build: npm run build exits 0, 51 static pages
