---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: v2 — Collections, Playlists, Lightbox, Brand
status: executing
stopped_at: Phase 8 complete — Photo Collections + Lightbox done. Next: Phase 9 Video Playlists + Featured.
last_updated: "2026-04-30T08:29:00Z"
last_activity: 2026-04-30 — Phase 8 complete; Lightbox component (AnimatePresence, keyboard nav, scroll lock), CollectionCard, CollectionGrid, CollectionPhotoGrid, PhotoCard onClick prop, /photographs collection landing, /photographs/[collectionId] detail with lightbox; npm run build exits 0 (22 static pages)
progress:
  total_phases: 13
  completed_phases: 8
  total_plans: 8
  completed_plans: 8
  percent: 62
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-29)

**Core value:** Family members can securely access and explore their shared family history — photos, videos, and an interactive family tree — through a private, beautifully designed archive.
**Current focus:** Phase 8 — Photo Collections + Lightbox

## Current Position

Phase: 8 of 13 (Photo Collections + Lightbox) — complete
Plan: 1 of 1 in current phase (08 done)
Status: Phase 8 complete — advancing to Phase 9
Last activity: 2026-04-30 — Phase 8 complete; Lightbox (AnimatePresence, keyboard nav, scroll lock, backdrop close), CollectionCard (4:3 cover + gradient overlay), CollectionGrid (1/2/3 col responsive), CollectionPhotoGrid (Client, owns lightbox state), PhotoCard onClick prop (backward compat), /photographs → CollectionGrid landing, /photographs/[collectionId] → full detail with lightbox; npm run build exits 0 (22 static pages, 3 collection detail pages pre-rendered)

Progress: [█████████░░░░] 62% (8/13 phases complete)

## Phase 1 outcome

- All 6 plans executed; 5/5 ROADMAP success criteria verified locally
- Code on GitHub: github.com/Hierophantra/agewish-curry_family (branch `main`, 27 commits)
- Vercel deploy deferred by user — all prerequisites complete (env values generated, README documents steps)
- Two latent bugs caught and fixed during local verification (dead app/page.tsx, dotenv-expand mangling bcrypt hashes)

## Performance Metrics

**Velocity:**

- Total plans completed: 5
- Average duration: ~3m 30s
- Total execution time: ~0.29 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 — Scaffold + Auth | 5/6 | ~17m 30s | ~3m 30s |

**Recent Trend:**

- Last 5 plans: 01-01 (8m 13s), 01-02 (2m 19s), 01-03 (2m 19s), 01-04 (2m 1s), 01-05 (1m 34s)
- Trend: Stable at ~2m for well-researched plans with exact code patterns

