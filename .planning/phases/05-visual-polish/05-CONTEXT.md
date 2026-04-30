# Phase 5: Visual Polish - Context

**Gathered:** 2026-04-29
**Status:** Ready for planning
**Mode:** --auto

<domain>
## Phase Boundary

Phase 5 is a quality pass — not a feature addition. Three concrete polish targets across the whole site:

1. **Typography refinement** — migrate from Georgia fallback to Cormorant Garamond via `next/font/google`. Per CONTEXT D-11 from Phase 1, this was deliberately deferred to Phase 5.
2. **Motion entry animations** — page transitions and content fade-ins via `motion/react` so navigation feels less abrupt. Use `template.tsx` (re-mounts on every navigation) per research, NOT `layout.tsx`.
3. **Responsive QA** — every page works on phones (375px wide), tablets (768px), and desktop. Especially: family tree horizontal scroll on narrow screens, photo grid stack, video grid stack.

**In scope:**
- `app/layout.tsx` — replace Georgia fallback with Cormorant Garamond import
- `app/template.tsx` — new file; motion wrapper for entry animation on navigation
- Polish animations: hero (subtle fade-up), section preview cards (stagger), photo cards (subtle reveal), video cards (subtle reveal)
- Family tree mobile: horizontal scrollable container with shadow indicators on narrow screens
- Empty state visual polish (centered, more padding)
- Photo card hover lift (subtle shadow on hover) — restraint: still Server Component, hover via Tailwind only
- Verify all eyebrows, hairlines, spacing tokens are applied consistently
- Cleanup: remove `react-family-tree` from package.json (unused per Phase 4 D-09)

**Out of scope:**
- New features (search, filters, lightbox, person detail pages) — Phase 6
- Major design changes — design language is locked
- Animation libraries beyond `motion` — already installed, sufficient

</domain>

<decisions>
## Implementation Decisions

### Typography Migration

- **D-01:** Use Cormorant Garamond via `next/font/google`. Weights: 400 (regular) and 500 (medium) only — matches the two-weight rule.
- **D-02:** Update `app/layout.tsx`:
  ```tsx
  import { Inter, Cormorant_Garamond } from 'next/font/google'
  const inter = Inter({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-inter' })
  const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-cormorant', style: ['normal', 'italic'] })
  // <body className={`${inter.variable} ${cormorant.variable} bg-white`}>
  ```
- **D-03:** Update `app/globals.css` `@theme {}` block:
  ```css
  --font-serif: var(--font-cormorant), Georgia, 'Times New Roman', serif;
  ```
  Existing `font-serif` Tailwind utility class now resolves to Cormorant. NO component code changes — the change cascades automatically.
- **D-04:** Cormorant has slightly different optical sizing than Georgia. May need a small adjustment to heading sizes. Verify in browser; Phase 5 has discretion to tune.

### Motion / Entry Animations

- **D-05:** Create `app/template.tsx`:
  ```tsx
  'use client'
  import { motion } from 'motion/react'
  export default function Template({ children }: { children: React.ReactNode }) {
    return <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>{children}</motion.div>
  }
  ```
  Subtle 8px fade-up on every navigation. `template.tsx` re-mounts (unlike layout.tsx) — this is the App Router idiomatic location for per-navigation animation.
- **D-06:** Hero on home page: stagger children. StarMark fades in first, then heading, then subtitle, then preview cards. Implement via Framer Motion `staggerChildren` on parent + `initial`/`animate` on children. Hero becomes a Client component (`'use client'`).
- **D-07:** Photo cards: subtle 200ms hover lift via Tailwind only — `hover:shadow-md hover:-translate-y-0.5 transition`. Stays Server Component. Same for video cards.
- **D-08:** Tree node hover: ring-2 ring-gold-deep on hover, signaling "click to open panel."
- **D-09:** Section preview cards on home: subtle hover lift + arrow translates right slightly (`hover:translate-x-1` on the arrow).
- **D-10:** Avoid `AnimatePresence` for cross-page transitions — known broken in App Router (research-flagged). Within-page only (already used in PersonPanel + PhotoCarousel).

### Responsive QA

- **D-11:** Test breakpoints: 375px (mobile), 768px (tablet), 1024px (laptop), 1440px (desktop).
- **D-12:** Family tree: wrap FamilyTreeCanvas in a `overflow-x-auto` container on mobile. Add a subtle ivory gradient at the right edge (signals "scroll for more"). On desktop, fits in the viewport; on mobile, swipes horizontally.
- **D-13:** Photo grid breakpoints already responsive (1/2/3/4 columns). Verify spacing on small screens.
- **D-14:** Video grid breakpoints already responsive (1/2/3 columns). Verify play button is large enough to tap on mobile.
- **D-15:** TopNav on mobile: tabs stack? Or horizontal scroll? Decision: horizontal scroll on small screens (`overflow-x-auto`) — keeps the 4-tab layout visually consistent with the rest of the chrome. Alternative (hamburger menu) is over-engineering for 4 tabs.
- **D-16:** PersonPanel on mobile: full-width sheet sliding from the bottom (instead of right-anchored). Use `md:absolute md:right-0 md:top-0` desktop, `bottom-0 left-0 right-0` mobile. Or simpler: full-screen modal on mobile, panel on desktop.

