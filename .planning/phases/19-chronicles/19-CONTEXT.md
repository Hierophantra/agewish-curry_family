# Phase 19: Chronicles - Context

**Gathered:** 2026-05-02
**Status:** Plan only (not yet built)
**Source:** User feedback + decision (markdown body) + V2.2-FEEDBACK.md

This phase introduces "Chronicles" — a new content type for written family stories with optional audio narration. Examples: founding the martial arts school, a relative's motorcycle accident, the year the family moved across the country.

For full scope rationale and naming-decision history, see `.planning/V2.2-FEEDBACK.md`.

<domain>
## Phase Boundary

Add Chronicles as a top-level content type and section. A chronicle is:
- A written story (markdown source) tied to one or more people
- An optional audio narration (the author reading the story aloud)
- Optional cover photo, date, location, provenance
- Surfaced at a new top-level route `/chronicles`, an individual `/chronicles/[id]` page, on person pages where they're tagged, and on the home page as recent reading

**In scope:**
- New schema (ChronicleSchema), new content file (chronicles.json), new content loader functions
- Two new routes (`/chronicles`, `/chronicles/[id]`)
- Three new components (ChronicleCard, ChronicleGrid, ChronicleBody)
- Markdown rendering via `react-markdown`
- TopNav adds 5th tab
- Person page adds "Chronicles featuring {name}" section
- Home page adds "Recent chronicles" preview section
- Bidirectional validator extension
- Archive export adds Chronicles tab to static HTML
- CONTENT_AUTHORING.md "Writing a chronicle" section
- 3 stub chronicles + matching audio placeholders

**Out of scope:**
- Search/filter on /chronicles page
- Chapter divisions (use markdown headers)
- Author attribution beyond existing provenance fields
- Chronicle-to-chronicle cross-references (markdown links suffice)
- Print stylesheet for chronicles (future polish pass)
- Collection detail pages displaying chronicles inline (data model supports via `collectionIds[]`; rendering is future work)
- Deep-linking audio playback state (`?audio=playing`)

</domain>

<decisions>
## Implementation Decisions

### Naming

- **D-01:** Section name is "Chronicles" (plural) for the nav tab and landing page. Individual entry is "a chronicle" (singular). Eyebrow on detail page reads "FAMILY ARCHIVE · CHRONICLE."

### Schema

- **D-02:** ChronicleSchema fields:
  ```typescript
  {
    id: string                       // kebab-case
    title: string
    subtitle: string | undefined
    body: string                     // markdown source
    audioFilename: string | undefined  // file in /public/audio/, optional
    audioDuration: string | undefined  // e.g., "8:42"
    date: string | undefined         // ISO YYYY-MM-DD
    dateLabel: string | undefined    // e.g., "Summer 1979"
    peopleIds: string[]              // people in this story
    coverPhotoId: string | undefined // displayed at top of detail
    collectionIds: string[]          // future cross-tagging
    // Provenance (Phase 15 pattern)
    source, identifiedBy, circa, confidence, lastVerified
  }
  ```
- **D-03:** Audio is embedded on the chronicle (audioFilename field), NOT referenced from audio.json. A chronicle's narration is 1:1 with the chronicle; no need for separate audio entity. audio.json continues to hold standalone audio (voicemails, songs, etc.).

### Body Format

- **D-04:** Markdown via `react-markdown`. User confirmed in v2.2 question. Rationale: long-form storytelling benefits from italics for emphasis, blockquotes for direct quotes, occasional emphasis. Markdown is permissive — plain text renders fine without any markdown.
- **D-05:** Render markdown server-side if possible. `react-markdown` works in Server Components. Use minimal plugins (no HTML-allowing plugin — never `rehype-raw` — security boundary).

### Routes

- **D-06:** `/chronicles` (Server Component) — landing. Loads all chronicles, sorts by date descending (newest first), renders ChronicleGrid.
- **D-07:** `/chronicles/[id]` (Server Component, async) — individual page. Calls `getChronicleById`; `notFound()` if missing. `generateStaticParams` returns all chronicle IDs.

