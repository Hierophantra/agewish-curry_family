# Phase 4: Family Tree - Context

**Gathered:** 2026-04-29
**Status:** Ready for planning
**Mode:** --auto (with user input on multi-spouse handling)
**Risk:** ELEVATED — research flagged this as the highest-risk phase

<domain>
## Phase Boundary

Phase 4 delivers `/tree` — an interactive family tree using `relatives-tree` (3.2.2) for layout calculation and a custom Server-rendered/Client-hydrated component stack. Clicking a tree node opens a `<PersonPanel>` slide-in within the tree section showing the person's name, dates, birthplace, bio, and a Framer Motion crossfade carousel of their photos.

**In scope:**
- `lib/tree.ts` — server-side adapter from `Person[]` to relatives-tree's expected shape; runs `calcTree()` and returns layout data (nodes + connectors)
- Multi-spouse flattening logic in `lib/tree.ts` (mitigates GitHub #24)
- `components/tree/FamilyTreeCanvas.tsx` — `'use client'` island that renders the layout output
- `components/tree/PersonNode.tsx` — single node renderer
- `components/tree/PersonPanel.tsx` — `'use client'` slide-in panel with Framer Motion
- `components/tree/PhotoCarousel.tsx` — `'use client'` crossfade carousel inside PersonPanel
- `app/(protected)/tree/page.tsx` — Server Component that pre-computes tree data and passes as props to FamilyTreeCanvas
- Schema migration: add optional `gender` field to Person (relatives-tree needs this)
- Stub data: add 1-2 multi-spouse test cases to `family.json` so the mitigation is exercised
- Bidirectional ref validation extension: validate that all `spouseIds`, `parentIds`, `childIds` resolve

**Out of scope:**
- Tree zoom / pan controls — Phase 5 (responsive QA)
- Touch gesture support on mobile — Phase 5
- Person detail page navigation — Phase 6 (`/person/[id]`)
- Real Curry family data — populated by user/developer post-Phase 4
- Custom node art (avatars, photos in nodes) — out of scope; nodes show name + relation label only

</domain>

<decisions>
## Implementation Decisions

### Schema Migration

- **D-01:** Add `gender?: 'male' | 'female' | 'other'` to `PersonSchema` in `lib/types.ts`. Optional field. relatives-tree requires this for layout (it uses gender to assign default node visual cues). When unset, default to `'other'` for layout purposes (no visual distinction in our renderer — we don't render gender).
- **D-02:** Stub `family.json` updated to set explicit gender on William, James, Emily (so the existing data has the field populated) AND adds 1 multi-spouse test case (e.g., add a `mary-curry` who is spouse to william AND a `secondary-spouse` who is william's second wife with shared children — this exercises the flattening mitigation).

### Multi-Spouse Mitigation (THE load-bearing decision)

- **D-03:** Multi-spouse flattening at the data-adapter layer in `lib/tree.ts`. Algorithm:
  1. For each person with `spouseIds.length > 1`, designate the FIRST spouse in the array as the "primary spouse" for tree layout
  2. Children of any non-primary spouse get re-attributed in the relatives-tree input as children of the primary spouse pairing (so they all render under the same parent cluster)
  3. The original `spouseIds[]` is preserved in the Person data — PersonPanel reads the full list and renders all spouses with date ranges in the bio area
  4. The flattening is annotated: PersonPanel shows "Spouse: Mary Smith (m. 1950–1965), Margaret Doe (m. 1968–present)" — multiple spouses are visible in the UI, just not in the tree topology
- **D-04:** This mitigation runs unconditionally — even single-spouse cases pass through the same code path. Avoids special-casing.
- **D-05:** The mitigation is documented inline in `lib/tree.ts` with a reference to relatives-tree GitHub #24. If the upstream bug is ever fixed, the function signature stays the same; the implementation can be simplified.

### Tree Data Adapter

- **D-06:** `lib/tree.ts` is server-side (no `'use client'`). Exports:
  - `getTreeData(rootId: string): { nodes: ExtNode[]; rootId: string }` — calls `getPeople()`, applies multi-spouse flattening, transforms to relatives-tree shape, runs `calcTree()`, returns the result
  - `findRootId(): string` — finds the eldest person with no parents (William Curry by default)
- **D-07:** relatives-tree expects this shape per node:
  ```ts
  { id: string; gender: 'male'|'female'; parents: {id, type}[]; children: {id, type}[]; siblings: {id, type}[]; spouses: {id, type}[] }
  ```
  Our Person uses `parentIds`, `childIds`, `spouseIds` (string arrays). The adapter does the shape transformation.

### Component Hierarchy

- **D-08:** Server / Client boundary:
  - `app/(protected)/tree/page.tsx` — Server Component. Calls `getTreeData()`, passes layout output as props to `<FamilyTreeCanvas>`.
  - `<FamilyTreeCanvas>` — `'use client'`. Receives layout output, renders nodes positioned absolutely via CSS `transform: translate(...)`. Owns selected-person state (`useState<string | null>(selectedId)`). Renders `<PersonNode>` for each layout entry and `<PersonPanel>` if a person is selected.
  - `<PersonNode>` — Server Component IF possible (just markup), Client if it needs `onClick`. Likely needs Client. Receives `node`, `isActive`, `onClick`. Pure click-to-select.
  - `<PersonPanel>` — `'use client'`. Receives `person: Person`, `photos: Photo[]`, `onClose`. Wrapped in Framer Motion `<AnimatePresence>` for slide-in. Renders bio + multi-spouse list + `<PhotoCarousel>`.
  - `<PhotoCarousel>` — `'use client'`. Receives `photos: Photo[]`. Internal `useState` for active index. Auto-advances every 4s OR via dot click. Framer Motion `<AnimatePresence mode="wait">` crossfade.
- **D-09:** `react-family-tree` is NOT used. We render the relatives-tree layout output directly with our own components. Reasoning: (a) `react-family-tree` is 4 years old and React 18 compatibility is uncertain (research-flagged); (b) our renderer is simple enough to write directly (~50 lines); (c) eliminates a stale dependency.

### Visual Specifications

- **D-10:** Tree canvas: `relative` positioned container, fixed width derived from layout output's bounding box, horizontally scrollable on mobile (Phase 5 will polish responsive behavior).
- **D-11:** Person node: white background, navy text, border (1.25px stone). Active state: navy stroke + ivory fill + small gold dot top-right corner (per CONTEXT D-04 from Phase 1 design system, though that was for tabs; same gold-dot motif for active node).
- **D-12:** Connector lines: 1px stone (#C9C4B0), drawn as positioned `<div>` elements (not SVG — keeps it Tailwind-styled and avoids SVG complexity). Horizontal lines between siblings/spouses; vertical lines between generations.
- **D-13:** Node dimensions: 160px wide × 60px tall. Inside: name (font-serif text-navy, sentence case), small relation label below in `.eyebrow` style (e.g., "GRANDFATHER", "FATHER"). Relation label is computed relative to the root.
- **D-14:** PersonPanel: slides in from the right within the tree section (NOT over the whole page — per Phase 1 D-08 from CONTEXT, the panel is contained within the tree container). 320px wide on desktop; full-width sheet on mobile.
- **D-15:** PhotoCarousel: 4:3 aspect inside the panel. Crossfade 600ms via Framer Motion `<AnimatePresence>` `mode="wait"`. Active dot: gold fill. Inactive dots: stone.

### Page Composition

- **D-16:** `app/(protected)/tree/page.tsx` renders eyebrow "FAMILY ARCHIVE" + serif "Family tree" h1 + muted subtitle, then `<FamilyTreeCanvas>` in a contained section.
- **D-17:** Subtitle: "From William Curry, born 1920 in London, the family expanded across generations." (placeholder — adapt to real data later).

### Edge Cases & Empty States

- **D-18:** Empty `family.json`: tree page shows the same eyebrow + heading + an empty-state message ("No family members yet" + body). Same pattern as PhotoGrid/VideoGrid.
- **D-19:** Single person (no descendants/ancestors): renders a single node, no connectors, panel still works.
- **D-20:** Cycle detection: relatives-tree handles invalid data internally; bidirectional validator (already in `lib/content.ts`) catches dangling refs at build time.

### Dependencies

- **D-21:** Use `motion` (already installed; rebrand of framer-motion). Import from `motion/react`. NO `framer-motion` package.
- **D-22:** `relatives-tree@3.2.2` and `react-family-tree@3.2.0` are installed; we use ONLY `relatives-tree`'s `calcTree` function. `react-family-tree` is unused (kept in package.json for now; Phase 5 polish can remove it).
- **D-23:** `motion` runtime size: ~80KB gzipped. Acceptable for the panel/carousel UX value.

### Verification

- **D-24:** Acceptance: `npm run build` exits 0. Local browser check: visit `/tree`, see tree of 4-5 people including the multi-spouse test case, click a node, panel slides in showing person details, photo carousel crossfades. Multi-spouse test case has both spouses listed in the panel.
- **D-25:** **Multi-spouse mitigation verification:** Add a stub person with `spouseIds: ['william-curry']` representing William's second spouse, with shared children. Verify the tree renders all children of both spouses under William's primary-spouse cluster (no missing nodes — that's the GitHub #24 manifestation).

### Claude's Discretion

- Exact node hover/active visual polish — defaults match design system, refine in Phase 5
- Carousel auto-advance interval (4s vs 6s vs no auto-advance) — start at 6s, easy to adjust
- Subtitle copy on tree page
- Whether to draw connector lines via SVG or positioned divs — start with divs, swap to SVG in Phase 5 if visual quality demands
- Mobile tree behavior (horizontal scroll vs zoom) — basic horizontal scroll for v1; Phase 5 polishes

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Documents
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md` — TREE-01..11 are scope
- `.planning/ROADMAP.md` — Phase 4 goal and 4 success criteria
- `.planning/research/PITFALLS.md` — Pitfall 5 (relatives-tree multi-spouse bug) — REQUIRED reading

### Phase 1 Outputs
- `.planning/phases/01-scaffold-auth-design/01-CONTEXT.md` — design system tokens
- `.planning/phases/01-scaffold-auth-design/01-RESEARCH.md` — Tailwind tokens, motion package details

### Phase 2/3 Outputs (pattern references)
- `.planning/phases/02-photo-gallery/02-01-SUMMARY.md` — empty state pattern
- `.planning/phases/03-video-gallery/03-01-SUMMARY.md` — Server/Client boundary pattern

### Source-of-truth Code Files
- `lib/types.ts` — Person schema (will be extended with optional `gender` in Phase 4)
- `lib/content.ts` — `getPeople()` access point + bidirectional validator
- `content/family.json` — current 3-person stub; Phase 4 adds multi-spouse case
- `app/globals.css` — design tokens
- `components/gallery/PhotoCard.tsx` — example Server Component composition
- `components/video/VideoPlayer.tsx` — example clean component boundary

### External Documentation
- relatives-tree README + API: https://github.com/SanichKotikov/relatives-tree
- relatives-tree GitHub #24 (multi-spouse bug): https://github.com/SanichKotikov/relatives-tree/issues/24
- motion (Framer Motion) AnimatePresence: https://motion.dev/docs/react-animate-presence
- Next.js Server/Client component boundary: https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `getPeople()` from `lib/content.ts` — returns validated `Person[]` with bidirectional ref check
- `getPhotos()` — used by PhotoCarousel inside PersonPanel
- `Person` type — has `id`, `name`, `birthYear`, `deathYear`, `birthPlace`, `bio`, `photoIds[]`, `parentIds[]`, `childIds[]`, `spouseIds[]` — Phase 4 adds optional `gender`
- `.eyebrow` utility — relation labels on tree nodes use this
- `motion` package (rebrand of framer-motion) — installed, used for AnimatePresence in PersonPanel + PhotoCarousel

### Established Patterns
- Server Components by default; `'use client'` only when needed
- All content via `lib/content.ts`
- Tailwind tokens; no string interpolation
- Sentence case; `.eyebrow` uppercase only
- Empty state inline in main grid/canvas component

### Integration Points
- `app/(protected)/tree/page.tsx` — currently placeholder; replace with FamilyTreeCanvas
- `(protected)/layout.tsx` — already wraps every page; tree page inherits chrome
- `/person/[id]` — placeholder until Phase 6; tree node clicks open PersonPanel (in-page) NOT navigate

### Pitfalls (project-specific)
- relatives-tree GitHub #24: multi-spouse silently drops children — MITIGATED via lib/tree.ts flattening
- react-family-tree is 4 years old and unused: do NOT import from it; render layout directly
- Framer Motion (motion package) requires `'use client'` on the FILE that imports motion components
- `dotenv-expand` mangles `$` in env values — not relevant to Phase 4 (no env work)
- Dead routes outside `(protected)` group — only edit existing `(protected)/tree/page.tsx`

</code_context>

<specifics>
## Specific Ideas

- **Blended families exist in the real Curry tree** (per user input). Mitigation must be in place from day 1.
- **Build with stub data now.** User will load real family data later; the mitigation ensures it'll work without rework.
- The 7-pointed star DOES NOT appear in the tree section — the tree is content, the chrome already has its 3 stars (nav + footer + the tree page might add one in the eyebrow header? No — the home page rule was 3 per page; here it's nav + footer = 2, no hero star on internal pages).
- Wait — the brief said exactly 3 per page. But internal pages don't have a hero. Decision: internal pages have 2 stars (nav + footer). The "exactly 3" rule applies to the home page specifically.

</specifics>

<deferred>
## Deferred Ideas

- **Tree zoom controls** — Phase 5
- **Touch gesture pan/zoom on mobile** — Phase 5
- **Person detail page navigation** — Phase 6 (`/person/[id]` link from PersonPanel)
- **Tree node photo thumbnails** — Phase 5 if desired
- **Search within tree** — Phase 6 if scoped in
- **Export tree as image** — out of scope (v2)
- **Real Curry family data** — user populates after Phase 4 completes

</deferred>

---

*Phase: 4-Family Tree*
*Context gathered: 2026-04-29*
*Risk: ELEVATED (relatives-tree multi-spouse bug mitigation in scope)*
