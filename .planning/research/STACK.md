# Technology Stack

**Project:** Curry Family Hub (curry.agewish.com)
**Researched:** 2026-04-29
**Confidence:** HIGH for core choices (non-negotiable per brief), MEDIUM for supporting libraries

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | `14.2.35` | Full-stack React framework | Non-negotiable. Pin to 14.x — current stable 14.x with security patches. Latest is 14.2.35. Do NOT upgrade to 15/16: breaking changes in async request APIs would require rework. |
| React | `18.x` (bundled with Next 14) | UI layer | Ships with Next 14. React 19 is bundled with Next 15+ only. |
| TypeScript | `5.x` (bundled with Next 14) | Type safety | Non-negotiable. `strict: true` in tsconfig. |

### Authentication

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| next-auth | `5.0.0-beta.x` (latest beta) | Auth gate | Non-negotiable. Install as `next-auth@beta`. Despite the beta tag, v5 is production-hardened and is the correct choice for App Router — v4 has App Router friction. V5 is the only version with first-class middleware support for Next.js 14+ App Router. |

**Auth pattern for single shared password (no user DB):**
- Use Credentials provider with a hardcoded bcrypt hash comparison
- Force `session: { strategy: "jwt" }` — Credentials provider requires JWT (no DB adapter needed)
- Store hash of the family password as `AUTH_PASSWORD_HASH` in env vars, never the plaintext
- Only one env var is required by Auth.js v5: `AUTH_SECRET` (plus your custom `AUTH_PASSWORD_HASH`)
- Middleware does a JWT signature check at the edge — no DB call, very fast

### Styling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | `4.x` (latest stable, released Jan 2025) | Utility-first CSS | Non-negotiable. Use v4 for new projects — CSS-first config (`@theme` in CSS, not `tailwind.config.js`), 5x faster builds, Lightning CSS engine, automatic content detection. No PostCSS config needed beyond `@tailwindcss/postcss`. |
| @tailwindcss/postcss | `4.x` | PostCSS plugin | Required thin PostCSS shim for Next.js (the "zero config" story is fully true only for Vite). |

**Note on Tailwind v4 vs v3:** The brief says "Tailwind CSS" without pinning version. Use v4. The CSS-first configuration means design tokens (navy/gold/ivory palette, two font weights) live in `globals.css` under `@theme {}` — no JS config file. This is cleaner for a content-focused archive site.

### Animation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| motion | `12.x` (currently 12.37+) | Crossfade / page transitions | The `framer-motion` package was rebranded to `motion` in late 2024. Install as `npm install motion`. Import from `"motion/react"`. For App Router files, either add `"use client"` or import from `"motion/react-client"` to reduce client bundle. API is identical to framer-motion — no migration friction. |

**Do NOT install `framer-motion` for new projects.** The package still receives updates but `motion` is the canonical name going forward.

### Family Tree

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| relatives-tree | `3.2.2` | Tree layout calculation | Non-negotiable per brief. Pure JS, no dependencies, 3.23 kB, 98% TypeScript. Does the hard math of positioning nodes and connectors in a family tree graph. Outputs plain JS objects — you bring your own React renderer. |
| react-family-tree | `3.2.0` | React renderer for relatives-tree | Companion React component from the same author (SanichKotikov). Accepts `nodes`, `rootId`, `width`, `height`, and a `renderNode` render prop. This is the React glue layer over `relatives-tree`. Note: last published ~4 years ago but has no deps that would break — it is a thin wrapper. |

**Critical constraint:** Both libraries are client-side only (DOM rendering). The family tree component file must have `"use client"` at the top. Do not attempt to render it in a Server Component.

### Images

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| next/image | (built-in) | Photo gallery image optimization | Built into Next.js. On Vercel, `sharp` is installed automatically — no manual install needed. Use `next/image` for all scanned photos: automatic WebP conversion, responsive `sizes`, layout shift prevention. |

### Infrastructure

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vercel | Current | Hosting + CI/CD | Non-negotiable. Zero-config Next.js deploys. Automatic image optimization. Environment variable management for `AUTH_SECRET` and `AUTH_PASSWORD_HASH`. |
| GitHub | Current | Source control + Vercel trigger | Existing pipeline per project brief. |

---

## Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `bcryptjs` | `^2.4.3` | Hash comparison for the shared password | Used in the Auth.js `authorize` callback. Use `bcryptjs` (pure JS) over native `bcrypt` — no native build step, works in all Vercel environments. |
| `zod` | `^3.x` | Runtime validation of JSON content files | Use for typed loaders in `lib/content.ts` — parse and validate JSON at build time so content errors surface during `next build`, not in production. |
| `clsx` | `^2.x` | Conditional Tailwind class merging | Cleaner than template literals for conditional classes. Pair with `tailwind-merge` if needed. |
| `tailwind-merge` | `^2.x` | Merges conflicting Tailwind classes | Use with `clsx` in a `cn()` utility — standard pattern across Next.js projects. |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework version | Next.js 14 | Next.js 15 / 16 | Breaking async request API changes; brief locks to 14. Next 15+ bundles React 19 which introduces additional migration surface. |
| Auth | Auth.js v5 (next-auth@beta) | next-auth v4 | v4 has App Router friction — no native middleware session access. v5 is the correct choice despite beta label. |
| Auth | Auth.js v5 | Lucia, Clerk, custom JWT | Lucia deprecated itself in 2024. Clerk is overkill/costly for a private family site. Custom JWT adds maintenance burden. |
| Tailwind | v4 | v3 | v3 is the legacy version. No reason to use it for a greenfield project in 2025. |
| Animation | motion (`motion/react`) | framer-motion | Same library, `motion` is the canonical package name post-rebrand. Identical API. |
| Tree rendering | relatives-tree + react-family-tree | react-d3-tree, vis-network, custom SVG | react-d3-tree is D3-opinionated and harder to style. Custom SVG is a rewrite of hard layout math. relatives-tree is the brief's explicit choice. |
| Content layer | JSON files + zod loaders | Contentlayer, Sanity, Prismic | No CMS needed — content is small, managed by one person, and version-controlled. JSON keeps deploys simple and avoids external service dependency. |
| Image handling | next/image | cloudinary, imgix | Vercel handles optimization natively; external CDN adds cost and complexity for a small family archive. |
| Password hashing | bcryptjs | argon2, native bcrypt | argon2 and native bcrypt require native binaries and can fail in serverless/edge environments. bcryptjs is pure JS, zero build friction. |

---

## Installation

```bash
# Bootstrap
npx create-next-app@14 curry-family --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Auth (v5 beta — intentional)
npm install next-auth@beta

# Animation (canonical package name post-rebrand)
npm install motion

# Family tree
npm install relatives-tree react-family-tree

# Content validation
npm install zod

# Utilities
npm install bcryptjs clsx tailwind-merge

# Types for bcryptjs
npm install -D @types/bcryptjs
```

**Do not install:**
- `framer-motion` (superseded by `motion`)
- `sharp` (auto-installed by Vercel)
- `@tailwindcss/forms` or other plugins upfront — add only if needed

---

## Key Configuration Notes

### next.config.ts
```ts
const nextConfig = {
  images: {
    // No external domains needed — images are local /public assets
    // or served from next/image with local paths
  },
  // Do NOT enable output: "standalone" — Vercel does not need it
};
```

### tsconfig.json (key additions beyond Next 14 default)
```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Environment Variables
```
AUTH_SECRET=<generated with: npx auth secret>
AUTH_PASSWORD_HASH=<bcrypt hash of family password>
```
Set both in Vercel project settings. `AUTH_URL` is not required on Vercel (auto-detected).

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Next.js 14 pin | HIGH | Official security update confirms 14.2.35 as latest 14.x |
| Auth.js v5 (next-auth@beta) | HIGH | Officially documented as the correct choice for Next 14 App Router; beta label is misleading — production-hardened |
| Tailwind v4 | HIGH | Stable release Jan 2025; official docs confirm Next.js compatibility |
| Motion (motion/react) | HIGH | Official rebranding confirmed; version 12.37+; App Router `"use client"` requirement documented |
| relatives-tree 3.2.2 | HIGH | Confirmed via GitHub; pure TS, no deps, matches brief's explicit requirement |
| react-family-tree 3.2.0 | MEDIUM | Package last published ~4 years ago; thin wrapper with no breaking deps, but worth checking GitHub issues before using |
| bcryptjs | HIGH | Long-established; pure-JS specifically chosen to avoid native binary issues in Vercel serverless |
| Zod for content parsing | HIGH | Standard pattern for typed JSON loaders in the Next.js ecosystem |

---

## Sources

- Next.js 14.2.35 security update: https://nextjs.org/blog/security-update-2025-12-11
- Auth.js v5 migration guide: https://authjs.dev/getting-started/migrating-to-v5
- Auth.js credentials provider: https://authjs.dev/getting-started/providers/credentials
- Tailwind CSS v4 release: https://tailwindcss.com/blog/tailwindcss-v4
- Tailwind CSS Next.js install guide: https://tailwindcss.com/docs/guides/nextjs
- Motion for React installation: https://motion.dev/docs/react-installation
- Motion upgrade guide (framer-motion → motion): https://motion.dev/docs/react-upgrade-guide
- relatives-tree GitHub: https://github.com/SanichKotikov/relatives-tree
- react-family-tree GitHub: https://github.com/SanichKotikov/react-family-tree
- Next.js image optimization (sharp on Vercel): https://nextjs.org/docs/messages/install-sharp
