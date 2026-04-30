# Domain Pitfalls

**Domain:** Private family archive site — Next.js 14 App Router, Auth.js v5, relatives-tree, Framer Motion, Tailwind CSS, Vercel
**Researched:** 2026-04-29
**Confidence:** HIGH (multiple verified sources; CVE documented by Vercel; library issues from GitHub)

---

## Critical Pitfalls

Mistakes that will cause rewrites, security holes, or total feature failure.

---

### Pitfall 1: Middleware-Only Auth Gate is Bypassable (CVE-2025-29927)

**What goes wrong:** Relying exclusively on Next.js middleware to enforce the password gate. An attacker can bypass middleware entirely by sending a crafted `x-middleware-subrequest` HTTP header, bypassing the auth check and reading all protected pages.

**Why it happens:** Next.js uses the `x-middleware-subrequest` header internally to prevent infinite middleware loops. Before patch versions (14.x < 14.2.25), external callers could spoof this header. Even post-patch, the design principle stands: middleware is the wrong layer to be the sole enforcer of security.

**Consequences:** The entire family archive — photos, family tree, films — becomes publicly accessible without a password. CVSS 9.1 (Critical).

**Prevention:**
- Use Next.js 14.2.25 or later (fixes the header exploit on Vercel-hosted apps; Vercel-hosted apps were not affected even before the patch).
- Do NOT use middleware as the only protection. Enforce `auth()` checks inside Server Components and Route Handlers as well — the "data source proximity" principle from Auth.js docs.
- Pattern: middleware handles redirects to `/login` for UX, but every protected Server Component calls `const session = await auth(); if (!session) redirect('/login')` independently.

**Detection:** Try loading `/gallery` with `curl -H "x-middleware-subrequest: middleware" https://your-site.com/gallery` — if unpatched, it serves protected content.

**Phase:** Session 1 (auth scaffold). This is the foundational security decision.

---

### Pitfall 2: AUTH_SECRET / NEXTAUTH_SECRET Missing in Vercel Production

**What goes wrong:** The app works locally but sessions fail silently in production — users cannot log in, cookies are not set, or the auth route throws a 500.

**Why it happens:** Auth.js v5 requires `AUTH_SECRET` (renamed from `NEXTAUTH_SECRET` in v4) to encrypt JWT session tokens. It is auto-generated locally in dev but must be explicitly set in Vercel's environment variables for production and preview environments. The variable name changed between versions; teams copy v4 tutorials and set the wrong name.

**Consequences:** Complete auth failure in production. No login possible.

**Prevention:**
- Generate: `openssl rand -base64 32`
- In Vercel dashboard → Project Settings → Environment Variables: add `AUTH_SECRET` for Production, Preview, and Development environments.
- Do NOT set `NEXTAUTH_URL` on Vercel — Vercel auto-populates `VERCEL_URL`; setting `NEXTAUTH_URL` manually causes callback URL mismatches on preview deployments.
- Never commit `.env.local` with real secrets to git.

**Detection:** Auth sign-in throws `[auth][error] MissingSecret` in Vercel function logs, or sessions return `null` on every request.

**Phase:** Session 1 (auth scaffold) and end of every session that deploys to Vercel.

---

### Pitfall 3: Framer Motion Requires `"use client"` — Breaks Server Components

**What goes wrong:** Framer Motion accesses browser APIs (`window`, `requestAnimationFrame`) that do not exist on the server. Adding a `motion.div` to a Server Component causes a runtime error or silent failure during SSR.

**Why it happens:** Next.js App Router renders components on the server by default. Framer Motion is a client-only library. The `motion.*` primitives are not safe to import in Server Components.

**Consequences:** Build errors, runtime crashes, or hydration mismatches that are hard to trace because the error message points to React internals, not the Framer Motion import.

**Prevention:**
- Every file that uses any Framer Motion export (`motion`, `AnimatePresence`, `useAnimation`, etc.) must begin with `"use client"`.
- Wrap animated components in a dedicated client boundary file (e.g., `components/animated/FadeIn.tsx`) rather than marking entire page files as client components — this preserves RSC benefits for the non-animated parts.
- Use `LazyMotion` with `domAnimation` or `domMax` feature bundles to reduce client bundle size.

