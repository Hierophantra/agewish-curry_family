# Requirements: Curry Family Hub

**Defined:** 2026-04-29
**Core Value:** Family members can securely access and explore their shared family history — photos, films, and an interactive family tree — through a private, beautifully designed archive.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation

- [x] **FOUND-01**: Project initializes with Next.js 14.2.35, TypeScript strict mode, Tailwind v4 — completed in 01-01
- [x] **FOUND-02**: All required libraries installed at correct versions (next-auth@beta, motion, relatives-tree, react-family-tree, bcryptjs, zod) — completed in 01-01
- [ ] **FOUND-03**: Folder structure matches the brief — route groups `(auth)` and `(protected)`, `/components/`, `/content/`, `/lib/`, `/public/`
- [ ] **FOUND-04**: Project deploys cleanly to Vercel from the `main` branch
- [ ] **FOUND-05**: README.md documents local setup, env vars, and content authoring

### Authentication

- [ ] **AUTH-01**: User can authenticate with the shared family password on the login page
- [ ] **AUTH-02**: Auth uses Auth.js v5 Credentials provider with bcryptjs password hash comparison
- [ ] **AUTH-03**: Auth uses two-file split — `auth.config.ts` (edge-safe) and `auth.ts` (full config); middleware imports config-only
- [ ] **AUTH-04**: All `(protected)` routes are gated by middleware AND `auth()` call in protected layout (defence in depth)
- [ ] **AUTH-05**: Unauthenticated requests redirect to `/login`; authenticated session persists via JWT cookie
- [ ] **AUTH-06**: User can log out from any protected page
- [ ] **AUTH-07**: `AUTH_SECRET` and `AUTH_PASSWORD_HASH` env vars are configured for local dev and Vercel (Production, Preview, Development)

### Design System

- [x] **DESIGN-01**: Tailwind v4 `@theme {}` block defines navy/gold/ivory palette as complete class-name tokens (no dynamic interpolation) — completed in 01-01
- [x] **DESIGN-02**: Typography uses serif for headings (Georgia fallback initially) and Inter for body — completed in 01-01
- [x] **DESIGN-03**: Only two font weights (400, 500) are available in the design system — completed in 01-01
- [ ] **DESIGN-04**: `<StarMark />` component renders the AgeWish 7-pointed gold star as inline SVG
- [ ] **DESIGN-05**: All metadata eyebrows use uppercase + 0.22em letter-spacing
- [ ] **DESIGN-06**: All copy is sentence case — no Title Case, no ALL CAPS (except eyebrows)
- [ ] **DESIGN-07**: Hairlines render at `0.5px solid #E2DFD5`; emphasis at `1.25px`
- [ ] **DESIGN-08**: Site is responsive — works on phones, tablets, desktop

### Navigation

- [ ] **NAV-01**: TopNav renders brand mark + tabs (Home, Family tree, Photographs, Films) on every protected page
- [ ] **NAV-02**: Active nav tab shows gold underline (1.25px) with navy text
- [ ] **NAV-03**: Footer renders the AgeWish star + serif tagline on every protected page
- [ ] **NAV-04**: Star motif appears exactly 3 times per page — TopNav, hero (where applicable), and Footer

### Content Architecture

- [x] **CONT-01**: All family data lives in JSON files under `/content/` (family.json, photos.json, videos.json)
- [x] **CONT-02**: TypeScript types in `/lib/types.ts` mirror the JSON schemas exactly
- [x] **CONT-03**: Typed loaders in `/lib/content.ts` are the SOLE access point for content data — no JSX hardcoded data, no direct fs reads from components
- [x] **CONT-04**: Loaders validate JSON at load time using Zod schemas
- [x] **CONT-05**: Person `id` is kebab-case slug (e.g., `william-curry`) and is stable across all content types
- [x] **CONT-06**: Bidirectional references (photo `peopleIds[]` ↔ person `photoIds[]`) are validated by the loader
- [x] **CONT-07**: Stub data — at least 2-3 example entries per content type for v1 scaffold

### Home Page

- [ ] **HOME-01**: Home page renders brand identity (star + serif name "The Curry Family") in the hero
- [ ] **HOME-02**: Home page includes preview sections for the family tree, photographs, and films
- [ ] **HOME-03**: Home page uses ivory section alternation for visual rhythm

### Photo Gallery

- [ ] **PHOTO-01**: `/photographs` route renders a grid of all photos from `photos.json`
- [ ] **PHOTO-02**: Each photo card displays the image, caption, and date label metadata
- [ ] **PHOTO-03**: Photo files load from `/public/photos/{filename}`
- [ ] **PHOTO-04**: Photo grid degrades gracefully when there are zero photos (empty state)

### Video Gallery

- [ ] **VIDEO-01**: `/films` route renders a grid of all videos from `videos.json`
- [ ] **VIDEO-02**: `<VideoPlayer />` component switches rendering on the `source` field (`youtube` | `vimeo`) — Vimeo migration is a one-field JSON edit
- [ ] **VIDEO-03**: YouTube videos use `@next/third-parties` deferred iframe pattern (load on click, not on page load)
- [ ] **VIDEO-04**: Each video card shows title, date label, and embedded player
- [ ] **VIDEO-05**: Video grid degrades gracefully when there are zero videos

### Family Tree

