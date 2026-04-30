# Phase 1: Scaffold + Auth Gate + Design System — Research

**Researched:** 2026-04-29
**Domain:** Next.js 14 App Router, Auth.js v5 Credentials, Tailwind CSS v4, Vercel DNS
**Confidence:** HIGH

---

## Summary

Phase 1 establishes four load-bearing contracts that every subsequent phase depends on: the auth
two-file split, the Tailwind v4 token set, the Zod-validated content loader, and the person slug
format. All four are irreversible without rework — get them right in this phase.

The biggest implementation risk is the Auth.js v5 two-file split. The pattern is well-documented
but the failure mode (importing `auth.ts` in `middleware.ts`) causes a silent build failure or
edge-runtime crash that is hard to trace. The key rule: `middleware.ts` imports ONLY from
`auth.config.ts`, never from `auth.ts`. The bcryptjs hash comparison lives exclusively in `auth.ts`
because bcryptjs has Node.js dependencies that cannot run in the edge runtime.

Tailwind v4 uses a CSS-first configuration approach. There is no `tailwind.config.ts`. All tokens
are defined in `globals.css` under `@theme {}`. The `@tailwindcss/postcss` PostCSS plugin replaces
the v3 `tailwindcss` PostCSS plugin — they are different packages. The `create-next-app` scaffold
at v14 installs Tailwind v3 by default; the v4 packages must be installed manually after
scaffolding.

**Primary recommendation:** Scaffold with `create-next-app@14`, then manually replace the Tailwind
v3 PostCSS setup with `@tailwindcss/postcss`, install `next-auth@beta` (5.0.0-beta.31), and write
the auth two-file split before touching any component files.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01 through D-08 (Authentication):**
- Login UX: single password field, white background, AgeWish star above, serif heading, navy button
- Error: inline message below field, generic copy ("That password isn't right"), server-rendered
- Auto-focus password input on mount
- Logout: "Sign out" text link in TopNav, server action form POST + `signOut()` + redirect to /login
- Two-file split mandatory: `auth.config.ts` edge-safe (no bcryptjs), `auth.ts` full; middleware
  imports ONLY from `auth.config.ts`
- Defence in depth: every Server Component under `(protected)` calls `await auth()` independently
- Env vars: `AUTH_SECRET` and `AUTH_PASSWORD_HASH` only; do NOT set `NEXTAUTH_SECRET`,
  `NEXTAUTH_URL`, or `AUTH_URL`
- Session: JWT, cookie-based, 30-day expiry

**D-09 through D-15 (Design System):**
- Tailwind v4 CSS-first: palette in `globals.css` `@theme {}` block, NO `tailwind.config.ts`
- Palette tokens: navy #1F2D5C, gold #E8A91F, gold-deep #B8851A, ivory #FBF9F2, border #E2DFD5,
  stone #C9C4B0, text-muted #6B6960, text-quiet #8B8778
- Typography: Georgia fallback for serif headings (v1), Inter 400+500 only via next/font/google
- Two-weight rule: only font-weight 400 and 500; no font-semibold (600) or font-bold (700)
- Sentence case everywhere; eyebrows use `.eyebrow` utility (uppercase + 0.22em letter-spacing)
- Hairlines: 0.5px for default, 1.25px for emphasis; defined as `.hairline`/`.hairline-emphasis`
- Section padding: py-11 px-7 mobile, scale up at md: breakpoint; hero pt-15 pb-12

**D-16 through D-17 (StarMark):**
- Server Component inline SVG, `size` prop in px, optional `className`
- Default sizes: 14px (nav), 36px (hero), 20px (footer)
- Exactly 3 stars per page (TopNav, Hero, Footer) — non-negotiable

**D-18 through D-20 (Navigation):**
- TopNav: Server Component, `<NavTabs />` Client island for usePathname() active state
- Active tab: border-b-1.25 border-gold + text-navy
- Footer: Server Component, centered StarMark, serif tagline, date metadata in muted color

**D-21 through D-28 (Content Architecture):**
- Folder layout locked (see D-21 for exact paths)
- Types derived from Zod schemas via `z.infer<>`
- Four content functions: getPeople(), getPhotos(), getVideos(), getPersonById(id)
- Bidirectional reference validator at module load
- Person ID: kebab-case slug (e.g., william-curry), stable forever
- Photos in /public/photos/ (v1)
- Video shape: source "youtube"|"vimeo", sourceId string
- No ISR; build-time static reads only

**D-29 through D-31 (Stub Content):**
- family.json: 3 people (William Curry grandfather, child, grandchild)
- photos.json: 2-3 entries with placeholder filenames
- videos.json: 1-2 entries with Rick Roll ID (dQw4w9WgXcQ)

**D-32 through D-34 (Home Page):**
- Hero: centered StarMark 36px, serif "The Curry Family" ~64px desktop, serif subtitle muted
- Section previews: 3 text cards in row (mobile: stack), section name + 1-line + "→" link
- Ivory alternation: bg-white hero / bg-ivory section previews

**D-35 through D-37 (Deployment):**
- Vercel, main branch is production, auto-deploy on push
- README.md with local setup, hash generation, content authoring, deploy notes

### Claude's Discretion

- Exact serif typography weight/sizing — pick visually pleasing defaults
- Exact hero subtitle copy — propose a tasteful one-liner
- Exact star SVG path data — generate 7-pointed star programmatically if /public/brand/star.svg
  not available
- Login page micro-spacing
- Placeholder image strategy for stub photos

### Deferred Ideas (OUT OF SCOPE)

