---
phase: "19"
plan: "19-chronicles"
subsystem: "chronicles"
tags: ["content-type", "markdown", "audio", "cross-cutting", "v2.2"]
dependency_graph:
  requires: ["17-v2-1-audio", "16-v2-1-deeplink-blurhash", "15-v2-1-schema-a11y", "08-collections-lightbox"]
  provides: ["chronicles-schema", "chronicles-routes", "chronicles-components"]
  affects: ["home-page", "person-pages", "nav-tabs", "archive-export"]
tech_stack:
  added: ["react-markdown@10.1.0"]
  patterns: ["Server Component markdown rendering (client component for react-markdown)", "embedded audio on chronicle entity", "ChronicleSchema Zod pattern", "bidirectional validator extension"]
key_files:
  created:
    - "lib/types.ts (ChronicleSchema + Chronicle type)"
    - "content/chronicles.json (3 stub entries)"
    - "public/audio/starting-the-school-narration.mp3 (placeholder)"
    - "public/audio/daniels-musical-life-narration.mp3 (placeholder)"
    - "components/chronicles/ChronicleCard.tsx"
    - "components/chronicles/ChronicleGrid.tsx"
    - "components/chronicles/ChronicleBody.tsx"
    - "app/(protected)/chronicles/page.tsx"
    - "app/(protected)/chronicles/[id]/page.tsx"
  modified:
    - "lib/content.ts (getChronicles, getChronicleById, getChroniclesByPersonId, getChroniclesInCollection, validateBidirectionalRefs extension)"
    - "components/layout/NavTabs.tsx (5th tab)"
    - "app/(protected)/person/[id]/page.tsx (CHRONICLES FEATURING section)"
    - "app/(protected)/page.tsx (Recent chronicles section)"
    - "lib/archive-template.ts (Chronicles tab in static export)"
    - "app/api/archive/route.ts (chronicles.json included in ZIP)"
    - "CONTENT_AUTHORING.md (Writing a chronicle section)"
    - "README.md (v2.2 status)"
decisions:
  - "D-03: Chronicle audio embedded on chronicle entity (audioFilename field), NOT in audio.json — 1:1 narration relationship"
  - "D-05: react-markdown in 'use client' ChronicleBody — react-markdown v10 requires client context; NO rehype-raw (XSS boundary)"
  - "D-15: Archive export renders chronicle body as plain paragraphs without bundling a markdown parser"
  - "D-18: Validator extended to check chronicle peopleIds, coverPhotoId, collectionIds bidirectional integrity"
metrics:
  duration: "~35 minutes"
  completed: "2026-04-29"
  tasks_completed: 15
  files_created: 9
  files_modified: 8
---

# Phase 19: Chronicles Summary

## One-liner

Chronicles content type: markdown body stories with optional MP3 narration, rendered via react-markdown, surfaced at /chronicles, /chronicles/[id], person pages, home page, and the static archive export.

## What was built

### Data layer

- **ChronicleSchema** (`lib/types.ts`) — Zod schema with id, title, subtitle, body (markdown string), audioFilename, audioDuration, date, dateLabel, peopleIds, coverPhotoId, collectionIds, and Phase 15 provenance fields. Audio is embedded directly on the chronicle (NOT in audio.json) per D-03.
- **chronicles.json** — 3 stub entries exercising all rendering paths:
  1. `starting-the-martial-arts-school` (robert-curry + william-curry, with audio, with cover photo)
  2. `daniels-musical-life` (daniel-curry, with audio, no cover photo)
  3. `the-summer-of-1985-at-the-lake` (all 8 family members, no audio, exercises "audio coming later" state)
- **Placeholder MP3 stubs** — `starting-the-school-narration.mp3`, `daniels-musical-life-narration.mp3` in `public/audio/`
- **Content loaders** (`lib/content.ts`) — `getChronicles`, `getChronicleById`, `getChroniclesByPersonId`, `getChroniclesInCollection`
- **Validator extension** — `validateBidirectionalRefs()` now checks chronicle `peopleIds`, `coverPhotoId`, and `collectionIds` integrity against their respective content files

### Components

- **ChronicleCard** — Server Component; cover photo (16:9, BlurHash) + title + subtitle + dateLabel eyebrow + first ~150 words body preview. Links to `/chronicles/{id}`.
- **ChronicleGrid** — Server Component; sorts by date descending; empty state with serif message.
- **ChronicleBody** — Client Component (`'use client'`); react-markdown with custom renderers for p, blockquote, h2/h3, em, strong, hr, ul/ol/li. NO rehype-raw per security boundary.

