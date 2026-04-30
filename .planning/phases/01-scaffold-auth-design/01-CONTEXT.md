# Phase 1: Scaffold + Auth Gate + Design System - Context

**Gathered:** 2026-04-29
**Status:** Ready for planning
**Mode:** --auto (recommended defaults selected)

<domain>
## Phase Boundary

Phase 1 delivers a deployable foundation: a Next.js 14 site that requires the family password to access, renders the AgeWish-branded home page with TopNav and Footer, and exposes a typed JSON content loader that all later phases will consume.

**Strictly in scope:**
- Project scaffolding (Next.js, TypeScript, Tailwind v4, all libraries pinned)
- Auth.js v5 Credentials login flow (login page → JWT session → middleware + Server Component double-gate)
- Tailwind v4 `@theme {}` palette and typography tokens
- TopNav, Footer, StarMark components
- Login page UI
- `/lib/types.ts` and `/lib/content.ts` with Zod-validated loaders
- Stub `family.json`, `photos.json`, `videos.json` (2-3 entries each)
- Home page with hero + section previews
- Vercel deployment, env var configuration, DNS pointer to curry.agewish.com
- README.md and `.env.local.example`

**NOT in scope (later phases):**
- Real photo files, real video embeds, real family data — Phases 2-4
- `/photographs`, `/films`, `/tree`, `/person/[id]` page implementations — placeholders only
- Mobile-specific responsive QA — Phase 5 (basic responsive only here)
- Cormorant Garamond webfont — Phase 5 (Georgia fallback for now)
- Search, filters, person pages — Phase 6

</domain>

<decisions>
## Implementation Decisions

### Authentication

- **D-01:** Login UX — Single password input centered on white background. AgeWish star above, "The Curry Family" serif heading below the star, password field, navy submit button. No "remember me" toggle (JWT cookie persistence handles this implicitly). No "forgot password" link (per brief — if forgotten, ask the developer).
- **D-02:** Login error handling — Inline error message displayed below the password input on failed authentication. Generic copy ("That password isn't right") — no specific failure modes leaked. Server-rendered error state (no client JS required for the error path).
- **D-03:** Auto-focus the password input on the login page mount.
- **D-04:** Logout — Small text link "Sign out" in the TopNav, right-aligned, sentence case, muted color. Implemented as a server action (form POST → `signOut()` → redirect to `/login`). No client component required.
- **D-05:** Auth two-file split is mandatory. `auth.config.ts` exports the Auth.js config with NO Node-only imports (no bcryptjs, no fs). `auth.ts` imports the config and adds the bcryptjs comparison in the `authorize()` callback. `middleware.ts` imports ONLY from `auth.config.ts`. Violating this fails the edge runtime build.
- **D-06:** Defence in depth — middleware redirects unauthenticated users at the edge for fast UX, but EVERY Server Component under `(protected)` calls `await auth()` independently. Mitigates CVE-2025-29927.
- **D-07:** Env vars — `AUTH_SECRET` (generated via `npx auth secret`) and `AUTH_PASSWORD_HASH` (bcryptjs hash of family password). Do NOT set `NEXTAUTH_SECRET` (v4) or `NEXTAUTH_URL`/`AUTH_URL` (breaks Vercel preview deployments).
- **D-08:** Session strategy — JWT (no DB adapter). Cookie-based session, 30-day expiry by default.

### Design System

- **D-09:** Tailwind v4 CSS-first config — Palette and typography defined in `app/globals.css` under `@theme {}` block. NO `tailwind.config.ts` file. Required `@tailwindcss/postcss` package as the PostCSS shim.
- **D-10:** Palette as named tokens (no string interpolation). Token names drop the `text-` prefix
  to avoid Tailwind utility doubling (`text-text-muted`); see RESEARCH.md Open Questions §1:
  - `--color-navy: #1F2D5C` → class `text-navy` / `bg-navy`
  - `--color-gold: #E8A91F` → class `text-gold` / `bg-gold`
  - `--color-gold-deep: #B8851A` → class `text-gold-deep`
  - `--color-ivory: #FBF9F2` → class `bg-ivory`
  - `--color-border: #E2DFD5` → class `border-border` / hairline default
  - `--color-stone: #C9C4B0` → class `border-stone`
  - `--color-muted: #6B6960` → class `text-muted` (body copy, descriptive text)
  - `--color-quiet: #8B8778` → class `text-quiet` (eyebrows, metadata, dates)
