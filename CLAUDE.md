# CLAUDE.md — Curry Family Hub

This file gives Claude Code context for working in this repository.

## Project

**Curry Family Hub** — a private, password-gated family archive site for the Curry family at curry.agewish.com. Personal project under the AgeWish brand umbrella, built on the same stack as AgeWish client work.

**Core value:** Family members can securely access and explore their shared family history — photos, films, and an interactive family tree.

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

## Build order (6 phases)

1. **Scaffold + Auth Gate + Design System** — foundation, load-bearing
2. **Photo Gallery** — `/photographs` route
3. **Video Gallery** — `/films` route with source abstraction
4. **Family Tree** — `/tree` with side panel (highest risk: relatives-tree multi-spouse bug)
5. **Visual Polish** — responsive, motion, typography refinement
6. **Person Detail Pages** — `/person/[id]` with bidirectional links

## Working principles

- Commit often, atomically. Each meaningful unit.
- Ask before deviating from the brief or roadmap.
- No premature abstractions — don't build a generic `<Card>` until 3+ uses.
- Test the feature in a browser before claiming Phase complete (UI work).
