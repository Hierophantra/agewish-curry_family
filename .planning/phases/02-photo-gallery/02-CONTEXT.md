# Phase 2: Photo Gallery - Context

**Gathered:** 2026-04-29
**Status:** Ready for planning
**Mode:** --auto (recommended defaults selected)

<domain>
## Phase Boundary

Phase 2 delivers the `/photographs` route — a server-rendered grid of all photos from `content/photos.json`, each card showing the image, caption, and date label. Real photo images load from `/public/photos/{filename}`. Empty state degrades gracefully when `photos.json` has zero entries.

**In scope:**
- `components/gallery/PhotoGrid.tsx` (Server Component)
- `components/gallery/PhotoCard.tsx` (Server Component)
- `app/(protected)/photographs/page.tsx` — replace placeholder with PhotoGrid
- Empty state component or inline empty render
- Stub photo files in `/public/photos/` to make existing stub data resolve to real images (vs. 404s)

**Out of scope (later phases):**
- Photo lightbox / fullscreen viewer — Phase 5 polish
- Filters, search, date-range — Phase 6 if scoped in
- Click-through to person detail page — Phase 6 (PERSON-03 covers the link target; this phase can include the link but the destination page comes in Phase 6)
- Lazy-loading pagination — defer until photo count > 50
- Image optimization beyond what `next/image` provides

</domain>

<decisions>
## Implementation Decisions

### Components

- **D-01:** PhotoGrid is a Server Component. Reads photos via `getPhotos()` from `lib/content.ts`. Receives no props — it's the page's primary content. Renders grid via CSS `grid-template-columns` (Tailwind utilities), maps photos to `<PhotoCard>`.
- **D-02:** PhotoCard is a Server Component. Receives a single `Photo` prop (typed from `lib/types.ts`). No interactivity in v1 — no hover effects, no click handler beyond an `<a>` wrapping the card linking to `/person/[id]` if `peopleIds[0]` exists (otherwise just renders without a link).
- **D-03:** Empty state is inline in PhotoGrid (not a separate component). When `photos.length === 0`, render a centered message: "No photographs yet" (eyebrow) + "Photographs will appear here as they are added to the archive." (muted body). No illustration in v1.

### Grid Layout

