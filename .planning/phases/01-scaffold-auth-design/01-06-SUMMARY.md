---
plan: 01-06
phase: 01-scaffold-auth-design
status: complete (deploy deferred)
completed: 2026-04-29
duration: 25 min
---

# Plan 01-06 Summary — Home page + README + Vercel deploy

## What shipped

**Task 1 (autonomous, complete):**
- `components/home/Hero.tsx` — Server Component, centered StarMark size=36 + serif "The Curry Family" h1 + muted serif subtitle on white background
- `components/home/SectionPreview.tsx` — Server Component, 3 text-forward cards on ivory background linking to `/tree`, `/photographs`, `/films`
- `app/(protected)/page.tsx` — composes both Hero and SectionPreview
- `README.md` — full developer docs: setup, env var generation, content authoring, deploy notes

**Task 2 (deploy, deferred to user):**
- Code is pushed to [github.com/Hierophantra/agewish-curry_family](https://github.com/Hierophantra/agewish-curry_family) on `main`
- Vercel project creation, env var configuration, and DNS setup deferred — user will complete manually when ready
- All env vars and deployment steps documented in README.md

## Verification

Local verification at `http://localhost:59313` confirmed all 5 ROADMAP success criteria pass:

1. ✓ Family member can visit site → redirected to `/login` → enter password → reach home page
2. ✓ Direct visit to `/tree` while logged out → `/login?callbackUrl=...%2Ftree`, redirects back after login
3. ✓ Home page displays AgeWish star (36px gold), serif "The Curry Family" navy h1, 3 section preview cards
4. ✓ TopNav and Footer render on every protected page; star motif appears exactly 3 times per page (nav + hero + footer)
5. ✓ Content loader (`lib/content.ts`) reads JSON, validates with Zod, stub data accessible (verified via `npm run build` succeeds with build-time validation)

Sign out works (form POST → `signOut()` → redirect to `/login`). Auth gate works (middleware + `auth()` in protected layout, defence in depth against CVE-2025-29927).

## Bugs caught and fixed during verification

**1. Dead `app/page.tsx` shadowed home page** (commit `870ed24`)
- A temporary placeholder from Plan 01-01 was never deleted when `(protected)/page.tsx` was added in Plan 01-04
- Both routes resolved to `/`, and Next.js served the placeholder ("Setting up...") instead of the home page
- **Fix:** Deleted `app/page.tsx`. Plan 01-01's planner should have included this cleanup as a follow-up task.

**2. `@next/env` mangles bcrypt hashes via dotenv-expand** (commit `870ed24`)
- bcrypt hashes contain `$` characters (e.g., `$2b$10$F2x7R9...`) which `dotenv-expand` treats as variable references
- Single quotes do NOT prevent this — only backslash escapes do
- **Fix:** Documented backslash-escape requirement in README.md and `.env.local.example`. Vercel's env UI does NOT run dotenv-expand, so the raw hash works there.

Both bugs are documented for future executors.

## Files created/modified

| Path | Change |
|------|--------|
| `components/home/Hero.tsx` | Created |
| `components/home/SectionPreview.tsx` | Created |
| `app/(protected)/page.tsx` | Created |
| `README.md` | Created, then updated with dotenv-expand caveat |
| `.env.local.example` | Updated with dotenv-expand caveat |
| `app/page.tsx` | Deleted (dead placeholder) |

## Commits

- `9b8df22` — feat(01-06): build home page (Hero + SectionPreview) and README
- `870ed24` — fix(01-06): remove dead app/page.tsx and document bcrypt hash escaping

## Deferred to user

The Vercel deployment (Task 2) is deferred. When the user is ready:
1. Import repo at vercel.com/new
2. Set `AUTH_SECRET` and `AUTH_PASSWORD_HASH` env vars (raw hash, no backslashes on Vercel)
3. Deploy
4. Add `curry.agewish.com` custom domain + CNAME

Phase 1 is **functionally complete locally**. The only remaining requirement (FOUND-04: deploys cleanly to Vercel) is deferred but unblocked — code is on GitHub, env values are generated, README documents the steps.

## Requirements covered

FOUND-01, FOUND-02, FOUND-03, FOUND-05, HOME-01, HOME-02, HOME-03 — verified locally.
FOUND-04 (Vercel deploy) — deferred but unblocked, all prerequisites complete.