- **D-11:** Typography — Serif headings use Georgia/Times fallback for v1 (`font-family: Georgia, 'Times New Roman', serif`). Body uses Inter via `next/font/google` with weights 400 and 500 only (no other weights loaded). Cormorant Garamond migration deferred to Phase 5.
- **D-12:** Two-weight rule enforced in CSS — only `font-weight: 400` and `font-weight: 500` available as utility classes. Building a `font-medium` (500) class is fine; `font-semibold` (600) and `font-bold` (700) must not appear in JSX.
- **D-13:** Sentence case everywhere — no Title Case in headings, no ALL CAPS in body. Exception: metadata eyebrows use uppercase + 0.22em letter-spacing (define as `.eyebrow` utility class).
- **D-14:** Hairlines — `border-width: 0.5px; border-color: #E2DFD5` (default). Emphasis hairlines use `1.25px` (active tab underline, brand circle). Define as `.hairline` and `.hairline-emphasis` utilities.
- **D-15:** Spacing rhythm — Section padding `py-11 px-7` mobile (44px / 28px), scale up on `md:` breakpoint. Hero padding `pt-15 pb-12`.

### StarMark Component

- **D-16:** `<StarMark />` is a Server Component (inline SVG, no interactivity). Accepts `size` prop (px) and optional `className`. Default sizes: 14px (nav), 36px (hero), 20px (footer). Exact path data for the 7-pointed star will be derived from the AgeWish brand assets — if `/public/brand/star.svg` exists, prefer reading it; otherwise generate the path inline based on the 7-point geometry.
- **D-17:** Star motif rule enforced as documentation (not code) — exactly 3 stars per page: TopNav (small), Hero (medium, where applicable), Footer (small). PR review and visual QA enforces.

### Navigation

- **D-18:** TopNav is a Server Component. Layout: brand mark (StarMark + "The Curry Family" serif text) on the left, tab links (Home, Family tree, Photographs, Films) center/right, Sign out link far right. Active tab gets `border-b-1.25 border-gold` underline + `text-navy`.
- **D-19:** Active state detection uses Next.js `usePathname()` — but the parent TopNav stays Server, with a small `<NavTabs />` Client island that owns the pathname-aware active state. Passes the tab list as props from server.
- **D-20:** Footer is a Server Component. Layout: centered StarMark (small), serif tagline beneath ("A private family archive" or similar — final copy decided in implementation), date metadata in muted color.

### Content Architecture

- **D-21:** Folder layout matches brief exactly:
  ```
  app/(auth)/login/page.tsx
  app/(protected)/layout.tsx
  app/(protected)/page.tsx          # home
  app/(protected)/tree/page.tsx     # placeholder
  app/(protected)/photographs/page.tsx  # placeholder
  app/(protected)/films/page.tsx    # placeholder
  app/(protected)/person/[id]/page.tsx  # placeholder
  app/api/auth/[...nextauth]/route.ts
  ```
- **D-22:** `/lib/types.ts` defines TypeScript types that mirror the JSON schemas exactly (Person, Photo, Video). Types derived from Zod schemas via `z.infer<typeof PersonSchema>`.
- **D-23:** `/lib/content.ts` exports four functions: `getPeople()`, `getPhotos()`, `getVideos()`, `getPersonById(id)`. Each reads its JSON file, validates with Zod, returns typed objects. Validation runs on every server-side call (cheap; bundled at build time anyway). Throws on schema violation — fail loud.
- **D-24:** Bidirectional reference validator runs at module load — verifies every `Photo.peopleIds[]` resolves to an existing `Person.id`, and every `Person.photoIds[]` resolves to an existing `Photo.id`. Throws on dangling reference.
- **D-25:** Person ID is kebab-case slug. Convention: `firstname-lastname` (e.g., `william-curry`, `robert-curry`). Stable forever — never rename. Birth year suffix only if disambiguating (`william-curry-1920`).
- **D-26:** Photo files live in `/public/photos/{filename}` for v1. Vercel Blob / external CDN deferred until photo volume warrants it (>100 photos or >50MB total).
- **D-27:** Video data shape includes `source: "youtube" | "vimeo"` and `sourceId: string`. Phase 1 stubs use `youtube`. Phase 3 implements the player switch.
- **D-28:** No ISR, no `revalidate` timers. JSON is static at build time. Content updates ship via `git commit && git push` → Vercel rebuilds.

### Stub Content

- **D-29:** `family.json` stub — 3 people: William Curry (grandfather), one child, one grandchild. Realistic-shaped data for the loader to validate and the tree (Phase 4) to render. Real family data populated separately by the developer.
- **D-30:** `photos.json` stub — 2-3 entries referencing placeholder filenames. Photo files themselves can be tiny placeholder images (or even missing — empty state path is exercised).
- **D-31:** `videos.json` stub — 1-2 entries with the Rick Roll YouTube ID (`dQw4w9WgXcQ`) as deliberate placeholder. Real videos swapped in later.

### Home Page

- **D-32:** Hero — centered StarMark (medium, 36px), then serif "The Curry Family" (large, ~64px on desktop), then a short serif subtitle in muted color ("A private family archive" — placeholder, refine in implementation). No CTA buttons — site IS the experience.
- **D-33:** Section previews — Three text-forward cards in a row (stack vertically on mobile). Each card: section name (serif), 1-line description, "→" arrow. Links to `/tree`, `/photographs`, `/films`. NO preview images in v1 — the tree/photo/video sections aren't built yet, and bare text is more appropriate for an archival aesthetic anyway.
- **D-34:** Ivory section alternation — alternating `bg-white` / `bg-ivory` between hero and section previews for visual rhythm.

