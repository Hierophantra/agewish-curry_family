---
phase: 04-family-tree
plan: 02
subsystem: family-tree-rendering
tags: [client-components, tree-canvas, person-node, connector-line, motion, use-client]
dependency_graph:
  requires:
    - lib/tree.ts (NODE_WIDTH, NODE_HEIGHT, H_UNIT, V_UNIT, TreeData type)
    - lib/types.ts (Person, Photo types)
    - relatives-tree/lib/types (ExtNode, Connector types)
    - motion/react (AnimatePresence)
  provides:
    - components/tree/FamilyTreeCanvas.tsx (client island: selectedId state, node+connector loops)
    - components/tree/PersonNode.tsx (160x60 node button, active/inactive states, eyebrow label)
    - components/tree/ConnectorLine.tsx (1px axis-aligned stone div connector)
  affects:
    - app/(protected)/tree/page.tsx (Plan 04-03 will wire FamilyTreeCanvas here)
    - components/tree/PersonPanel.tsx (Plan 04-03 will be imported into FamilyTreeCanvas)
tech_stack:
  added: []
  patterns:
    - client island with useState for selectedId toggle
    - absolute positioning via CSS transform: translate(left*H_UNIT, top*V_UNIT)
    - connector-before-node render order (z-index stacking)
    - pointer-events-none on connectors (preserves node click targets)
    - eslint-disable-next-line for intentionally unused future props
key_files:
  created:
    - components/tree/FamilyTreeCanvas.tsx
    - components/tree/PersonNode.tsx
    - components/tree/ConnectorLine.tsx
  modified: []
decisions:
  - "PersonNode accepts `node: ExtNode` in props interface (for type safety at call site) but does not render from it — name resolved by FamilyTreeCanvas via Person[] lookup. _node prefix + eslint-disable used since node is a required future-compatibility prop."
  - "eslint-disable-next-line comments added for _node (PersonNode) and _photos (FamilyTreeCanvas) — both are intentionally unused stubs for Plan 04-03, accepted as deviations from pure no-unused-vars"
  - "ConnectorLine duplicates H_UNIT/V_UNIT constants locally rather than importing from lib/tree.ts — lib/tree.ts is server-only (import server-only), importing it in a client component would fail at build time"
metrics:
  duration: "2m 23s"
  completed_date: "2026-04-30"
  tasks_completed: 2
  files_modified: 3
requirements:
  - TREE-01
  - TREE-02
  - TREE-03
  - TREE-04
  - TREE-05
---

# Phase 4 Plan 02: FamilyTreeCanvas, PersonNode, ConnectorLine Summary

**One-liner:** Client rendering layer — FamilyTreeCanvas island with selectedId state, PersonNode 160x60px interactive buttons with active/inactive visual states, and ConnectorLine 1px stone axis-aligned positioned divs.

## What Was Built

### components/tree/ConnectorLine.tsx

Axis-aligned connector line rendered as an absolutely positioned `<div>` (not SVG — per D-12). Receives `x1, y1, x2, y2` in grid units; multiplies by local H_UNIT/V_UNIT constants to compute pixel positions. Horizontal when `y1 === y2` (1px tall, full width), vertical otherwise (1px wide, full height).

Key props interface:
```typescript
interface ConnectorLineProps {
  x1: number
  y1: number
  x2: number
  y2: number
}
```

