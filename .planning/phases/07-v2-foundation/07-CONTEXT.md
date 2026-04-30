# Phase 7: v2 Foundation Migration - Context

**Gathered:** 2026-04-30
**Status:** Ready for planning
**Mode:** v2 milestone start; user-confirmed defaults
**Source:** CURRY_FAMILY_HUB_BRIEF_v2.md + curry-family-hub-prototype.html

<domain>
## Phase Boundary

Phase 7 migrates the v1 codebase to the v2 schema, brand, copy, and routing conventions WITHOUT introducing new features. Subsequent phases (8-13) build features on top of this migration.

**In scope:**
1. **Schema migrations** in `lib/types.ts`:
   - Person: add `relationLabel`, `eyebrow`, `birthDate`/`deathDate` (ISO YYYY-MM-DD), `datesLabel` (display string), `birthplace` (renamed from `birthPlace`), `spouseId` (singular — primary spouse only), `parentIds[]`, `childrenIds[]` (renamed from `childIds`). Keep `spouseIds[]` for backward compatibility with v1's multi-spouse mitigation logic in `lib/tree.ts` — but the new primary `spouseId` is the surfaced one in the panel.
   - Photo: add `collectionIds[]`, `dateLabel` (display string), `location`, `notes`. Keep `dateTaken` for back-compat (some v1 code may reference); but migrate uses to `date` (ISO).
   - Video: add `playlistIds[]`, `featured` (boolean), `duration` (string like "12:34"), `dateLabel`.
   - NEW: Collection schema (`id`, `title`, `subtitle`, `coverPhotoId`, `date`, `dateLabel`, `description`).
   - NEW: Playlist schema (`id`, `title`, `subtitle`, `coverVideoId`, `description`).

2. **New content files:** `content/collections.json`, `content/playlists.json`. Stub each with 3 entries.

3. **Content loader extensions** in `lib/content.ts`:
   - `getCollections(): Collection[]`
   - `getCollectionById(id: string): Collection | null`
   - `getPhotosInCollection(collectionId: string): Photo[]` (filters by `collectionIds.includes(id)`)
   - `getPlaylists(): Playlist[]`
   - `getPlaylistById(id: string): Playlist | null`
   - `getVideosInPlaylist(playlistId: string): Video[]`
   - `getFeaturedVideos(): Video[]` (filters `featured === true`)
   - `getPhotosByPersonId(personId: string): Photo[]` (helper used by person page; currently inline)
   - `getVideosByPersonId(personId: string): Video[]`
   - Bidirectional validator extension: every `Photo.collectionIds[]` resolves to a real Collection; every `Video.playlistIds[]` resolves to a Playlist; every Collection.coverPhotoId resolves to a real Photo; every Playlist.coverVideoId resolves to a real Video.

4. **Section rename: Films → Videos**:
   - Rename `app/(protected)/films/` → `app/(protected)/videos/`
   - Update TopNav tab label "Films" → "Videos" and href `/films` → `/videos`
   - Update SectionPreview card on home: "Films" → "Videos", `/films` → `/videos`
   - Update components folder: `components/video/` already exists (good); no rename needed there
   - Update CLAUDE.md, README.md references

5. **Brand mark via real PNG logos:**
   - Replace inline SVG `<StarMark />` with `next/image` referencing `/public/images/AW Symbol [2x].png`
   - StarMark becomes a simple wrapper component: `<Image src="/images/AW Symbol [2x].png" width={size} height={size} alt="" />`
   - Update brand mark in TopNav: 36px navy-ringed circle containing 16px star + 2-line text stack ("AGEWISH · PRIVATE ARCHIVE" eyebrow + "The Curry Family" name)
   - Hero star: 40px (per prototype, was 36px in v1)
   - Footer star: 22px (per prototype, was 20px in v1)
   - Note: filename has spaces and brackets — Next.js Image handles this but URL-encoding may be needed. Recommend renaming the file to `aw-symbol-2x.png` for safety. Or use the file as-is with proper URL encoding.

6. **Hero copy update:**
   - Old h1: "The Curry Family" / subtitle: "A private family archive"
   - New h1: "A gathering of generations" / subtitle: "The stories, faces, and moments that make us who we are — kept in one place, for those here now and those to come." (italic serif)

7. **Footer copy update:**
   - Tagline: "Held in trust for those who come after." (italic serif)
   - Metadata: "A private archive · AgeWish" (eyebrow style)

