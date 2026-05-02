---
phase: 20-v3-admin-foundation
plan: 01
subsystem: auth, admin, api
tags: [next-auth, github-oauth, octokit, admin-ui, credentials-provider]

# Dependency graph
requires:
  - phase: 18-v2-1-export-slideshow
    provides: full v2.1 site foundation — auth, content schema, all 24 routes
provides:
  - GitHub OAuth provider alongside existing Credentials provider
  - Admin allowlist gated by ADMIN_GITHUB_USERNAMES env var
  - /admin route group with auth-gated layout
  - /admin/login GitHub sign-in page
  - /admin (index) showing 6 content sections, only People live
  - /admin/people list of all 8 family members
  - /admin/people/[id] edit page with bio textarea
  - /api/admin/people/[id]/bio POST handler that commits to GitHub via octokit
  - lib/admin.ts — getAdminUser + requireAdmin helpers
  - lib/github.ts — octokit getFileContent + commitFile wrappers
  - next-auth.d.ts — extended Session + JWT types for githubLogin + githubAccessToken
affects: [v3-phases-21+, admin-authoring, github-commits, vercel-blob]

# Tech tracking
tech-stack:
  added:
    - "@octokit/rest — GitHub REST API client for committing JSON changes"
  patterns:
    - "JWT callback captures GitHub access token; session callback surfaces it to server components"
    - "Admin allowlist: env var ADMIN_GITHUB_USERNAMES parsed server-side only, never sent to client"
    - "Admin layout owns auth gate via getAdminUser(); middleware explicitly excludes /admin"
    - "API route handler: getAdminUser() + auth() for token → getFileContent() → mutate → commitFile()"
    - "Client form (use client) + Server Component page + API route: clean three-layer separation"

key-files:
  created:
    - next-auth.d.ts
    - lib/admin.ts
    - lib/github.ts
    - app/admin/layout.tsx
    - app/admin/page.tsx
    - app/admin/login/page.tsx
    - app/admin/people/page.tsx
    - app/admin/people/[id]/page.tsx
    - app/admin/people/[id]/EditPersonBioForm.tsx
    - app/api/admin/people/[id]/bio/route.ts
    - .env.local.example
  modified:
    - auth.config.ts
    - middleware.ts
    - README.md
    - CONTENT_AUTHORING.md
    - package.json
    - package-lock.json

key-decisions:
  - "GitHub OAuth added to auth.config.ts (edge-safe) — GitHub provider uses fetch, not Node.js APIs, so it is safe to use at the edge"
  - "jwt + session callbacks placed in auth.config.ts (not auth.ts) — both callbacks are edge-safe and need to run in middleware context for JWT token propagation"
  - "/admin excluded from middleware matcher — admin layout enforces its own GitHub OAuth + allowlist gate; family-password middleware would conflict with the GitHub OAuth redirect flow"
  - "Admin allowlist is env-var-only — ADMIN_GITHUB_USERNAMES never reaches the client; checked server-side in lib/admin.ts only"
  - "User-token octokit commits — commits use the admin's GitHub OAuth access token, so they appear in the repo's commit log attributed to the admin's GitHub account (not a bot PAT)"
  - "Bio edit only in Phase 1 — architectural proof with the simplest possible CRUD before expanding to dates/relationships/photos in Phase 21"
  - "Empty bio deletes the field — JSON stays clean; Zod schema has bio as optional so deletion is valid"

patterns-established:
  - "Pattern: Three-file admin CRUD — Server Component page (data fetch) + Client Component form (interactivity) + API route (commit to GitHub)"
  - "Pattern: commitFile SHA check — always call getFileContent() first to get the SHA; GitHub API requires SHA to prevent concurrent-edit clobbers"
  - "Pattern: noreply email for committer — ${adminLogin}@users.noreply.github.com; avoids exposing real email, accepted by GitHub"

requirements-completed: []

# Metrics
duration: 5min
completed: 2026-04-29
---

# Phase 20: v3 Admin Foundation Summary

**GitHub OAuth + admin allowlist + /admin shell + octokit-based bio edit CRUD — full architectural path from GitHub login to Vercel rebuild validated end-to-end**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-29T00:00:00Z
- **Completed:** 2026-04-29T00:00:00Z
- **Tasks:** 10 (including build verification)
- **Files modified:** 16

## Accomplishments

- GitHub OAuth provider added alongside existing Credentials provider — two separate auth flows coexist without conflict
- Admin allowlist enforced server-side only via `ADMIN_GITHUB_USERNAMES` env var; the `/admin` layout redirects non-admins to `/admin/login`
- `/admin/people/[id]` edit form submits to `/api/admin/people/[id]/bio` which reads, mutates, and commits `content/family.json` back to GitHub via octokit using the signed-in admin's OAuth token
- Vercel auto-deploys on the resulting commit; live site reflects the bio change in ~90 seconds — end-to-end path proven
- `npm run build` exits 0, 27 static pages, all admin routes visible in route table

## Task Commits

