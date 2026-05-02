---
phase: 15
plans: [15-01, 15-02]
subsystem: schema + accessibility
tags: [provenance, a11y, focus-trap, reduced-motion, keyboard-nav, aria]
dependency_graph:
  requires: [Phase 14 — visual polish, focus rings]
  provides: [provenance metadata schema, focus traps, reduced-motion respecting animations, keyboard tree navigation, ARIA dialog semantics]
  affects: [Photo, Video, Person schemas; Lightbox, VideoLightbox, PersonPanel, PhotoCarousel, Hero, template]
tech_stack:
  added: [lib/focus-trap.ts (new useFocusTrap hook)]
  patterns: [useReducedMotion from motion/react, useFocusTrap custom hook, ARIA labelledby pattern, spatial arrow-key nav by row/column proximity]
key_files:
  created:
    - lib/focus-trap.ts
    - .planning/phases/15-v2-1-schema-a11y/15-SUMMARY.md
  modified:
    - components/lightbox/Lightbox.tsx
    - components/lightbox/VideoLightbox.tsx
    - components/tree/PersonPanel.tsx
    - components/tree/PhotoCarousel.tsx
    - components/tree/FamilyTreeCanvas.tsx
    - components/tree/PersonNode.tsx
    - components/home/Hero.tsx
    - app/template.tsx
    - lib/types.ts
    - content/photos.json
    - content/family.json
decisions:
  - "useFocusTrap hook owns previousFocusRef — returns focus on useEffect cleanup (unmount), not on explicit close call — so focus is restored regardless of how the modal closes"
  - "PersonPanel aria-modal=true (not false) because Tab IS genuinely trapped via useFocusTrap — consistency between implementation and declaration"
  - "Arrow-key tree nav uses node.top/node.left grid coordinates, not pixel positions, for stable spatial neighbours — H_UNIT/V_UNIT multiply out but comparisons are clean at grid scale"
  - "PhotoCarousel crossfade: kept as inline style transition rather than converting to motion.div — avoids rearchitecting the opacity-stacking pattern; useReducedMotion guards the transition value"
  - "Lightbox aria-labelledby targets the caption div; if no caption is present aria-labelledby points at an element that may be absent — acceptable tradeoff (photo.caption or photo.id is always present in practice)"
  - "focusedNodeId is separate state from selectedId in FamilyTreeCanvas — keyboard focus and panel-open selection are independent concepts; user can arrow-key to a node without opening its panel"
metrics:
  duration: "~45 minutes"
  completed: "2026-04-29"
  tasks_completed: 11
  files_modified: 11
---

# Phase 15: v2.1 Schema + Accessibility — Summary

## One-liner

Provenance schema (source/circa/confidence/identifiedBy/lastVerified) on photos/people, plus full accessibility hardening: focus traps with return-focus in all three modals, genuine prefers-reduced-motion on all six animation surfaces, spatial arrow-key tree navigation, and ARIA dialog semantics.

## Plan 15-01: Provenance Metadata Schema

Added provenance fields to Photo, Video, and Person types — `source`, `circa`, `confidence`, `identifiedBy`, `lastVerified` — with Zod validation and optional defaulting. Surfaced `circa` and `source` in Lightbox caption display. Added example data to stub JSON. Updated CONTENT_AUTHORING.md with authoring guidance.

**Commits:**
- `d1d936a` — add provenance fields to Photo, Video, Person schemas
- `66fac87` — add example provenance entries to stub data
- `d44b958` — subtly surface circa/source in lightbox metadata
- `464811f` — add provenance authoring guide to CONTENT_AUTHORING.md

## Plan 15-02: Accessibility Hardening

### Task 1: useFocusTrap hook (`lib/focus-trap.ts`)

A self-contained client hook that:
- Traps Tab and Shift+Tab within the container element while `active` is true
- Saves the previously-focused element via `previousFocusRef` on activation
- Restores focus to that element in the `useEffect` cleanup (on unmount)
- Selects all standard interactive elements via the `FOCUSABLE_SELECTOR` query

**Commit:** `16e5d0d`

### Task 2: Focus trap applied to modals

