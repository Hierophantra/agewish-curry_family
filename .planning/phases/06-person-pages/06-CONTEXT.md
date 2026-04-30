# Phase 6: Person Detail Pages - Context

**Gathered:** 2026-04-29
**Status:** Ready for planning
**Mode:** --auto

<domain>
## Phase Boundary

Phase 6 closes the loop. Every person in `family.json` gets a dedicated detail page at `/person/[id]`. Tree nodes and photo `peopleIds[]` slugs already point at this URL pattern from earlier phases — Phase 6 fills in the destination.

**In scope:**
- `app/(protected)/person/[id]/page.tsx` — replace placeholder with real person detail page
- Page content: name (serif h1), dates (eyebrow), birthplace, bio, photos by person (PhotoGrid filtered)
- Optional: helper function `getPhotosByPersonId(id)` in `lib/content.ts` (or filter inline)
- 404 handling: if person id doesn't exist, render Next.js `notFound()` for proper 404 page
- "View full profile" link from PersonPanel inside the tree → navigates to `/person/{id}`
- generateStaticParams() for static-site generation (build-time pre-render of all person pages — Vercel benefit)

**Out of scope:**
- Editing person data via the page (admin upload UI = v2)
- Comments / notes / annotations
- Family relationship visualization on the person page (the tree already does that)
- Print stylesheet
- OG/Twitter metadata refinement (could add basic metadata function but no images)

</domain>

<decisions>
## Implementation Decisions

### Page Structure

- **D-01:** `app/(protected)/person/[id]/page.tsx` is a Server Component (async). Fetches via `getPersonById(params.id)`; if null, calls `notFound()`.
- **D-02:** Page layout (top to bottom):
  1. FAMILY ARCHIVE eyebrow
  2. Serif h1: person.name
  3. Date eyebrow (small): `{birthYear}–{deathYear ?? 'present'}` if both/either, else hidden
  4. Birthplace line: muted serif italic — "Born in {birthPlace}"
  5. Bio: serif body text, normal weight, max-w-prose
  6. Spouses block (if any): "Married to: {names with date ranges}"
  7. Children block (if any): "Children: {comma-separated names linked to their pages}"
  8. Parents block (if any): "Parents: {comma-separated names linked to their pages}"
  9. Photos heading: "Photographs of {name}" eyebrow
  10. PhotoGrid filtered to this person's photos (reuse existing PhotoGrid component? OR a simpler ad-hoc grid)
- **D-03:** PhotoGrid component currently calls `getPhotos()` internally. Phase 6 needs a filtered view. Decision: extract a `<PhotoGridView photos={...} />` variant OR just inline the grid markup in the person page. Simpler: extract a small `<PhotoGridView>` that takes a `photos: Photo[]` prop, and the existing `<PhotoGrid>` becomes a thin wrapper that calls `getPhotos()` and passes to `PhotoGridView`. Refactor scope is small.

### Routing

- **D-04:** generateStaticParams() returns an array of `{ id: personId }` from `getPeople()`. Pre-renders every person page at build time. Build cost is trivial (a few dozen pages at most).
- **D-05:** dynamicParams = true (default) — if a new person is added without rebuild, the page generates on first request. Reasonable for a static archive.
- **D-06:** Route already exists at correct path; no folder changes needed.

### Linking

- **D-07:** PhotoCard already wraps in `<Link href={`/person/${peopleIds[0]}`}>` if peopleIds is non-empty (Phase 2 D-20). After Phase 6, this link works. No PhotoCard change needed.
- **D-08:** PersonPanel (Phase 4) shows person data inline. Phase 6 adds: "View full page →" link in the panel that navigates to `/person/{id}`. Updates components/tree/PersonPanel.tsx to add this link.
- **D-09:** Spouse/child/parent names on the person page are linked to their respective person pages.

### Edge Cases

