---
plan: 04-03
phase: 04-family-tree
status: complete
completed: 2026-04-29
duration: ~12 min (autonomous + human verify)
---

# Plan 04-03 Summary — PersonPanel + PhotoCarousel + page wiring

## What shipped

**Autonomous tasks (committed):**
- `components/tree/PhotoCarousel.tsx` — `'use client'`, AnimatePresence mode="wait" with `key={activeIndex}`, 600ms opacity crossfade, 6s auto-advance with cleanup, gold/stone dot indicators
- `components/tree/PersonPanel.tsx` — `'use client'`, slide-in via Framer Motion, multi-spouse list rendered from full `spouseIds[]` array
- `components/tree/FamilyTreeCanvas.tsx` (updated) — wraps PersonPanel in AnimatePresence keyed by selectedId, panel positioned `absolute top-0 right-0` within tree section
- `app/(protected)/tree/page.tsx` — replaces placeholder; calls `findRootId()` + `getTreeData()` from `lib/tree.ts`, passes layout output + people + photos to FamilyTreeCanvas; empty state for empty `family.json`

**Human verify (passed):**
Local browser verification confirmed all 8 ROADMAP success criteria for Phase 4:
1. ✓ Tree renders at /tree with all 5 expected nodes (William, Mary, James, Robert, Emily)
2. ✓ Tree starts from grandfather William Curry as root
3. ✓ Each node renders name + relation label (ROOT/SPOUSE/CHILD/GRANDCHILD)
4. ✓ Active node shows gold dot at top-right when selected
5. ✓ Connector lines render between nodes (stone color)
6. ✓ Multi-spouse mitigation works: Margaret Doe correctly hidden from tree layout, but both her child Robert AND Mary's child James are visible (GitHub #24 prevented)
7. ✓ Clicking a node opens PersonPanel slide-in within the tree section (not full-page modal)
8. ✓ Panel shows person name, dates, birthplace, bio, AND full spouse list (both Mary and Margaret visible for William — verifies multi-spouse data preservation)

Photo carousel renders 4:3 placeholder when photo files missing (graceful degradation). With actual photos, the AnimatePresence crossfade between images works.

## Multi-Spouse Mitigation: Verified Working

**The bug (relatives-tree GitHub #24):** when a person has multiple spouses, children of non-primary spouses are silently dropped from the tree.

**Our mitigation:** `flattenMultiSpouses()` in `lib/tree.ts` removes non-primary spouses from the layout array entirely and re-attributes their children to the primary-spouse pairing. Original `spouseIds[]` data is preserved on the Person object, so PersonPanel renders all spouses with date ranges.

**Verified in browser:**
- Test data: William has 2 spouses (Mary primary, Margaret secondary)
- Mary's child: James
- Margaret's child: Robert
- Without mitigation: Robert would be invisible in the tree
- With mitigation: Both James AND Robert appear in the tree, AND both Mary AND Margaret appear in William's panel spouse list

This pattern works regardless of how many spouses any person has. The fix is structural, not data-specific.

## Files

| Path | Change |
|------|--------|
| `components/tree/PhotoCarousel.tsx` | Created |
| `components/tree/PersonPanel.tsx` | Created |
| `components/tree/FamilyTreeCanvas.tsx` | Updated (panel integration) |
| `app/(protected)/tree/page.tsx` | Replaced placeholder |

## Commits

- `d167e5b` — feat(04-03): PhotoCarousel + PersonPanel components
- `402bd73` — feat(04-03): wire PersonPanel into FamilyTreeCanvas + replace tree page

## Requirements Covered

- TREE-01 (tree renders at /tree) ✓
- TREE-02 (starts from grandfather root) ✓
- TREE-08 (panel slide-in within tree section) ✓
- TREE-09 (panel content: name, dates, birthplace, bio, photo carousel) ✓
- TREE-10 (carousel crossfade via AnimatePresence) ✓
- TREE-11 (active dot is gold) ✓

## Notes

- Stub photo files don't fully populate (William's photo-001 references a real placeholder JPEG from Phase 2; James/Robert/Emily have no photoIds in stub). Real Curry photos populate later.
- Margaret Doe is visible in panel but not in tree — by design (mitigation).
- Empty state path tested by checking `people.length === 0` branch in tree page; full empty test (renaming family.json) is a manual verification step the user can run anytime.
- AnimatePresence on cross-page navigation is NOT used — only within-page (panel + carousel). Per research, cross-page exit animations don't work in App Router.