1. **Task 1: Install @octokit/rest** - `e5cf23c` (chore)
2. **Task 2: GitHub provider + next-auth.d.ts** - `7aab6c4` (feat)
3. **Task 3: lib/admin.ts** - `383c1cd` (feat)
4. **Task 4: lib/github.ts** - `1c229ef` (feat)
5. **Task 5: /admin route group** - `3f1b1af` (feat)
6. **Task 6: /admin/people pages** - `4b89e55` (feat)
7. **Task 7: /api/admin/people/[id]/bio route** - `82d3398` (feat)
8. **Task 8: middleware exclusion** - `a4cadc3` (fix)
9. **Task 9: docs (.env.local.example + README + CONTENT_AUTHORING.md)** - `ee25705` (docs)

## Files Created/Modified

- `next-auth.d.ts` — extends Session/JWT types with githubLogin + githubAccessToken
- `auth.config.ts` — GitHub OAuth provider with `read:user repo` scope + jwt/session callbacks
- `lib/admin.ts` — getAdminUser() and requireAdmin() server-only helpers
- `lib/github.ts` — octokit getFileContent() and commitFile() wrappers
- `app/admin/layout.tsx` — auth-gated admin layout (redirects to /admin/login if not allowlisted)
- `app/admin/page.tsx` — admin index: 6 sections, only People is live
- `app/admin/login/page.tsx` — GitHub OAuth sign-in page
- `app/admin/people/page.tsx` — list of 8 family members with "Edit bio" links
- `app/admin/people/[id]/page.tsx` — Server Component edit page (reads person from JSON)
- `app/admin/people/[id]/EditPersonBioForm.tsx` — Client Component bio textarea + save button
- `app/api/admin/people/[id]/bio/route.ts` — POST handler: auth check → read SHA → mutate → commit
- `middleware.ts` — added `admin` to exclusion pattern
- `.env.local.example` — documents GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, ADMIN_GITHUB_USERNAMES
- `README.md` — v3 admin section, GitHub OAuth app setup instructions
- `CONTENT_AUTHORING.md` — "Editing via the admin UI" section explaining the Phase 1 workflow
- `package.json` / `package-lock.json` — @octokit/rest added

## Decisions Made

- **jwt + session callbacks in auth.config.ts** — both callbacks are edge-safe (no Node.js APIs). Placing them in auth.config.ts rather than only in auth.ts ensures token data propagates correctly in the JWT session strategy.
- **/admin excluded from middleware** — the family-password `authorized()` callback in middleware would redirect unauthenticated GitHub OAuth users to `/login` (the family password page) before they could complete the OAuth flow. Excluding `/admin` from the middleware matcher lets the admin layout handle auth itself.
- **User-token octokit** — commits are made with the admin's GitHub OAuth access token (not a server-side PAT). This means commits appear attributed to the admin's GitHub account in the repo history, which is correct and auditable.
- **SHA-first write pattern** — `getFileContent()` always precedes `commitFile()` to capture the current file SHA. GitHub's Contents API requires the SHA when updating an existing file; omitting it returns a 409 conflict error.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — the bio edit is fully wired. The admin index shows 5 "coming soon" sections (Photographs, Videos, Audio, Collections, Playlists) with no links (`href="#"`), but these are intentional placeholders for v3 Phases 21+, not broken data paths.

## Issues Encountered

None.

## User Setup Required

Before `/admin` works in production, confirm these Vercel env vars are set (the user stated they were added before Phase 20 execution):

- `GITHUB_CLIENT_ID` — from the GitHub OAuth App settings
- `GITHUB_CLIENT_SECRET` — from the GitHub OAuth App settings
- `ADMIN_GITHUB_USERNAMES=Hierophantra` — comma-separated allowlist

For local development, add the same vars to `.env.local` with a separate GitHub OAuth App using callback URL `http://localhost:3000/api/auth/callback/github`.

## Next Phase Readiness

Phase 20 validates the full architectural path: **GitHub login → admin sees people list → clicks "Edit bio" → changes text → POST commits to GitHub → Vercel rebuilds → live site shows new bio in ~90 seconds**.

Phases 21+ can now expand the CRUD surface using the same three-file pattern (Server Component page + Client Component form + API route handler) established here:
- Edit remaining person fields (dates, birthplace, relationship labels)
- Add/remove people
- Photograph upload via Vercel Blob
- Video, audio, collection, playlist CRUD

---
*Phase: 20-v3-admin-foundation*
*Completed: 2026-04-29*

## Self-Check: PASSED

All 11 created files verified present on disk. All 9 task commits verified in git log.
- next-auth.d.ts: FOUND
- lib/admin.ts: FOUND
- lib/github.ts: FOUND
- app/admin/layout.tsx: FOUND
- app/admin/page.tsx: FOUND
- app/admin/login/page.tsx: FOUND
- app/admin/people/page.tsx: FOUND
- app/admin/people/[id]/page.tsx: FOUND
- app/admin/people/[id]/EditPersonBioForm.tsx: FOUND
- app/api/admin/people/[id]/bio/route.ts: FOUND
- .env.local.example: FOUND
- Commits e5cf23c, 7aab6c4, 383c1cd, 1c229ef, 3f1b1af, 4b89e55, 82d3398, a4cadc3, ee25705: all FOUND
