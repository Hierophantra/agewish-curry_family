---
phase: 01-scaffold-auth-design
plan: "03"
subsystem: content
tags: [zod, content-schema, typed-loaders, bidirectional-refs, server-only]
dependency_graph:
  requires:
    - 01-01 (scaffold: zod, clsx, tailwind-merge installed)
  provides:
    - lib/types.ts (PersonSchema, PhotoSchema, VideoSchema, Person, Photo, Video types)
    - lib/utils.ts (cn() utility)
    - lib/content.ts (getPeople, getPhotos, getVideos, getPersonById, validateBidirectionalRefs)
    - content/family.json (3-person stub)
    - content/photos.json (2-photo stub)
    - content/videos.json (1-video stub)
  affects:
    - All subsequent phases (Phase 2-6 consume lib/content.ts loaders)
    - Phase 4 (family tree depends on Person.id kebab-case format)
    - Phase 6 (person detail pages use Person.id as URL segment)
tech_stack:
  added:
    - server-only (Next.js server boundary enforcement)
  patterns:
    - Zod .parse() throw pattern (fail loud, not safeParse)
    - ZodType<Output, Def, Input> generics for correct default-filled type inference
    - server-only boundary: import 'server-only' prevents client bundle inclusion
    - Bidirectional reference validation: photo→person and person→photo cross-checks
key_files:
  created:
    - lib/types.ts
    - lib/utils.ts
    - lib/content.ts
    - content/family.json
    - content/photos.json
    - content/videos.json
  modified:
    - package.json (added server-only dependency)
    - package-lock.json
decisions:
  - "ZodType<Output, Def, Input> generics required in readJSON<> to correctly reflect post-default output types in TypeScript strict mode"
  - "server-only installed as runtime dependency (not devDependency) — build enforces boundary"
  - "safeParse intentionally avoided — .parse() throws ZodError on bad content, surfaces mistakes at request time"
metrics:
  duration: "2m 19s"
  completed: "2026-04-30"
  tasks_completed: 2
  files_created: 6
  files_modified: 2
---

# Phase 1 Plan 03: Content Schema, Loaders, and Stub Data Summary

**One-liner:** Zod-validated content layer with server-only boundary, bidirectional reference validator, and 3-person/2-photo/1-video stub JSON using kebab-case person IDs.

## What Was Built

### Task 1 — lib/types.ts and lib/utils.ts (commit: 6fc3d36)

**lib/types.ts** defines three Zod schemas as the single source of truth for all content types:
- `PersonSchema`: kebab-case ID (regex enforced), name, optional birth/death years, bio, photoIds, parentIds, childIds, spouseIds (all array fields default to `[]`)
- `PhotoSchema`: id, filename, optional caption/dateTaken, peopleIds array
- `VideoSchema`: id, title, `source: z.enum(['youtube', 'vimeo'])`, sourceId, optional description/dateTaken, peopleIds

TypeScript types (`Person`, `Photo`, `Video`) are derived via `z.infer<typeof ...Schema>` — no manual duplication.

**lib/utils.ts** exports `cn()` using `clsx` + `tailwind-merge` for conditional Tailwind class merging.

### Task 2 — lib/content.ts and stub JSON (commit: 54fc3ee)

**lib/content.ts** is the sole access point for family content:
- `import 'server-only'` at line 6 — build error if accidentally imported in client component
- `readJSON<Output, Def, Input>()` internal helper uses `z.ZodType<Output, Def, Input>` generics and `schema.parse()` (throws ZodError on failure)
- Five exported functions: `getPeople()`, `getPhotos()`, `getVideos()`, `getPersonById(id)`, `validateBidirectionalRefs()`
- `validateBidirectionalRefs()` checks both directions: photo.peopleIds→Person.id and person.photoIds→Photo.id, throws descriptively on dangling reference

**Stub JSON files:**
- `content/family.json`: william-curry (grandfather, 1920-1998), james-curry (child, b.1948), emily-curry (grandchild, b.1975) with consistent parent/child links
- `content/photos.json`: photo-001 (William Curry circa 1950, peopleIds: ["william-curry"]) + photo-002 (family gathering, no people tagged)
- `content/videos.json`: video-001 with Rick Roll placeholder (source: "youtube", sourceId: "dQw4w9WgXcQ")

Bidirectional refs are consistent: william-curry.photoIds = ["photo-001"] ↔ photo-001.peopleIds = ["william-curry"].

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing server-only package**
- **Found during:** Task 2 setup
- **Issue:** `import 'server-only'` in lib/content.ts requires the `server-only` npm package, which was not installed
- **Fix:** Ran `npm install server-only` before writing content.ts
- **Files modified:** package.json, package-lock.json

**2. [Rule 1 - Bug] TypeScript strict-mode type error in readJSON generic**
- **Found during:** Task 2 verification (`npx tsc --noEmit`)
- **Issue:** `readJSON<T>(filename, schema: z.ZodSchema<T>)` infers T as the *input* type from Zod schemas. With `.default([])`, Zod's input type has `photoIds?: string[] | undefined` but the output type has `photoIds: string[]`. TypeScript strict mode rejects the output being assigned to `Person[]` because the inferred T includes `undefined`.
- **Fix:** Changed generic signature to `readJSON<Output, Def extends z.ZodTypeDef, Input>(filename, schema: z.ZodType<Output, Def, Input>): Output` — this binds TypeScript to the *output* type, correctly reflecting defaults-filled values.
- **Files modified:** lib/content.ts
- **Commit:** 54fc3ee (included in task commit)

## Known Stubs

| Stub | File | Description |
|------|------|-------------|
| placeholder-001.jpg | content/photos.json | Photo file does not exist in /public/photos/ — empty state path exercised by Phase 2 |
| placeholder-002.jpg | content/photos.json | Photo file does not exist in /public/photos/ — same |
| Rick Roll YouTube video | content/videos.json | sourceId: dQw4w9WgXcQ is an intentional placeholder per D-31; replaced when real family films are available |

All stubs are intentional per the plan (D-29, D-30, D-31). Photo files not existing is expected — Phase 2 exercises the empty state path. The stubs do not prevent plan goals (schema validation, loader contract, bidirectional refs) from being achieved.

## Threat Surface Scan

The `import 'server-only'` boundary addresses T-03-02 from the plan's threat register. No new network endpoints, auth paths, or file access patterns were introduced beyond what the plan specified. The `lib/content.ts` file reads from `content/*.json` only (developer-maintained, no user upload path).

No new threat flags identified.

## Self-Check: PASSED

Files exist:
- lib/types.ts: FOUND
- lib/utils.ts: FOUND
- lib/content.ts: FOUND
- content/family.json: FOUND
- content/photos.json: FOUND
- content/videos.json: FOUND

Commits exist:
- 6fc3d36 (feat(01-03): add Zod schemas, TypeScript types, and cn() utility): FOUND
- 54fc3ee (feat(01-03): add content loaders, bidirectional validator, and stub JSON): FOUND

Build: `npm run build` exits 0 — PASSED
