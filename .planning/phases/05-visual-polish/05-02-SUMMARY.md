---
phase: 05-visual-polish
plan: 02
subsystem: ui-animation
tags: [motion, hover, stagger, cards, accessibility]
dependency_graph:
  requires: [05-01]
  provides: [hero-stagger, hover-lift-cards, person-node-ring]
  affects: [components/home/Hero.tsx, components/home/SectionPreview.tsx, components/gallery/PhotoCard.tsx, components/video/VideoCard.tsx, components/tree/PersonNode.tsx]
tech_stack:
  added: []
  patterns: [motion-stagger-children, tailwind-hover-lift, css-group-hover]
key_files:
  created: []
  modified:
    - components/home/Hero.tsx
    - components/home/SectionPreview.tsx
    - components/gallery/PhotoCard.tsx
    - components/video/VideoCard.tsx
    - components/tree/PersonNode.tsx
decisions:
  - Motion itemVariants ease requires 'as const' assertion to satisfy TypeScript Easing type
  - PhotoCard innerContent refactored to avoid duplication across two render paths
  - SectionPreview uses CSS group + group-hover:[&_span]:translate-x-1 for arrow animation
metrics:
  duration: "2m 43s"
  completed: "2026-04-30"
  tasks_completed: 2
  files_modified: 5
---

# Phase 5 Plan 02: Hover Lifts + Hero Stagger Animation Summary

Hero upgraded to Client Component with motion staggerChildren (star → heading → subtitle, 0.12s stagger); photo/video/section-preview cards receive Tailwind hover lifts; PersonNode gets gold ring on hover.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Hero stagger animation | 7ae28ab, 495754e | components/home/Hero.tsx |
| 2 | Hover lifts on cards + PersonNode ring | ca272e4 | SectionPreview.tsx, PhotoCard.tsx, VideoCard.tsx, PersonNode.tsx |

## What Was Built

### Task 1 — Hero stagger animation (Client Component upgrade)

`components/home/Hero.tsx` converted from Server Component to Client Component:
- Added `'use client'` directive
- Imported `motion` from `motion/react`
- `containerVariants`: `staggerChildren: 0.12`, `delayChildren: 0.05`
- `itemVariants`: `hidden { opacity: 0, y: 12 }` → `visible { opacity: 1, y: 0, duration: 0.45 }`
- `<section>` replaced with `<motion.section variants={containerVariants} initial="hidden" animate="visible">`
- StarMark, h1, and p each wrapped in motion elements with `variants={itemVariants}`
- No AnimatePresence added (cross-page handled by template.tsx)

### Task 2 — Hover lifts on cards + PersonNode ring

**SectionPreview.tsx:** Card outer div gains `group rounded p-3 -mx-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm`. Arrow Link gains `group-hover:[&_span]:translate-x-1`. Arrow character wrapped in `<span className="inline-block transition-transform duration-200">` so it translates right on card hover.

**PhotoCard.tsx:** Refactored to extract `innerContent` fragment (shared between paths). For the Link render path, hover lift classes on `<Link className="block transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">`. For the plain path, hover lift classes on `<article className="flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">`. Stays Server Component.

**VideoCard.tsx:** `<article>` gains `transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`. Stays Server Component.

**PersonNode.tsx:** Inactive state class string gains `hover:ring-2 hover:ring-gold-deep` — communicates clickability on mobile where cursor:pointer is invisible. Active state unchanged.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript Easing type error on Hero itemVariants**
- **Found during:** Task 1 build verification
- **Issue:** `ease: 'easeOut'` typed as `string` but `motion/react` Variants requires `Easing` (literal union type)
- **Fix:** Added `as const` assertion: `ease: 'easeOut' as const`
- **Files modified:** components/home/Hero.tsx
- **Commit:** 495754e

## Verification Results

| Check | Result |
|-------|--------|
| `grep -c "'use client'" components/home/Hero.tsx` | 1 |
| `grep -c "staggerChildren" components/home/Hero.tsx` | 2 |
| `grep -c "hover:shadow-md" components/gallery/PhotoCard.tsx` | 2 (link path + article path) |
| `grep -c "hover:shadow-md" components/video/VideoCard.tsx` | 1 |
| `grep -c "hover:ring-2" components/tree/PersonNode.tsx` | 1 |
| `grep -c "hover:translate-x\|translate-x-1" components/home/SectionPreview.tsx` | 1 |
| font-bold/font-semibold audit | CLEAN - no matches |
| 'use client' in PhotoCard/VideoCard/SectionPreview | 0 each (all stay Server Components) |
| `npm run build` | exits 0 |

## Known Stubs

None.

## Threat Flags

No new network endpoints, auth paths, file access patterns, or schema changes introduced. Hero.tsx motion variants are static config with no user input surface. Threat register T-05-03 and T-05-04 both accepted as documented.

## Self-Check: PASSED

All modified files confirmed present. All task commits confirmed in git log:
- 7ae28ab (Hero stagger feat)
- 495754e (Hero TypeScript fix)
- ca272e4 (hover lifts + ring feat)