Applied `useFocusTrap<T>(true)` to the outermost element of:
- **Lightbox** — `motion.div` backdrop; close button gets focus on open; Tab cycles Close → Prev → Next
- **VideoLightbox** — same; Close → Prev → Next
- **PersonPanel** — `motion.aside`; close button gets focus on open; Tab cycles Close → "View full page" link

Focus is automatically returned to the tree node / photo thumbnail that triggered the modal when it unmounts.

**Commit:** `50fddd5`

### Task 3: prefers-reduced-motion (genuine skip, not duration reduction)

Applied `useReducedMotion()` from motion/react to all six animation surfaces:

| Surface | Animation | Reduced behaviour |
|---------|-----------|-------------------|
| `app/template.tsx` | Page entry fade-up (0.4s) | `initial: false` — content appears without motion |
| `components/home/Hero.tsx` | Stagger fade-up | `initial: false` + zero-duration variants |
| `components/lightbox/Lightbox.tsx` | Backdrop fade + photo crossfade | `duration: 0` on enter/exit |
| `components/lightbox/VideoLightbox.tsx` | Backdrop fade + video crossfade | `duration: 0` on enter/exit |
| `components/tree/PersonPanel.tsx` | Slide-in from right | `duration: 0` — instant appear |
| `components/tree/PhotoCarousel.tsx` | CSS 1.2s opacity crossfade | `transition: 'none'` inline style override |

All reductions are genuine skips (instant transitions), not shortened durations.

**Commit:** `ba0bf21`

### Task 4: Keyboard navigation in FamilyTreeCanvas

Added `focusedNodeId` state (separate from `selectedId` / panel-open state) and an `onKeyDown` handler on the canvas container:

- **ArrowRight/Left** — moves to the nearest node on the same row (same `node.top` value)
- **ArrowUp/Down** — moves to the horizontally-closest node on the adjacent row above/below
- **Escape** — closes panel if open; otherwise blurs the tree
- **Enter/Space** — existing button semantics open the panel (unchanged)
- **Tab** — existing Tab order preserved; nodes receive native focus ring

PersonNode gained `isFocused: boolean` prop (visible gold ring) and `onRef` callback for imperative focus from the canvas.

Canvas container has `role="group"` and `aria-label` with keyboard instructions for screen reader users.

**Commit:** `c6ca19b`

### Task 5: ARIA dialog roles + labels

| Component | Change |
|-----------|--------|
| PersonPanel | Added `role="dialog"` + `aria-modal="true"` + `aria-labelledby="person-panel-name-{id}"`; h2 got matching `id` |
| Lightbox | Changed `aria-label` to `aria-labelledby="lightbox-caption"`; caption div got `id="lightbox-caption"` |
| VideoLightbox | Changed `aria-label` to `aria-labelledby="video-lightbox-title"`; title p got `id="video-lightbox-title"` |
| PhotoCarousel | Added `aria-live="polite"` + `aria-atomic="true"` + `aria-label` on image container to announce photo changes |

**Commit:** `7a0238e`

## Deviations from Plan

### Auto-fixed Issues

None. All tasks executed as specified.

### Decision log

1. **PersonPanel aria-modal=true** — the plan listed `aria-modal="false"` as an option since the page remains readable, but since `useFocusTrap` genuinely traps Tab interaction, `aria-modal="true"` is the correct declaration. Documented above.

2. **Arrow-key nav: full spatial implementation delivered** — the plan offered Tab/Enter/Escape as a fallback. Full spatial grid navigation was implemented using `node.top`/`node.left` grid coordinates. No fallback was needed.

3. **PhotoCarousel kept CSS-based** — the plan offered converting to `motion.div` OR adding an inline style guard. The inline style guard (`transition: reduce ? 'none' : ...`) was chosen as it required no structural changes to the opacity-stacking pattern. Correct for this component.

## Known Stubs

None. All provenance fields are optional (schema is complete; data authoring is the user's responsibility per CONTENT_AUTHORING.md).

## Threat Flags

None introduced. All changes are purely client-side accessibility/UX improvements with no new network endpoints, auth paths, or schema changes at trust boundaries.

## Self-Check: PASSED