**Detection:** Error: `ReferenceError: window is not defined` during `next build` or dev server startup, or hydration mismatch warnings in the browser console.

**Phase:** Session 2 (home page with animations) and Session 4 (family tree with node transitions).

---

### Pitfall 4: AnimatePresence Page Transitions Do Not Work in App Router

**What goes wrong:** Wrapping page content in `AnimatePresence` to get exit animations between routes does nothing — the exit animation never plays and the new page snaps in immediately.

**Why it happens:** Next.js App Router unmounts the old page and mounts the new page synchronously during navigation, giving `AnimatePresence` no time window to play the exit animation. The "FrozenRouter" workaround that circulates in tutorials relies on unexposed Next.js internal APIs and breaks unpredictably.

**Consequences:** Wasted time chasing a feature that cannot work reliably without fragile hacks. Risk of shipping broken navigation if a workaround breaks on a Next.js patch update.

**Prevention:**
- Do not attempt full-page exit transitions in App Router. Use entry-only animations (`initial` + `animate` without `exit`) on page wrapper components — these work reliably.
- For the fade-in effect on navigation, use CSS `view-transitions` API (`next/link` supports it via the `experimental.viewTransition` flag in Next.js 14+) rather than Framer Motion for cross-page transitions.
- Framer Motion `AnimatePresence` works well for within-page transitions: modals, side panels (the family tree detail panel), list item additions/removals, and conditional content — use it there.

**Detection:** Exit animation plays for zero frames then disappears. Or `AnimatePresence` wrapping `{children}` in `layout.tsx` has no effect.

**Phase:** Session 2 (home page) and Session 3 (photo gallery). Avoid the trap before implementing. Session 5 (polish) if view-transitions are added.

---

## Moderate Pitfalls

Issues that cause significant debugging time or require architectural rework if not caught early.

---

### Pitfall 5: relatives-tree Cannot Model Remarriage or Complex Blended Families

**What goes wrong:** A family tree node for someone who remarried (e.g., a widowed grandparent who remarried) causes children to be misplaced or disappear from the rendered tree.