### Routes

- **`/chronicles`** — landing page with FAMILY ARCHIVE header, gold divider, ChronicleGrid
- **`/chronicles/[id]`** — detail page: back link → eyebrow → title → subtitle → dateLabel → cover photo (BlurHash) → AudioPlayer narration (adapter object from chronicle fields) → ChronicleBody → people chips. `generateStaticParams` pre-renders all 3.

### Cross-cutting integrations

- **NavTabs** — 5th tab "Chronicles" added; order: Home / Family tree / Photographs / Videos / Chronicles
- **Person page** — "CHRONICLES FEATURING {NAME}" section between videos and audio; compact card list (title + dateLabel + first sentence); empty state updated
- **Home page** — "CHRONICLES / Recent chronicles" section after photographs, before videos; 1-2 most recent full ChronicleCard
- **Archive export** — `chronicles.json` bundled in ZIP; Chronicles tab added to static `index.html`; `renderChronicles()` renders body as plain paragraphs without bundling a markdown parser
- **CONTENT_AUTHORING.md** — "Writing a chronicle" section with field reference, markdown cheatsheet, narration recording tips, worked example
- **README.md** — v2.2 milestone status block

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Template literal backtick collision in archive-template.ts**
- **Found during:** npm run build (Task 16)
- **Issue:** The `renderChronicles()` JS function embedded in the TypeScript template literal used `` /`(.+?)`/g `` (a regex for inline code stripping). The backtick inside the string terminated the outer TypeScript template literal, causing a webpack syntax error.
- **Fix:** Escaped the backtick as `\`` inside the template literal.
- **Files modified:** `lib/archive-template.ts`
- **Commit:** `bd02b88`

## Known Stubs

| Stub | File | Reason |
|------|------|--------|
| `starting-the-school-narration.mp3` | `public/audio/` | 1-byte placeholder; replace with real recording when available |
| `daniels-musical-life-narration.mp3` | `public/audio/` | 1-byte placeholder; replace with real recording when available |

The stub MP3 files produce a silent/failed play (handled gracefully in AudioPlayer). The chronicles themselves render correctly with full text content.

## Self-Check: PASSED

Files verified:
- `content/chronicles.json` — FOUND
- `components/chronicles/ChronicleCard.tsx` — FOUND
- `components/chronicles/ChronicleGrid.tsx` — FOUND
- `components/chronicles/ChronicleBody.tsx` — FOUND
- `app/(protected)/chronicles/page.tsx` — FOUND
- `app/(protected)/chronicles/[id]/page.tsx` — FOUND
- `public/audio/starting-the-school-narration.mp3` — FOUND
- `public/audio/daniels-musical-life-narration.mp3` — FOUND

Commits verified:
- `e84e28d` react-markdown install — FOUND
- `b4f0e36` ChronicleSchema — FOUND
- `0c8e751` chronicles.json — FOUND
- `d68ff7c` placeholder MP3s — FOUND
- `4fef78c` content.ts loaders — FOUND
- `c7fea09` chronicle components — FOUND
- `f8e8192` chronicle routes — FOUND
- `8daa640` NavTabs 5th tab — FOUND
- `83f5c55` person page section — FOUND
- `19629c9` home page section — FOUND
- `a2b65c5` archive export — FOUND
- `465d640` docs — FOUND
- `bd02b88` backtick fix — FOUND

npm run build: exits 0, 31 static pages (including 3 chronicle detail pages pre-rendered)

Success criteria check:
- [x] react-markdown in package.json
- [x] ChronicleSchema in lib/types.ts
- [x] content/chronicles.json with 3 stub entries
- [x] 3 placeholder MP3 files in public/audio/ (2 stubs; 3rd chronicle has no audio by design)
- [x] getChronicles, getChronicleById, getChroniclesByPersonId, getChroniclesInCollection + extended validator
- [x] ChronicleCard.tsx, ChronicleGrid.tsx, ChronicleBody.tsx
- [x] /chronicles lists chronicles
- [x] /chronicles/[id] renders with generateStaticParams
- [x] NavTabs has 5th Chronicles tab
- [x] Person page has CHRONICLES FEATURING section
- [x] Home page has Recent chronicles section
- [x] Archive export includes chronicles.json + Chronicles tab
- [x] CONTENT_AUTHORING.md has Writing a chronicle section
- [x] README mentions v2.2 status
- [x] npm run build exits 0
