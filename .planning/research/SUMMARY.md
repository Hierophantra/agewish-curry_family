# Project Research Summary — Curry Family Hub

**Project:** Curry Family Hub (curry.agewish.com)
**Domain:** Private single-family read-only archive (photo gallery, video gallery, interactive family tree, curated home)
**Researched:** 2026-04-29
**Confidence:** HIGH overall

---

## Executive Summary

The Curry Family Hub is a private, password-gated archive built on a well-understood stack (Next.js 14 App Router, Auth.js v5, Tailwind CSS v4, relatives-tree) that maps cleanly onto the existing 6-session incremental build order. Research confirms the plan is sound: the chosen libraries are the correct versions for each other, the JSON-over-CMS content strategy is right-sized for a single maintainer, and relatives-tree covers the layout complexity without custom graph math. No major architectural pivots are needed.

The two highest-leverage decisions happen in Session 1 and neither is reversible without rework: the auth two-file split (auth.config.ts vs auth.ts) must be done correctly from the start to avoid edge-runtime build failures, and the Tailwind token set (navy/gold/ivory palette as complete class names under `@theme {}`) must be committed before any component work or production builds will strip the AgeWish brand colours. Both are well-documented and low-effort to get right — they simply require doing them in the correct order before anything else.

The only genuine uncertainty in the plan is the relatives-tree multi-spouse rendering bug (GitHub issue #24, unfixed as of March 2025). If any Curry family member has multiple spouses in the data, tree nodes can disappear silently. This must be prototyped with real Curry data at the start of Session 3, not during it.

---

## Key Findings

### Recommended Stack

**Core technologies (all version-pinned):**
- **Next.js `14.2.35`** — pin to exact patch; do not upgrade to 15/16
- **next-auth `@beta` (v5)** — install as `next-auth@beta`
- **Tailwind CSS `4.x`** — CSS-first config via `@theme {}` in `globals.css`; requires `@tailwindcss/postcss`
- **`motion` `12.x`** — `framer-motion` was rebranded; install as `motion`, import from `motion/react`
- **`relatives-tree` `3.2.2` + `react-family-tree` `3.2.0`** — tree component must be `"use client"`
- **`bcryptjs` `^2.4.3`** — pure-JS bcrypt for Vercel serverless
- **`zod` `^3.x`** — validate JSON content at build time

**Two env vars only:** `AUTH_SECRET` (generated with `npx auth secret`) and `AUTH_PASSWORD_HASH`. Do NOT set `NEXTAUTH_URL` or `AUTH_URL` on Vercel — breaks preview deployment callbacks.

### Expected Features

**Must have (table stakes — all v1):**
- Password gate (single shared password, no user accounts)
- Curated home page with hero, brand identity, section previews
- Interactive family tree with clickable nodes and person side panel
- Photo gallery with grid, lightbox, and metadata
- Video gallery with YouTube embed and VideoPlayer source abstraction
- Person detail content (name, dates, photo, bio) from JSON
- Responsive design — family browse on phones
- Graceful empty states — content populates incrementally

**Should have (differentiators):**
- Video platform abstraction: `source: "youtube" | "vimeo"` field
- Bidirectional navigation: person slug shared between tree nodes and photo `people[]` arrays
- Content fully in `/content/*.json` — non-developer maintainable

**Defer indefinitely:**
- Search/filters, admin upload UI, user accounts, comments, GEDCOM import, notifications, public SEO

### Architecture Approach

Two route groups (`(auth)` for login, `(protected)` for everything else) as independent layout trees. All content reads happen exclusively in Server Components via `lib/content.ts`. The family tree is the most complex boundary: data preparation server-side in `lib/tree.ts`, passed as props to `FamilyTreeCanvas` which is a `"use client"` island. Auth is enforced at two layers: middleware (edge, UX redirect) plus `auth()` calls in Server Components (defence in depth against CVE-2025-29927).

**Critical components:**
1. `auth.config.ts` / `auth.ts` / `middleware.ts` — mandatory two-file split
2. `lib/content.ts` — sole access point for all JSON data; typed with Zod
3. `FamilyTreeCanvas.tsx` (`"use client"`) — relatives-tree DOM island
4. `VideoPlayer.tsx` (`"use client"`) — switches on `source` field
5. `(protected)/layout.tsx` (Server) — independent `auth()` call

### Critical Pitfalls

1. **Middleware-only auth bypass (CVE-2025-29927)** — every protected Server Component must also call `await auth()`. Use Next.js 14.2.25+.

2. **Wrong env var name** — Auth.js v5 uses `AUTH_SECRET`, NOT `NEXTAUTH_SECRET`. Missing or misnamed = complete production auth failure.

3. **Two-file auth split violated** — importing `auth.ts` in `middleware.ts` pulls bcryptjs into edge runtime → build failure.

4. **Tailwind dynamic class purging** — never construct class names via string interpolation. Define full palette as named tokens upfront.

5. **relatives-tree multi-spouse bug (GitHub #24)** — multiple spouse entries can silently drop children from tree. Prototype with real data before Session 3.

---

## Implications for Roadmap

The existing 6-session build order is **validated**. No reordering needed. Specifics added per session:

### Session 1: Scaffold + Auth Gate + Design System
**Load-bearing — three pitfalls compound if missed.** Must complete:
- `auth.config.ts` + `auth.ts` + `middleware.ts` two-file split
- `AUTH_SECRET` set in Vercel for all three environments
- Tailwind v4 `@theme {}` block with full navy/gold/ivory palette as complete class name tokens
- `lib/content.ts` with typed Zod loaders and stub JSON for all four content types (people, photos, films, tree)
- Dual-layer auth: middleware redirect AND `auth()` call in `(protected)/layout.tsx`
- **Critical: person slug format decided here** (e.g., `william-curry`) — used by all subsequent sessions

### Session 2: Photo Gallery
- `PhotoGrid` + `PhotoCard` Server Components
- Photo `people[]` slugs as stub hrefs resolving in Session 6
- Photos in `/public/photos/` for v1 (no Vercel Blob)

### Session 3: Video Gallery
- `@next/third-parties` `YouTubeEmbed` for facade-style deferred iframe
- `VideoPlayer` switches on `source` field — implementation of Vimeo abstraction
- Document: "commit + push = publish"; no ISR

### Session 4: Family Tree (HIGHEST RISK)
- **Pre-session prototype required**: relatives-tree with real Curry data including any multi-spouse cases
- `lib/tree.ts` wraps `calcTree`, runs server-side
- `FamilyTreeCanvas` as `"use client"` island
- `PersonPanel` slide-in with `AnimatePresence` (within-page only, never cross-page)
- Bidirectional reference validator in `lib/content.ts`

### Session 5: Visual Polish
- Typography refinement (transition from Georgia fallback to Cormorant Garamond/EB Garamond via `next/font`)
- Motion polish (entry animations only with `motion/react`; use `template.tsx` not `layout.tsx`)
- Responsive QA with focus on family tree on narrow screens
- Edge case handling, empty states

### Session 6: Person Pages, Search, Filters
- `/person/[id]` pages — depends on stable slugs from Session 1
- **Search is gated**: only build if content volume warrants (>50 people, >100 photos)
- If gated in: needs phase research on indexing strategy (Fuse.js vs build-time index)

---

## Open Questions

| Question | Resolves at | Default |
|----------|-------------|---------|
| Multi-spouse Curry family data | Session 4 prototype | Flatten blended families to single annotated node |
| Photo storage location | Session 2 | `/public/photos/` |
| react-family-tree React 18 compatibility | Session 4 prototype | Render relatives-tree layout directly if wrapper breaks |
| Session 6 search scope | Post-Session 5 | Skip if content stays small |
| Person slug format | Session 1 | `kebab-case` (e.g., `william-curry`) |

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified against official docs |
| Features | HIGH | Table stakes unambiguous for domain |
| Architecture | HIGH | Two-file auth split officially documented |
| Pitfalls | HIGH | CVE-2025-29927 documented; multi-spouse bug tracked in GitHub |

**Overall: HIGH** — proceed to requirements with confidence.

---

*Research completed: 2026-04-29 | Ready for roadmap: yes*