**Why it happens:** `relatives-tree` has a documented open issue (#24, filed June 2024, unfixed as of March 2025) where children of a parent from a previous relationship are dropped when that parent has multiple spouse entries in the data. The library's layout algorithm assumes each person has at most one active spousal unit when placing children.

**Consequences:** Family members missing from the tree silently — the tree renders but looks wrong. Could undermine trust in the accuracy of the family data.

**Prevention:**
- Audit the Curry family data before building the tree. If remarriages exist, prototype with that specific data structure *first* and verify the rendered output matches expectations.
- For known problematic cases, consider flattening: represent the blended family as a single "family unit" node with a note in the side panel rather than trying to encode the full spousal history in the tree node.
- Track the upstream issue; a fix may land before Session 4.

**Detection:** A person present in `content/people.json` does not appear on the rendered tree canvas. Check the browser console — the library may output a warning or silently omit the node.

**Phase:** Session 4 (family tree). Pre-phase data audit is essential.

---

### Pitfall 6: relatives-tree Renders in DOM — Performance Degrades With Large Trees

**What goes wrong:** As the family tree grows (50+ people), scrolling and panning the tree canvas becomes sluggish, especially on mobile.

**Why it happens:** `relatives-tree` produces layout data (positions, connectors) but delegates rendering to your React components. If you render each person as a full DOM element (a common pattern from examples), you end up with dozens of absolutely positioned `div` elements plus SVG connector lines, all re-rendering on pan/zoom events.

**Consequences:** Janky UX on mobile. For a family that may grow to 100+ members over time, this is a real risk.

**Prevention:**
- Memoize node components with `React.memo` to prevent re-renders during panning.
- Use CSS `transform: translate()` for node positioning instead of updating `left/top` properties — `transform` is GPU-accelerated.
- For the initial v1, the Curry tree likely starts small (William Curry + 2-3 generations = 20-40 people). Defer canvas/WebGL rendering optimisation until the tree actually gets large.
- Do not pre-optimise with a Canvas renderer in Session 4 — it will massively increase complexity for a tree that may never have performance problems.

**Detection:** `requestAnimationFrame` callbacks take >16ms during tree pan. Check with Chrome DevTools Performance tab.

**Phase:** Session 4. Monitor, don't pre-optimise.

---

### Pitfall 7: Tailwind Dynamic Class Names Are Purged in Production

**What goes wrong:** Styles work in development but are missing in the production build. This is especially likely when constructing class names from data — for example, generating `bg-navy-800` or `text-gold-500` from a theme config value at runtime.

**Why it happens:** Tailwind's build-time scanner reads source files as plain text and extracts complete class name strings. It cannot evaluate JavaScript expressions. Any class name assembled via string concatenation (`bg-${color}-500`) will never appear as a complete string in source, so Tailwind excludes it from the output CSS.

**Consequences:** Design tokens (navy, gold, ivory) that look fine locally are invisible in production. The AgeWish brand palette disappears.

**Prevention:**
- Always use complete Tailwind class names in JSX. Use lookup objects when the class depends on data: `const bg = { navy: 'bg-navy-800', gold: 'bg-gold-500' }[color]`.
- Extend `theme.colors` in `tailwind.config.ts` with the full AgeWish palette (navy, gold, ivory) and commit that file. Never derive brand colors at runtime.
- Test `next build` output locally (not just `next dev`) before the first Vercel deploy to catch purging issues early.

**Detection:** Visual discrepancy between `next dev` and `next build` output. Use browser DevTools to confirm the class is present in the DOM but missing from the stylesheet.

**Phase:** Session 1 (Tailwind config). The AgeWish theme setup is Session 1 work; get it right then and it won't bite later.

---

### Pitfall 8: JSON Content Files Are Baked Into the Build — Stale Data After Updates

**What goes wrong:** A family photo or person entry is updated in `/content/people.json`, but the live site still shows the old data after `git push`.

**Why it happens:** When JSON is read with `fs.readFileSync` inside a Server Component (or imported directly), Next.js treats the output as static and bakes it into the build output. The file is read once at build time, not on each request. Re-deploying re-reads the files — but if you update a JSON file without triggering a rebuild, the data will be stale.

**Consequences:** New family content doesn't appear until a full redeploy. Confusing if someone updates a JSON file directly without understanding the build model.

**Prevention:**
- This is acceptable for a single-developer project. Document explicitly: "to publish new content, commit the updated JSON and push — Vercel will rebuild."
- Do NOT add `revalidate` timers or ISR unless you plan to have content updates happen outside of git. For a git-managed archive, a full deploy is the correct cache-busting mechanism.
- Never use `fetch()` to load local JSON files in App Router — it invokes the Data Cache layer and its complex revalidation rules. Use `fs.readFileSync` + `JSON.parse` in Server Components, or direct ES module `import` for static data.
- Place content loaders in a single `lib/content.ts` file (already specified in PROJECT.md) so the access pattern is consistent and easy to reason about.

**Detection:** Content in `/content/*.json` changed, pushed, but the live site still shows old data — indicates the deploy didn't trigger or the file wasn't staged in git.

**Phase:** Session 1 (project structure) — establish the pattern. Revisit in Session 3 (photo gallery) when real content starts flowing.

---

## Minor Pitfalls

Issues that cost hours, not days, and are easy to fix once identified.

---

### Pitfall 9: `NEXTAUTH_URL` Set Manually on Vercel Breaks Preview Deployments

**What goes wrong:** Auth callbacks redirect to the wrong URL on Vercel preview deployments (branch previews, PR deploys).

**Why it happens:** Each Vercel preview gets a unique URL. If `NEXTAUTH_URL` is hardcoded to the production domain in Vercel environment variables, Auth.js constructs callback URLs pointing to production instead of the current preview URL.

**Prevention:** Do not set `NEXTAUTH_URL` in Vercel at all. Auth.js v5 on Vercel auto-detects `VERCEL_URL`. If you must override, use `AUTH_URL` (the v5 equivalent) only for the Production environment, not Preview or Development.

**Phase:** Session 1 deploy.

---

### Pitfall 10: YouTube Embeds Set Third-Party Cookies Even in Privacy Mode

**What goes wrong:** Embedding YouTube videos with `youtube.com` iframes sets tracking cookies on page load, even before the user clicks play.

**Why it happens:** YouTube's standard embed loads JavaScript and sets cookies immediately. Using `youtube-nocookie.com` prevents HTTP cookies on load but still writes identifiers to `localStorage` immediately, and sets cookies once play is clicked.

**Consequences:** Not a legal compliance problem for a private family site behind auth, but the page load performance takes a hit from loading YouTube's embed runtime on every `/films` page visit — even for videos the user may not watch.

**Prevention:**
- Use a facade/placeholder pattern: show a static thumbnail with a "play" overlay, only inject the `<iframe>` after user click.
- Next.js's `@next/third-parties` package provides a `YouTubeEmbed` component that uses `lite-youtube-embed` under the hood — this is the right approach. It defers iframe injection until interaction.
- The VideoPlayer abstraction already planned in PROJECT.md (`source: "youtube" | "vimeo"`) is the right place to implement this pattern.

**Detection:** Lighthouse performance score drops significantly when the `/films` page loads multiple video iframes immediately. Check Network tab for early YouTube requests.

**Phase:** Session 3 (video gallery).

---

### Pitfall 11: Auth.js v5 Documentation Is Sparse for Credentials-Only Use Cases

**What goes wrong:** Auth.js v5 is a complete rewrite from NextAuth v4. Most tutorials, Stack Overflow answers, and community examples are v4. Copying v4 patterns into a v5 project causes cryptic failures.

**Why it happens:** The Auth.js team intentionally limits the Credentials provider documentation because they discourage its use for multi-user apps (it cannot persist sessions to a database, requires JWT strategy, and has security tradeoffs). For a single-password family gate this is fine — but the docs do not cover this pattern explicitly.

**Consequences:** Wasted time debugging v4 patterns that don't work in v5. Common traps: `signIn` callback signature changed, `authorize` function placement changed, `secret` option renamed to `AUTH_SECRET` env var.

**Prevention:**
- Read only the official Auth.js v5 docs at `authjs.dev`, not `next-auth.js.org` (which is v4).
- For a single shared password gate, the minimal pattern is: one Credentials provider, `authorize()` that compares `password === process.env.SITE_PASSWORD`, `session: { strategy: "jwt" }`, and middleware that checks `auth()` for the session.
- Store the shared password in `SITE_PASSWORD` env var, not hardcoded in source. This also makes it easy to change.

**Phase:** Session 1 (auth scaffold).

---

### Pitfall 12: relatives-tree Nodes Must Reference Bidirectionally

**What goes wrong:** A person is defined in the data but their parent or child does not exist as a node, or the relationship is declared only one-way. The library silently drops or misplaces the node.

**Why it happens:** `relatives-tree` validates the graph at calculation time. Each relationship reference (parent ID in a child's `parents[]` array) must correspond to an existing node with the matching ID. If you add a child's entry and forget to add the `children: [{id: childId}]` on the parent's node, the library may render without error but produce an incorrect layout.

**Prevention:**
- Write a simple validation function in `lib/content.ts` that checks bidirectional consistency of the family tree data (every `children[]` reference has a corresponding node, every `parents[]` reference exists).
- Run this validator in a test or in `lib/content.ts` at module load time (development only).

**Phase:** Session 4 (family tree). Build the validator before loading real data.

---

## Phase-Specific Warnings

| Phase | Topic | Likely Pitfall | Mitigation |
|-------|-------|---------------|------------|
| Session 1 | Auth scaffold | Middleware-only protection (Critical Pitfall 1) | Add `auth()` checks in Server Components too |
| Session 1 | Auth scaffold | Wrong env var name (`NEXTAUTH_SECRET` vs `AUTH_SECRET`) | Use `AUTH_SECRET` per v5 docs |
| Session 1 | Tailwind setup | Dynamic class purging (Pitfall 7) | Configure full AgeWish palette as named tokens in `tailwind.config.ts` |
| Session 1 | Vercel deploy | `NEXTAUTH_URL` set manually breaks previews (Pitfall 9) | Do not set this variable on Vercel |
| Session 2 | Framer Motion | `"use client"` missing on animated components (Pitfall 3) | Wrap all motion.* usage in client boundary files |
| Session 2 | Framer Motion | Chasing exit animations for page transitions (Pitfall 4) | Entry-only animations; save AnimatePresence for modals/panels |
| Session 3 | Video gallery | YouTube iframe on page load hits performance (Pitfall 10) | Use `@next/third-parties` `YouTubeEmbed` facade component |
| Session 3 | Photo gallery | JSON stale after content updates (Pitfall 8) | Document: commit + push = publish; no ISR needed |
| Session 4 | Family tree | Remarriage / blended family data gaps (Pitfall 5) | Audit Curry family data for multi-spouse cases before coding |
| Session 4 | Family tree | Bidirectional reference errors (Pitfall 12) | Write validator in `lib/content.ts` before loading real data |
| Session 4 | Family tree | DOM rendering performance (Pitfall 6) | Use `React.memo`, CSS transforms; defer canvas optimisation |
| All sessions | Auth.js v5 | Following v4 tutorials (Pitfall 11) | Only read `authjs.dev`, not `next-auth.js.org` |

---

## Sources

- CVE-2025-29927 analysis: [ProjectDiscovery](https://projectdiscovery.io/blog/nextjs-middleware-authorization-bypass), [Vercel Postmortem](https://vercel.com/blog/postmortem-on-next-js-middleware-bypass), [Datadog Security Labs](https://securitylabs.datadoghq.com/articles/nextjs-middleware-auth-bypass/)
- Auth.js v5 Credentials: [authjs.dev Credentials provider](https://authjs.dev/getting-started/providers/credentials), [Auth.js migration guide](https://authjs.dev/getting-started/migrating-to-v5)
- Auth.js Vercel env vars: [Vercel Community — AUTH_SECRET not accessible](https://community.vercel.com/t/auth-secret-env-variable-not-accessible-in-production-runtime/15803), [NextAuth deployment docs](https://next-auth.js.org/deployment)
- Framer Motion SSR: [Medium — 'use client' workaround](https://medium.com/@dolce-emmy/resolving-framer-motion-compatibility-in-next-js-14-the-use-client-workaround-1ec82e5a0c75), [Next.js issue #49279](https://github.com/vercel/next.js/issues/49279)
- AnimatePresence App Router: [imcorfitz.com](https://www.imcorfitz.com/posts/adding-framer-motion-page-transitions-to-next-js-app-router), [Next.js discussion #59349](https://github.com/vercel/next.js/discussions/59349)
- relatives-tree issues: [GitHub issues list](https://github.com/SanichKotikov/relatives-tree/issues), [npm page](https://www.npmjs.com/package/relatives-tree)
- Tailwind purging: [Tailwind discussion #8521](https://github.com/tailwindlabs/tailwindcss/discussions/8521), [LogRocket debugging guide](https://blog.logrocket.com/debugging-tailwind-css-next-js/)
- Next.js JSON/caching: [Next.js caching docs](https://nextjs.org/docs/14/app/building-your-application/data-fetching/fetching-caching-and-revalidating), [Vercel knowledge base](https://vercel.com/kb/guide/loading-static-file-nextjs-api-route)
- YouTube embeds: [Kukie.io privacy mode limitations](https://kukie.io/blog/youtube-embeds-cookie-consent), [next/third-parties YouTubeEmbed](https://nextjs.org/docs/app/guides/third-party-libraries)