- [ ] **TREE-01**: `/tree` route renders an interactive family tree using `relatives-tree` + `react-family-tree`
- [ ] **TREE-02**: Tree starts with the grandfather as root and descends through generations
- [ ] **TREE-03**: Each node renders person name and relation label
- [ ] **TREE-04**: Active node shows navy stroke (1.5px), ivory fill, and a small gold dot at top-right
- [ ] **TREE-05**: Connector lines use stone color (#C9C4B0)
- [ ] **TREE-06**: Tree data preparation runs server-side via `lib/tree.ts` wrapping `calcTree`; rendered in `'use client'` canvas component
- [ ] **TREE-07**: Multi-spouse / blended-family cases are validated against relatives-tree GitHub #24 bug — flatten or annotate before render
- [ ] **TREE-08**: Clicking a node opens `<PersonPanel />` slide-in within the tree section (not over whole page)
- [ ] **TREE-09**: Side panel shows person name, dates, birthplace, bio, and a fading photo carousel of their `photoIds`
- [ ] **TREE-10**: Photo carousel crossfades between images using Framer Motion (`AnimatePresence` within-page)
- [ ] **TREE-11**: Active carousel dot fills with gold

### Person Detail Pages

- [ ] **PERSON-01**: `/person/[id]` route renders an individual person detail page
- [ ] **PERSON-02**: Person page shows name, dates, birthplace, bio, and full photo grid for that person
- [ ] **PERSON-03**: Person page links from tree nodes and photo `peopleIds`

## v2 Requirements

Deferred to future release.

### Search & Filters

- **SEARCH-01**: User can search across photos, videos, and people
- **SEARCH-02**: User can filter photos by date range, person, or location
- **SEARCH-03**: User can filter videos by date range or person

### Content Management

- **ADMIN-01**: Admin upload UI for adding photos via web (avoid manual JSON editing)
- **ADMIN-02**: Admin upload UI for adding videos
- **ADMIN-03**: Admin form for editing person data

### Typography Polish

- **POLISH-01**: Migrate from Georgia fallback to Cormorant Garamond or EB Garamond via `next/font`

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| User accounts / multi-user auth | Single shared family password is sufficient and simpler |
| Comments or social features | Not appropriate for a curated family archive — "museum, not forum" |
| Real-time collaboration | This is a read-only archive |
| Public SEO / discoverability | Site is private, hidden from search engines |
| GEDCOM import | Family tree is small and curated by hand |
| Mobile native app | Web-first, mobile responsive is sufficient |
| Vercel Blob / external CDN for v1 | `/public/photos/` is sufficient for v1 photo volume |
| ISR / on-demand revalidation | "Commit + push = publish" workflow is simpler and correct |
| Email/notifications | Not needed for read-only archive |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Pending |
| FOUND-02 | Phase 1 | Pending |
| FOUND-03 | Phase 1 | Pending |
| FOUND-04 | Phase 1 | Pending |
| FOUND-05 | Phase 1 | Pending |
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| AUTH-05 | Phase 1 | Pending |
| AUTH-06 | Phase 1 | Pending |
| AUTH-07 | Phase 1 | Pending |
| DESIGN-01 | Phase 1 | Pending |
| DESIGN-02 | Phase 1 | Pending |
| DESIGN-03 | Phase 1 | Pending |
| DESIGN-04 | Phase 1 | Pending |
| DESIGN-05 | Phase 1 | Pending |
| DESIGN-06 | Phase 1 | Pending |
| DESIGN-07 | Phase 1 | Pending |
| DESIGN-08 | Phase 5 | Pending |
| NAV-01 | Phase 1 | Pending |
| NAV-02 | Phase 1 | Pending |
| NAV-03 | Phase 1 | Pending |
| NAV-04 | Phase 1 | Pending |
| CONT-01 | Phase 1 | Complete (01-03) |
| CONT-02 | Phase 1 | Complete (01-03) |
| CONT-03 | Phase 1 | Complete (01-03) |
| CONT-04 | Phase 1 | Complete (01-03) |
| CONT-05 | Phase 1 | Complete (01-03) |
| CONT-06 | Phase 1 | Complete (01-03) |
| CONT-07 | Phase 1 | Complete (01-03) |
| HOME-01 | Phase 1 | Pending |
| HOME-02 | Phase 1 | Pending |
| HOME-03 | Phase 1 | Pending |
| PHOTO-01 | Phase 2 | Pending |
| PHOTO-02 | Phase 2 | Pending |
| PHOTO-03 | Phase 2 | Pending |
| PHOTO-04 | Phase 2 | Pending |
| VIDEO-01 | Phase 3 | Pending |
| VIDEO-02 | Phase 3 | Pending |
| VIDEO-03 | Phase 3 | Pending |
| VIDEO-04 | Phase 3 | Pending |
| VIDEO-05 | Phase 3 | Pending |
| TREE-01 | Phase 4 | Pending |
| TREE-02 | Phase 4 | Pending |
| TREE-03 | Phase 4 | Pending |
| TREE-04 | Phase 4 | Pending |
| TREE-05 | Phase 4 | Pending |
| TREE-06 | Phase 4 | Pending |
| TREE-07 | Phase 4 | Pending |
| TREE-08 | Phase 4 | Pending |
| TREE-09 | Phase 4 | Pending |
| TREE-10 | Phase 4 | Pending |
| TREE-11 | Phase 4 | Pending |
| PERSON-01 | Phase 6 | Pending |
| PERSON-02 | Phase 6 | Pending |
| PERSON-03 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 57 total
- Mapped to phases: 57
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-29*
*Last updated: 2026-04-29 — coverage count corrected to 57 after roadmap creation*