Design decisions:
- `bg-stone` (#C9C4B0) matches D-12 connector color
- `pointer-events-none` prevents connectors from blocking PersonNode click events
- H_UNIT/V_UNIT duplicated locally (not imported from lib/tree.ts) — lib/tree.ts has `import 'server-only'` and cannot be imported in client components

### components/tree/PersonNode.tsx

Interactive 160x60px button node (per D-13). Renders person name in `font-serif text-navy` and relation label in `eyebrow text-quiet`. Receives positioning via `style: CSSProperties` from the canvas parent.

Key props interface:
```typescript
interface PersonNodeProps {
  node: ExtNode       // required for type safety at call site; not rendered directly
  name: string        // resolved by FamilyTreeCanvas from Person[] lookup
  isActive: boolean
  relationLabel: string  // e.g., "ROOT", "CHILD", "GRANDCHILD", "SPOUSE", "PARENT", "FAMILY"
  onClick: () => void
  style: CSSProperties
}
```

Visual states (per D-11):
- **Inactive:** `bg-white hairline border-stone hover:bg-ivory`
- **Active:** `bg-ivory hairline-emphasis border-navy` + gold dot (`w-2 h-2 rounded-full bg-gold`) at `top-1.5 right-1.5`

### components/tree/FamilyTreeCanvas.tsx

Main client island. Owns `selectedId: string | null` via `useState`. Maps `nodes[]` → `<PersonNode>` and `connectors[]` → `<ConnectorLine>`.

Key props interface:
```typescript
export interface FamilyTreeCanvasProps {
  nodes: readonly ExtNode[]
  connectors: readonly Connector[]
  canvas: { width: number; height: number }
  people: Person[]
  photos: Photo[]    // unused until PersonPanel wired in Plan 04-03
}
```

Key behaviors:
- Canvas container: `overflow-x-auto` for horizontal scroll on narrow viewports (D-10)
- Inner container: `relative`, pixel dimensions computed as `canvas.width * H_UNIT` × `canvas.height * V_UNIT`
- Connector render order: connectors drawn BEFORE nodes (z-index stacking)
- Node positioning: `position: absolute; transform: translate(${node.left * H_UNIT}px, ${node.top * V_UNIT}px)`
- Click toggle: `onClick={() => setSelectedId(node.id === selectedId ? null : node.id)}`
- `getRelationLabel()` helper: BFS on `childIds` from root to determine depth (ROOT, CHILD, GRANDCHILD, DESCENDANT), then fallback checks for SPOUSE, PARENT, FAMILY
- `<AnimatePresence mode="wait">` slot present for PersonPanel (Plan 04-03)

## Known Stubs

| Stub | File | Line | Reason |
|------|------|------|--------|
| `PersonPanel` not imported or rendered | `components/tree/FamilyTreeCanvas.tsx` | 11, 119 | Intentional — Plan 04-03 wires PersonPanel. AnimatePresence renders `{null}` as placeholder. |
| `photos` prop accepted but unused (`_photos`) | `components/tree/FamilyTreeCanvas.tsx` | 68 | Intentional — PersonPanel will consume photos. Prop accepted now for clean interface. |

These stubs do NOT prevent the plan's goal (rendering the tree canvas with nodes and connectors). They are explicitly deferred to Plan 04-03 per the plan spec.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ESLint @typescript-eslint/no-unused-vars failures on `_` prefixed params**
- **Found during:** Task 2 — `npm run build` linting phase
- **Issue:** `next/typescript` ESLint config does not enable the `argsIgnorePattern: "^_"` option for `@typescript-eslint/no-unused-vars`. Destructured params `_node` (PersonNode) and `_photos` (FamilyTreeCanvas) — prefixed with `_` per plan spec — caused build failure.
- **Fix:** Added `// eslint-disable-next-line @typescript-eslint/no-unused-vars` comments above each occurrence. The `_` prefix is preserved as a semantic signal that the param is intentionally unused/future.
- **Files modified:** `components/tree/PersonNode.tsx`, `components/tree/FamilyTreeCanvas.tsx`
- **Commit:** 6b9c461

**2. [Rule 3 - Blocking] FamilyTreeCanvas and ConnectorLine cannot import from lib/tree.ts (server-only)**
- **Found during:** Task 1 (ConnectorLine architectural analysis); Task 2 post-build for FamilyTreeCanvas
- **Issue:** `lib/tree.ts` contains `import 'server-only'`. The plan spec included `import { NODE_WIDTH, NODE_HEIGHT, H_UNIT, V_UNIT } from '@/lib/tree'` in FamilyTreeCanvas — this would cause a server-only boundary error when the tree page (Plan 04-03) wires FamilyTreeCanvas into the RSC tree.
- **Fix:** NODE_WIDTH (160), NODE_HEIGHT (60), H_UNIT (200), V_UNIT (100) duplicated as local constants in both `ConnectorLine.tsx` and `FamilyTreeCanvas.tsx`. The `@/lib/tree` import line was removed from FamilyTreeCanvas. Both files have a comment: "keep in sync with lib/tree.ts."
- **Files modified:** `components/tree/ConnectorLine.tsx`, `components/tree/FamilyTreeCanvas.tsx`
- **Commits:** a6cfec4 (ConnectorLine), 6e02a75 (FamilyTreeCanvas)

## Threat Surface Assessment

| Threat | Status |
|--------|--------|
| T-04-02-01: PersonNode onClick spoofing | ACCEPTED — onClick sets local React state only; no auth-sensitive action |
| T-04-02-02: RSC props serialization info disclosure | ACCEPTED — tree route is behind auth() in layout; tree data not sensitive beyond gate |
| T-04-02-03: DoS via large node array | ACCEPTED — Curry family tree <= 100 nodes; no virtualization needed |

No new threat surface beyond plan spec.

## Self-Check: PASSED

- components/tree/ConnectorLine.tsx exists with `'use client'` directive at line 3
- components/tree/PersonNode.tsx exists with `'use client'` directive at line 3
- components/tree/FamilyTreeCanvas.tsx exists with `'use client'` directive at line 3
- grep -c "motion/react" FamilyTreeCanvas.tsx = 1
- grep -c "framer-motion" FamilyTreeCanvas.tsx (non-comment) = 0
- grep -c "bg-gold" PersonNode.tsx = 1
- grep -c "bg-stone" ConnectorLine.tsx = 2 (comment + className — both correct)
- grep -c "pointer-events-none" ConnectorLine.tsx = 2 (comment + className — both correct)
- grep -c "useState" FamilyTreeCanvas.tsx = 2 (import + usage)
- no `import '@/lib/tree'` or `import 'server-only'` in any client component
- npm run build exits 0
- Commits: a6cfec4 (ConnectorLine), 6b9c461 (PersonNode + FamilyTreeCanvas), 6e02a75 (server-only fix)