- Cormorant Garamond / EB Garamond webfont — Phase 5
- Real family content
- Search bar in TopNav — Phase 6
- Admin upload UI — v2
- Person bio markdown rendering — v2
- Photo lightbox — Phase 2
- Tree node photo thumbnail — Phase 4

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOUND-01 | Next.js 14.2.35, TypeScript strict, Tailwind v4 | create-next-app@14 + manual Tailwind v4 install |
| FOUND-02 | All libraries at correct versions | npm install commands documented below |
| FOUND-03 | Folder structure: route groups (auth)/(protected), /components/, /content/, /lib/, /public/ | Route group layout patterns documented |
| FOUND-04 | Deploys cleanly to Vercel from main branch | Vercel auto-deploys Next.js; env var setup documented |
| FOUND-05 | README.md with local setup, env vars, content authoring | README template in Code Examples |
| AUTH-01 | User can authenticate with shared family password | Credentials provider + bcryptjs pattern documented |
| AUTH-02 | Auth.js v5 Credentials provider with bcryptjs | authorize() callback pattern documented with exact code |
| AUTH-03 | Two-file split: auth.config.ts (edge-safe) + auth.ts (full) | Both file shapes documented with exact code |
| AUTH-04 | (protected) routes gated by middleware AND auth() in layout | Defence-in-depth pattern documented |
| AUTH-05 | Unauthenticated requests redirect to /login; JWT cookie | middleware.ts authorized callback pattern documented |
| AUTH-06 | User can log out from any protected page | signOut() server action form pattern documented |
| AUTH-07 | AUTH_SECRET and AUTH_PASSWORD_HASH in Vercel (all 3 envs) | Generation commands and Vercel setup documented |
| DESIGN-01 | Tailwind v4 @theme {} palette tokens | Complete @theme block documented |
| DESIGN-02 | Serif headings (Georgia) + Inter body | next/font/google + @theme font tokens documented |
| DESIGN-03 | Only weights 400 and 500 | @theme font-weight tokens + next/font weights array documented |
| DESIGN-04 | StarMark 7-pointed gold star inline SVG | 7-point star geometry documented, SVG path logic |
| DESIGN-05 | Uppercase + 0.22em eyebrow metadata | @utility .eyebrow documented |
| DESIGN-06 | Sentence case everywhere | Convention only; no code implementation needed |
| DESIGN-07 | Hairlines at 0.5px and 1.25px | @utility .hairline pattern documented |
| NAV-01 | TopNav with brand mark + tabs on every protected page | Server Component + NavTabs Client island pattern |
| NAV-02 | Active tab: gold underline + navy text | usePathname() in NavTabs Client island |
| NAV-03 | Footer with AgeWish star + serif tagline | Server Component pattern |
| NAV-04 | Star motif exactly 3 times per page | Convention; TopNav + (protected)/layout.tsx hero slot + Footer |
| CONT-01 | JSON files in /content/ | File structure documented |
| CONT-02 | TypeScript types from Zod schemas via z.infer | Zod schema patterns documented |
| CONT-03 | lib/content.ts is sole access point | Loader pattern documented |
| CONT-04 | Zod validation at load time | Zod .parse() + throw pattern documented |
| CONT-05 | Person id is kebab-case slug | Convention locked in D-25 |
| CONT-06 | Bidirectional reference validation | Validator function pattern documented |
| CONT-07 | Stub data 2-3 entries per content type | Stub JSON shapes documented |
| HOME-01 | Hero: star + serif "The Curry Family" | JSX pattern documented |
| HOME-02 | Preview sections for tree, photographs, films | Three-card grid pattern |
| HOME-03 | Ivory section alternation | bg-white / bg-ivory alternation pattern |

</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Auth session validation | Edge (middleware) | Node.js (Server Component layout) | Edge = fast UX redirect; Server Component = defence in depth (CVE-2025-29927) |
| Password hash comparison | Node.js (Server, auth.ts) | — | bcryptjs has Node.js APIs; must NOT run at edge |
| JWT cookie issue/verify | Edge (middleware via auth.config.ts) | Node.js (auth.ts handlers) | JWT verify is edge-compatible; bcrypt comparison is not |
| Content loading | Node.js (Server Components) | — | fs.readFileSync; cannot run at edge or client |
| Zod validation | Node.js (Server Components, build time) | — | lib/content.ts is server-only |
| UI rendering (auth gate) | Browser (React hydration) | Node.js (SSR) | Login form auto-focus requires client hydration |
| Inter font loading | CDN (self-hosted by Next.js) | — | next/font/google self-hosts; no Google CDN at runtime |
| StarMark SVG | Server (RSC) | — | Inline SVG; no JS, no interactivity needed |
| TopNav active state | Client (NavTabs island) | Server (TopNav shell) | usePathname() is client-only hook |
| Static JSON reads | Node.js build-time | — | fs.readFileSync bakes into build output |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | `14.2.35` | Full-stack React framework | Pinned; latest 14.x security patch [VERIFIED: npm registry] |
| next-auth | `5.0.0-beta.31` | Auth.js v5 — Credentials provider, middleware | Only version with first-class Next.js 14 App Router support [VERIFIED: npm registry] |
| tailwindcss | `4.2.4` | Utility-first CSS with CSS-first config | v4 is current stable for greenfield projects [VERIFIED: npm registry] |
| @tailwindcss/postcss | `4.2.4` | PostCSS bridge for Tailwind v4 + Next.js | Required shim; v4 no longer uses `tailwindcss` as PostCSS plugin [VERIFIED: tailwindcss.com/docs] |
| zod | `3.x (latest: 3.x)` | Runtime JSON schema validation | Standard typed-loader pattern in Next.js ecosystem [ASSUMED] |
| bcryptjs | `^2.4.3` | Pure-JS password hash comparison | Edge-safe; no native binaries needed [ASSUMED — confirmed by prior project research] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx | `2.1.1` | Conditional class merging | Anywhere conditional Tailwind classes are applied [VERIFIED: npm registry] |
| tailwind-merge | `3.5.0` | Resolve conflicting Tailwind classes | Use with clsx in a `cn()` utility [VERIFIED: npm registry] |
| @types/bcryptjs | latest | TypeScript types for bcryptjs | devDependency alongside bcryptjs |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| next-auth@beta | Lucia, Clerk | Lucia deprecated 2024; Clerk adds cost/complexity for single-password site |
| bcryptjs | native bcrypt, argon2 | Native bcrypt requires build toolchain; argon2 not supported in all Vercel environments |
| Tailwind v4 | Tailwind v3 | v3 is legacy; no reason to use for greenfield project |
| CSS-first @theme | tailwind.config.ts | v4 CSS-first is the correct approach per official docs; JS config file is not used in v4 |

### Installation

```bash
# 1. Scaffold with Next.js 14 (installs Tailwind v3 by default — we replace it below)
npx create-next-app@14 curry-family \
  --typescript \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*"

# 2. Replace Tailwind v3 with v4
npm uninstall tailwindcss postcss autoprefixer
npm install tailwindcss@4 @tailwindcss/postcss@4 postcss

# 3. Auth.js v5 (beta intentional — production-hardened)
npm install next-auth@beta

# 4. Content validation
npm install zod

# 5. Password hashing
npm install bcryptjs
npm install -D @types/bcryptjs

# 6. Utilities
npm install clsx tailwind-merge
```

**Version verification (run before writing Standard Stack):**
```bash
npm view next@14 version            # → 14.2.35
npm view next-auth@beta version     # → 5.0.0-beta.31
npm view tailwindcss version        # → 4.2.4
npm view @tailwindcss/postcss version # → 4.2.4
```

---

## Architecture Patterns

### System Architecture Diagram

```
Browser request
  │
  ▼
[middleware.ts — edge runtime]
  │  imports: auth.config.ts ONLY
  │  reads JWT cookie
  │  no session → redirect to /login
  │  session valid → NextResponse.next()
  │
  ▼
[(auth)/login/page.tsx — Server]       [(protected)/layout.tsx — Server]
  │                                      │
  │  form submit →                       │  imports: auth.ts
  │  server action →                     │  calls await auth()
  │  signIn('credentials', data)         │  no session → redirect('/login')
  │  ← sets AUTH_SESSION cookie          │  session valid → render layout
  │                                      │
  ▼                                      ▼
[app/api/auth/[...nextauth]/route.ts]  [lib/content.ts — Server only]
  │                                      │  fs.readFileSync JSON
  │  handlers from auth.ts              │  Zod .parse() → throw on fail
  │  GET + POST                         │  bidirectional ref validator
                                         │
                                         ▼
                                    [JSX props → Client islands]
                                    NavTabs (usePathname)
                                    StarMark (SVG, no JS)
```

