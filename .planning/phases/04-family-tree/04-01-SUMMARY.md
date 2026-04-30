---
phase: 04-family-tree
plan: 01
subsystem: family-tree-data-layer
tags: [schema, tree-adapter, multi-spouse, server-only, bidirectional-validation]
dependency_graph:
  requires:
    - lib/content.ts (getPeople, existing bidirectional validator)
    - lib/types.ts (PersonSchema base)
    - content/family.json (existing 3-person stub)
  provides:
    - lib/tree.ts (getTreeData, findRootId, flattenMultiSpouses)
    - PersonSchema.gender field
    - validateBidirectionalRefs() tree cross-reference block
    - 6-person multi-spouse family.json dataset
  affects:
    - All components that import from lib/tree.ts (Plans 04-02, 04-03)
    - Any component that receives Person type (gender field now available)
tech_stack:
  added: []
  patterns:
    - server-only import boundary (lib/tree.ts)
    - const enum cast workaround (relatives-tree isolatedModules incompatibility)
    - unconditional multi-spouse flattening (D-04)
key_files:
  created:
    - lib/tree.ts
    - __tests__/types-schema.test.ts
  modified:
    - lib/types.ts
    - lib/content.ts
    - content/family.json
decisions:
  - "Cast RelativesTreeNode[] as unknown as readonly RelNode[] at calcTree call site — relatives-tree const enum Gender/RelType in .d.ts is incompatible with plain string literals under isolatedModules; structural equivalence guarantees correctness"
  - "Import ExtNode/Connector from 'relatives-tree/lib/types' (compiled .d.ts path) — verified path exists in node_modules; matches plan spec"
  - "TDD test file uses compile-time @ts-expect-error assertion for invalid gender value — no Jest; project test script is tsc --noEmit && next build"
metrics:
  duration: "3m 26s"
  completed_date: "2026-04-30"
  tasks_completed: 3
  files_modified: 5
requirements:
  - TREE-06
  - TREE-07
---

# Phase 4 Plan 01: Schema Migration + Server-Only Tree Adapter Summary

**One-liner:** Server-only tree adapter (lib/tree.ts) with relatives-tree GitHub #24 multi-spouse flattening, optional gender field on PersonSchema, and bidirectional family-ref validator extension.

## What Was Built

### lib/types.ts — PersonSchema gender extension

Added `gender: z.enum(['male', 'female', 'other']).optional()` after `spouseIds`. No `.default()` — undefined means not set. The `Person` TypeScript type automatically gains `gender?: 'male' | 'female' | 'other'` via `z.infer<>`.

### lib/content.ts — Bidirectional validator extension

Extended `validateBidirectionalRefs()` with a family tree cross-reference block (appended after existing photo↔person checks, per plan spec — no refactor of existing code):

- **spouseIds reciprocity:** if `A.spouseIds` includes `B`, then `B.spouseIds` must include `A`
- **parentIds bidirectionality:** if `A.parentIds` includes `B`, then `B.childIds` must include `A`
- **childIds existence:** each `childIds` entry must resolve to a known person ID

### lib/tree.ts — Server-only tree adapter

Full module created. Key exports:

| Export | Type | Purpose |
|--------|------|---------|
| `getTreeData(rootId)` | `(string) => TreeData` | Load people, flatten, run calcTree, return layout |
| `findRootId()` | `() => string` | Find eldest parentless person (defaults to 'william-curry') |
| `NODE_WIDTH` | `160` | Pixel width per node — FamilyTreeCanvas uses this |
| `NODE_HEIGHT` | `60` | Pixel height per node |
| `H_UNIT` | `200` | Horizontal grid unit in pixels (node + gap) |
| `V_UNIT` | `100` | Vertical grid unit in pixels (node + gap) |
| `TreeData` | type | `{ nodes, connectors, canvas, people }` |

**TreeData shape:**
```typescript
type TreeData = {
  nodes: readonly ExtNode[]       // relatives-tree layout nodes with top/left grid coords
  connectors: readonly Connector[] // 4-tuple [x1,y1,x2,y2] grid coords
  canvas: { width: number; height: number }  // bounding box in grid units
  people: Person[]               // original Person[] for PersonPanel data lookup
}
```

**flattenMultiSpouses()** runs unconditionally (D-04). For each person with `>1` spouse:
1. Keeps only primary (first) spouse in `spouses[]` for layout
2. Ensures primary spouse claims all children from all pairings
3. Redirects children's `parents[]` refs from non-primary → primary spouse
4. Removes non-primary spouse nodes from layout entirely

Full inline comment references GitHub #24: `https://github.com/SanichKotikov/relatives-tree/issues/24`

### content/family.json — 6-person multi-spouse dataset

Expanded from 3 to 6 people. Exercises the flattenMultiSpouses() mitigation:

| Person | Gender | Parents | Children | Spouses |
|--------|--------|---------|----------|---------|
| william-curry | male | none | james-curry, robert-curry | mary-curry, margaret-doe |
| mary-curry | female | none | james-curry | william-curry |
| margaret-doe | female | none | robert-curry | william-curry |
| james-curry | male | william-curry, mary-curry | emily-curry | none |
| robert-curry | male | william-curry, margaret-doe | none | none |
| emily-curry | female | james-curry | none | none |

Multi-spouse test case: william has `spouseIds: ["mary-curry", "margaret-doe"]`. After `flattenMultiSpouses()`: margaret-doe is removed from layout; robert-curry's parent ref to margaret-doe is redirected to mary-curry. All children are visible under william's primary-spouse cluster.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Cast for const enum incompatibility with isolatedModules**
- **Found during:** Task 2 — TypeScript compilation
- **Issue:** `relatives-tree` uses `const enum Gender` and `const enum RelType` in its `.d.ts` declaration files. With `isolatedModules: true` in tsconfig.json, TypeScript treats these as opaque enum types; plain string literals `'male' | 'female'` are not assignable to `Gender`.
- **Fix:** Added `import type { Node as RelNode }` from relatives-tree types, then cast at the `calcTree()` call site: `calcTree(flattenedNodes as unknown as readonly RelNode[], { rootId })`. This is structurally safe — our `RelativesTreeNode` is identical to `RelNode` at runtime; the cast is purely a type boundary workaround.
- **Files modified:** `lib/tree.ts` (lines 82-84)
- **Commit:** aa5ad04

## Threat Surface Assessment

The threat model from the plan is fully mitigated:

| Threat | Status |
|--------|--------|
| T-04-01-01: Tampering via family.json | ACCEPTED — Zod validation at getPeople() throws on malformed data |
| T-04-01-02: DoS via calcTree loop | ACCEPTED — finite graph traversal, 6-person tree negligible CPU |
| T-04-01-03: Info disclosure via server bundle | MITIGATED — `import 'server-only'` at line 1 of lib/tree.ts enforces build-time boundary |

No new threat surface introduced beyond what the plan specified.

## Self-Check: PASSED

- lib/tree.ts exists and exports getTreeData, findRootId, NODE_WIDTH, NODE_HEIGHT, H_UNIT, V_UNIT
- PersonSchema in lib/types.ts has optional gender field (z.enum)
- content/family.json has 6 entries including margaret-doe with william having 2 spouseIds
- grep -c "GitHub #24" lib/tree.ts = 3 (>= 1 required)
- grep -c "import 'server-only'" lib/tree.ts = 1
- grep -c "calcTree" lib/tree.ts = 8 (>= 1 required)
- npm run build exits 0
