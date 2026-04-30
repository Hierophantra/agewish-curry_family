---
phase: 1
phase_slug: scaffold-auth-design
created: 2026-04-29
---

# Phase 1 Validation Strategy

## Approach

Phase 1 is a greenfield scaffold. There is no existing test infrastructure, and adding a full Jest/Playwright setup is deferred to Phase 5 polish. Validation for Phase 1 uses a **three-layer approach**:

1. **`npm run build`** — primary automated gate (cheap, fast, comprehensive)
2. **Per-task grep acceptance criteria** — every task in every plan has verifiable acceptance criteria using grep, file reads, or command output checks
3. **Human-verify checkpoint at deploy** — Plan 01-06 Task 2 is the human-confirmed acceptance gate covering the auth flow end-to-end

This pragmatic approach trades automated test coverage for execution speed, with the trade-off being explicit and time-bounded (Phase 5 adds proper tests if needed).

## Layer 1 — `npm run build` Coverage

`npm run build` validates more than it appears to:

| Concern | What `npm run build` catches | Coverage |
|---------|------------------------------|----------|
| TypeScript types | Strict mode compilation across all `.ts`/`.tsx` files | FOUND-01 |
| Zod schemas | Build-time JSON parsing of `family.json`, `photos.json`, `videos.json` via the content loader (server components evaluate these at build) | CONT-04, CONT-06 (bidirectional ref validation throws on broken refs) |
| Tailwind purge | Static class extraction; missing token utilities cause unstyled output (visible in build manifest) | DESIGN-01, DESIGN-10 |
| Auth two-file split | Edge runtime build of `middleware.ts` fails if `auth.ts` is imported (pulls Node modules into edge) | AUTH-03 |
| Route group structure | Next.js validates `(auth)` and `(protected)` layouts compile | FOUND-03 |
| next/font load | Inter font fetch and CSS injection validated at build | DESIGN-02 |

**Gate command:** `npm run build`
**Pass criterion:** Exit code 0
**Fail mode:** Build error printed; executor halts and surfaces to user.

## Layer 2 — Per-Task Acceptance Criteria

Every task in every Phase 1 plan has a `<acceptance_criteria>` block with grep-verifiable conditions. The executor checks these after each task completes and surfaces failures immediately. Examples:

- Plan 01-01 Task 1: `grep -c "next.*14.2.35" package.json` returns `1`
- Plan 01-02 Task 2: `grep -c "from './auth'" middleware.ts` returns `0` (only auth.config import allowed)
- Plan 01-03 Task 1: `grep -c "z.string().regex" lib/types.ts` returns ≥ `3` (Person, Photo, Video schemas)
- Plan 01-01 Task 1: `ls tailwind.config.ts 2>&1 | grep -c "No such"` returns `1` (file does NOT exist)

These task-level checks are the primary functional validation for the implementation.

## Layer 3 — Human-Verify Checkpoint

Plan 01-06 Task 2 (the deployment task) is `autonomous: false` and includes a human-verify checklist:

1. Visit `https://curry.agewish.com` — site loads
2. Submitting wrong password shows inline error
3. Submitting correct password redirects to home
4. Home page renders with star + "The Curry Family" + 3 section preview cards
5. Direct visit to `/tree` while logged out redirects to `/login` with callback
6. After login, redirect returns to `/tree` placeholder
7. Sign out link in TopNav signs out and redirects to `/login`
8. Star motif appears exactly 3 times per page (TopNav + hero + footer on home)
9. All headings are sentence case (no Title Case in nav, hero, or section preview cards)
10. Tree, Photographs, Films placeholder pages render with eyebrow + heading

This checkpoint covers all 5 ROADMAP success criteria. Failures here block phase completion regardless of build status.

## Phase 1 Requirements → Validation Map

| Req ID | Validation Layer | Specific Check |
|--------|------------------|----------------|
| FOUND-01 | Layer 1 | `npm run build` succeeds with TypeScript strict |
| FOUND-02 | Layer 2 | grep package.json for each library at correct version |
| FOUND-03 | Layer 2 | `find app -type d` matches expected route group structure |
| FOUND-04 | Layer 3 | curl on production URL returns HTML |
| FOUND-05 | Layer 2 | `test -f README.md && grep -c "## Setup" README.md` |
| AUTH-01 | Layer 3 | Manual login flow with correct password |
| AUTH-02 | Layer 2 | grep `bcrypt.compare` in `auth.ts` |
| AUTH-03 | Layer 1 + Layer 2 | edge build succeeds + grep middleware imports |
| AUTH-04 | Layer 2 | grep `await auth()` in `(protected)/layout.tsx` |
| AUTH-05 | Layer 3 | Manual: visit /tree without session → /login redirect |
| AUTH-06 | Layer 3 | Manual: click Sign out from any protected page |
| AUTH-07 | Layer 2 | grep `AUTH_SECRET` and `AUTH_PASSWORD_HASH` in `.env.local.example` |
| DESIGN-01 | Layer 1 | Tailwind purge during build extracts `text-navy`, `bg-ivory`, etc. |
| DESIGN-02 | Layer 2 | grep `next/font/google` in app/layout.tsx + grep Georgia fallback |
| DESIGN-03 | Layer 2 | grep `font-weight-normal\|font-weight-medium` in globals.css; ensure no `font-weight-semibold\|bold` |
| DESIGN-04 | Layer 2 | grep `<svg` in `components/ui/StarMark.tsx`; size prop default checks |
| DESIGN-05 | Layer 2 | grep `letter-spacing: 0.22em` in eyebrow utility |
| DESIGN-06 | Layer 3 | Visual check during human verify |
| DESIGN-07 | Layer 2 | grep `0.5px` and `1.25px` border definitions |
| NAV-01..04 | Layer 3 | Visual check + StarMark count check (`grep -c "<StarMark" app/(protected)/layout.tsx`) |
| CONT-01 | Layer 2 | `ls content/family.json content/photos.json content/videos.json` |
| CONT-02..06 | Layer 1 | Build-time Zod validation runs on all stub JSON |
| CONT-07 | Layer 2 | `jq '.people \| length' content/family.json` returns ≥ 2 |
| HOME-01..03 | Layer 3 | Visual check during human verify |

## Wave 0 Gaps (deferred to Phase 5)

The following requirements would benefit from automated tests but are validated via Layer 3 in Phase 1:

- AUTH-01 (full login flow) — could have e2e Playwright test in Phase 5
- DESIGN-06 (sentence case enforcement) — could have lint rule in Phase 5
- HOME-01..03 (visual rendering) — could have visual regression test in Phase 5
- NAV-04 (star motif count = 3 per page) — could have automated DOM check in Phase 5

These are **knowingly deferred**, not missed. Phase 5 polish will revisit if real bugs emerge.

## Validation Acceptance

Phase 1 is **validated** when:

- [ ] `npm run build` exits 0 (Layer 1)
- [ ] All task acceptance criteria pass per executor reports (Layer 2)
- [ ] Plan 01-06 Task 2 human checkpoint completes with all 10 items confirmed (Layer 3)

Phase 1 is **NOT** validated by:
- The absence of automated test files
- The lack of CI configuration (added in later phase if scoped)