### Recommended Project Structure

```
/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx           # Minimal — no nav, no star motif
│   │   └── login/
│   │       └── page.tsx         # Login form, auto-focus, error state
│   ├── (protected)/
│   │   ├── layout.tsx           # auth() gate + TopNav + Footer
│   │   ├── page.tsx             # Home — hero + section previews
│   │   ├── tree/
│   │   │   └── page.tsx         # Placeholder
│   │   ├── photographs/
│   │   │   └── page.tsx         # Placeholder
│   │   ├── films/
│   │   │   └── page.tsx         # Placeholder
│   │   └── person/
│   │       └── [id]/
│   │           └── page.tsx     # Placeholder
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts     # Auth.js handlers
│   ├── globals.css              # @import "tailwindcss" + @theme {} + @utility
│   └── layout.tsx               # Root layout — Inter font, html/body
├── components/
│   ├── layout/
│   │   ├── TopNav.tsx           # Server Component
│   │   ├── NavTabs.tsx          # 'use client' — usePathname()
│   │   └── Footer.tsx           # Server Component
│   ├── ui/
│   │   └── StarMark.tsx         # Server Component — inline SVG
│   └── home/
│       ├── Hero.tsx             # Server Component
│       └── SectionPreview.tsx   # Server Component
├── content/
│   ├── family.json
│   ├── photos.json
│   └── videos.json
├── lib/
│   ├── content.ts               # Zod loaders — sole data access point
│   └── types.ts                 # z.infer<> derived types
├── public/
│   ├── brand/
│   │   └── star.svg             # If provided; otherwise generate inline
│   └── photos/                  # Placeholder photos (Phase 1 stubs)
├── auth.config.ts               # Edge-safe (NO bcryptjs, NO Node.js APIs)
├── auth.ts                      # Full config (bcryptjs, signIn, signOut)
├── middleware.ts                # Imports auth.config.ts ONLY
├── .env.local                   # AUTH_SECRET + AUTH_PASSWORD_HASH (gitignored)
├── .env.local.example           # Template with instructions
└── README.md
```

### Pattern 1: Auth Two-File Split (Critical — get this right first)

**What:** Separate edge-safe config from Node.js-only config to avoid build failures.
**When to use:** Always. This is the mandatory pattern for Auth.js v5 + Next.js 14 middleware.

```typescript
// auth.config.ts — EDGE-SAFE. NO bcryptjs. NO fs. NO node: imports.
// Source: https://authjs.dev/getting-started/migrating-to-v5
import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

export default {
  providers: [
    Credentials({
      // The credentials shape defines the form field names
      credentials: {
        password: { label: 'Password', type: 'password' },
      },
      // authorize() CANNOT contain bcryptjs here — bcryptjs requires Node.js
      // The actual hash comparison lives in auth.ts's authorize callback override
      // See auth.ts below for the full pattern
      async authorize() {
        // Return a non-null value to indicate "authorized by default"
        // The real check happens when credentials are submitted — see auth.ts
        return null
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth }) {
      // Returns true (allow) or false (redirect to signIn page)
      return !!auth?.user
    },
  },
} satisfies NextAuthConfig
```

```typescript
// auth.ts — NODE.JS ONLY. Contains bcryptjs. Never imported by middleware.ts.
// Source: https://authjs.dev/getting-started/migrating-to-v5
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import authConfig from './auth.config'

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    // Override the Credentials provider here with the full bcryptjs check
    Credentials({
      credentials: {
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const password = credentials?.password
        if (typeof password !== 'string') return null

        const hash = process.env.AUTH_PASSWORD_HASH
        if (!hash) throw new Error('AUTH_PASSWORD_HASH env var not set')

        const isValid = await bcrypt.compare(password, hash)
        if (!isValid) return null

        // Return a user object — id is required, other fields optional
        // For a single-password site, a static "family" identity is fine
        return { id: 'family', name: 'Family Member' }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
})
```

```typescript
// middleware.ts — imports ONLY from auth.config.ts, never from auth.ts
// Source: https://authjs.dev/getting-started/migrating-to-v5
// Source: https://nextjs.org/docs/14/app/building-your-application/routing/middleware
import NextAuth from 'next-auth'
import authConfig from './auth.config'

const { auth } = NextAuth(authConfig)

export default auth

export const config = {
  // Match all routes except:
  // - api/ (Auth.js route handler)
  // - _next/static (static files)
  // - _next/image (image optimization)
  // - favicon.ico
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

```typescript
// app/api/auth/[...nextauth]/route.ts
// Source: https://authjs.dev/getting-started/installation?framework=next.js
import { handlers } from '@/auth'
export const { GET, POST } = handlers
```

**Critical gotcha:** The `authorized` callback in `auth.config.ts` controls whether the middleware
redirects. It checks for an existing session (`!!auth?.user`). It does NOT re-run the authorize
callback. The authorize callback runs only on sign-in. This means: unauthorized users hit the
`authorized` callback → false → redirect to `/login`. The login form submission runs `authorize()`
in auth.ts.

**Gotcha about spreading providers:** The `...authConfig` spread in `auth.ts` includes the
edge-safe Credentials provider from `auth.config.ts`. The providers array override in `auth.ts`
replaces it with the bcryptjs version. The `...authConfig` spread must come BEFORE the `providers`
key, or the spread will overwrite your providers. Alternatively, put providers only in `auth.ts`
and use an empty `providers: []` in `auth.config.ts` if you prefer explicit control.

### Pattern 2: Defence-in-Depth Server Component Gate (CVE-2025-29927)

**What:** Every Server Component under `(protected)` calls `await auth()` independently.
**When to use:** ALWAYS in `(protected)/layout.tsx`. Optionally on individual pages for extra safety.

```typescript
// app/(protected)/layout.tsx — Server Component
// Source: https://authjs.dev/getting-started/migrating-to-v5#authenticating-server-side
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import TopNav from '@/components/layout/TopNav'
import Footer from '@/components/layout/Footer'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <TopNav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
```

### Pattern 3: Logout Server Action

**What:** Form POST to a server action that calls `signOut()` — no client JS required.
**When to use:** "Sign out" link in TopNav.

```typescript
// components/layout/TopNav.tsx — Server Component (layout)
// The sign-out link is a form so it can be a server action
import { signOut } from '@/auth'

// Inline server action — only valid in Server Components
async function handleSignOut() {
  'use server'
  await signOut({ redirectTo: '/login' })
}

