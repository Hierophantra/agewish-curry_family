# CLAUDE.md — Curry Family Hub

This file gives Claude Code context for working in this repository.

## v2 changes (current — Phase 7+)

**Primary spec:** `CURRY_FAMILY_HUB_BRIEF_v2.md` (project root). Phases 7–13 build the v2 feature set.

Key v2 architectural changes:
- **Collections/playlists as tags:** Photos have `collectionIds[]`, videos have `playlistIds[]`. Collections and playlists are JSON stubs in `content/collections.json` and `content/playlists.json`. A photo can belong to multiple collections (tag-based, not folder-based).
- **Section rename:** `app/(protected)/films/` renamed to `app/(protected)/videos/`. Tab label and hrefs updated throughout. No redirect needed (no external traffic).
- **Real PNG brand mark:** `components/ui/StarMark.tsx` now wraps `next/image` pointing to `/images/aw-symbol-2x.png`. The PNG contains the full mark (navy circle border + gold 8-pointed star). No inline SVG.
- **Prototype-fidelity panel UX:** TopNav brand = PNG at 36px + eyebrow "AgeWish · Private archive" + serif "The Curry Family". Hero = "A gathering of generations" h1 + italic serif subtitle. Footer = "Held in trust for those who come after." tagline + eyebrow meta.
- **Lightbox shared component** — Phase 8 dependency, not yet built. Prepare for it in photo components.
- **Dynamic routes stubbed:** `/photographs/[collectionId]` and `/videos/[playlistId]` are Phase 7 stubs; Phase 8/9 implement them.

For full v2 phase roadmap see `.planning/ROADMAP.md`.

## Project

**Curry Family Hub** — a private, password-gated family archive site for the Curry family at curry.agewish.com. Personal project under the AgeWish brand umbrella, built on the same stack as AgeWish client work.

**Core value:** Family members can securely access and explore their shared family history — photos, videos, and an interactive family tree.

## Stack (non-negotiable)

- **Next.js 14.2.35** — App Router. Do NOT upgrade to 15/16.
- **TypeScript** — strict mode, no `any`
- **Tailwind CSS v4** — CSS-first config via `@theme {}` in `globals.css`. NOT `tailwind.config.ts`.
- **next-auth@beta (Auth.js v5)** — Credentials provider, JWT strategy
- **motion** (rebrand of framer-motion) — install as `motion`, import from `motion/react`
- **relatives-tree 3.2.2** + **react-family-tree 3.2.0** — for the family tree
- **bcryptjs** (NOT native bcrypt) — for password hashing
- **zod** — JSON content validation
- **Vercel** — hosting

## Critical architectural principles

1. **Content separated from code.** All family data lives in `/content/*.json`. Components NEVER hardcode names, dates, photo paths, or video IDs. The sole access point is `/lib/content.ts` (typed, Zod-validated).

2. **Two-file auth split is mandatory.** `auth.config.ts` is edge-safe (no bcryptjs). `auth.ts` has the full config. `middleware.ts` imports ONLY from `auth.config.ts`. Violating this fails the edge runtime build.

3. **Defence in depth on auth.** Every protected Server Component must call `await auth()` independently — middleware alone is not the security layer (CVE-2025-29927).

4. **Tailwind tokens must be complete class names.** Never use string interpolation like `bg-${color}` — Tailwind purges these in production. Define the navy/gold/ivory palette as named tokens in `globals.css` under `@theme {}`.

5. **Server components by default.** Only mark `'use client'` for: motion components, the family tree canvas, the side panel, the video player.

6. **Person slug format is locked in Phase 1.** Kebab-case (e.g., `william-curry`). Used by tree nodes, photo `peopleIds[]`, and `/person/[id]` routes.

7. **Video source abstraction.** `source: "youtube" | "vimeo"` field in JSON. `<VideoPlayer>` switches on this. Vimeo migration = one-field JSON edit.

## Env vars

- `AUTH_SECRET` — generated via `npx auth secret`
- `AUTH_PASSWORD_HASH` — bcryptjs hash of the family password
- Do NOT set `NEXTAUTH_SECRET` (v4 name) or `NEXTAUTH_URL`/`AUTH_URL` (breaks Vercel preview)