### Empty States

- **D-17:** Tighten empty state spacing on PhotoGrid, VideoGrid, FamilyTreeCanvas — center vertically with more padding, larger StarMark visual cue (don't break the 3-star rule on home; gallery empty states can have their own decorative star). Wait — strict reading of the brief: "exactly 3 per page" applies always. Decision: empty states get NO star, just text. Keeps the rule intact.

### Cleanup

- **D-18:** Remove `react-family-tree` from `package.json` dependencies — unused per Phase 4 D-09. Reduces install footprint.
- **D-19:** Verify no `font-bold` or `font-semibold` snuck into JSX during phases 2-4. Run `grep -r "font-bold\|font-semibold" components/ app/` — should return zero matches.

### Verification

- **D-20:** Acceptance: `npm run build` exits 0; visual QA at three breakpoints (375/768/1024); typography upgrade visible (Cormorant has narrower x-height than Georgia, characteristic feel); no Title Case anywhere; star count = 3 on home, 2 on internal pages.
- **D-21:** Performance: Cormorant adds ~30KB woff2 — acceptable. Verify no layout shift via CLS check (DevTools).

### Claude's Discretion

- Animation duration tuning (200/400/600ms variants — pick what feels right)
- Hover state easing curves
- Mobile breakpoint micro-adjustments (e.g., where exactly to switch tree to scroll mode)
- Whether photo card hover gets a subtle ivory background glow
- Empty state copy refinements

</decisions>

<canonical_refs>
## Canonical References

### Project Documents
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md` — DESIGN-08 (responsive)
- `.planning/ROADMAP.md` — Phase 5 goal and 3 success criteria

### Phase 1-4 Outputs
- `.planning/phases/01-scaffold-auth-design/01-CONTEXT.md` — full design system (D-11 Cormorant migration deferred to here)
- `.planning/research/PITFALLS.md` — Pitfall 4: AnimatePresence cross-page broken
- `.planning/phases/04-family-tree/04-CONTEXT.md` — D-21 motion package, D-22 motion/react import path

### Source-of-truth Code Files (will be modified)
- `app/layout.tsx` — typography migration
- `app/globals.css` — @theme update
- `app/template.tsx` — NEW file, page transition wrapper
- `components/home/Hero.tsx` — becomes Client Component for stagger animation
- `components/home/SectionPreview.tsx` — hover lift + arrow translate
- `components/gallery/PhotoCard.tsx` — hover lift via Tailwind
- `components/video/VideoCard.tsx` — hover lift via Tailwind
- `components/tree/FamilyTreeCanvas.tsx` — mobile scroll container
- `components/tree/PersonNode.tsx` — hover ring
- `components/tree/PersonPanel.tsx` — mobile bottom-sheet variant
- `components/layout/TopNav.tsx` — mobile horizontal scroll for tabs
- `package.json` — remove react-family-tree

### External Documentation
- `next/font/google` Cormorant Garamond: https://fonts.google.com/specimen/Cormorant+Garamond
- Next.js template.tsx: https://nextjs.org/docs/app/api-reference/file-conventions/template
- Motion staggerChildren: https://motion.dev/docs/react-animation#stagger-children

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `motion` package already installed and used (PersonPanel, PhotoCarousel)
- `next/font/google` already configured for Inter — same pattern works for Cormorant
- Tailwind hover utilities already available — no plugin needed for hover lifts

### Established Patterns
- Server Components by default
- Two-weight rule (400, 500)
- Sentence case
- Tailwind tokens only

### Integration Points
- All components touched in earlier phases get a polish pass
- No new content; no new routes; no new requirements

### Pitfalls
- AnimatePresence cross-page = broken (use template.tsx instead)
- Cormorant Garamond is a different optical size than Georgia — verify spacing
- Mobile responsive: easy to assume desktop sizes work; explicit testing at 375px is required

</code_context>

<specifics>
## Specific Ideas

- Subtle motion is the brief's tone — no aggressive animations, no parallax, no scroll-triggered effects
- Cormorant Garamond is the canonical AgeWish serif (per Phase 1 brief)
- Mobile family tree is the hardest UX problem — horizontal scroll is the pragmatic answer

</specifics>

<deferred>
## Deferred Ideas

- **Photo lightbox / fullscreen** — user wanted this in original brief but deferred from Phase 2; Phase 6 if scoped in
- **Tree zoom controls** — pinch zoom on mobile is a phone-native gesture; out of scope unless requested
- **Dark mode** — explicitly out of scope per archive aesthetic
- **Page-level metadata refinement (favicon, OG image)** — minor, can do anytime
- **Loading states** — Server Components don't really have these; can add Suspense boundaries if perceived perf is poor

</deferred>

---

*Phase: 5-Visual Polish*
*Context gathered: 2026-04-29*
