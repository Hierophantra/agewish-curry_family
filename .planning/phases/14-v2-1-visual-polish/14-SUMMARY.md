---
phase: 14
plans: [14-01, 14-02]
subsystem: ui
tags: [panel, layout, empty-states, not-found, typography, nav, accessibility]
dependency_graph:
  requires: [phase-13]
  provides: [panel-sheet-ux, custom-404, polished-empty-states]
  affects: [tree, person-pages, galleries, playlists]
tech_stack:
  added: []
  patterns:
    - fixed-position panel sheet (viewport-anchored, no tree shrink)
    - custom not-found with archival copy
    - consistent empty-state design pattern (eyebrow + serif heading + muted body)
key_files:
  created:
    - app/not-found.tsx
  modified:
    - components/tree/PersonPanel.tsx
    - components/tree/FamilyTreeCanvas.tsx
    - components/tree/PhotoCarousel.tsx
    - components/gallery/CollectionGrid.tsx
    - components/gallery/CollectionPhotoGrid.tsx
    - components/video/PlaylistGrid.tsx
    - components/video/PlaylistVideoGrid.tsx
    - app/(protected)/person/[id]/page.tsx
    - app/layout.tsx (14-01 — font sizes, globals)
    - app/globals.css (14-01 — eyebrow/hairline utilities)
    - components/nav/TopNav.tsx (14-01 — remove Sign out, active tab)
    - content/family.json (14-01 — PATRIARCH -> GRANDFATHER labels)
decisions:
  - "PersonPanel fixed-position viewport sheet — no backdrop on desktop, tree always visible behind"
  - "Panel z-40 (above tree gradient z-20 and nodes, below any future z-50 modals)"
  - "PlaylistGrid empty state upgraded to eyebrow + serif heading pattern to match CollectionGrid"
  - "Person page combined empty state uses italic serif for softer archival voice"
  - "Bio removed from PersonPanel — info + photos only; bio retained on /person/[id] full page"
metrics:
  duration: "~10m (14-01 ~8m, 14-02 ~2m)"
  completed: "2026-05-02"
  tasks_14_01: 5
  tasks_14_02: 5
  files_changed: 14
---

# Phase 14: v2.1 Visual + UX Polish Summary

**One-liner:** PersonPanel restructured as fixed viewport sheet; bio removed; custom 404 added; empty states rewritten with archival voice; plus all 14-01 chrome polish (font sizes, navy/gold saturation, Sign out removal, focus rings, relation label normalization).

## Plans Covered

This summary covers both plans in Phase 14:
- **14-01:** Chrome polish (5 items: font sizes, saturation, nav, focus rings, relation labels)
- **14-02:** Panel restructure + bio removal + custom 404 + empty state copy (5 items)

## Phase 14-01 Work (committed before this plan)

| Commit | Description |
|--------|-------------|
| 017a0a0 | Bump font sizes globally — hero, headers, body, eyebrows |
| 782ab9d | Remove Sign out + upgrade active tab highlight in TopNav/NavTabs |
| 6beec4f | Increase navy/gold saturation across page headers and dividers |
| 6a94d56 | Replace browser default focus rings with branded gold ring (keyboard-only) |
| 370ed60 | Normalize family.json relation labels (PATRIARCH -> GRANDFATHER) |

## Phase 14-02 Work

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 3632593 | PersonPanel fixed-position right sheet |
| 2 | 56820af | Remove bio section from PersonPanel |
| 3 | b711a3c | Custom not-found.tsx with archival copy |
| 4 | e4518f1 | Polish empty state copy across 6 components |

## Key Changes

### PersonPanel restructure (Task 1)

**Before:** Panel was `md:absolute md:top-0 md:right-0 md:h-full md:w-80` — docked inside the tree's scroll container. As more generations were added vertically, the panel competed with the tree for horizontal space.

**After:** Panel is `md:fixed md:top-0 md:right-0 md:h-screen md:w-[400px] z-40` — viewport-anchored sheet that slides in from the right edge. The tree container stays at its full natural width regardless of panel state. The tree and panel no longer compete.

Mobile bottom-sheet variant (D-16: `fixed bottom-0 inset-x-0 max-h-[80vh] rounded-t-xl`) is unchanged.

### Bio removal (Task 2)

Panel now shows: eyebrow | name | dates | photo carousel | meta rows | "View full page" link. The bio block (`person.bio`) was removed. Full bio remains on `/person/[id]` where it belongs.

Verified: `grep -c "person.bio|panel-bio" components/tree/PersonPanel.tsx` returns 0.

### Custom 404 (Task 3)

`app/not-found.tsx` at root scope. Applies to all unmatched routes and anywhere `notFound()` is called (person pages, collection pages, playlist pages). Copy: "This page is not in the archive" serif h1 + "doesn't exist — or was moved before being remembered" italic subtitle.

### Empty state copy (Task 4)

| Component | Before | After |
|-----------|--------|-------|
| CollectionGrid | "Photo collections will appear here as they are added" | "Collections of photographs will appear here as they are gathered into the archive." |
| CollectionPhotoGrid | "...will appear here." | "...will appear here as they are added." |
| PlaylistGrid | Plain muted small text | Upgraded to eyebrow + serif heading + muted body (matches CollectionGrid pattern) |
| PlaylistVideoGrid | "...will appear here." | "...will appear here as they are gathered." |
| Person page empty | Small `text-muted text-sm` | Italic serif, "films", "have been added to the archive yet." |
| PhotoCarousel empty | "No photographs of this person yet" | "No photographs yet" (simpler) |

## Deviations from Plan

None. Plan executed exactly as written.

## Success Criteria Verification

- [x] PersonPanel uses fixed positioning on desktop (md:fixed, md:h-screen)
- [x] FamilyTreeCanvas no longer applies any padding-right when panel is open
- [x] grep -c "person.bio|panel-bio" components/tree/PersonPanel.tsx returns 0
- [x] app/not-found.tsx exists with serif h1 + italic subtitle + return-home link
- [x] Empty state copy updated in 6 components (CollectionGrid, PlaylistGrid, CollectionPhotoGrid, PlaylistVideoGrid, person page, PhotoCarousel)
- [x] npm run build exits 0 (22 pages)
- [x] SUMMARY.md written for Phase 14 (this file, covering both 14-01 and 14-02)

## Self-Check: PASSED

All files exist. All commits verified in git log. Build exits 0.