### Page Composition (chronicle detail)

- **D-08:** Order top to bottom:
  1. "← Back to chronicles" link (text-quiet eyebrow)
  2. "FAMILY ARCHIVE · CHRONICLE" eyebrow (gold-deep)
  3. Title (serif h1, large — text-5xl or text-6xl matching person page)
  4. Subtitle if present (italic serif, muted)
  5. dateLabel (eyebrow style if present)
  6. Cover photo if present (full-width, ~16:9 max, with BlurHash placeholder)
  7. AudioPlayer if `audioFilename` is present (placed early so narration is findable; user can listen while reading)
  8. Markdown body (font-serif text-navy, max-w-prose, generous line-height)
  9. "About the people in this story" — list of `<Link>` chips for each peopleIds entry, linking to `/person/{id}`

### Component Boundaries

- **D-09:** ChronicleCard, ChronicleGrid — Server Components (no client interaction)
- **D-10:** ChronicleBody — Server Component if react-markdown supports it; otherwise wrap in `'use client'`. Either works.
- **D-11:** AudioPlayer (existing) — already `'use client'`; receives chronicle audio via a small adapter prop

### Cross-cutting Integrations

- **D-12:** TopNav — 5th tab "Chronicles" between Videos and (no Sign out). Order: Home / Family tree / Photographs / Videos / Chronicles. Mobile horizontal scroll already in place.
- **D-13:** Person page — new section "CHRONICLES FEATURING {NAME}" between videos and audio sections. Renders as compact card list (smaller than full ChronicleCard — title + dateLabel + first sentence). Empty state condition extends to require chronicles too.
- **D-14:** Home page — new section "CHRONICLES" eyebrow + "Recent chronicles" h2 + 1-2 most recent chronicles as full ChronicleCard. Slot it after the photographs section, before videos.
- **D-15:** Archive export — `lib/archive-template.ts` adds a Chronicles tab + render function. The static HTML viewer should display chronicle title, dateLabel, and the body text (markdown source rendered as plain paragraphs — no need to bundle a markdown parser in the export).

### Stub Data

- **D-16:** 3 chronicles in stub:
  1. `starting-the-martial-arts-school` — robert-curry + william-curry, with audio, with cover photo (use existing 1979-school stub photo if available, or null)
  2. `daniels-musical-life` — daniel-curry (the musician from prototype), no cover photo, with audio
  3. `the-summer-of-1985-at-the-lake` — multi-person, no audio (exercises the "audio coming later" empty state)
- **D-17:** 3 placeholder MP3 files in `/public/audio/` (matching audioFilename in stubs). 1-byte stubs are fine.

### Validator Extension

- **D-18:** `lib/content.ts` `validateBidirectionalRefs()` extended:
  - Every `Chronicle.peopleIds[]` ID must exist in family.json
  - Every `Chronicle.coverPhotoId` must exist in photos.json (if non-null)
  - Every `Chronicle.collectionIds[]` ID must exist in collections.json (if non-empty array)

### CONTENT_AUTHORING.md

- **D-19:** New "Writing a chronicle" section. Topics:
  - When to write a chronicle vs leave a memory in a photo caption
  - Field reference (id, title, subtitle, body, audio, date, peopleIds, coverPhotoId, collectionIds, provenance)
  - Markdown cheatsheet — italics with `*`, blockquotes with `>`, em-dash with `--`, paragraph break with blank line
  - Recording the narration: tips on quiet room, leave a few seconds of silence at start/end for editing, save as MP3 at 64-128 kbps mono
  - The audio file goes in `/public/audio/{audioFilename}` matching the JSON
  - Worked example: a chronicle entry from start to finish

### Verification