### Deployment

- **D-35:** Deploy to Vercel after Phase 1 completes. Uses stub content. Validates: env vars are set in Production/Preview/Development, DNS at curry.agewish.com points to Vercel, password gate works in production.
- **D-36:** GitHub repo workflow: `main` branch is production. PRs optional for personal project (single developer). Vercel auto-deploys on push to `main`.
- **D-37:** README.md covers: local setup (clone, npm install, env vars, npm run dev), generating a new password hash (`node -e "require('bcryptjs').hash('<pw>', 10).then(console.log)"`), content authoring (how to add a person, photo, video), deploy notes (Vercel env vars, DNS).

### Claude's Discretion

- Exact serif typography weight/sizing fine-tuning — pick visually pleasing defaults; refine in Phase 5
- Exact hero subtitle copy — propose a tasteful one-liner, developer can edit
- Exact star SVG path data — if `/public/brand/star.svg` not yet available, generate a 7-pointed star programmatically (geometry: 7 points, alternating outer/inner radii, gold fill)
- Login page layout micro-spacing — match the white-card-on-white aesthetic from the brief
- Exact placeholder image strategy for stub photos — empty `1x1.jpg` or generated SVG placeholder, both fine

### Folded Todos

(None — fresh project, no prior todos)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Documents
- `.planning/PROJECT.md` — Project context, constraints, key decisions
- `.planning/REQUIREMENTS.md` — 57 v1 requirements with REQ-IDs
- `.planning/ROADMAP.md` — 6-phase plan, dependencies, success criteria

### Research
- `.planning/research/SUMMARY.md` — Synthesized findings (read first)
- `.planning/research/STACK.md` — Library versions and install commands
- `.planning/research/ARCHITECTURE.md` — Route groups, two-file auth split, content boundary
- `.planning/research/PITFALLS.md` — 12 catalogued pitfalls; 5 of them are Phase 1-critical
- `.planning/research/FEATURES.md` — Table stakes / differentiators / anti-features

### Brand & Design
- Project brief in conversation history (visual reference characteristics, palette, typography rules)
- `/public/brand/star.svg` — AgeWish star asset (if available; otherwise generate inline)

### External Documentation (referenced by research)
- Auth.js v5 migration guide — https://authjs.dev/getting-started/migrating-to-v5
- Auth.js Credentials provider — https://authjs.dev/getting-started/providers/credentials
- Tailwind v4 release notes — https://tailwindcss.com/blog/tailwindcss-v4
- CVE-2025-29927 postmortem — https://vercel.com/blog/postmortem-on-next-js-middleware-bypass

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project. All components and utilities will be created in this phase.

### Established Patterns
- None yet. Phase 1 establishes the patterns that all subsequent phases follow:
  - Server Component by default; `'use client'` only for interactivity
  - All content reads via `lib/content.ts` (single boundary)
  - Tailwind tokens for all colors/spacing (no inline styles, no string interpolation)
  - Sentence case copy + serif headings + Inter body

### Integration Points
- **Future Phase 2 (Photos)** depends on: `lib/content.ts.getPhotos()`, `Photo` type, `/public/photos/` directory
- **Future Phase 3 (Videos)** depends on: `lib/content.ts.getVideos()`, `Video.source` field, VideoPlayer placeholder location
- **Future Phase 4 (Tree)** depends on: `lib/content.ts.getPeople()`, `Person.id` slug convention, bidirectional reference validator
- **Future Phase 6 (Person pages)** depends on: `Person.id` slug as URL segment for `/person/[id]`

</code_context>

<specifics>
## Specific Ideas

- The visual reference is a mockup that has been approved (described in the brief). Visual direction is locked.
- Reference site for tone: AgeWish client work (e.g., John Miller piece) — same brand DNA but warmer because this is family.
- The seven-pointed star is the AgeWish brand stamp — three appearances per page, no more, no less. This rule is non-negotiable.

</specifics>

<deferred>
## Deferred Ideas

- **Cormorant Garamond / EB Garamond webfont** — Phase 5 polish
- **Real family content** — populated incrementally by developer, not a phase deliverable
- **Search bar in TopNav** — Phase 6 if scoped in
- **Admin upload UI** — explicitly out of scope (v2)
- **Person bio markdown rendering** — defer until real bios are written; v1 plain-text is fine
- **Photo lightbox** — Phase 2
- **Tree node photo thumbnail** — Phase 4

### Reviewed Todos (not folded)
(None)

</deferred>

---

*Phase: 1-Scaffold + Auth Gate + Design System*
*Context gathered: 2026-04-29*