- **D-04:** Responsive grid columns:
  - mobile (<640px): 1 column
  - sm (≥640px): 2 columns
  - md (≥768px): 2 columns
  - lg (≥1024px): 3 columns
  - xl (≥1280px): 4 columns
  Implemented as `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- **D-05:** Grid gap: `gap-7` (28px) — matches the section padding rhythm from Phase 1's design system.
- **D-06:** Section padding: `py-11 px-7` mobile, `md:px-11 lg:px-15` desktop — matches home page section rhythm.
- **D-07:** Eyebrow above grid: "FAMILY ARCHIVE" using `.eyebrow` utility (uppercase + 0.22em letter-spacing + text-quiet) — adds metadata texture and matches design language.

### PhotoCard Anatomy

- **D-08:** Card structure (top to bottom):
  1. Image container (aspect-ratio enforced)
  2. Date eyebrow (e.g. "JUNE 1953") — uppercase eyebrow, text-quiet
  3. Caption (e.g. "Wedding day") — serif, text-navy
  4. Optional location (e.g. "Dayton, Ohio") — text-muted, smaller
- **D-09:** Image aspect ratio: `aspect-[4/3]` (4:3 landscape). Most scanned family photos are landscape; consistent ratio gives the grid visual rhythm. Photos with different native ratios get `object-cover` cropping (slight crop is acceptable for grid view; full image accessible later via lightbox in Phase 5).
- **D-10:** Image rendering uses `next/image` with `width`, `height`, and `alt` props derived from the Photo data. Default `sizes` attribute: `"(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"` — matches the responsive grid breakpoints.
- **D-11:** Image alt text: use `photo.caption` (e.g., "Wedding day"). Acceptable accessibility default — captions are descriptive.
- **D-12:** Image background: `bg-ivory` placeholder color while loading (visible if image is slow or 404s).

### Sorting

- **D-13:** Photos render in chronological order (oldest first) by `photo.date`. Photos with empty `date` (`""`) sort to the end. Implemented as a simple sort in PhotoGrid before mapping. Rationale: family archives feel natural to browse historically.

### Empty State

- **D-14:** Empty state copy:
  - Eyebrow: "FAMILY ARCHIVE"
  - Heading (serif, text-navy): "No photographs yet"
  - Muted body: "Photographs will appear here as they are added to the archive."
  - Centered, vertically padded section
- **D-15:** No "Add photo" button — this is a curator's archive, not a user-upload site. Out-of-scope per project brief.

### Section Header

- **D-16:** Page renders an `<SectionHeader />` reusable component above the grid OR an inline header. Decision: inline for now. If TopNav and Footer remain stable, `<SectionHeader />` extracts naturally in Phase 5 polish if reused 2+ times.
- **D-17:** Header text: serif "Photographs" h1 in text-navy. Below it: muted serif subtitle "Scanned and curated from the family archive." (placeholder — easy to refine).

### Stub Photo Files

- **D-18:** Real photo files placed in `/public/photos/` matching the filenames in `content/photos.json` stub data. For Phase 2 stub, use small placeholder images (1x1 colored squares, gradient JPGs, or simple SVG-converted-to-JPG). Goal: exercise the real image-loading path so PhotoCard rendering is verified end-to-end. Real scanned family photos populate later by the developer.
- **D-19:** If a referenced filename is missing, `next/image` will throw at request time. Phase 2 must guarantee every photo entry in `photos.json` has a matching file in `/public/photos/`.

### Person Link

- **D-20:** PhotoCard wraps in `<Link href={...}>` only if `photo.peopleIds.length > 0`. Link target: `/person/${photo.peopleIds[0]}`. The `/person/[id]` route is a placeholder until Phase 6 — the link will redirect to the placeholder until then, which is fine (graceful intermediate state).

### Verification

- **D-21:** Acceptance gate: `npm run build` exits 0 (validates types, Zod schema, Tailwind purge, and image filenames since `next/image` validates at build with statically-imported sources or warns on dynamic). Local browser check: visit `/photographs`, see grid of photos. Edit `content/photos.json` to empty array, refresh, see empty state. Build passes both states.

### Claude's Discretion

- Exact spacing micro-tuning between card image, eyebrow, caption, location
- Hover interaction polish in Phase 5 (subtle shadow lift on hover)
- Final stub image content (any 4 small JPGs of distinct colors will do)
- Subtitle copy for the page header — propose tasteful wording, can be edited

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Documents
- `.planning/PROJECT.md` — Project context
- `.planning/REQUIREMENTS.md` — PHOTO-01..04 are this phase's scope
- `.planning/ROADMAP.md` — Phase 2 goal and 3 success criteria

### Phase 1 Outputs (the foundation Phase 2 builds on)
- `.planning/phases/01-scaffold-auth-design/01-CONTEXT.md` — Design system tokens (D-09..D-15), folder structure (D-21)
- `.planning/phases/01-scaffold-auth-design/01-RESEARCH.md` — Tailwind v4 token names (note: `text-muted`, `text-quiet`, `bg-ivory`)
- `.planning/phases/01-scaffold-auth-design/01-06-SUMMARY.md` — Two latent-bug fixes (dotenv-expand, dead app/page.tsx)

### Source-of-truth Code Files (read before modifying)
- `lib/content.ts` — `getPhotos()` is the sole content access point
- `lib/types.ts` — `Photo` type and `PhotoSchema` (Zod)
- `content/photos.json` — current stub data (2-3 entries)
- `app/(protected)/photographs/page.tsx` — placeholder page to replace
- `app/globals.css` — design tokens and `.eyebrow` / `.hairline` utilities
- `components/ui/StarMark.tsx` — example Server Component pattern
- `components/layout/TopNav.tsx`, `Footer.tsx` — example Server Components with brand styling

### External Documentation
- next/image: https://nextjs.org/docs/app/api-reference/components/image
- next/link: https://nextjs.org/docs/app/api-reference/components/link

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `getPhotos()` in `lib/content.ts` — already returns validated `Photo[]` with bidirectional ref check. PhotoGrid imports this directly.
- `Photo` type in `lib/types.ts` — fields: `id`, `filename`, `caption`, `date`, `dateLabel`, `peopleIds[]`, `location`, `notes`
- `.eyebrow` utility in `globals.css` — apply for date eyebrows on cards
- `StarMark`, `TopNav`, `Footer` — examples of established Server Component pattern

### Established Patterns (from Phase 1)
- Server Components by default; `'use client'` only when interactivity needed (PhotoGrid + PhotoCard need NEITHER — both Server Components)
- All content reads via `lib/content.ts` — never read JSON files directly from components
- Tailwind tokens for all colors; named tokens only (no string interpolation)
- Sentence case throughout; eyebrows are the only uppercase
- 400/500 weights only

### Integration Points
- `app/(protected)/photographs/page.tsx` — currently renders placeholder ("Coming in Phase 2"). Replace its body with `<PhotoGrid />`.
- `(protected)/layout.tsx` — already wraps every protected page in TopNav + Footer + auth gate. Phase 2 doesn't touch this.
- `/public/photos/` directory — currently empty. Phase 2 adds stub image files matching `content/photos.json` filenames.

### Pitfalls to Avoid (from Phase 1 lessons)
- Do NOT create a duplicate `app/photographs/page.tsx` outside the `(protected)` group — the dead `app/page.tsx` from Phase 1 is a cautionary tale.
- Do NOT use `next/image` with a hardcoded `src=""` — must reference `/photos/{filename}` from photo data.

</code_context>

<specifics>
## Specific Ideas

- The aesthetic stays archival — text-forward, ivory and white sections, serif headings. Photos are the visual content; chrome is intentionally restrained.
- Crop is acceptable for grid view; uncropped photos are accessible later via Phase 5 lightbox.
- Empty state matters — content arrives incrementally; the page must look intentional with zero photos.

</specifics>

<deferred>
## Deferred Ideas

- **Photo lightbox / fullscreen viewer** — Phase 5 polish
- **Filter by person, year, location** — Phase 6 if gated in
- **Click-through to /person/[id]** — link wired in Phase 2; destination page comes in Phase 6
- **Lazy loading / pagination** — defer until photo count exceeds 50
- **Hover effects** — Phase 5 polish (subtle shadow lift)
- **Dedicated SectionHeader component** — extract in Phase 5 if reused

</deferred>

---

*Phase: 2-Photo Gallery*
*Context gathered: 2026-04-29*