- **D-20:** `npm run build` exits 0
- **D-21:** Visit `/chronicles` — sees 3 cards
- **D-22:** Click a card → `/chronicles/{id}` opens with title, date, audio player (if present), markdown-rendered body, and people chips
- **D-23:** Visit `/person/robert-curry` → "CHRONICLES FEATURING ROBERT CURRY" section appears with the school chronicle linked
- **D-24:** Home page shows "Recent chronicles" section
- **D-25:** Archive download includes `chronicles.json` and the static index.html has a Chronicles tab

</decisions>

<canonical_refs>
## Canonical References

### Project Documents
- `.planning/V2.2-FEEDBACK.md` — full v2.2 scope and naming rationale
- `.planning/V2.1-MILESTONE-COMPLETE.md` — what shipped in v2.1 (this phase builds on it)
- CURRY_FAMILY_HUB_BRIEF_v2.md — original v2 brief; tone guidance still applies

### Source-of-truth Code Files (will be modified)
- `lib/types.ts` — ChronicleSchema added
- `lib/content.ts` — getChronicles/getChronicleById/etc. added; validator extended
- `content/chronicles.json` — NEW
- `public/audio/{narration files}` — NEW
- `app/(protected)/chronicles/page.tsx` — NEW
- `app/(protected)/chronicles/[id]/page.tsx` — NEW
- `components/chronicles/ChronicleCard.tsx` — NEW
- `components/chronicles/ChronicleGrid.tsx` — NEW
- `components/chronicles/ChronicleBody.tsx` — NEW
- `components/layout/NavTabs.tsx` — adds Chronicles tab
- `app/(protected)/person/[id]/page.tsx` — adds chronicles section
- `app/(protected)/page.tsx` — adds Recent chronicles section
- `lib/archive-template.ts` — adds Chronicles tab to static export
- `CONTENT_AUTHORING.md` — adds "Writing a chronicle" section
- `package.json` — adds react-markdown

### External Documentation
- react-markdown: https://github.com/remarkjs/react-markdown
- Markdown spec: https://commonmark.org/help/

</canonical_refs>

<code_context>
## Existing Code Insights (relevant patterns to mirror)

- Audio integration patterns from Phase 17 (AudioPlayer reuse, audio.json schema)
- Collection patterns from Phase 8 (CollectionCard/CollectionGrid for the chronicle list view)
- Provenance fields from Phase 15
- BlurHash from Phase 16 (cover photo gets blur placeholder)
- Deep-linking from Phase 16 (could extend to chronicle audio state, deferred)
- Archive export from Phase 18 (extend with chronicles tab)
- Person page surface pattern from Phase 11 (add chronicles section similar to videos/audio)
- Home page composition from Phase 12 (add Recent chronicles section)

## Pitfalls to avoid

- Markdown rendering: do NOT use `rehype-raw` or any HTML-allowing plugin (XSS boundary; user-content body could contain unsafe HTML)
- Don't bundle the markdown library into the static archive export (Task 15) — render markdown source as plain paragraphs in the export's index.html
- TopNav 5 tabs may overflow on smaller mobile widths — verify scrollbar appears

</code_context>

<specifics>
## Specific Notes

- Chronicle audio is part of the chronicle entity, not a separate audio.json entry. Don't conflate.
- The body is markdown SOURCE (string) in JSON. The CHRONICLE component renders it. Keep raw markdown in JSON for portability and easy editing.
- Cover photos for chronicles can reference the same photos as collections — they're tagged into photos.json by ID, not duplicated.

</specifics>

<deferred>
## Deferred (out of scope)

- Search inside /chronicles
- Chapter navigation within a long chronicle
- Print stylesheet for chronicles
- Collection detail pages rendering chronicles
- Deep-linkable chronicle audio playback state
- Chronicle-to-chronicle cross-referencing UI (markdown links already work)
- A "next/previous chronicle" reader navigation
- Comments / annotations
- "Suggested reading" carousel based on shared people

</deferred>

---

*Phase: 19-Chronicles*
*Context gathered: 2026-05-02*
*Status: PLAN ONLY — not yet executed*
