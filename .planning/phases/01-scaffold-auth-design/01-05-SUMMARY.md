---
phase: 01-scaffold-auth-design
plan: "05"
subsystem: navigation-and-auth-ui
tags:
  - topnav
  - footer
  - login
  - server-action
  - client-island
  - auth

dependency_graph:
  requires:
    - "01-04"  # StarMark component + route group layouts
    - "01-02"  # auth.ts signIn/signOut exports
    - "01-03"  # lib/utils.ts cn() utility
    - "01-01"  # globals.css Tailwind tokens (text-navy, text-muted, hairline, etc.)
  provides:
    - TopNav with Sign out server action
    - NavTabs client island with usePathname active state
    - Footer with StarMark and tagline
    - Login page with inline error and autoFocus
    - Protected layout wired with real TopNav/Footer (no more TODO stubs)
  affects:
    - "01-06"  # Home page hero (3rd StarMark appearance)

tech_stack:
  added: []
  patterns:
    - Server Component with inline server action (TopNav/handleSignOut)
    - Client island for usePathname (NavTabs)
    - searchParams error state in Server Component (login page)
    - AuthError catch + NEXT_REDIRECT re-throw pattern
    - autoFocus via HTML attribute (no client JS needed)

key_files:
  created:
    - components/layout/NavTabs.tsx
    - components/layout/TopNav.tsx
    - components/layout/Footer.tsx
    - app/(auth)/login/page.tsx
  modified:
    - app/(protected)/layout.tsx

decisions:
  - NavTabs uses text-muted (not text-text-muted) — token naming resolution from Plan 01-01
  - Login error redirects to /login?error=CredentialsSignin — error surfaced via searchParams, not session
  - callbackUrl defaults to '/' if absent — Auth.js validates same-origin on redirectTo
  - autoFocus via HTML attribute only — no useEffect island needed for initial page load
  - Footer tagline copy: "A private family archive" — tasteful, archival tone

metrics:
  duration: "94s"
  completed: "2026-04-29"
  tasks_completed: 2
  tasks_total: 2
  files_created: 4
  files_modified: 1
---

# Phase 1 Plan 05: TopNav + NavTabs + Footer + Login Page Summary

**One-liner:** Navigation shell (TopNav server component with NavTabs client island, Footer) and login page with AuthError catch + NEXT_REDIRECT re-throw using searchParams error state.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | TopNav, NavTabs, Footer | 6d5a16a | components/layout/{TopNav,NavTabs,Footer}.tsx |
| 2 | Login page + protected layout wired | d48aa73 | app/(auth)/login/page.tsx, app/(protected)/layout.tsx |

## What Was Built

### TopNav (components/layout/TopNav.tsx)
Server Component. Brand mark left (StarMark size=14 + "The Curry Family" serif text), NavTabs client island center/right, Sign out far right as a form with an inline `'use server'` action calling `signOut({ redirectTo: '/login' })`. No client JS required for logout.

### NavTabs (components/layout/NavTabs.tsx)
`'use client'` island. Uses `usePathname()` to detect active tab. Home tab: exact match (`pathname === '/'`). Others: prefix match (`pathname.startsWith(tab.href)`). Active styling: `text-navy border-b hairline-emphasis border-gold`. Inactive: `text-muted hover:text-navy`. No font-bold or font-semibold — two-weight rule enforced.

### Footer (components/layout/Footer.tsx)
Server Component. Centered StarMark size=20, serif tagline "A private family archive", muted "The Curry Family" metadata line. Star motif count: TopNav (1) + Footer (1) = 2 from chrome. Hero (Plan 06) will add the 3rd.

### Login page (app/(auth)/login/page.tsx)
Server Component. StarMark size=36, serif "The Curry Family" heading, autoFocus password input, navy "Enter" button. Server action `handleLogin` catches `AuthError` and redirects to `/login?error=CredentialsSignin` — re-throws all other errors (critical: `NEXT_REDIRECT` must propagate). Error state read from `searchParams.error` — shows inline "That password isn't right." when present.

### Protected layout update (app/(protected)/layout.tsx)
Replaced TODO stub comments with real `import TopNav` and `import Footer`. `await auth()` gate preserved. Layout shell: `<TopNav /> <main className="flex-1">{children}</main> <Footer />`.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. All components have real implementations. The login error message ("That password isn't right.") is intentionally generic per D-02 / T-05-01 threat model — this is correct behavior, not a stub.

## Threat Flags

No new security surface introduced beyond the plan's threat model. T-05-01 through T-05-04 all implemented as specified:
- T-05-01: Generic error text prevents information leakage
- T-05-02: callbackUrl defaults to '/' and is passed to Auth.js which validates same-origin
- T-05-03: signOut accepted (CSRF protection via Next.js server actions)
- T-05-04: `throw err` after AuthError check ensures NEXT_REDIRECT propagates

## Self-Check: PASSED

Files exist:
- components/layout/TopNav.tsx: FOUND
- components/layout/NavTabs.tsx: FOUND
- components/layout/Footer.tsx: FOUND
- app/(auth)/login/page.tsx: FOUND
- app/(protected)/layout.tsx: FOUND (modified)

Commits exist:
- 6d5a16a: FOUND
- d48aa73: FOUND

Build: `npm run build` exits 0. All 9 pages generated.
