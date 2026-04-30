# Phase 1 Discussion Log

**Date:** 2026-04-29
**Mode:** --auto (recommended defaults selected without interactive prompts)

## Auto-Selected Decisions

The brief and research SUMMARY.md provided enough context that no real "gray areas" required user input. Auto mode selected the recommended option for each decision point, all annotated below for audit.

### Authentication

| Decision | Options Considered | Selected | Rationale |
|----------|--------------------|----------|-----------|
| Login UX style | Single password input centered / multi-step / passwordless email | Single password input centered | Brief explicitly specifies this layout |
| Remember me toggle | Yes / No | No | Single shared password — JWT cookie persists implicitly |
| Login error UX | Inline below input / toast / redirect with query param | Inline below input | Server-rendered, accessible, no client JS |
| Logout placement | TopNav right / Footer / dropdown menu | TopNav right (text link) | Discoverable but unobtrusive |
| Logout implementation | Server action / API route + client | Server action | App Router idiomatic, no client component |
| Auth file structure | Two-file split (config + full) / single file | Two-file split | Required by Auth.js v5 + edge middleware |
| Defence in depth | Middleware only / middleware + auth() in components | Middleware + auth() | Mitigates CVE-2025-29927 |

### Design System

| Decision | Options Considered | Selected | Rationale |
|----------|--------------------|----------|-----------|
| Tailwind config style | `tailwind.config.ts` (v3) / `@theme {}` in CSS (v4) | `@theme {}` in CSS | Tailwind v4 idiom |
| Palette token form | CSS variables / Tailwind theme keys | CSS variables under `@theme {}` | v4 standard |
| Font weight set | All weights / 400+500 only | 400+500 only | Brief explicitly limits to two |
| Sans body font loading | `next/font/google` / self-host / system | `next/font/google` for Inter | Fast, automatic optimization |
| Serif body font for v1 | Webfont / system fallback | System fallback (Georgia) | Defer webfont to Phase 5 polish |

### Content Architecture

| Decision | Options Considered | Selected | Rationale |
|----------|--------------------|----------|-----------|
| Schema validation | TypeScript types only / Zod | Zod | Catches bad JSON at load time |
| Content loader scope | Per-component reads / single `lib/content.ts` | Single `lib/content.ts` | Architectural boundary in research |
| Bidirectional ref validation | Skip / runtime / on import | On module load | Fail loud if data is broken |
| Person ID format | UUID / sequential / kebab-case slug | Kebab-case slug (firstname-lastname) | Stable, readable, URL-safe |
| Photo storage | `/public/photos/` / Vercel Blob / S3 | `/public/photos/` for v1 | Volume small, no external service needed |
| Video source abstraction | Direct YouTube / abstracted source field | Abstracted (`source: youtube\|vimeo`) | Brief explicitly requires for Vimeo migration |
| Content revalidation | ISR / on-demand / static (commit + push) | Static | Simpler, correct for archive use case |

### Stub Content

| Decision | Options Considered | Selected | Rationale |
|----------|--------------------|----------|-----------|
| Stub people count | 0 / 2-3 / 10+ | 3 (William + child + grandchild) | Enough for loader validation, no premature data work |
| Stub photo count | 0 / 2-3 | 2-3 | Exercises grid empty state and populated state |
| Stub video count | 0 / 1-2 | 1-2 (with Rick Roll placeholder ID) | Validates VideoPlayer source switch in Phase 3 |

### Home Page

| Decision | Options Considered | Selected | Rationale |
|----------|--------------------|----------|-----------|
| Hero composition | Star + name + subtitle / image hero / minimal | Star + name + subtitle | Brief specifies, archival aesthetic |
| Section preview cards | Image cards / text-forward cards / minimal links | Text-forward cards | Image content not yet built; archival tone |
| Section count | 3 (tree, photos, films) / 4+ | 3 | Matches the four content types minus home |
| Background alternation | None / ivory section alternation | Ivory alternation | Brief specifies for visual rhythm |

### Deployment

| Decision | Options Considered | Selected | Rationale |
|----------|--------------------|----------|-----------|
| Initial deploy timing | After Phase 1 / after Phase 2 / after polish | After Phase 1 | Validates env vars + DNS early |
| Vercel deploy strategy | Auto on `main` push / manual | Auto on `main` push | Personal project, single dev |
| README scope | Minimal / setup + deploy / setup + deploy + content authoring | Setup + deploy + content authoring | Single dev needs to remember how to add a photo in 6 months |

## Deferred Ideas Captured

- Cormorant Garamond / EB Garamond webfont migration → Phase 5
- Photo lightbox → Phase 2
- Tree node photo thumbnails → Phase 4
- Search bar → Phase 6 (if gated in)
- Admin upload UI → v2 (out of scope)
- Person bio markdown rendering → defer until real bios written

## Notes

- No user prompts were issued (auto mode). All decisions follow the brief, research recommendations, or the most idiomatic Next.js 14 / Auth.js v5 / Tailwind v4 patterns.
- Five of the twelve research-flagged pitfalls are addressed in Phase 1 decisions: middleware-only auth bypass (D-06), wrong env var name (D-07), two-file auth split (D-05), Tailwind dynamic class purging (D-10), and Auth.js v4 tutorial trap (D-07/D-08).
- The relatives-tree multi-spouse bug (Pitfall #5) is NOT addressed here — it is a Phase 4 concern.