8. **family.json migration to prototype's 8-person tree:**
   - william-curry (Patriarch) — spouse: eleanor-hayes — children: robert-curry, margaret-curry, james-curry
   - eleanor-hayes (William's spouse) — spouse: william-curry — children: same
   - robert-curry (Son) — spouse: linda-marsh — children: sarah-curry, daniel-curry
   - margaret-curry (Daughter) — spouse: henry-walsh — children: emily-walsh, thomas-walsh
   - james-curry (Son) — spouse: patricia-reeves — children: (none)
   - sarah-curry (Granddaughter) — spouse: michael-tan — no children
   - daniel-curry (Grandson) — single
   - emily-walsh (Granddaughter, Margaret's daughter) — spouse: david-klein — children: noah-walsh, iris-walsh (out of stub depth — exclude)
   - thomas-walsh (Grandson, Margaret's son) — single
   - Total in stub: 8 people (William, his 3 children, his 4 grandchildren) PLUS spouses if we choose to include them. Decision: include spouses as people too (eleanor, linda, patricia, henry) — they have bios in the prototype. Stub has 8 Curry-line + 4 spouses = 12 people. Or simpler: 8 Curry line, spouse names only in `spouseLabel` field — no separate Person records. Decision: 8 Curry-line people, spouses are shown in panel meta as text strings (matches prototype panel exactly).
   - **Final stub: 8 people with no separate spouse records.** Spouses go in panel meta rows, not in family.json as Person entries. This keeps the tree visualization clean and matches the prototype's `panel-meta` rendering.

9. **Fresh photos.json + collections.json:**
   - Drop v1 placeholder JPEGs (placeholder-001.jpg, placeholder-002.jpg)
   - Generate 6 new placeholder JPEGs with collection-meaningful filenames (e.g., `1953-wedding-01.jpg`, `1974-christmas-03.jpg`, `1981-lake-house-01.jpg`, `1989-sunday-dinner-01.jpg`, `1995-reunion-01.jpg`, `2005-christmas-01.jpg`)
   - photos.json: 6-8 entries spread across 3 collections, each with `collectionIds[]`
   - collections.json: 3 stub collections (e.g., "Christmas mornings", "Lake house summers", "Wedding days")

10. **Fresh videos.json + playlists.json:**
    - videos.json: 3-4 entries with diverse `source` values (mostly youtube), some `featured: true`, each with `playlistIds[]`
    - playlists.json: 2 stub playlists (e.g., "Birthdays", "Reunions")

11. **Stub the new routes** (placeholders only — features come in Phase 8/9):
    - `app/(protected)/photographs/page.tsx` — keep current photo grid (will be replaced in Phase 8 with collection grid; just adapt to v2 schema for now)
    - `app/(protected)/photographs/[collectionId]/page.tsx` — NEW placeholder
    - `app/(protected)/videos/page.tsx` — keep current video grid (Phase 9 replaces with playlist grid)
    - `app/(protected)/videos/[playlistId]/page.tsx` — NEW placeholder

12. **Update CLAUDE.md** to reflect v2 architecture:
    - Section rename
    - Collections-as-tags principle
    - Lightbox shared component (in scope but built in Phase 8)

**Out of scope for Phase 7:**
- Lightbox component (Phase 8)
- Collection grid + collection detail rendering (Phase 8)
- Playlist grid + playlist detail rendering (Phase 9)
- Featured video logic on home (Phase 12)
- Tree panel refresh to match prototype (Phase 10) — keep current Phase 4 panel for now
- Person page schema upgrade (Phase 11) — current Phase 6 page works with old field names; keep it functional via back-compat
- Real content (Phase 13)

</domain>

<decisions>
## Implementation Decisions

### Schema Migration Strategy

- **D-01:** Add new fields as **optional** in Zod schemas. Existing data without new fields still validates. Forward-compatible.
- **D-02:** For renamed fields (e.g., `birthPlace` → `birthplace`, `childIds` → `childrenIds`): support BOTH names initially via a Zod `.or()` or migrate the stub data and update all callers in one shot. Decision: migrate stub data + update all callers. The codebase is small enough; one-shot is cleaner.
- **D-03:** `dateLabel` (display string) is set from `date` (ISO) at content-load time when not provided, OR is provided explicitly in JSON for human polish. Loader function: `formatDateLabel(date: string): string` returns "December 2005" from "2005-12-25".

### Brand Mark / Logo

- **D-04:** Rename PNG files to URL-safe names: `public/images/AW Symbol [2x].png` → `public/images/aw-symbol-2x.png`, etc. Avoids spaces/brackets in URLs, simpler in JSX.
- **D-05:** StarMark wraps `next/image`. Props: `size: number` (default 20). For nav: `<StarMark size={16} />` inside a 36px navy-bordered circle. For hero: `<StarMark size={40} />`. For footer: `<StarMark size={22} />`.
- **D-06:** TopNav brand markup matches prototype exactly:
  ```tsx
  <Link href="/" className="brand">
    <div className="brand-mark"> {/* 36px circle, 1.25px navy border */}
      <StarMark size={16} />
    </div>
    <div className="brand-text">
      <span className="brand-eyebrow">AgeWish · Private archive</span>
      <span className="brand-name">The Curry Family</span>
    </div>
  </Link>
  ```

### Section Rename

- **D-07:** `app/(protected)/films/` directory renamed to `app/(protected)/videos/`. Use `git mv` for clean history. Update tab label, href, breadcrumb references.
- **D-08:** Internal redirect: NOT needed — no external traffic on /films yet. Clean break.

### Hero Copy

- **D-09:** Adopt prototype's hero copy verbatim:
  - h1: "A gathering of generations"
  - subtitle: "The stories, faces, and moments that make us who we are — kept in one place, for those here now and those to come."
- **D-10:** Subtitle is rendered in italic serif (font-serif italic), max-w-prose centered.

### Footer Copy

- **D-11:** Adopt prototype's footer copy:
  - tagline: "Held in trust for those who come after." (italic serif)
  - meta: "A private archive · AgeWish" (eyebrow uppercase)

### Family Stub Data

- **D-12:** 8-person stub matching the prototype:
  - william-curry (Patriarch, 1920–2008)
  - robert-curry (Son, 1948–present)
  - margaret-curry (Daughter, 1952–present)
  - james-curry (Son, 1956–present)
  - sarah-curry (Granddaughter, 1978–present)
  - daniel-curry (Grandson, 1981–present)
  - emily-walsh (Granddaughter, 1980–present) — note: Walsh because she's Margaret's daughter (Margaret married Henry Walsh)
  - thomas-walsh (Grandson, 1984–present)
- **D-13:** Spouses listed in `panelMeta` rows (Spouse: Eleanor Hayes), NOT as separate Person records. Avoids tree-clutter; matches prototype.
- **D-14:** William has only one spouse in v2 (Eleanor Hayes). The v1 multi-spouse case (William + Mary + Margaret) is intentionally dropped. The mitigation in `lib/tree.ts` STAYS in code — it's still correct and protects against future blended-family data without being triggered now.
- **D-15:** Each Person has rich `eyebrow` text: "Patriarch of the family", "Son of William", "Daughter of William", "Granddaughter of William through Robert", etc.
- **D-16:** Each Person has `datesLabel` like "1920 — 2008" or "1952 — present" (em dash, non-breaking spaces optional). Computed from `birthDate`/`deathDate` if not provided.
- **D-17:** Each Person has `relationLabel` for tree-node display: "PATRIARCH", "SON", "DAUGHTER", "GRANDSON", "GRANDDAUGHTER" — uppercase, used in tree node eyebrow.

### Photos Stub

- **D-18:** 6 photos across 3 collections:
  - Collection 1: "Christmas mornings" (christmas-mornings) — 2 photos: 1974-christmas-01.jpg, 2005-christmas-01.jpg
  - Collection 2: "Lake house summers" (lake-house-summers) — 2 photos: 1981-lake-house-01.jpg, 1995-reunion-01.jpg (also tagged "reunions")
  - Collection 3: "Wedding days" (wedding-days) — 2 photos: 1953-wedding-01.jpg, 1989-sunday-dinner-01.jpg (also tagged "everyday")
- **D-19:** Some photos cross multiple collections (proves the tag-based architecture works).
- **D-20:** Each photo has `peopleIds[]` linking to family.json (e.g., 1953-wedding-01 → william-curry).
- **D-21:** Placeholder JPEGs are 800x600 solid-color JPGs generated via `sharp` OR Node's image-encoding-via-canvas. Or simpler: copy a single 1x1 colored JPG (already in v1) to all 6 filenames. Phase 8 lightbox needs real image dimensions — a 1x1 file might be problematic. Use `sharp` to generate 800x600 placeholders with the photo caption text rendered on them.

### Videos Stub

- **D-22:** 3 videos across 2 playlists:
  - Playlist 1: "Birthdays" — 2 videos (one is `featured: true`)
  - Playlist 2: "Reunions" — 1 video
- **D-23:** All 3 source: youtube (we have 1 stub already from v1; keep that). New stub videos use distinct YouTube IDs (e.g., `dQw4w9WgXcQ`, `jNQXAC9IVRw`, `9bZkp7q19f0`).

### Routes

- **D-24:** Phase 7 stubs the new dynamic routes but doesn't implement them. `app/(protected)/photographs/[collectionId]/page.tsx` returns "Coming in Phase 8". `app/(protected)/videos/[playlistId]/page.tsx` returns "Coming in Phase 9".
- **D-25:** Existing /photographs and /videos pages keep working with the migrated schema (they show all photos / all videos until Phase 8/9 replaces them).

### Backward Compatibility

- **D-26:** Tree code in `lib/tree.ts` and components/tree/* uses Person fields that may be renamed. Audit and update all references in this phase. After Phase 7, no code references the old field names.
- **D-27:** PhotoCard currently uses `caption`, `dateTaken`. After Phase 7, also reads `dateLabel` if present. Caption stays.
- **D-28:** Prior phases' SUMMARY.md files reference old schemas — those are historical, leave alone.

### Verification

- **D-29:** `npm run build` exits 0
- **D-30:** Visual: home page shows new hero copy, new brand mark, new footer copy
- **D-31:** /tree renders 8 people from prototype data without errors
- **D-32:** /photographs renders 6 photos
- **D-33:** /videos (renamed) renders 3 videos
- **D-34:** /photographs/christmas-mornings renders placeholder ("Coming in Phase 8")
- **D-35:** /videos/birthdays renders placeholder ("Coming in Phase 9")
- **D-36:** No 404s on any of the existing routes

</decisions>

<canonical_refs>
## Canonical References

### v2 Source Documents
- `CURRY_FAMILY_HUB_BRIEF_v2.md` (project root) — the new spec
- `curry-family-hub-prototype.html` (project root) — the visual + interaction contract
- `public/images/*.png` — actual brand logos

### Project Documents
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md` — TODO: Phase 7 should add v2 requirements (not done yet; the brief itself acts as the requirements list for v2)
- `.planning/ROADMAP.md` (just updated for v2)

### v1 Source Files (will be modified)
- `lib/types.ts` — Person/Photo/Video schemas
- `lib/content.ts` — loader functions, bidirectional validator
- `content/family.json`, `content/photos.json`, `content/videos.json`
- `app/(protected)/films/` (renamed to videos/)
- `app/(protected)/photographs/page.tsx` — keep, will be replaced in Phase 8
- `app/(protected)/videos/page.tsx` — keep (post-rename), will be replaced in Phase 9
- `app/(protected)/page.tsx` — home page, hero copy
- `components/ui/StarMark.tsx` — replace inline SVG with PNG
- `components/layout/TopNav.tsx` — brand markup update
- `components/layout/Footer.tsx` — copy update
- `components/home/Hero.tsx` — copy update
- `components/home/SectionPreview.tsx` — Films → Videos label/link
- `CLAUDE.md` — v2 reference + section rename

### v1 Placeholder Files (will be deleted)
- `public/photos/placeholder-001.jpg`
- `public/photos/placeholder-002.jpg`

### External Documentation
- next/image with public folder: https://nextjs.org/docs/app/api-reference/components/image
- next/font/google Cormorant Garamond italic style: https://fonts.google.com/specimen/Cormorant+Garamond

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `getPeople()`, `getPhotos()`, `getVideos()`, `getPersonById()` already exist
- Bidirectional validator already extended in Phase 4 (parent/child/spouse reciprocity)
- Cormorant Garamond + Inter already configured (Phase 5)
- StarMark inline SVG (Phase 1 D-04) — REPLACE with PNG-backed version
- `motion` package + AnimatePresence patterns (Phase 4) — used by Lightbox in Phase 8
- All design tokens in `app/globals.css @theme` block (Phase 1) — STAYS, just add brand-mark utility classes

### Established Patterns (preserve)
- Server Components by default
- All content via `lib/content.ts` (sole boundary)
- Tailwind tokens via `@theme {}` (no string interpolation)
- Two-weight rule (400, 500)
- Sentence case + uppercase eyebrows

### Integration Points
- TopNav brand mark — gets PNG + text stack
- Hero — gets new copy
- Footer — gets new copy
- /films directory — moved to /videos

### Pitfalls (project-specific)
- File names with spaces in `/public/images/` — rename for URL safety
- Renaming Person fields (childIds → childrenIds) — must update ALL callers (lib/tree.ts is the main one)
- Don't drop the multi-spouse mitigation in lib/tree.ts even though stub data won't trigger it
- `next/image` requires width/height — placeholder JPEGs need real dimensions

</code_context>

<specifics>
## Specific Ideas

- Use prototype's family data verbatim (per user)
- Drop v1 photo placeholders, generate fresh per-collection placeholders
- Brand mark via real PNG (per user) — not inline SVG anymore
- v2 keeps JSON-based content (no Supabase) — confirmed with user

</specifics>

<deferred>
## Deferred Ideas

- **Lightbox** — Phase 8 (foundational dependency)
- **Collection grid rendering** — Phase 8
- **Playlist grid + featured videos on /videos** — Phase 9
- **Tree panel refresh to match prototype exactly** — Phase 10
- **Person pages with new schema fields** — Phase 11
- **Home curated previews** — Phase 12
- **Real content** — Phase 13 / post-v2

</deferred>

---

*Phase: 7-v2-Foundation*
*Context gathered: 2026-04-30*