export default function TopNav() {
  return (
    <nav className="border-b hairline px-7 py-4 flex items-center justify-between">
      {/* Brand mark */}
      <div className="flex items-center gap-2">
        {/* <StarMark size={14} /> */}
        <span className="font-serif text-navy">The Curry Family</span>
      </div>

      {/* Nav tabs — Client island for active state */}
      {/* <NavTabs /> */}

      {/* Sign out — server action form, no client JS */}
      <form action={handleSignOut}>
        <button
          type="submit"
          className="text-sm text-text-muted hover:text-navy transition-colors"
        >
          Sign out
        </button>
      </form>
    </nav>
  )
}
```

**Alternative (if inline server action gives type issues):** Extract to a named server action in a
separate `app/actions/auth.ts` file marked with `'use server'` at the top.

### Pattern 4: Login Page with Inline Error and Auto-Focus

**What:** Server-rendered login form with error state, auto-focus via useEffect island.
**When to use:** `app/(auth)/login/page.tsx`.

```typescript
// app/(auth)/login/page.tsx
// Auth.js v5 in Next.js App Router: signIn returns errors via searchParams
// Source: https://authjs.dev/getting-started/providers/credentials
import { signIn } from '@/auth'
import { AuthError } from 'next-auth'
import { redirect } from 'next/navigation'