*Updated after each plan completion*
| Phase 01 P04 | 2m 1s | 2 tasks | 7 files |
| Phase 01 P05 | 1m 34s | 2 tasks | 5 files |
| Phase 02 P01 | 8m 0s | 2 tasks | 5 files |
| Phase 03 P01 | 3m 0s | 2 tasks | 7 files |
| Phase 04 P01 | 3m 26s | 3 tasks | 5 files |
| Phase 04 P02 | 2m 43s | 2 tasks | 3 files |
| Phase 05 P01 | ~4m 0s | 2 tasks | 3 files |
| Phase 05 P02 | 2m 43s | 2 tasks | 5 files |
| Phase 05 P03 | 2m 0s | 2 tasks | 4 files |
| Phase 06 P01 | 2m 15s | 2 tasks | 3 files |
| Phase 08 P01 | ~30m | 7 tasks | 7 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Phase 1: Auth two-file split is mandatory — `auth.config.ts` (edge-safe) and `auth.ts` (full); middleware imports config-only only. Violation causes build failure. IMPLEMENTED in 01-02.
- Phase 1: Tailwind v4 `@theme {}` palette tokens must be committed before any component work or production builds strip brand colours.
- Phase 1: Person slug format is kebab-case (e.g., `william-curry`) — stable across all content types from Day 1. IMPLEMENTED in 01-03.
- Phase 4: relatives-tree multi-spouse bug (GitHub #24) must be prototyped with real Curry data before Phase 4 begins, not during it.
- 01-01: next.config.mjs (not .ts) — Next.js 14 does not support TypeScript config files (15+ feature only)
- 01-01: Token names --color-muted/--color-quiet (NOT --color-text-muted) — prevents Tailwind double-prefix class generation
- 01-01: bcryptjs@3.x is current stable (not v2.4.3 as planned) — API compatible, no code changes needed
- 01-01: zod pinned to v3 — v4 released since research; v3 used per plan spec
- 01-03: ZodType<Output, Def, Input> generics required in readJSON<> for correct default-filled type inference in TypeScript strict mode
- 01-03: server-only installed as runtime dependency; build enforces server boundary on lib/content.ts
- 01-04: StarMark generates 7-pointed heptagram inline (no star.svg) using generateStarPath with outerR=size/2, innerR=outerR*0.45
- 01-04: Protected layout ships as stub shell (no TopNav/Footer) — Plan 05 wires nav components via TODO comments
- 01-05: NavTabs uses text-muted (token naming resolution from 01-01) — not text-text-muted
- 01-05: Login error state via searchParams.error (not session); AuthError caught and re-thrown as redirect; NEXT_REDIRECT re-thrown
- 01-05: autoFocus on password input via HTML attribute only — no useEffect client island needed
- 02-01: dateTaken formatted inline in PhotoCard as "MONTH YYYY" uppercase; no dateLabel field on Photo type; noon UTC used to avoid timezone-off-by-one on YYYY-MM-DD strings
- 02-01: Stub images written as minimal valid JPEG (335 bytes) via Node.js Buffer; no ImageMagick/sharp needed at dev time
- 02-01: New filenames in content/photos.json require matching file in public/photos/ — critical constraint for future content editors
- 03-01: @next/third-parties v16 uses playlabel (not title) on YouTubeEmbed — API changed from earlier version documented in plan research
- 03-01: VimeoPlayer uses plain lazy iframe (no facade) — Vimeo does not have the per-page-load third-party cost that YouTube does
- 03-01: VideoPlayer throws on unknown source — Zod enforces the enum at load time so this guard only fires for future values not in schema
- 04-01: Cast RelativesTreeNode[] as unknown as readonly RelNode[] at calcTree call — relatives-tree const enum Gender/RelType incompatible with plain string literals under isolatedModules; structurally safe
- 04-01: flattenMultiSpouses() runs unconditionally (single-spouse cases pass through) per D-04 — avoids special-casing paths
- 04-02: ConnectorLine and FamilyTreeCanvas duplicate H_UNIT/V_UNIT/NODE_WIDTH/NODE_HEIGHT as local constants — lib/tree.ts has import 'server-only' so cannot be imported in client components
- 04-02: ESLint next/typescript does not enable argsIgnorePattern for _ prefix — eslint-disable-next-line used for _node and _photos (intentionally unused stubs)
- 05-01: template.tsx entry-only animation (no exit, no AnimatePresence) — cross-page AnimatePresence is broken in App Router; template.tsx re-mounts on navigation making it the idiomatic entry animation location
- 05-01: Cormorant Garamond weights ['400','500'] only — two-weight rule preserved; style ['normal','italic'] added for future blockquote variants without extra weight load
- 05-02: motion itemVariants ease requires 'as const' assertion to satisfy TypeScript Easing literal type — string inferred from object literal breaks strict mode
- 05-02: PhotoCard refactored to extract innerContent fragment to avoid duplicating image/metadata JSX across two render paths (Link-wrapped vs plain article)
- 05-03: PersonPanel mobile uses fixed (not absolute) bottom-sheet so panel anchors to viewport, not tree canvas container — prevents clipping on small-height canvas div
- 05-03: FamilyTreeCanvas gradient indicator uses lg:hidden (not md:hidden) — tree may still overflow on tablet; gradient stays visible until laptop breakpoint
- 05-03: react-family-tree removed; relatives-tree retained — FamilyTreeCanvas imports ExtNode/Connector types from relatives-tree/lib/types
- 06-01: Photo filter uses photo.peopleIds.includes(person.id) not person.photoIds — photos tag people, not the reverse
- 06-01: PhotoGrid accepts optional photos prop with = {} default; absent prop falls back to getPhotos() preserving /photographs page
- 06-01: PersonPanel "View full page" link styled as eyebrow + hover:text-gold — subtle accent consistent with two-weight design system
- 08: PhotoCard became 'use client' to accept onClick function prop; backward compat preserved (no onClick = original Link/article behavior)
- 08: CollectionPhotoGrid owns lightbox state (lightboxIndex: number | null) — clean server/client boundary split
- 08: Photo index counter (1 / N) shown in lightbox per Claude's discretion (D-13 allowed this)

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 4 (elevated risk): relatives-tree GitHub issue #24 — multi-spouse cases can silently drop children from the tree. Pre-phase prototype required with real Curry family data. Default resolution: flatten blended families to single annotated node.

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Typography | Cormorant Garamond / EB Garamond webfont via next/font | v2 POLISH-01 | Init |
| Search | Search across photos, videos, people | v2 SEARCH-01/02/03 | Init |
| Admin | Upload UI for photos, videos, persons | v2 ADMIN-01/02/03 | Init |

## Session Continuity

Last session: 2026-04-30T08:29:00Z
Stopped at: Completed 08-PLAN — Photo Collections + Lightbox; Lightbox, CollectionCard, CollectionGrid, CollectionPhotoGrid, PhotoCard onClick prop; npm run build exits 0 (22 pages)
Resume file: None
