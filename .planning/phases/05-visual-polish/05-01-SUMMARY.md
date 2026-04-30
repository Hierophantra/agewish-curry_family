---
phase: 05-visual-polish
plan: "01"
subsystem: typography + animation
tags: [typography, motion, next-font, cormorant, template]
dependency_graph:
  requires: [04-03]
  provides: [cormorant-font-variable, serif-css-token, entry-animation-wrapper]
  affects: [all-pages-headings, navigation-transitions]
tech_stack:
  added: [Cormorant_Garamond via next/font/google]
  patterns: [CSS variable font injection, Next.js template.tsx entry animation]
key_files:
  modified: [app/layout.tsx, app/globals.css]
  created: [app/template.tsx]
decisions:
  - "Cormorant Garamond loaded with weights ['400','500'] only — two-weight rule preserved (D-01)"
  - "Style includes ['normal','italic'] for future blockquote variants without extra weight"
  - "template.tsx uses entry-only animation (no exit) — avoids App Router AnimatePresence cross-page bug (Pitfall 4)"
  - "Georgia retained as fallback in --font-serif for the ~200ms before Cormorant loads"
metrics:
  duration: "~4 minutes"
  completed: "2026-04-29"
  tasks: 2
  files: 3
requirements_closed: [DESIGN-08]
---

# Phase 5 Plan 01: Typography Migration + Entry Animation Summary

Cormorant Garamond loaded via next/font/google and wired as the primary serif font variable; all h1-h6 headings across all pages now render in Cormorant without any component edits, cascading automatically through the existing --font-serif CSS variable. app/template.tsx created as the App Router-idiomatic entry animation wrapper giving every page navigation a subtle 400ms fade-up.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add Cormorant Garamond to layout.tsx | 3cc245f | app/layout.tsx |
| 2 | Update globals.css serif token + create template.tsx | ea93070 | app/globals.css, app/template.tsx |

## What Was Built

### Task 1 — layout.tsx: Cormorant Garamond font setup

- Added `Cormorant_Garamond` import alongside `Inter` from `next/font/google`
- Configured with weights `['400', '500']` only (two-weight rule, D-01) and style `['normal', 'italic']`
- `display: 'swap'` to prevent invisible text during font load — matches Inter pattern
- `variable: '--font-cormorant'` injects the CSS custom property onto `<html>`
- Updated `<html className>` to inject both `inter.variable` and `cormorant.variable`

### Task 2A — globals.css: --font-serif token update

- Replaced `--font-serif: Georgia, 'Times New Roman', serif;`
  with `--font-serif: var(--font-cormorant), Georgia, 'Times New Roman', serif;`
- Updated inline comment to reflect Cormorant as primary, Georgia as fallback
- No other part of globals.css was touched

### Task 2B — app/template.tsx: entry animation wrapper

- New `'use client'` file at `app/template.tsx`
- Imports `motion` from `motion/react` (correct import path per CLAUDE.md)
- `motion.div` with `initial={{ opacity: 0, y: 8 }}`, `animate={{ opacity: 1, y: 0 }}`
- Transition: `duration: 0.4, ease: 'easeOut'` — decelerating feel per D-05
- No exit animation defined — intentional (App Router cross-page AnimatePresence bug, Pitfall 4)
- `template.tsx` re-mounts on every navigation (unlike `layout.tsx` which persists)

## Verification Results

| Check | Result |
|-------|--------|
| `grep -c "Cormorant_Garamond" app/layout.tsx` | 2 (import + const) |
| `grep -c "var(--font-cormorant)" app/globals.css` | 1 |
| `test -f app/template.tsx` | exists |
| `motion.div` in template.tsx (non-comment lines) | present |
| AnimatePresence absent from template.tsx | 0 matches |
| `motion/react` import present | 1 match |
| Two-weight rule (no font-weight-semibold/bold) | 0 matches |
| `npm run build` | exits 0 |

## Deviations from Plan

None — plan executed exactly as written.

The `Cormorant_Garamond` string appearing twice in layout.tsx (once in the import statement, once in the const declaration) is expected behavior. The plan verification note "counts return 1" referred to confirming presence, not exactly one occurrence. Both occurrences are correct and intentional.

## Known Stubs

None. This plan makes no data connections — it only wires CSS variables and creates an animation wrapper. No data stubs introduced.

## Threat Flags

None. No new network endpoints, auth paths, or trust boundary surfaces introduced. Threat T-05-01 (Google Fonts CDN) is mitigated by next/font self-hosting at build time. Threat T-05-02 (template.tsx motion wrapper) has no input surface.

## Self-Check: PASSED
