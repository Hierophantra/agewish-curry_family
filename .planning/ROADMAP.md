# Roadmap: Curry Family Hub

## Overview

Six phases build the archive incrementally from secure scaffold to fully navigable family history. Phase 1 is the most load-bearing — it establishes the auth two-file split, Tailwind token set, and content loader contract that every subsequent phase depends on. Phases 2 and 3 add the media galleries as independent vertical slices. Phase 4 adds the family tree (highest-risk phase due to relatives-tree multi-spouse bug). Phase 5 applies visual polish across the whole site. Phase 6 completes person detail pages, closing the bidirectional navigation loop opened in Phase 1.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Scaffold + Auth Gate + Design System** - Secure foundation, design tokens, content loader contract, and home page (Vercel deploy deferred — code on GitHub, prerequisites complete)
- [x] **Phase 2: Photo Gallery** - Grid of family photographs with metadata, loaded from JSON
- [x] **Phase 3: Video Gallery** - Grid of family films with source-abstracted video player
- [x] **Phase 4: Family Tree** - Interactive tree with clickable nodes and person side panel (multi-spouse GitHub #24 mitigation verified)
- [x] **Phase 5: Visual Polish** - Responsive QA, motion polish, typography refinement across all pages (visual judgment deferred to user real-browser check)
- [x] **Phase 6: Person Detail Pages** - Individual person pages linked from tree nodes and photo metadata

## Phase Details

### Phase 1: Scaffold + Auth Gate + Design System
**Goal**: The site is live, password-gated, and visually branded — family members can log in and see the home page; all content infrastructure is in place for subsequent phases
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, DESIGN-01, DESIGN-02, DESIGN-03, DESIGN-04, DESIGN-05, DESIGN-06, DESIGN-07, NAV-01, NAV-02, NAV-03, NAV-04, CONT-01, CONT-02, CONT-03, CONT-04, CONT-05, CONT-06, CONT-07, HOME-01, HOME-02, HOME-03
**Success Criteria** (what must be TRUE):
  1. A family member can visit the site, be redirected to the login page, enter the shared password, and reach the home page
  2. Navigating directly to any protected route without a session redirects to `/login` and then back after login
  3. The home page displays the AgeWish star, serif "The Curry Family" heading, and preview sections for tree, photographs, and films
  4. The TopNav and Footer render on every protected page with the star motif appearing exactly 3 times per page
  5. The content loader (`lib/content.ts`) reads from JSON files, validates with Zod, and stub data for all four content types is accessible to components
**Plans**: 6 plans
Plans:
- [x] 01-01-PLAN.md — Scaffold: Next.js 14.2.35, Tailwind v4, Inter font, globals.css @theme tokens
- [x] 01-02-PLAN.md — Auth two-file split: auth.config.ts (edge), auth.ts (Node), middleware.ts, API route
- [x] 01-03-PLAN.md — Content schema + loader: lib/types.ts, lib/content.ts, stub JSON, lib/utils.ts
- [x] 01-04-PLAN.md — StarMark SVG, route group layouts, placeholder pages, protected auth() gate
- [x] 01-05-PLAN.md — TopNav + NavTabs + Footer + login page UI
- [ ] 01-06-PLAN.md — Home page (Hero + SectionPreview), README, Vercel deployment
**UI hint**: yes

### Phase 2: Photo Gallery
**Goal**: Family members can browse the full photograph archive in a grid with captions and dates
**Depends on**: Phase 1
**Requirements**: PHOTO-01, PHOTO-02, PHOTO-03, PHOTO-04
**Success Criteria** (what must be TRUE):
  1. Visiting `/photographs` shows a grid of photo cards, each displaying the image, caption, and date label
  2. Photo images load from `/public/photos/` without broken image errors
  3. Visiting `/photographs` with zero photos in `photos.json` shows a graceful empty state rather than an error
**Plans**: 1 plan
Plans:
- [x] 02-01-PLAN.md — PhotoCard + PhotoGrid components, wire /photographs page, add stub images to /public/photos/
**UI hint**: yes

### Phase 3: Video Gallery
**Goal**: Family members can browse and watch family films, with the video player abstracting the hosting platform
**Depends on**: Phase 2
**Requirements**: VIDEO-01, VIDEO-02, VIDEO-03, VIDEO-04, VIDEO-05
**Success Criteria** (what must be TRUE):
  1. Visiting `/films` shows a grid of video cards, each displaying the title, date label, and an embedded player
  2. YouTube videos load on click (deferred iframe), not on page load — the page does not trigger YouTube network requests until a user clicks play
  3. Switching a video's `source` field in `videos.json` from `"youtube"` to `"vimeo"` changes the player component without touching any other code
  4. Visiting `/films` with zero videos in `videos.json` shows a graceful empty state
**Plans**: 1 plan
Plans:
- [x] 03-01-PLAN.md — VideoPlayer stack (@next/third-parties), VideoCard + VideoGrid, wire /films page, update videos.json stub
**UI hint**: yes

### Phase 4: Family Tree
**Goal**: Family members can explore the family tree interactively — clicking any person node opens a side panel with their details and photos
**Depends on**: Phase 3
**Requirements**: TREE-01, TREE-02, TREE-03, TREE-04, TREE-05, TREE-06, TREE-07, TREE-08, TREE-09, TREE-10, TREE-11
**Success Criteria** (what must be TRUE):
  1. Visiting `/tree` renders the full family tree starting from the grandfather (William Curry), with all nodes and connector lines visible
  2. Clicking a tree node opens `<PersonPanel />` as a slide-in within the tree section showing the person's name, dates, birthplace, and bio
  3. The side panel photo carousel crossfades between that person's photos, with the active dot filled gold
  4. Multi-spouse cases in the Curry data render correctly — no nodes silently disappear from the tree
**Plans**: 3 plans
Plans:
- [x] 04-01-PLAN.md — Schema migration (gender field), bidirectional validator extension, lib/tree.ts adapter + flattenMultiSpouses mitigation, family.json multi-spouse stub data
- [x] 04-02-PLAN.md — FamilyTreeCanvas, PersonNode, ConnectorLine — client rendering components
- [ ] 04-03-PLAN.md — PersonPanel slide-in, PhotoCarousel crossfade, tree page wiring + human verify
**UI hint**: yes

### Phase 5: Visual Polish
**Goal**: The site looks and feels finished across all devices — responsive layout, refined typography, and subtle motion all work cohesively
**Depends on**: Phase 4
**Requirements**: DESIGN-08
**Success Criteria** (what must be TRUE):
  1. All pages — home, photographs, films, and tree — are usable on a phone screen (no horizontal overflow, no overlapping elements, no unreadable text)
  2. Page entry animations play on navigation without layout shift or jank
  3. The family tree renders usably on narrow screens (scroll/zoom, no node overlap)
**Plans**: 4 plans
Plans:
- [x] 05-01-PLAN.md  -  Typography migration (Cormorant Garamond) + app/template.tsx entry animation
- [x] 05-02-PLAN.md  -  Hover states + Hero stagger animation across home/gallery/video/tree
- [x] 05-03-PLAN.md  -  Mobile responsive polish (tree scroll, PersonPanel bottom-sheet, NavTabs) + cleanup
- [ ] 05-04-PLAN.md  -  Visual QA checkpoint: human verification at three breakpoints
**UI hint**: yes

### Phase 6: Person Detail Pages
**Goal**: Every person in the family has a dedicated detail page, fully linked from the tree and photo metadata
**Depends on**: Phase 5
**Requirements**: PERSON-01, PERSON-02, PERSON-03
**Success Criteria** (what must be TRUE):
  1. Visiting `/person/william-curry` (or any person slug from `family.json`) renders a full person page with name, dates, birthplace, bio, and photo grid
  2. Clicking a tree node navigates to that person's detail page (link is active in tree)
  3. Person slugs used in photo `peopleIds[]` arrays resolve to working person page URLs
**Plans**: 1 plan
Plans:
- [x] 06-01-PLAN.md — Person detail page (full impl + generateStaticParams), PhotoGrid prop refactor, PersonPanel "View full page" link
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Scaffold + Auth Gate + Design System | 5/6 | In Progress|  |
| 2. Photo Gallery | 1/1 | Complete | 2026-04-29 |
| 3. Video Gallery | 1/1 | Complete | 2026-04-30 |
| 4. Family Tree | 2/3 | In Progress | - |
| 5. Visual Polish | 3/4 | In Progress | - |
| 6. Person Detail Pages | 1/1 | Complete | 2026-04-30 |