- **D-10:** Person with no photos: render the page without the photos section, OR with a small empty state ("No photographs of this person yet"). Decision: small empty state, consistent with other pages.
- **D-11:** Person with no bio: render the page without the bio paragraph. No empty placeholder.
- **D-12:** Person with no birth/death year: hide the date eyebrow entirely.
- **D-13:** Person with no birthPlace: hide the "Born in" line.
- **D-14:** Person with no relations (orphan in tree): render normally; relationship blocks just don't appear.
- **D-15:** /person/non-existent → notFound() → Next.js default 404 page (or custom not-found.tsx if we add one — out of scope for v1).

### Verification

- **D-16:** `npm run build` succeeds, with all 6 person pages pre-rendered (one per person in stub family.json).
- **D-17:** Visual checks: visit /person/william-curry — see name, dates, birthplace, bio, both spouses, child links, photo. Click James in children — navigate to /person/james-curry.

### Claude's Discretion

- Exact spacing between page sections
- Whether to show a small back-arrow link to /tree at the top of the page (probably yes — easy navigation)
- Whether the photos section uses the same 4-column grid as /photographs or a tighter 3-column variant since it's typically fewer photos

</decisions>

<canonical_refs>
## Canonical References

### Project Documents
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md` — PERSON-01..03 are scope
- `.planning/ROADMAP.md` — Phase 6 goal and 3 success criteria

### Phase References
- `.planning/phases/02-photo-gallery/02-01-SUMMARY.md` — PhotoGrid pattern
- `.planning/phases/04-family-tree/04-CONTEXT.md` — PersonPanel multi-spouse list logic (reuse for person page)
- `.planning/phases/01-scaffold-auth-design/01-CONTEXT.md` — design tokens, kebab-case slug rule

### Source-of-truth Code Files
- `lib/types.ts` — Person type
- `lib/content.ts` — getPeople, getPersonById, getPhotos
- `app/(protected)/person/[id]/page.tsx` — placeholder to replace
- `components/gallery/PhotoGrid.tsx` — current grid (may extract PhotoGridView prop variant)
- `components/gallery/PhotoCard.tsx` — already wires the /person/{id} link
- `components/tree/PersonPanel.tsx` — add "View full page" link
- `app/(protected)/photographs/page.tsx` — analog for page composition
- `app/globals.css` — design tokens

### External Documentation
- Next.js generateStaticParams: https://nextjs.org/docs/app/api-reference/functions/generate-static-params
- Next.js notFound(): https://nextjs.org/docs/app/api-reference/functions/not-found

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `getPersonById(id: string): Person | null` already exists in lib/content.ts
- `getPhotos()` returns all photos; person photo filter is `photos.filter(p => p.peopleIds.includes(personId))` — small inline OR a new `getPhotosByPersonId()` helper
- PhotoCard already wraps in /person/{id} link (Phase 2 wired this)

### Established Patterns
- Server Components by default
- All content via lib/content.ts
- Sentence case, eyebrow eyebrow style
- Empty states inline
- design tokens via Tailwind classes

### Integration Points
- /person/[id] page (currently placeholder) — replace
- PersonPanel (in tree) — add "View full page" link
- Maybe extract PhotoGridView from PhotoGrid (small refactor)

### Pitfalls
- generateStaticParams must return objects with `{id: string}` matching the [id] segment
- Don't shadow the route with app/person/[id]/page.tsx outside the (protected) group
- notFound() must be called inside async Server Component

</code_context>

<specifics>
## Specific Ideas

- This is the closing phase — no new architectural patterns, just composition
- The relation links (spouses, children, parents) are the polish that makes the archive feel "navigable" — easy to wander through generations

</specifics>

<deferred>
## Deferred Ideas

- Custom not-found.tsx for /person/[id] — out of scope for v1
- Edit-in-place for person data — admin UI is v2
- Print stylesheet — out of scope
- Person page metadata (OG image generation) — future polish

</deferred>

---

*Phase: 6-Person Detail Pages*
*Context gathered: 2026-04-29*