// The login page reads the 'error' searchParam that Auth.js sets on failed login
// and the 'callbackUrl' param to redirect back after successful login
export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; callbackUrl?: string }
}) {
  const error = searchParams.error
  const callbackUrl = searchParams.callbackUrl ?? '/'

  async function handleLogin(formData: FormData) {
    'use server'
    try {
      await signIn('credentials', {
        password: formData.get('password'),
        redirectTo: callbackUrl,
      })
    } catch (err) {
      if (err instanceof AuthError) {
        redirect(`/login?error=CredentialsSignin&callbackUrl=${encodeURIComponent(callbackUrl)}`)
      }
      throw err // Re-throw non-auth errors (NEXT_REDIRECT is not an AuthError)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* StarMark (size 36px) */}
        {/* <StarMark size={36} className="mx-auto" /> */}

        <h1 className="text-center font-serif text-3xl text-navy">
          The Curry Family
        </h1>

        <form action={handleLogin} className="space-y-4">
          <div>
            <input
              type="password"
              name="password"
              id="password"
              placeholder="Family password"
              autoFocus
              required
              className="w-full border hairline rounded px-4 py-3 text-sm focus:outline-none focus:border-navy"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              That password isn&apos;t right.
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-navy text-white py-3 text-sm font-medium hover:bg-navy/90 transition-colors"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  )
}
```

**Auth.js v5 login error gotcha:** When `signIn()` fails with a Credentials provider in App Router,
Auth.js throws an `AuthError` — it does NOT return a value. You must catch the error and redirect
manually to `/login?error=CredentialsSignin`. The `error` searchParam is set by convention, not
automatically. Also note that `signIn()` success throws a `NEXT_REDIRECT` which is NOT an
`AuthError` — you must re-throw any non-`AuthError` exceptions.

**Auto-focus:** The `autoFocus` attribute on the `<input>` handles this server-side — no client
JS needed. Works for initial page load. If you need focus on client-side navigation (which won't
happen for the login page since it's outside the protected layout), add a `useEffect`.

### Pattern 5: Tailwind v4 globals.css with Full AgeWish Palette

**What:** CSS-first theme definition — all tokens in `@theme {}`, no JS config.
**When to use:** `app/globals.css` (only file for Tailwind config).

```css
/* app/globals.css */
/* Source: https://tailwindcss.com/docs/theme */
/* Source: https://tailwindcss.com/docs/guides/nextjs */

@import "tailwindcss";

@theme {
  /* ── AgeWish Brand Palette ── */
  /* These generate: bg-navy, text-navy, border-navy, fill-navy, etc. */
  --color-navy:       #1F2D5C;
  --color-gold:       #E8A91F;
  --color-gold-deep:  #B8851A;
  --color-ivory:      #FBF9F2;
  --color-border:     #E2DFD5;
  --color-stone:      #C9C4B0;
  --color-text-muted: #6B6960;
  --color-text-quiet: #8B8778;

  /* ── Typography — body font (Inter via CSS variable) ── */
  /* The actual font-family value is injected by next/font/google via var(--font-inter) */
  /* Defined here so Tailwind generates font-sans utility */
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;

  /* ── Typography — serif fallback for v1 ── */
  /* Cormorant Garamond replaces this in Phase 5 */
  --font-serif: Georgia, 'Times New Roman', serif;

  /* ── Font weights (two-weight rule: only 400 and 500) ── */
  /* Tailwind v4 generates font-weight utilities from --font-weight-* */
  /* By NOT defining 600/700, those weights are unavailable as utilities */
  --font-weight-normal: 400;
  --font-weight-medium: 500;

  /* ── Spacing rhythm ── */
  /* Keep Tailwind's default spacing scale; sections use py-11 px-7 */
}

/* ── Custom utilities (Tailwind v4 @utility directive) ── */
/* Source: https://tailwindcss.com/docs/adding-custom-styles */

@utility eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.22em;
  font-size: var(--text-xs, 0.75rem);
  font-weight: 500;
}

@utility hairline {
  border-width: 0.5px;
  border-color: #E2DFD5;
}

@utility hairline-emphasis {
  border-width: 1.25px;
  border-color: #E2DFD5;
}

/* ── Base styles ── */
@layer base {
  html {
    font-family: var(--font-sans);
    color: #1a1a1a;
    background-color: white;
  }

  /* Headings use serif font */
  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-serif);
    font-weight: 400; /* Serif headings always normal weight */
  }
}
```

**Tailwind v4 `@theme` gotcha — `--color-text-muted` vs `text-muted` class name:** Token names
with hyphens generate classes using the full name. `--color-text-muted` generates `text-text-muted`
(duplicated prefix). Consider using `--color-muted` to generate `text-muted` instead. However,
since the project uses the exact names from D-10, `text-text-muted` is the correct utility class
for text color. Document this clearly in the codebase.

**Alternative naming to avoid double-prefix:** Use `bg-[#6B6960]` for one-off uses, or rename
tokens in `@theme` to `--color-muted` and `--color-quiet` for cleaner utility names (`text-muted`,
`text-quiet`). The planner should pick one convention and lock it.

### Pattern 6: Inter Font via next/font/google (Weights 400+500 Only)

**What:** Self-hosted Inter font with exactly two weights, exposed as a CSS variable.
**When to use:** `app/layout.tsx` (root layout).

```typescript
// app/layout.tsx
// Source: https://nextjs.org/docs/app/getting-started/fonts
import { Inter } from 'next/font/google'
import './globals.css'

// Load Inter with exactly weights 400 and 500 — no more
// 'latin' subset covers all English/Western European characters
// display: 'swap' = renders with fallback font until Inter loads (prevents invisible text)
// variable = CSS variable name injected on <html> for use in @theme --font-sans
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-inter',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
```

**Gotcha:** Pass `variable: '--font-inter'` (not `className`) so the CSS variable is available for
the `@theme` definition in `globals.css`. The `className` approach (e.g., `className={inter.className}`)
directly applies the font to `<html>` but does not expose a CSS variable for use in `@theme`.
Using `variable` + `className={inter.variable}` on `<html>` injects `--font-inter` as a CSS
variable that your `@theme { --font-sans: var(--font-inter), ... }` can reference.

**Note on Inter as a variable font:** Inter is a variable font on Google Fonts. If the font
supports variable weights, `next/font/google` may ignore the `weight` array and load the variable
font axes instead (which includes all weights). To strictly enforce the two-weight rule at the
CSS utility level, also define `--font-weight-normal: 400` and `--font-weight-medium: 500` in
`@theme {}` (done in Pattern 5 above) and never use `font-bold` or `font-semibold` in JSX.

### Pattern 7: Zod Schemas and Content Loader

**What:** Type-safe JSON loaders with Zod validation and bidirectional reference checking.
**When to use:** `lib/types.ts` (schemas) and `lib/content.ts` (loaders).

```typescript
// lib/types.ts
// Source: https://zod.dev (standard pattern)
import { z } from 'zod'

export const PersonSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*[a-z0-9]$/, 'Person ID must be kebab-case'),
  name: z.string().min(1),
  birthYear: z.number().int().optional(),
  deathYear: z.number().int().optional(),
  birthPlace: z.string().optional(),
  bio: z.string().optional(),
  photoIds: z.array(z.string()).default([]),
  parentIds: z.array(z.string()).default([]),
  childIds: z.array(z.string()).default([]),
  spouseIds: z.array(z.string()).default([]),
})

export const PhotoSchema = z.object({
  id: z.string(),
  filename: z.string().min(1),
  caption: z.string().optional(),
  dateTaken: z.string().optional(), // ISO 8601 date string
  peopleIds: z.array(z.string()).default([]),
})

export const VideoSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  source: z.enum(['youtube', 'vimeo']),
  sourceId: z.string().min(1),
  dateTaken: z.string().optional(),
  peopleIds: z.array(z.string()).default([]),
})

// Types derived from schemas — single source of truth
export type Person = z.infer<typeof PersonSchema>
export type Photo = z.infer<typeof PhotoSchema>
export type Video = z.infer<typeof VideoSchema>
```

```typescript
// lib/content.ts
// Source: Architecture.md Pattern 2 + D-23 + D-24
import { readFileSync } from 'fs'
import { join } from 'path'
import { PersonSchema, PhotoSchema, VideoSchema } from './types'
import { z } from 'zod'
import type { Person, Photo, Video } from './types'

// ── File reader ──
function readJSON<T>(filename: string, schema: z.ZodSchema<T>): T {
  const filePath = join(process.cwd(), 'content', filename)
  const raw = readFileSync(filePath, 'utf-8')
  const parsed = JSON.parse(raw)

  // .parse() throws a ZodError with detail if validation fails
  // This surfaces content errors at build time, not runtime
  return schema.parse(parsed)
}

// ── Loaders ──
export function getPeople(): Person[] {
  return readJSON('family.json', z.array(PersonSchema))
}

export function getPhotos(): Photo[] {
  return readJSON('photos.json', z.array(PhotoSchema))
}

export function getVideos(): Video[] {
  return readJSON('videos.json', z.array(VideoSchema))
}

export function getPersonById(id: string): Person | null {
  return getPeople().find((p) => p.id === id) ?? null
}

// ── Bidirectional reference validator ──
// Run at module load time to catch dangling references early.
// Throws if any Photo.peopleIds[] references a non-existent Person.id,
// or any Person.photoIds[] references a non-existent Photo.id.
export function validateBidirectionalRefs(): void {
  const people = getPeople()
  const photos = getPhotos()

  const personIds = new Set(people.map((p) => p.id))
  const photoIds = new Set(photos.map((p) => p.id))

  // Check photo → person references
  for (const photo of photos) {
    for (const pid of photo.peopleIds) {
      if (!personIds.has(pid)) {
        throw new Error(
          `Photo "${photo.id}" references unknown person ID "${pid}"`
        )
      }
    }
  }

  // Check person → photo references
  for (const person of people) {
    for (const phid of person.photoIds) {
      if (!photoIds.has(phid)) {
        throw new Error(
          `Person "${person.id}" references unknown photo ID "${phid}"`
        )
      }
    }
  }
}
```

**Zod gotcha — `.parse()` vs `.safeParse()`:** Use `.parse()` (throws on failure) not
`.safeParse()` (returns result object). The requirement is "fail loud" — a Zod error thrown at
build/server startup surfaces the content mistake immediately. Using `.safeParse()` and logging
a warning would let bad data through silently.

**When to call `validateBidirectionalRefs()`:** Call it from a build-time script or from within
`getPeople()` / `getPhotos()` on the first call. For Phase 1 with stub data, add a call inside the
content loader or as a separate utility function that can be called from `(protected)/layout.tsx`
in development mode (`process.env.NODE_ENV === 'development'`). In production the build validates
content at build time.

### Pattern 8: NavTabs Client Island for Active State

**What:** Thin `'use client'` island that reads `usePathname()` — parent TopNav stays Server.
**When to use:** `components/layout/NavTabs.tsx`.

```typescript
// components/layout/NavTabs.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils' // clsx + tailwind-merge utility

const tabs = [
  { href: '/', label: 'Home' },
  { href: '/tree', label: 'Family tree' },
  { href: '/photographs', label: 'Photographs' },
  { href: '/films', label: 'Films' },
] as const

export default function NavTabs() {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-6">
      {tabs.map((tab) => {
        const isActive =
          tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href)

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'text-sm pb-1 transition-colors',
              isActive
                ? 'text-navy border-b hairline-emphasis border-gold'
                : 'text-text-muted hover:text-navy'
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
```

### Pattern 9: 7-Pointed Star SVG (Claude's Discretion)

**What:** Server Component rendering an inline SVG for the 7-pointed star motif.
**When to use:** TopNav (14px), Hero (36px), Footer (20px).

Geometry for a regular 7-pointed star: 7 outer points at radius R, 7 inner points at radius r,
alternating. Standard ratio: r/R ≈ 0.45 for an aesthetically balanced heptagram.

```typescript
// components/ui/StarMark.tsx — Server Component (no 'use client')
import { cn } from '@/lib/utils'

interface StarMarkProps {
  size?: number      // px — defaults determined per usage context
  className?: string
}

function generateStarPath(outerR: number, innerR: number, points: number): string {
  const step = Math.PI / points // angle between outer and inner point
  const paths: string[] = []

  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR
    const angle = i * step - Math.PI / 2 // start from top (12 o'clock)
    const x = outerR + r * Math.cos(angle)
    const y = outerR + r * Math.sin(angle)
    paths.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)
  }

  return paths.join(' ') + ' Z'
}

export default function StarMark({ size = 20, className }: StarMarkProps) {
  const outerR = size / 2
  const innerR = outerR * 0.45 // heptagram inner radius ratio
  const d = generateStarPath(outerR, innerR, 7)

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      aria-hidden="true"
      className={cn(className)}
    >
      <path d={d} fill="#E8A91F" />
    </svg>
  )
}
```

**Note on star.svg:** If `/public/brand/star.svg` is available, prefer reading its path data via
`fs.readFileSync` at build time and embedding it. The generated SVG above is a fallback.
The `generateStarPath` approach works and is predictable, but may not match the exact AgeWish
brand star if it has custom proportions.

### Pattern 10: Stub JSON Content Files

```jsonc
// content/family.json
[
  {
    "id": "william-curry",
    "name": "William Curry",
    "birthYear": 1920,
    "deathYear": 1998,
    "birthPlace": "London, England",
    "bio": "Founder of the Curry family line. Born in London.",
    "photoIds": ["photo-001"],
    "parentIds": [],
    "childIds": ["james-curry"],
    "spouseIds": []
  },
  {
    "id": "james-curry",
    "name": "James Curry",
    "birthYear": 1948,
    "birthPlace": "London, England",
    "bio": "",
    "photoIds": [],
    "parentIds": ["william-curry"],
    "childIds": ["emily-curry"],
    "spouseIds": []
  },
  {
    "id": "emily-curry",
    "name": "Emily Curry",
    "birthYear": 1975,
    "birthPlace": "London, England",
    "bio": "",
    "photoIds": [],
    "parentIds": ["james-curry"],
    "childIds": [],
    "spouseIds": []
  }
]
```

```jsonc
// content/photos.json
[
  {
    "id": "photo-001",
    "filename": "placeholder-001.jpg",
    "caption": "William Curry, circa 1950",
    "dateTaken": "1950-01-01",
    "peopleIds": ["william-curry"]
  },
  {
    "id": "photo-002",
    "filename": "placeholder-002.jpg",
    "caption": "Family gathering",
    "dateTaken": "1970-06-15",
    "peopleIds": []
  }
]
```

```jsonc
// content/videos.json
[
  {
    "id": "video-001",
    "title": "Placeholder film",
    "description": "This is a placeholder. Replace with a real family film.",
    "source": "youtube",
    "sourceId": "dQw4w9WgXcQ",
    "dateTaken": "1970-01-01",
    "peopleIds": []
  }
]
```

### Pattern 11: `cn()` Utility

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### Anti-Patterns to Avoid

- **Importing `auth.ts` in `middleware.ts`:** Pulls bcryptjs into the edge runtime. Build fails or
  produces cryptic runtime error. Import from `auth.config.ts` only.
- **Setting `NEXTAUTH_URL` or `AUTH_URL` in Vercel:** Breaks preview deployment callback URLs.
  Leave unset; Vercel auto-detects via `VERCEL_URL`.
- **Using `tailwind.config.ts` with Tailwind v4:** v4 uses CSS-first config. A `tailwind.config.ts`
  file is a v3 artifact. Do not create one.
- **Using `@tailwind base/components/utilities` directives:** These are v3 directives. v4 uses
  `@import "tailwindcss"` (single import).
- **Constructing Tailwind class names via string interpolation:** `bg-${color}` will be purged in
  production. Always use complete class names.
- **Using `getServerSession()` from next-auth/next:** This is the v4 API. In v5, use
  `await auth()` from `@/auth` directly.
- **Not re-throwing non-AuthError exceptions in the login action:** `signIn()` success throws
  `NEXT_REDIRECT` (which is technically an error). If you catch all errors, the redirect never
  fires. Always re-throw errors that are not `instanceof AuthError`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password hashing | Custom hash function | `bcryptjs.compare()` | bcrypt salts prevent rainbow table attacks; hand-rolled hashing is always wrong |
| JWT session management | Custom JWT signing | Auth.js v5 session | Secure key rotation, clock skew, expiry — all handled |
| Conditional class names | Template literals | `clsx` + `tailwind-merge` via `cn()` | tailwind-merge resolves conflicting Tailwind classes (e.g., `px-4` + `px-6` = `px-6`, not both) |
| Font loading | CSS @font-face | `next/font/google` | Automatic self-hosting, no FOUT, subset optimization, display:swap |
| JSON type safety | Casting (`as MyType`) | Zod `.parse()` | Cast does nothing at runtime; Zod catches content errors immediately |

---

## Common Pitfalls

### Pitfall 1: auth.config.ts Accidentally Imports a Node.js Module

**What goes wrong:** Developer imports `bcryptjs` or `fs` in `auth.config.ts` while adding the
authorize check. Build error: "Module not found" or "dynamic require not supported" in edge
runtime.

**Why it happens:** `auth.config.ts` is imported by `middleware.ts`, which runs in the edge
runtime. The edge runtime does not have Node.js APIs or native modules.

**How to avoid:** Keep `auth.config.ts` to pure ECMAScript. Only imports allowed: `next-auth`,
`next-auth/providers/*`, `next-auth/types`. No `bcryptjs`, no `fs`, no `path`, no `crypto`.

**Warning signs:** `next build` error mentioning "edge runtime" or "Module 'fs' cannot be
resolved". Or: `next dev` works but `next build` fails.

### Pitfall 2: AUTH_SECRET Missing in Vercel

**What goes wrong:** Login works locally but fails silently in production. Sessions return null.

**Why it happens:** `AUTH_SECRET` is auto-generated in local `.env.local` by `npx auth secret`.
Vercel needs it set explicitly for Production, Preview, and Development environments.

**How to avoid:**
1. Generate: `npx auth secret` (writes to `.env.local`) or `openssl rand -base64 32`
2. In Vercel dashboard → Project Settings → Environment Variables
3. Add `AUTH_SECRET` with the same value for **all three** environments: Production, Preview,
   Development

**Detection:** Vercel Function logs show `[auth][error] MissingSecret` or sessions are null on
every request.

### Pitfall 3: NEXTAUTH_URL Set Manually in Vercel

**What goes wrong:** Auth callbacks redirect to the wrong URL on Vercel preview deployments.

**Why it happens:** Each Vercel preview gets a unique URL. If `NEXTAUTH_URL` is set to the
production domain, Auth.js constructs callback URLs pointing to production from the preview.

**How to avoid:** Do NOT set `NEXTAUTH_URL` or `AUTH_URL` in Vercel at all. Auth.js v5 on Vercel
auto-detects via `VERCEL_URL`. (Local dev: `AUTH_URL` is auto-set to `http://localhost:3000`.)

### Pitfall 4: Login signIn() Error Handling Swallows NEXT_REDIRECT

**What goes wrong:** After a successful login, the user stays on the login page instead of being
redirected. Or: error message never shows on failed login.

**Why it happens:** `signIn()` in App Router throws exceptions for both success (NEXT_REDIRECT)
and failure (AuthError). A `catch (err)` block that doesn't re-throw non-AuthErrors swallows the
success redirect. Conversely, not catching AuthErrors means the error page shows a stack trace.

**How to avoid:** Pattern is in Code Example above:
```typescript
try {
  await signIn(...)
} catch (err) {
  if (err instanceof AuthError) {
    redirect('/login?error=CredentialsSignin')
  }
  throw err  // NEXT_REDIRECT must be re-thrown
}
```

### Pitfall 5: Tailwind v4 @theme Token Naming Generates Double-Prefix Classes

**What goes wrong:** `--color-text-muted` generates class `text-text-muted` (doubled). Using
`text-muted` in JSX won't work — the correct class is `text-text-muted`.

**Why it happens:** Tailwind v4 generates utility classes by combining the namespace prefix
(`text-` for color applied as text color) with the token name (`text-muted`). If the token name
itself starts with `text-`, the prefix doubles.

**How to avoid:** Choose one of:
  - Use the doubled class name (`text-text-muted`) consistently in JSX
  - Rename the token: `--color-muted: #6B6960` generates `text-muted` (no double prefix)
  - Decision MUST be made before any component work begins — changing it later requires
    find-and-replace across all JSX files

**Recommendation:** Rename `text-muted` → `--color-muted` and `text-quiet` → `--color-quiet` in
the `@theme {}` block for cleaner utility names. Document the full palette → class name mapping.

### Pitfall 6: create-next-app@14 Installs Tailwind v3

**What goes wrong:** The scaffold generates a `tailwind.config.ts` and uses v3 PostCSS config.
Attempting to use `@theme {}` syntax with v3 silently fails.

**Why it happens:** `create-next-app@14` pins the version available at Next.js 14's release time,
which is Tailwind v3.

**How to avoid:** After scaffolding:
```bash
# Remove v3 artifacts
npm uninstall tailwindcss postcss autoprefixer
rm tailwind.config.ts  # if exists
# Install v4
npm install tailwindcss@4 @tailwindcss/postcss@4 postcss
# Update postcss.config.mjs to use @tailwindcss/postcss
# Update globals.css to use @import "tailwindcss" + @theme {}
```

### Pitfall 7: Next.js 14 middleware.ts — Edge Runtime Only

**What goes wrong:** Code that uses Node.js APIs (like `bcryptjs`) placed in `middleware.ts` fails
with "x is not defined in edge runtime."

**Why it happens:** In Next.js 14, middleware runs exclusively in the Edge Runtime, which is a
V8-based environment without Node.js APIs. [VERIFIED: nextjs.org/docs/14]

**Note on Next.js 16:** Next.js 16 renamed `middleware.ts` to `proxy.ts`. We are pinned to 14.2.35.
The file remains `middleware.ts` and must use the edge runtime. Do not follow Next.js 16 docs.

---

## Environment Setup

### Env Var Generation

```bash
# Generate AUTH_SECRET (run once, copy output)
npx auth secret
# OR: openssl rand -base64 32

# Generate AUTH_PASSWORD_HASH (run with actual family password)
node -e "require('bcryptjs').hash('<family-password>', 10).then(console.log)"
# Example output: $2a$10$xxxxx...
# Store this hash in AUTH_PASSWORD_HASH, never the plaintext
```

### .env.local

```bash
# .env.local (gitignored)
AUTH_SECRET=<output from npx auth secret>
AUTH_PASSWORD_HASH=<output from bcryptjs hash command>
```

### .env.local.example

```bash
# .env.local.example (committed to git)
# Copy to .env.local and fill in values

# Required: Auth.js secret for JWT encryption
# Generate with: npx auth secret
AUTH_SECRET=

# Required: bcrypt hash of the shared family password
# Generate with: node -e "require('bcryptjs').hash('<your-password>', 10).then(console.log)"
AUTH_PASSWORD_HASH=
```

### Vercel Env Var Setup

1. Go to Vercel project → Settings → Environment Variables
2. Add `AUTH_SECRET` → check Production, Preview, Development → paste value
3. Add `AUTH_PASSWORD_HASH` → check Production, Preview, Development → paste hash
4. Do NOT add `NEXTAUTH_URL`, `AUTH_URL`, or `NEXTAUTH_SECRET`
5. Redeploy after adding vars (existing deployments don't pick up new env vars)

---

## DNS Configuration

**Goal:** Point `curry.agewish.com` to the Vercel project.

**Method:** CNAME record (correct for subdomains per Vercel docs).
[VERIFIED: vercel.com/docs/domains/working-with-domains/add-a-domain]

**Steps:**
1. In Vercel dashboard → Project Settings → Domains → Add Domain → type `curry.agewish.com`
2. Vercel shows a CNAME record with a project-specific value (e.g.,
   `d1d4fc829fe7bc7c.vercel-dns-017.com` — the actual value is shown in the dashboard)
3. In your DNS registrar (wherever `agewish.com` DNS is managed):
   - Add a CNAME record: `curry` → `<value from Vercel dashboard>`
   - TTL: 300 (5 minutes) for initial setup; increase to 3600 after verified
4. Vercel automatically verifies the DNS once it propagates (typically 5-30 minutes)

**A record vs CNAME:** CNAME is correct for subdomains. A records are for apex domains
(e.g., `agewish.com` itself). Do NOT use an A record for `curry.agewish.com`.

**HTTPS:** Vercel automatically provisions an SSL certificate via Let's Encrypt once DNS is
verified. No manual configuration needed.

**Gotcha:** If `agewish.com` uses Vercel Nameservers (NS delegation), you add the CNAME within
Vercel's DNS panel rather than your registrar. Check which method is in use.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `NEXTAUTH_SECRET` | `AUTH_SECRET` | Auth.js v5 (2024) | Must use new name; v4 tutorials are wrong |
| `getServerSession()` from next-auth/next | `await auth()` from `@/auth` | Auth.js v5 (2024) | Old import doesn't exist in v5 |
| `tailwind.config.ts` + postcss plugin | `@theme {}` in CSS + `@tailwindcss/postcss` | Tailwind v4 (Jan 2025) | No JS config file; CSS-first approach |
| `@tailwind base/components/utilities` | `@import "tailwindcss"` | Tailwind v4 (Jan 2025) | Single import replaces three directives |
| `framer-motion` package | `motion` package (import from `motion/react`) | Late 2024 rebrand | Same API, different package name |
| `middleware.ts` | `proxy.ts` | Next.js v16 | We are pinned to Next.js 14 — use `middleware.ts` |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | bcryptjs v2.4.3 is still the latest stable and works in current Vercel Node.js | Standard Stack | Version may have changed; verify with `npm view bcryptjs version` before install |
| A2 | The `signIn()` + AuthError catch pattern is correct for next-auth@beta 5.0.0-beta.31 | Pattern 4 | Auth.js beta may have changed the error handling API; verify against authjs.dev at implementation time |
| A3 | Inter is available as a variable font via next/font/google; weight array may be ignored | Pattern 6 | Variable font loads all weights; visual weight enforcement must be via CSS only, not font loading |
| A4 | `autoFocus` attribute works server-side for the password input auto-focus | Pattern 4 | Some browsers ignore `autoFocus` on `<input>` inside Server-rendered HTML; may need a `useEffect` island |
| A5 | The `authorized` callback in auth.config.ts returning `!!auth?.user` is sufficient for the middleware gate | Pattern 1 | Edge cases around session expiry may require additional checks |

---

## Open Questions

1. **Token naming — double-prefix issue**
   - What we know: `--color-text-muted` generates `text-text-muted`; `--color-muted` generates `text-muted`
   - What's unclear: Which naming convention is already used in the project brief / design mockups?
   - Recommendation: Lock the naming before writing any components. Proposed: rename `text-muted` →
     `--color-muted` and `text-quiet` → `--color-quiet` in `@theme {}`.

2. **star.svg availability**
   - What we know: `/public/brand/star.svg` may or may not exist; D-16 says prefer reading it
   - What's unclear: Whether the AgeWish brand star has custom proportions that differ from
     the generated heptagram
   - Recommendation: Check `public/brand/star.svg` at implementation start. If not present, use the
     `generateStarPath` function in Pattern 9.

3. **Inter as variable font — weight enforcement**
   - What we know: Inter on Google Fonts is available as a variable font that includes all weights
   - What's unclear: Whether specifying `weight: ['400', '500']` actually prevents other weights
     from loading when it's a variable font
   - Recommendation: Enforce the two-weight rule via CSS utilities in `@theme {}` (only define
     `--font-weight-normal` and `--font-weight-medium`). The font file may load all weights but the
     CSS utilities only expose 400 and 500.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 1 is a greenfield scaffold. All dependencies are installed via npm;
no pre-installed external tools, databases, or services are required beyond Node.js + npm.

---

## Validation Architecture

> nyquist_validation not explicitly false in config — section included.

### Test Framework

Phase 1 is a greenfield project with no test infrastructure. The planner should add minimal
smoke tests to verify the auth gate works.

| Property | Value |
|----------|-------|
| Framework | None yet — Wave 0 creates this |
| Config file | `jest.config.ts` OR skip unit tests; use `next build` as the primary smoke test |
| Quick run command | `npm run build` (verifies: TypeScript types, Zod validation, Tailwind purging) |
| Full suite command | `npm run build && npx playwright test` (if e2e added) |

**Pragmatic recommendation for Phase 1:** The most valuable "test" for this phase is a successful
`next build`. This verifies TypeScript strict mode, Zod schema validation at build time, and
Tailwind class availability in production mode. A full Jest/Playwright setup can be deferred to
Phase 5 unless the project brief requires it.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Login with correct password redirects to / | Smoke (manual or e2e) | Manual browser test | ❌ Wave 0 |
| AUTH-02 | Incorrect password shows error, stays on /login | Smoke (manual or e2e) | Manual browser test | ❌ Wave 0 |
| AUTH-04 | /photographs without session → /login | Smoke | `next build` (type check only) | ❌ Wave 0 |
| FOUND-01 | Project builds cleanly | Build | `npm run build` | ❌ Wave 0 |
| CONT-04 | Zod throws on invalid JSON | Unit | `node -e "require('./lib/content').getPeople()"` | ❌ Wave 0 |

### Wave 0 Gaps

- [ ] `npm test` script — add to `package.json` (at minimum: `"test": "tsc --noEmit && next build"`)
- [ ] Auth smoke test procedure documented in README.md
- [ ] Zod validation test: intentionally break a JSON file to confirm throw behavior

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes | Auth.js v5 Credentials + bcryptjs |
| V3 Session Management | Yes | JWT cookie, 30-day maxAge, HttpOnly (handled by Auth.js) |
| V4 Access Control | Yes | Middleware + Server Component double-gate |
| V5 Input Validation | Yes | Zod schemas for all content; password is compared via bcrypt (not validated as plaintext) |
| V6 Cryptography | Yes | bcryptjs for hash comparison; AUTH_SECRET for JWT signing (never hand-rolled) |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Middleware bypass (CVE-2025-29927) | Elevation of Privilege | `await auth()` in every Server Component under (protected) |
| Password brute-force | Spoofing | bcrypt has built-in cost factor (10 rounds); no IP-based rate limiting needed for a family site |
| JWT tampering | Tampering | AUTH_SECRET used for HMAC signing; Auth.js handles verification |
| Plaintext password in logs | Information Disclosure | Never log `credentials.password`; bcryptjs compares hash only |
| Stale sessions | Spoofing | JWT maxAge 30 days; changing AUTH_SECRET invalidates all existing sessions (nuclear option for password rotation) |

---

## Sources

### Primary (HIGH confidence)

- `authjs.dev/getting-started/migrating-to-v5` — two-file split code patterns, session strategy, signIn/signOut exports
- `authjs.dev/getting-started/providers/credentials` — Credentials provider shape, authorize() signature
- `authjs.dev/guides/edge-compatibility` — why bcryptjs cannot go in auth.config.ts
- `tailwindcss.com/docs/theme` — @theme {} syntax, token-to-class-name mapping, @utility directive
- `tailwindcss.com/docs/guides/nextjs` — postcss.config.mjs for Next.js + Tailwind v4
- `tailwindcss.com/docs/adding-custom-styles` — @utility directive for custom utilities in v4
- `nextjs.org/docs/14/app/building-your-application/routing/middleware` — middleware.ts file format, matcher config, edge-runtime-only constraint
- `nextjs.org/docs/app/getting-started/fonts` — next/font/google weights, variable option, CSS variable injection
- `vercel.com/docs/domains/working-with-domains/add-a-domain` — CNAME vs A record for subdomains

### Secondary (MEDIUM confidence)

- Prior project research in `.planning/research/ARCHITECTURE.md` — auth two-file split code examples
- Prior project research in `.planning/research/PITFALLS.md` — AUTH_SECRET naming, NEXTAUTH_URL gotcha
- npm registry — version verification for next@14.2.35, next-auth@beta (5.0.0-beta.31), tailwindcss@4.2.4, @tailwindcss/postcss@4.2.4, clsx@2.1.1, tailwind-merge@3.5.0

### Tertiary (LOW confidence)

- Vercel CNAME value format `d1d4fc829fe7bc7c.vercel-dns-017.com` — this is an example; actual value shown in Vercel dashboard differs per project

---

## Metadata

**Confidence breakdown:**
- Auth two-file split: HIGH — verified against authjs.dev official docs + prior project research
- Tailwind v4 @theme: HIGH — verified against tailwindcss.com official docs
- next/font/google pattern: HIGH — verified against nextjs.org official docs
- Zod loader pattern: HIGH — standard ecosystem pattern, consistent with prior research
- DNS configuration: HIGH for CNAME method; LOW for exact CNAME target value (dashboard-specific)
- Middleware matcher: HIGH — verified against Next.js 14 official docs

**Research date:** 2026-04-29
**Valid until:** 2026-05-29 (next-auth@beta moves fast; re-verify beta version at implementation time)

---

*Phase: 1 — Scaffold + Auth Gate + Design System*
*Research completed: 2026-04-29*