## Design system

- **Palette**: Navy `#1F2D5C`, Gold `#E8A91F`, Ivory `#FBF9F2`, Border `#E2DFD5`
- **Typography**: Serif headings (Georgia fallback for v1, Cormorant/EB Garamond later), Inter body
- **Weights**: ONLY 400 and 500. Never 600/700.
- **Case**: Sentence case everywhere. Uppercase + 0.22em letter-spacing for metadata eyebrows only.
- **Star motif**: Exactly 3 per page — TopNav, hero (where applicable), Footer.

## GSD workflow

This project uses GSD (Get Stuff Done) for phase-driven execution.

- `.planning/PROJECT.md` — project context (read this first)
- `.planning/REQUIREMENTS.md` — 57 v1 requirements with REQ-IDs
- `.planning/ROADMAP.md` — 6 phases with goals, deps, success criteria
- `.planning/STATE.md` — current position, velocity
- `.planning/research/` — stack, features, architecture, pitfalls, summary
- `.planning/config.json` — workflow preferences (yolo, standard granularity, parallel, all agents enabled)

**Phase commands:**
- `/gsd-discuss-phase N` — gather context for phase N
- `/gsd-plan-phase N` — create phase plan
- `/gsd-execute-phase N` — execute phase plan
- `/gsd-progress` — check current state

**Auto mode active.** Workflow auto-advances through phases.

## Build order

### v1 phases (complete)

1. **Scaffold + Auth Gate + Design System** — foundation, load-bearing
2. **Photo Gallery** — `/photographs` route
3. **Video Gallery** — `/films` route with source abstraction
4. **Family Tree** — `/tree` with side panel (highest risk: relatives-tree multi-spouse bug)
5. **Visual Polish** — responsive, motion, typography refinement
6. **Person Detail Pages** — `/person/[id]` with bidirectional links

### v2 phases (current — see `.planning/ROADMAP.md` for full details)

7. **v2 Foundation** — schema migration, brand PNG, hero/footer copy, films→videos rename
8. **Collection detail** — `/photographs/[collectionId]` photo grid
9. **Playlist detail** — `/videos/[playlistId]` video list + featured video home section
10. **Tree panel refresh** — match prototype panel UX exactly
11. **Person pages v2** — new schema fields rendered
12. **Home curated previews** — featured video, recent photos on home page
13. **Real content** — replace stubs with actual family media

## Configurability contract (v3.6 — see .planning/CONTROL_SYSTEM_AUDIT.md)

"Everything important can be changed within a disciplined design system" — controlled flexibility, not per-pixel chaos. Three mechanisms, with clear ownership. **Do not hardcode user-facing strings in components.**

1. **`data-edit-id` element overrides → `theme.json`** (Shift+E editor): one-off visual/text nudges on tagged elements — color, background, font size (presets + slider), text content, free-drag position, scale. Sitewide or per-route. *Appearance.*
2. **`content/*.json` (Zod-validated, via `lib/content.ts`)**: archival data + reusable chrome copy. `site.json` = brand mark / nav labels / footer CTA; `screens.json` = section show/hide. *Structure & content.*
3. **`hero.json` / `tree-layout.json`**: media rotation + tree spatial arrangement. *Layout.*

Guardrails: reuse design tokens (don't duplicate); constrain new editable inputs to presets/swatches where consistency or a11y is at stake; admin tooling (DebugOverlay Shift+D, validation, history/restore) is admin-only and never leaks to family viewers. Token presets live in `globals.css @theme` (semantic names — never override Tailwind's numeric scales). The DebugOverlay (Shift+D) + `/admin/history` (restore) + `/api/admin/validate` are the test/safety surfaces.

## Working principles

- Commit often, atomically. Each meaningful unit.
- Ask before deviating from the brief or roadmap.
- No premature abstractions — don't build a generic `<Card>` until 3+ uses.
- Test the feature in a browser before claiming Phase complete (UI work).
