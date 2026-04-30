# Phase 4: Family Tree — Research

**Researched:** 2026-04-29
**Domain:** relatives-tree layout engine, Framer Motion (motion package) AnimatePresence, CSS absolute positioning, Zod schema extension
**Confidence:** HIGH — all critical findings verified from installed source code and type declarations

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** `gender?: 'male' | 'female' | 'other'` added to PersonSchema (optional). Default `'other'` for layout when unset.
- **D-02:** `family.json` updated with explicit gender on William/James/Emily + 1 multi-spouse test case (William with a second wife + shared children).
- **D-03:** Multi-spouse flattening in `lib/tree.ts`: designate first spouse as primary; re-attribute all non-primary-spouse children to the primary pairing before passing to `calcTree`.
- **D-04:** Flattening runs unconditionally — single-spouse cases pass through the same code path.
- **D-05:** Mitigation documented inline with reference to GitHub #24.
- **D-06:** `lib/tree.ts` exports `getTreeData(rootId)` and `findRootId()`. Server-only. No `'use client'`.
- **D-07:** relatives-tree node shape: `{ id, gender, parents: {id,type}[], children: {id,type}[], siblings: {id,type}[], spouses: {id,type}[] }`.
- **D-08:** Component boundaries: `tree/page.tsx` (Server), `FamilyTreeCanvas` (`'use client'`), `PersonNode` (`'use client'` for onClick), `PersonPanel` (`'use client'`), `PhotoCarousel` (`'use client'`).
- **D-09:** `react-family-tree` NOT used. Render layout output directly.
- **D-10:** Canvas is `relative` positioned, fixed-width from bounding box, horizontally scrollable.
- **D-11:** Active node: navy stroke (1.25px border), ivory fill, small gold dot top-right.
- **D-12:** Connector lines: 1px stone `#C9C4B0` as positioned `<div>` elements — NOT SVG.
- **D-13:** Node: 160px × 60px. Name in `font-serif text-navy`. Relation label in `.eyebrow`.
- **D-14:** PersonPanel: slides in from right within tree section. 320px desktop / full-width mobile.
- **D-15:** PhotoCarousel: 4:3 aspect, 600ms crossfade, `AnimatePresence mode="wait"`, gold/stone dots.
- **D-16/17:** Tree page: eyebrow "FAMILY ARCHIVE" + serif h1 + muted subtitle.
- **D-18–D-20:** Empty state, single-person, cycle detection handled.
- **D-21:** Use `motion` package (NOT `framer-motion`). Import from `motion/react`.
- **D-22:** `relatives-tree@3.2.2` only. `react-family-tree` installed but NOT imported.
- **D-23:** ~80KB gzipped for motion. Acceptable.
- **D-24/D-25:** Acceptance: build exits 0, browser shows 4-5 person tree, multi-spouse case works.

### Claude's Discretion

- Exact node hover/active visual polish (refine Phase 5)
- Carousel auto-advance interval (start at 6s)
- Subtitle copy on tree page
- Connector lines: divs for now, SVG swap in Phase 5 if needed
- Mobile tree behavior: basic horizontal scroll for v1

### Deferred Ideas (OUT OF SCOPE)

- Tree zoom controls — Phase 5
- Touch gesture pan/zoom — Phase 5
- Person detail page navigation — Phase 6
- Tree node photo thumbnails — Phase 5
- Search within tree — Phase 6
- Export as image — v2
- Real Curry family data — user populates after Phase 4
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TREE-01 | `/tree` route renders interactive family tree using `relatives-tree` | calcTree API verified from source; adapter pattern documented in §Architecture Patterns |
| TREE-02 | Tree starts with grandfather as root, descends through generations | `findRootId()` pattern (person with empty `parentIds[]`) documented |
| TREE-03 | Each node renders person name and relation label | Node 160×60px with `font-serif` name + `.eyebrow` relation; rendering from `ExtNode` documented |
| TREE-04 | Active node: navy stroke 1.5px, ivory fill, gold dot top-right | CSS class map pattern documented to avoid Tailwind purging |
| TREE-05 | Connector lines use stone color `#C9C4B0` | Div-based connector pattern from `Connector` tuple documented |
| TREE-06 | Tree data prep server-side in `lib/tree.ts`; rendered in `'use client'` canvas | Server/client boundary pattern documented; `import 'server-only'` confirmed |
| TREE-07 | Multi-spouse / blended-family cases mitigated against GitHub #24 | Bug mechanism verified from source; flattening algorithm with exact edge cases documented |
| TREE-08 | Clicking node opens `<PersonPanel />` slide-in within tree section | `AnimatePresence` within-page pattern documented |
| TREE-09 | Panel shows name, dates, birthplace, bio, photo carousel | PersonPanel prop types and data flow documented |
| TREE-10 | Photo carousel crossfades with Framer Motion `AnimatePresence` within-page | `AnimatePresence mode="wait"` crossfade with `key={activeIndex}` pattern documented |
| TREE-11 | Active carousel dot fills with gold | Dot rendering pattern using static class lookup map documented |
</phase_requirements>

---

## Summary

This phase is the highest-risk in the project because it combines three independent moving parts that all need to work together: the relatives-tree layout engine (verified from installed source), the multi-spouse flattening mitigation (bug mechanism confirmed by reading `children/create.ts`), and the Framer Motion within-page animation patterns. Each part is individually well-understood after reading the source — there are no black boxes.

The relatives-tree coordinate system is **grid units, not pixels**. `SIZE = 2`, so all `top`, `left`, `canvas.width`, `canvas.height`, and `Connector` values are in these abstract units. The renderer multiplies by `(nodeWidth / SIZE)` = `(160 / 2)` = `80` and `(nodeHeight / SIZE)` = `(60 / 2)` = `30` to get pixel positions. Connectors are 4-tuples `[x1, y1, x2, y2]` in the same grid units.

The multi-spouse bug mechanism is confirmed: in `src/children/create.ts`, `getChildUnitsFunc` filters children with `first.children.filter(hasSameRelation(second))` — only children that BOTH parents share are included. Children from a different spouse pairing are dropped silently. The mitigation is straightforward: before passing data to `calcTree`, merge all of a person's children into the primary-spouse pairing. The algorithm edge cases (child of two different spouse pairings, spouse with no children) are all tractable — documented below.

The `motion/react` `AnimatePresence` is a re-export of `framer-motion` (confirmed from `node_modules/motion/dist/cjs/react.js` — it directly re-exports all framer-motion exports). `mode="wait"` is the correct choice for both the PersonPanel and the PhotoCarousel crossfade. The panel uses a conditional presence pattern; the carousel uses a `key={activeIndex}` swap pattern.

**Primary recommendation:** Build in this order: (1) schema migration + stub data, (2) `lib/tree.ts` adapter with flattening, (3) `FamilyTreeCanvas` positioning, (4) `PersonNode`, (5) connector rendering, (6) `PersonPanel` + `AnimatePresence`, (7) `PhotoCarousel`. Validate multi-spouse rendering after step 2 by inspecting `getTreeData()` output in a server-side test before any UI work.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Tree layout calculation | API / Backend (Server Component) | — | `calcTree` is pure CPU work; runs in `lib/tree.ts` at request time; output serialized as props |
| Tree node rendering + click state | Browser / Client | — | `onClick` requires event handlers; `useState` for selectedId |
| Connector line rendering | Browser / Client | — | Co-located with node rendering in `FamilyTreeCanvas` |
| PersonPanel slide-in animation | Browser / Client | — | `AnimatePresence` + `motion` require `'use client'` |
| PhotoCarousel crossfade | Browser / Client | — | `AnimatePresence` + `useState` for activeIndex |
| Content data loading | API / Backend (Server Component) | — | `getPeople()` / `getPhotos()` via `lib/content.ts` (`server-only`) |
| Bidirectional ref validation | API / Backend (Server Component) | — | Runs at module load / build time in `lib/content.ts` |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `relatives-tree` | 3.2.2 (installed) | Family tree layout algorithm | Already installed; provides `calcTree()` returning `ExtNode[]` with grid positions + `Connector[]` tuples |
| `motion` | 12.38.0 (installed) | AnimatePresence, motion.div for panel + carousel | Installed as framer-motion rebrand; imports from `motion/react` |
| `zod` | 3.x (installed) | Schema validation for extended Person type | Already in use for all content schemas |

### No New Dependencies Needed

All required packages are already installed. This phase adds NO new `npm install` commands.

**Version verification:** All libraries confirmed from `package.json` — `relatives-tree@3.2.2`, `motion@12.38.0`, `zod@^3.25.76`. [VERIFIED: package.json + node_modules inspection]

---

## Architecture Patterns

### System Architecture Diagram

```
Request: GET /tree
         |
         v
app/(protected)/tree/page.tsx  [Server Component]
  |
  +-- await getPeople()          [lib/content.ts, server-only]
  |   returns Person[]
  |
  +-- findRootId(people)         [lib/tree.ts]
  |   returns string ('william-curry')
  |
  +-- getTreeData(rootId)        [lib/tree.ts]
  |   |
  |   +-- flattenMultiSpouses()  [internal — the mitigation]
  |   |   Person[] --> RelativesTreeNode[]
  |   |
  |   +-- calcTree(nodes, {rootId})
  |       returns RelData { canvas, nodes: ExtNode[], connectors: Connector[] }
  |
  +-- passes { nodes, connectors, canvas, people } as props
  |
  v
<FamilyTreeCanvas>  ['use client']
  |
  +-- useState<string|null>(selectedId)
  |
  +-- <div style={{ width: canvas.width * SCALE, height: canvas.height * SCALE, position: 'relative' }}>
  |     |
  |     +-- {nodes.map(node => <PersonNode key={node.id} node={node} isActive={...} onClick={...} />)}
  |     |     Each: position: absolute, transform: translate(left*SCALE, top*SCALE)
  |     |
  |     +-- {connectors.map((c, i) => <ConnectorLine key={i} connector={c} />)}
  |           Each: position: absolute div, calculated from [x1,y1,x2,y2]*SCALE
  |
  +-- <AnimatePresence mode="wait">
        {selectedId && (
          <PersonPanel
            key={selectedId}
            person={people.find(p => p.id === selectedId)}
            photos={photos.filter(ph => person.photoIds.includes(ph.id))}
            onClose={() => setSelectedId(null)}
          />
        )}
      </AnimatePresence>
```

### Recommended Project Structure

```
lib/
  tree.ts              # server-only — calcTree adapter + flattening
components/
  tree/
    FamilyTreeCanvas.tsx   # 'use client' — layout, node loop, connector loop, panel
    PersonNode.tsx         # 'use client' — single positioned node div
    ConnectorLine.tsx      # 'use client' — single positioned div connector
    PersonPanel.tsx        # 'use client' — AnimatePresence slide-in panel
    PhotoCarousel.tsx      # 'use client' — AnimatePresence crossfade carousel
app/(protected)/
  tree/
    page.tsx               # Server Component — data fetch, passes props
```

---

## Topic 1: relatives-tree calcTree() Exact API

[VERIFIED: node_modules/relatives-tree/src/types.ts, src/index.ts, src/constants.ts]

### Function Signature

```typescript
// Import (default export)
import calcTree from 'relatives-tree'

// Signature
calcTree(nodes: readonly Node[], options: Options): RelData
```

### Input: `Node` shape

```typescript
type Node = {
  id: string
  gender: 'male' | 'female'          // NOTE: no 'other' — see below
  parents: readonly Relation[]
  children: readonly Relation[]
  siblings: readonly Relation[]
  spouses: readonly Relation[]
  placeholder?: boolean               // internal use by placeholders option
}

type Relation = { id: string; type: RelType }

type RelType = 'blood' | 'married' | 'divorced' | 'adopted' | 'half'

// Options
type Options = {
  rootId: string          // ID of the node to treat as root
  placeholders?: boolean  // if true, adds phantom parent nodes when root has no parents
}
```

**Critical: `gender` is a const enum with only `'male'` and `'female'`.** There is no `'other'` in the library type. Our Person schema adds `'other'` as an allowed value — in the adapter, map `'other'` → `'male'` as a default for layout (gender only affects visual symmetry in the layout algorithm, not correctness). This mapping is invisible to the UI because PersonPanel renders from the original `Person` data, not the relatives-tree node.

### Output: `RelData`

```typescript
type RelData = {
  canvas: { width: number; height: number }
  families: readonly Family[]    // internal family cluster structures (rarely used directly)
  nodes: readonly ExtNode[]      // the renderable nodes — what we use
  connectors: readonly Connector[] // the renderable lines — what we use
}

type ExtNode = Node & {
  top: number       // grid units
  left: number      // grid units
  hasSubTree: boolean  // true if node has relatives not shown (out of viewport direction)
}

type Connector = readonly [x1: number, y1: number, x2: number, y2: number]
// [x1, y1] = start point; [x2, y2] = end point; all in grid units
```

### Coordinate System: Grid Units, Not Pixels

`SIZE = 2` is the library's internal grid unit. All positions are multiples of `SIZE`.

- A couple (2 spouses) occupies `2 * SIZE = 4` grid units of width
- A single person occupies `SIZE = 2` grid units of width
- One generation (parents row + gap + children row) = `2 * SIZE = 4` grid units of height

**Converting to pixels:**
```typescript
// D-13 specifies: node width = 160px, node height = 60px
// SIZE = 2 (from constants.ts)
// → 1 grid unit = 160px / 2 = 80px horizontally
// → 1 grid unit = 60px / 2 = 30px vertically
// These are DIFFERENT — x and y scale factors are not equal.

const NODE_WIDTH = 160   // px
const NODE_HEIGHT = 60   // px
const SIZE = 2           // relatives-tree grid constant

export const SCALE_X = NODE_WIDTH / SIZE   // 80px per grid unit
export const SCALE_Y = NODE_HEIGHT / SIZE  // 30px per grid unit
```

**Why different scale factors?** The library treats each node as `SIZE × SIZE` grid squares. The physical node is 160px wide but 60px tall (not square). Applying the same scale to both axes would make generations overlap. Use `SCALE_X` for horizontal positions (left, x1, x2) and `SCALE_Y` for vertical positions (top, y1, y2).

### Connector Tuple Semantics

Each `Connector` is `[x1, y1, x2, y2]` — a line segment in grid units. After source-code analysis of `src/connectors/parents.ts`, connectors are always axis-aligned (horizontal or vertical). There are no diagonal connectors. A connector is horizontal if `y1 === y2`; vertical if `x1 === x2`.

**This means:** div-based connector rendering works cleanly. An H connector is a `div` with `height: 1px`, a V connector is a `div` with `width: 1px`.

### Error Behavior

`calcTree` throws `ReferenceError` if `rootId` is not found in the `nodes` array. No other validation — unknown IDs in `parents[]`, `children[]`, etc. are silently ignored (the relationship just doesn't render). This is important: dangling references cause missing nodes, not crashes.

---

## Topic 2: Multi-Spouse Bug Mechanism and Flattening Algorithm

[VERIFIED: node_modules/relatives-tree/src/children/create.ts]

### Exact Bug Mechanism

In `src/children/create.ts`, the function that determines which children to include for a parent-unit family is:

```typescript
// Source: src/children/create.ts getChildUnitsFunc
return (familyId: number, parents: readonly Node[]): readonly Unit[] => {
  const [first, second] = parents as [Node, Node | undefined];

  return first.children
    .filter(hasSameRelation(second))   // ← BUG: only includes children BOTH parents share
    .flatMap((rel) => createChildUnits(familyId, toNode(rel)));
};

const hasSameRelation = (node: Node | undefined) => (rel: Relation): boolean =>
  !node || node.children.some(withId(rel.id));
//  ^^ only passes if second parent ALSO claims this child
```

**Result:** When William is in a family unit with his PRIMARY spouse, only children listed in BOTH William's `children[]` AND the primary spouse's `children[]` are rendered. Children from a second spouse pairing are silently dropped because the second spouse does not claim them.

### Flattening Algorithm (D-03 Implementation)

The mitigation rewrites the `Node[]` that goes into `calcTree` — the original `Person[]` is unchanged.

```typescript
// lib/tree.ts
// CONTEXT D-03: Multi-spouse flattening — mitigates relatives-tree GitHub #24
// When a person has >1 spouse, all children from ALL pairings are attributed
// to the primary (first) spouse. The original Person.spouseIds[] is untouched;
// PersonPanel reads that for the full spouse list.

function flattenMultiSpouses(nodes: RelativesTreeNode[]): RelativesTreeNode[] {
  // Build a map for O(1) lookup
  const byId = new Map(nodes.map(n => [n.id, n]))

  return nodes.map(node => {
    // Only act on nodes with 2+ spouses
    if (node.spouses.length <= 1) return node

    const primarySpouseId = node.spouses[0]!.id
    const nonPrimarySpouseIds = new Set(node.spouses.slice(1).map(s => s.id))

    // Collect all children (union across all pairings)
    // node.children already contains all children from all pairings (from the Person adapter)
    const allChildIds = new Set(node.children.map(c => c.id))

    // Build updated node: keep only primary spouse in spouses[]
    // All children remain in children[] (they were already there)
    const updatedNode: RelativesTreeNode = {
      ...node,
      spouses: [node.spouses[0]!],  // primary spouse only for layout
    }

    // Update primary spouse: ensure all children are in their children[]
    const primarySpouse = byId.get(primarySpouseId)
    if (primarySpouse) {
      const existingChildIds = new Set(primarySpouse.children.map(c => c.id))
      const missingChildren = node.children.filter(c => !existingChildIds.has(c.id))
      byId.set(primarySpouseId, {
        ...primarySpouse,
        children: [...primarySpouse.children, ...missingChildren],
      })
    }

    // Remove non-primary spouses' exclusive children
    // (children who claim both a non-primary spouse AND our node as parents
    //  must be rewritten to claim primary spouse instead)
    for (const nonPrimaryId of nonPrimarySpouseIds) {
      const nonPrimary = byId.get(nonPrimaryId)
      if (!nonPrimary) continue

      // Children that have this non-primary as a parent: redirect to primary
      for (const childId of allChildIds) {
        const child = byId.get(childId)
        if (!child) continue

        const hasNonPrimaryAsParent = child.parents.some(p => p.id === nonPrimaryId)
        if (hasNonPrimaryAsParent) {
          // Replace non-primary parent reference with primary spouse reference
          byId.set(childId, {
            ...child,
            parents: child.parents.map(p =>
              p.id === nonPrimaryId
                ? { id: primarySpouseId, type: p.type }
                : p
            ),
          })
        }
      }

      // Remove non-primary spouse from output (they would cause layout confusion)
      // DECISION: non-primary spouses are EXCLUDED from the layout nodes entirely.
      // PersonPanel shows them from Person.spouseIds[] which is preserved.
      byId.delete(nonPrimaryId)
    }

    return updatedNode
  }).filter(n => {
    // Remove non-primary spouses we deleted from byId above
    return byId.has(n.id)
  }).map(n => byId.get(n.id)!)
}
```

### Edge Cases

**Edge Case 1: Child claims parents from BOTH spouse pairings (i.e., child's `parentIds` includes both `william` and `mary` AND `william` and `margaret`)**

This is impossible in valid data — a child has exactly two parents (or one, or zero). If a child has `parentIds: ['william', 'mary']`, they are a child of the william+mary pairing. If another child has `parentIds: ['william', 'margaret']`, they are a child of the william+margaret pairing. No child legitimately references both spouse pairings as parents simultaneously. The edge case does not exist in valid family data.

**Edge Case 2: Non-primary spouse has NO children (is childless)**

The algorithm handles this correctly — `missingChildren` will be empty (no children to add to the primary spouse). The non-primary spouse node is still removed from the layout. PersonPanel still shows them via `Person.spouseIds[]`.

**Edge Case 3: A child of a non-primary pairing is ALSO a sibling to a child of the primary pairing**

After flattening, all children fall under the primary pairing. They will appear as siblings in the layout (which is correct — they ARE half-siblings in real life). The `siblings[]` array in the relatives-tree node input controls explicit sibling declarations; the layout engine also discovers siblings implicitly via shared parents.

**Edge Case 4: Triple spouse (spouseIds.length === 3)**

The algorithm iterates all `spouses.slice(1)` — both non-primary spouses are processed. All their children get redirected to the primary pairing.

**Edge Case 5: Person with 2+ spouses is NOT the root**

The flattening runs over ALL nodes before `calcTree` is called, not just the root. Non-root multi-spouse people are handled identically.

### Before/After Shape Example

```typescript
// BEFORE flattening (input from Person[] adapter):
[
  {
    id: 'william-curry', gender: 'male',
    parents: [], siblings: [],
    spouses: [
      { id: 'mary-curry', type: 'married' },
      { id: 'margaret-doe', type: 'divorced' }
    ],
    children: [
      { id: 'james-curry', type: 'blood' },   // child of william + mary
      { id: 'robert-curry', type: 'blood' }   // child of william + margaret
    ]
  },
  {
    id: 'mary-curry', gender: 'female', parents: [], siblings: [],
    spouses: [{ id: 'william-curry', type: 'married' }],
    children: [{ id: 'james-curry', type: 'blood' }]
  },
  {
    id: 'margaret-doe', gender: 'female', parents: [], siblings: [],
    spouses: [{ id: 'william-curry', type: 'divorced' }],
    children: [{ id: 'robert-curry', type: 'blood' }]
  },
  {
    id: 'james-curry', gender: 'male',
    parents: [{ id: 'william-curry', type: 'blood' }, { id: 'mary-curry', type: 'blood' }],
    siblings: [], spouses: [], children: []
  },
  {
    id: 'robert-curry', gender: 'male',
    parents: [{ id: 'william-curry', type: 'blood' }, { id: 'margaret-doe', type: 'blood' }],
    siblings: [], spouses: [], children: []
  },
]

// AFTER flattening (what goes into calcTree):
[
  {
    id: 'william-curry', gender: 'male',
    parents: [], siblings: [],
    spouses: [{ id: 'mary-curry', type: 'married' }],  // only primary spouse
    children: [
      { id: 'james-curry', type: 'blood' },
      { id: 'robert-curry', type: 'blood' }            // still listed here
    ]
  },
  {
    id: 'mary-curry', gender: 'female', parents: [], siblings: [],
    spouses: [{ id: 'william-curry', type: 'married' }],
    children: [
      { id: 'james-curry', type: 'blood' },
      { id: 'robert-curry', type: 'blood' }  // added — now claims both children
    ]
  },
  // margaret-doe: REMOVED from layout nodes entirely
  {
    id: 'james-curry', gender: 'male',
    parents: [{ id: 'william-curry', type: 'blood' }, { id: 'mary-curry', type: 'blood' }],
    siblings: [], spouses: [], children: []
  },
  {
    id: 'robert-curry', gender: 'male',
    parents: [
      { id: 'william-curry', type: 'blood' },
      { id: 'mary-curry', type: 'blood' }   // redirected from margaret-doe to mary-curry
    ],
    siblings: [], spouses: [], children: []
  },
]
```

Result: `calcTree` sees william + mary as a single couple with both children. Both children render. Margaret does not appear in the layout but appears in the PersonPanel bio.

---

## Topic 3: Tree Node Positioning from Layout Output

[VERIFIED: src/utils/getExtendedNodes.ts, src/constants.ts, src/utils/units.ts]

### The Scale Factor Pattern

```typescript
// lib/tree.ts — export these with the layout data
export const NODE_WIDTH = 160  // px — per D-13
export const NODE_HEIGHT = 60  // px — per D-13
const SIZE = 2                  // relatives-tree grid unit constant

// Scale factors: multiply grid units → pixels
// X and Y are DIFFERENT because nodes are not square
export const SCALE_X = NODE_WIDTH / SIZE    // = 80
export const SCALE_Y = NODE_HEIGHT / SIZE   // = 30

// Horizontal padding between nodes (optional — can increase for visual breathing room)
// relatives-tree positions nodes flush; add gap by multiplying SCALE_X by a factor > 1
// Recommend: SCALE_X = 200 (giving 40px gap between 160px nodes)
// i.e. each grid unit = 100px, nodes are 160px centered in 200px cells
// The gap = SCALE_X - NODE_WIDTH = 40px between nodes.
// For Phase 4 start: use SCALE_X = NODE_WIDTH + GAP where GAP = 40
```

**Recommended approach for padding:** Rather than post-processing connector coordinates, use a padding multiplier:

```typescript
const H_UNIT = 200  // px per horizontal grid unit (160px node + 40px gap)
const V_UNIT = 100  // px per vertical grid unit (60px node + 40px vertical gap)
```

This gives a canvas that breathes. All positions — nodes and connectors — multiply by the same unit, so connector endpoints automatically land at node edges.

### FamilyTreeCanvas Rendering Pattern

```typescript
// components/tree/FamilyTreeCanvas.tsx
'use client'

const H_UNIT = 200
const V_UNIT = 100

export default function FamilyTreeCanvas({ nodes, connectors, canvas, people, photos }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const canvasWidth = canvas.width * H_UNIT
  const canvasHeight = canvas.height * V_UNIT

  return (
    <div className="overflow-x-auto">
      {/* Relative-positioned canvas — absolutely positioned children */}
      <div
        className="relative"
        style={{ width: canvasWidth, height: canvasHeight }}
      >
        {nodes.map((node) => (
          <PersonNode
            key={node.id}
            node={node}
            isActive={selectedId === node.id}
            onClick={() => setSelectedId(node.id === selectedId ? null : node.id)}
            style={{
              position: 'absolute',
              transform: `translate(${node.left * H_UNIT}px, ${node.top * V_UNIT}px)`,
              width: NODE_WIDTH,
              height: NODE_HEIGHT,
            }}
          />
        ))}
        {connectors.map(([x1, y1, x2, y2], i) => (
          <ConnectorLine key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {selectedId && (() => {
          const person = people.find(p => p.id === selectedId)!
          const personPhotos = photos.filter(ph => person.photoIds.includes(ph.id))
          return (
            <PersonPanel
              key={selectedId}
              person={person}
              photos={personPhotos}
              onClose={() => setSelectedId(null)}
            />
          )
        })()}
      </AnimatePresence>
    </div>
  )
}
```

### Container Sizing

`canvas.width` and `canvas.height` from `RelData` represent the bounding box in grid units. The `relative` div is sized to exactly `canvas.width * H_UNIT` × `canvas.height * V_UNIT` px. On mobile, the outer `overflow-x-auto` wrapper enables horizontal scrolling (D-10).

---

## Topic 4: Connector Line Rendering Without SVG

[VERIFIED: src/types.ts Connector type; src/connectors/parents.ts confirms axis-aligned only]

All connectors from relatives-tree are **axis-aligned** (horizontal or vertical only). This was confirmed by reading the connector calculation code — connectors are always `[pX, pY, pX, pY+k]` (vertical) or `[pX, pY, pX+k, pY]` (horizontal) forms. No diagonals.

### ConnectorLine Component Pattern

```typescript
// components/tree/ConnectorLine.tsx
'use client'

const H_UNIT = 200
const V_UNIT = 100

interface ConnectorLineProps {
  x1: number; y1: number; x2: number; y2: number
}

export default function ConnectorLine({ x1, y1, x2, y2 }: ConnectorLineProps) {
  const left = Math.min(x1, x2) * H_UNIT
  const top = Math.min(y1, y2) * V_UNIT
  const width = Math.abs(x2 - x1) * H_UNIT
  const height = Math.abs(y2 - y1) * V_UNIT

  const isHorizontal = y1 === y2  // confirmed safe: all connectors are axis-aligned

  return (
    <div
      className="absolute bg-stone pointer-events-none"
      style={{
        left,
        top,
        // Horizontal: 1px tall, full width
        // Vertical: 1px wide, full height
        width: isHorizontal ? width : 1,
        height: isHorizontal ? 1 : height,
      }}
    />
  )
}
```

**Gotcha 1 — Zero-dimension div:** If `width === 0` (vertical line) or `height === 0` (horizontal line), the div collapses. The pattern above handles this by clamping one dimension to `1px` and the other to the calculated length. Never use `width: Math.abs(...) || 1` as it hides bugs; use the `isHorizontal` branch.

**Gotcha 2 — Tailwind purging on `bg-stone`:** `bg-stone` is a custom token defined in `globals.css` as `--color-stone: #C9C4B0`. The class name `bg-stone` is a complete static string in the JSX — it will NOT be purged. Do not write `bg-${color}` dynamically.

**Gotcha 3 — `pointer-events-none`:** Connectors must not intercept clicks intended for nodes. Add `pointer-events-none` to all connector divs.

---

## Topic 5: motion AnimatePresence Within-Page (PersonPanel)

[VERIFIED: node_modules/framer-motion/dist/types/index.d.ts AnimatePresenceProps]
[VERIFIED: node_modules/motion/dist/cjs/react.js — motion/react is a direct re-export of framer-motion]

### PersonPanel Slide-In Pattern

```typescript
// components/tree/PersonPanel.tsx
'use client'
import { motion, AnimatePresence } from 'motion/react'

// Used inside FamilyTreeCanvas — not at route level.
// AnimatePresence works correctly for within-page transitions.
// The known bug (Pitfall 4 in PITFALLS.md) only affects cross-ROUTE transitions.

interface PersonPanelProps {
  person: Person
  photos: Photo[]
  onClose: () => void
}

export default function PersonPanel({ person, photos, onClose }: PersonPanelProps) {
  return (
    <motion.div
      // D-14: slides in from right within tree section
      // position: fixed or absolute? Use absolute — D-14 says "contained within tree container"
      className="absolute top-0 right-0 h-full w-80 bg-ivory border-l hairline z-10"
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
    >
      {/* Panel content */}
      <button onClick={onClose} className="...">Close</button>
      <h2 className="font-serif text-navy">{person.name}</h2>
      {/* bio, dates, birthplace, spouses list */}
      <PhotoCarousel photos={photos} />
    </motion.div>
  )
}
```

**The `key` prop on PersonPanel is critical.** In `FamilyTreeCanvas`, the panel is keyed by `selectedId`:

```typescript
<AnimatePresence mode="wait">
  {selectedId && (
    <PersonPanel
      key={selectedId}   // ← WITHOUT THIS, React reuses the component and exit/enter don't fire
      person={...}
      ...
    />
  )}
</AnimatePresence>
```

When `selectedId` changes from `'william-curry'` to `'james-curry'`, React unmounts the old PersonPanel (triggering `exit` animation) and mounts a new one (triggering `initial → animate`). Without `key`, React reconciles the same component, and no animation fires.

### `mode="wait"` vs default `"sync"`

| Mode | Behavior | When to Use |
|------|----------|-------------|
| `"sync"` (default) | Old exits and new enters simultaneously | List item adds/removes |
| `"wait"` | Old fully exits before new enters | PersonPanel swap (D-15 specifies this); PhotoCarousel crossfade |
| `"popLayout"` | Old is popped from layout flow immediately | Reorder lists |

Use `mode="wait"` for both PersonPanel and PhotoCarousel per D-15.

### Common Gotcha: `exit` prop on non-motion element

`exit` only works on `motion.*` elements, not plain HTML elements. Every element that needs an exit animation must be a `motion.div`, `motion.aside`, etc.

### `initial={false}` on AnimatePresence

When the tree first renders, if `initial={false}` is passed to AnimatePresence, the initial animation of the FIRST child is suppressed. Useful to avoid the panel "flying in" when the page loads with a pre-selected person. For Phase 4, we start with no selection, so this is not needed.

---

## Topic 6: Framer Motion PhotoCarousel Crossfade

[VERIFIED: AnimatePresenceProps — mode="wait" confirmed in framer-motion types]

### PhotoCarousel Pattern

```typescript
// components/tree/PhotoCarousel.tsx
'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { Photo } from '@/lib/types'

const AUTO_ADVANCE_MS = 6000  // D-15 (Claude's discretion: 6s)

interface PhotoCarouselProps {
  photos: Photo[]
}

export default function PhotoCarousel({ photos }: PhotoCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  // Auto-advance with proper cleanup (avoids stale closure / memory leak)
  useEffect(() => {
    if (photos.length <= 1) return  // no-op for 0 or 1 photos

    const timer = setTimeout(() => {
      setActiveIndex(i => (i + 1) % photos.length)
    }, AUTO_ADVANCE_MS)

    return () => clearTimeout(timer)  // ← CRITICAL: cleanup on index change or unmount
  }, [activeIndex, photos.length])

  if (photos.length === 0) {
    return (
      <div className="aspect-[4/3] bg-ivory flex items-center justify-center">
        <p className="text-quiet text-sm eyebrow">No photographs</p>
      </div>
    )
  }

  const activePhoto = photos[activeIndex]!

  return (
    <div>
      {/* 4:3 aspect container — D-15 */}
      <div className="relative aspect-[4/3] overflow-hidden bg-ivory">
        <AnimatePresence mode="wait">
          <motion.img
            key={activeIndex}         // ← drives the crossfade swap
            src={`/photos/${activePhoto.filename}`}
            alt={activePhoto.caption ?? 'Family photograph'}
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}  // D-15: 600ms
          />
        </AnimatePresence>
      </div>

      {/* Dot indicators — D-15: gold active, stone inactive */}
      {photos.length > 1 && (
        <div className="flex gap-1.5 justify-center mt-2">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              // Static Tailwind classes — use lookup object, NOT interpolation
              className={i === activeIndex ? 'w-2 h-2 rounded-full bg-gold' : 'w-2 h-2 rounded-full bg-stone'}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

**Gotcha: `useEffect` cleanup timing.** The `return () => clearTimeout(timer)` runs when:
1. `activeIndex` changes (clears the old timer before starting a new one in the next render)
2. The component unmounts (when PersonPanel closes)

Without the cleanup, multiple concurrent timers accumulate. After 5 node clicks, you'd have 5 timers all trying to advance the carousel.

**Gotcha: `motion.img` inside `absolute inset-0` container.** The `aspect-[4/3]` is on the parent container. The `motion.img` is `position: absolute` with `inset-0` so it fills the container. This works because `relative overflow-hidden` constrains it. Without `overflow-hidden`, the exiting image would be visible outside the bounds during the crossfade.

---

## Topic 7: Schema Migration for gender Field

[VERIFIED: lib/types.ts, lib/content.ts — read directly from project source]

### Current PersonSchema (from lib/types.ts)

```typescript
export const PersonSchema = z.object({
  id: z.string().regex(...),
  name: z.string().min(1),
  birthYear: z.number().int().optional(),
  deathYear: z.number().int().optional(),
  birthPlace: z.string().optional(),
  bio: z.string().optional(),
  photoIds: z.array(z.string()).default([]),
  parentIds: z.array(z.string()).default([]),
  childIds: z.array(z.string()).default([]),
  spouseIds: z.array(z.string()).default([]),
})
```

### Migration: Add Optional gender Field

```typescript
// lib/types.ts — add one field
export const PersonSchema = z.object({
  // ... existing fields ...
  gender: z.enum(['male', 'female', 'other']).optional(),
  // No .default() — undefined means 'not set'; adapter defaults to 'other' for layout
})
```

**Backward compatibility:** Existing `family.json` entries WITHOUT `gender` will parse as `undefined` (valid — the field is `.optional()`). Zod `.optional()` means the field may be absent from JSON. No migration script needed.

**Adapter mapping:**
```typescript
// lib/tree.ts — in the Person → relatives-tree Node adapter
function personGender(person: Person): 'male' | 'female' {
  if (person.gender === 'male') return 'male'
  if (person.gender === 'female') return 'female'
  return 'male'  // default for 'other' and undefined — layout-only, not displayed
}
```

---

## Topic 8: Stub Data Design

### Multi-Spouse Test Case for family.json

The test case adds 2 new people (Mary Curry as primary spouse, Margaret Doe as secondary) plus 2 children (one per pairing), giving a 7-person tree.

```json
[
  {
    "id": "william-curry",
    "name": "William Curry",
    "gender": "male",
    "birthYear": 1920,
    "deathYear": 1998,
    "birthPlace": "London, England",
    "bio": "Founder of the Curry family line. Born in London, England.",
    "photoIds": ["photo-001"],
    "parentIds": [],
    "childIds": ["james-curry", "robert-curry"],
    "spouseIds": ["mary-curry", "margaret-doe"]
  },
  {
    "id": "mary-curry",
    "name": "Mary Curry",
    "gender": "female",
    "birthYear": 1922,
    "deathYear": 1960,
    "birthPlace": "Bristol, England",
    "bio": "First wife of William Curry.",
    "photoIds": [],
    "parentIds": [],
    "childIds": ["james-curry"],
    "spouseIds": ["william-curry"]
  },
  {
    "id": "margaret-doe",
    "name": "Margaret Doe",
    "gender": "female",
    "birthYear": 1935,
    "birthPlace": "London, England",
    "bio": "Second wife of William Curry.",
    "photoIds": [],
    "parentIds": [],
    "childIds": ["robert-curry"],
    "spouseIds": ["william-curry"]
  },
  {
    "id": "james-curry",
    "name": "James Curry",
    "gender": "male",
    "birthYear": 1948,
    "birthPlace": "London, England",
    "bio": "",
    "photoIds": [],
    "parentIds": ["william-curry", "mary-curry"],
    "childIds": ["emily-curry"],
    "spouseIds": []
  },
  {
    "id": "robert-curry",
    "name": "Robert Curry",
    "gender": "male",
    "birthYear": 1965,
    "birthPlace": "London, England",
    "bio": "Son of William Curry and Margaret Doe.",
    "photoIds": [],
    "parentIds": ["william-curry", "margaret-doe"],
    "childIds": [],
    "spouseIds": []
  },
  {
    "id": "emily-curry",
    "name": "Emily Curry",
    "gender": "female",
    "birthYear": 1975,
    "birthPlace": "London, England",
    "bio": "",
    "photoIds": [],
    "parentIds": ["james-curry"],
    "childIds": [],
    "spouseIds": []
  }
]
```

**Why this shape:** William has 2 spouses. James is a child of the primary pairing (william + mary). Robert is a child of the secondary pairing (william + margaret). After flattening: margaret-doe is removed from layout; robert's parents are rewritten to [william, mary]; both james and robert appear under william. This is exactly what D-25 requires to verify.

**Note on emily-curry:** She has only one parent (`james-curry`) because no spouse for James is defined yet. relatives-tree handles single-parent cases correctly (the `second` in `hasSameRelation` is undefined, and the condition `!node` returns `true`, so all of first's children pass).

---

## Topic 9: Bidirectional Reference Validator Extension

[VERIFIED: lib/content.ts validateBidirectionalRefs() — read directly from project source]

### Current Coverage

The existing validator (lib/content.ts) checks:
- `Photo.peopleIds[]` → every ID must exist in `family.json`
- `Person.photoIds[]` → every ID must exist in `photos.json`

### Should We Extend It?

**Yes.** Phase 4 introduces new cross-references within `family.json` itself:
- `Person.spouseIds[]` → every ID must exist as another person
- `Person.parentIds[]` → every ID must exist as another person
- `Person.childIds[]` → every ID must exist as another person

And symmetry checks:
- If A has B in `spouseIds`, B must have A in `spouseIds`
- If A has B in `childIds`, B must have A in `parentIds`

These checks prevent the "relatives-tree silently drops node" scenario (Pitfall 12 in PITFALLS.md) by catching dangling references at build time.

**Decision:** Extend `validateBidirectionalRefs()` in `lib/content.ts` to add a second block. This is in scope for Phase 4 per the CONTEXT.md "Bidirectional ref validation extension: validate spouseIds, parentIds, childIds."

### Extension Pattern

```typescript
// lib/content.ts — add to validateBidirectionalRefs() after existing checks

// --- Family tree cross-reference validation ---
const people = getPeople()
const personIds = new Set(people.map(p => p.id))

for (const person of people) {
  // spouseIds: must exist
  for (const sid of person.spouseIds) {
    if (!personIds.has(sid)) {
      throw new Error(
        `Content error: Person "${person.id}" has unknown spouseId "${sid}". ` +
        `Check content/family.json.`
      )
    }
    // spouseIds reciprocity: B must also claim A
    const spouse = people.find(p => p.id === sid)!
    if (!spouse.spouseIds.includes(person.id)) {
      throw new Error(
        `Content error: "${person.id}" lists "${sid}" as a spouse, but "${sid}" ` +
        `does not list "${person.id}" in return. Spouse relationships must be bidirectional.`
      )
    }
  }

  // parentIds: must exist
  for (const pid of person.parentIds) {
    if (!personIds.has(pid)) {
      throw new Error(
        `Content error: Person "${person.id}" has unknown parentId "${pid}".`
      )
    }
    // parentIds ↔ childIds reciprocity
    const parent = people.find(p => p.id === pid)!
    if (!parent.childIds.includes(person.id)) {
      throw new Error(
        `Content error: "${person.id}" lists "${pid}" as a parent, but "${pid}" ` +
        `does not list "${person.id}" in childIds.`
      )
    }
  }

  // childIds: existence only (reciprocity covered by parentIds check above)
  for (const cid of person.childIds) {
    if (!personIds.has(cid)) {
      throw new Error(
        `Content error: Person "${person.id}" has unknown childId "${cid}".`
      )
    }
  }
}
```

**Note on call site:** `validateBidirectionalRefs()` currently calls `getPeople()` and `getPhotos()` separately. The extension also calls `getPeople()`. In the existing code these are separate calls — that's fine (the file is small; the reads are cheap). Or refactor to pass the arrays in. Either is correct; keep it simple for Phase 4.

---

## Topic 10: Build-Time vs Runtime Tree Calculation

[VERIFIED: lib/content.ts uses readFileSync; package.json "test" script; Next.js 14 App Router caching behavior]

### How `calcTree` Is Called

`calcTree` runs in `lib/tree.ts` which is imported by `app/(protected)/tree/page.tsx` (a Server Component). In Next.js 14 App Router with no `export const revalidate` set, **Server Components run on every request** (dynamic by default when using data that isn't cacheable). The JSON file is read via `readFileSync` (Pitfall 8 in PITFALLS.md confirms this is the established pattern).

### Cost Analysis

`calcTree` on a 50-person tree:

- Input processing: building a `Map<string, Node>` from 50 nodes — O(n)
- Layout calculation: O(n) traversal with no nested loops in the hot path
- The library is 3.23 kB brotli-compressed — the entire algorithm is small
- No network I/O, no disk I/O after JSON parse

**Realistic estimate:** For 50 people, `calcTree` completes in under 1ms. The JSON `readFileSync` + `JSON.parse` is the bottleneck (also sub-millisecond for a small file).

**For Phase 4 (7 people):** Negligible. For a realistic Curry tree (50-100 people in future): still negligible — this is pure in-memory graph traversal.

### Caching Strategy for Phase 4

**No caching needed.** The "commit + push = publish" deploy model (established in Phase 1 Pitfall 8) means the JSON is rebuilt on deploy. Running `calcTree` on every request for a static family of 50-100 people costs less than 1ms. No memoization, no ISR, no module-level cache.

If the tree grows beyond ~500 people and becomes measurably slow: add a module-level cache keyed on the JSON file's content hash. But this is a Phase 6+ concern, not Phase 4.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Family tree layout math | Custom graph layout algorithm | `calcTree` from `relatives-tree` | Handles sibling spacing, cross-generational alignment, spouse units — non-trivial math |
| Crossfade animation | CSS transition with setTimeout | `AnimatePresence mode="wait"` from `motion/react` | Handles the overlap timing correctly; CSS transitions require manual state management |
| Schema validation | Manual type checks | Zod `.optional()` on gender field | Already established pattern; `.optional()` handles missing field automatically |
| Bidirectional ref checking | Ad-hoc array scans | Extend existing `validateBidirectionalRefs()` | Pattern already established in `lib/content.ts` |

---

## Common Pitfalls

### Pitfall 1: Forgetting `key` on PersonPanel Inside AnimatePresence

**What goes wrong:** When the user clicks a different node, the PersonPanel content updates but NO animation fires — the old person's data just snaps to the new person's data.

**Why it happens:** Without a `key` prop, React reuses the same component instance. AnimatePresence can only trigger exit/enter when the component is actually unmounted/remounted, which requires a changed `key`.

**How to avoid:** Always pass `key={selectedId}` to the direct child of `AnimatePresence`.

**Warning signs:** Panel content changes but no slide-in/out animation is visible.

---

### Pitfall 2: Using `gender: 'other'` in the relatives-tree Node Input

**What goes wrong:** TypeScript error at build time OR unexpected behavior if the library ever acts on the gender value.

**Why it happens:** relatives-tree's `Gender` enum has only `'male'` and `'female'`. Our `PersonSchema` allows `'other'`. The adapter must map before calling `calcTree`.

**How to avoid:** The `personGender()` helper in `lib/tree.ts` maps `'other'` → `'male'` (layout default). The helper is the single place this conversion happens.

---

### Pitfall 3: Same Scale Factor for X and Y

**What goes wrong:** Nodes overlap vertically, or are spaced too widely horizontally (or vice versa).

**Why it happens:** Node dimensions are 160×60px — not square. Applying the same multiplier to both X and Y positions produces distorted spacing.

**How to avoid:** Use `H_UNIT` and `V_UNIT` as separate constants (e.g., 200px and 100px). Apply `H_UNIT` to `left`, `x1`, `x2`. Apply `V_UNIT` to `top`, `y1`, `y2`.

---

### Pitfall 4: Non-Primary Spouse Nodes Left in relatives-tree Input

**What goes wrong:** margaret-doe appears as a disconnected floating node on the canvas, or causes layout algorithm errors because her children are now attributed to mary-curry but she still appears as a spouse of william.

**Why it happens:** The flattening algorithm removes margaret-doe from the layout nodes. If the deletion is incomplete (e.g., only removed from william's spouses but left in the nodes array), the layout encounters a node with stale relationships.

**How to avoid:** The `flattenMultiSpouses` function must delete non-primary spouse nodes from `byId` AND filter them out of the output array with `.filter(n => byId.has(n.id))`.

---

### Pitfall 5: Connector Divs Have No Height/Width When Axis-Aligned

**What goes wrong:** Connectors are invisible — the `div` has `width: 0` (for vertical) or `height: 0` (for horizontal).

**Why it happens:** `Math.abs(x2 - x1) * H_UNIT` = 0 when x1 === x2 (vertical connector). A div with width 0 is invisible.

**How to avoid:** In `ConnectorLine`, set width to 1px for vertical connectors, height to 1px for horizontal connectors. The `isHorizontal` branch pattern handles this correctly.

---

### Pitfall 6: `PhotoCarousel` Timer Not Cleaned Up on Panel Close

**What goes wrong:** After closing the PersonPanel and reopening it, multiple timers are active, causing erratic carousel advancement (speeds up on each open).

**Why it happens:** `setTimeout` in `useEffect` without `return () => clearTimeout(timer)`. When PersonPanel unmounts (panel closes), the cleanup function runs — but only if it was returned from `useEffect`.

**How to avoid:** Always return the cleanup function. The pattern above shows `return () => clearTimeout(timer)` inside every `useEffect` that creates a timer.

---

### Pitfall 7: `motion/react` AnimatePresence for Cross-Page Transitions

**What goes wrong:** Wasted time trying to animate between `/tree` and another route.

**Why it happens:** This is the documented App Router limitation (PITFALLS.md Pitfall 4). It does not apply to within-page usage.

**How to avoid:** `AnimatePresence` in Phase 4 is ONLY used within `FamilyTreeCanvas` for the PersonPanel and inside `PhotoCarousel`. Neither wraps `{children}` at route level.

---

## Code Examples

### lib/tree.ts — Complete Adapter Skeleton

```typescript
// lib/tree.ts
// Server-side only — no 'use client'
import 'server-only'
import calcTree from 'relatives-tree'
import type { Node as RTNode, RelType, ExtNode, Connector, RelData } from 'relatives-tree/lib/types'
import { getPeople } from './content'
import type { Person } from './types'

// D-13: node pixel dimensions
export const NODE_WIDTH = 160
export const NODE_HEIGHT = 60

// Scale factors: grid units → pixels (separate X/Y because nodes are not square)
// SIZE = 2 (relatives-tree constant) → 1 grid unit = NODE_WIDTH/2 px horizontal
export const H_UNIT = NODE_WIDTH + 40   // 200: 40px gap between nodes
export const V_UNIT = NODE_HEIGHT + 40  // 100: 40px gap between generations

// D-07: RelativesTree node shape (assembled from Person data)
type RTInputNode = {
  id: string
  gender: 'male' | 'female'
  parents: { id: string; type: RelType }[]
  children: { id: string; type: RelType }[]
  siblings: { id: string; type: RelType }[]
  spouses: { id: string; type: RelType }[]
}

export type TreeData = {
  nodes: readonly ExtNode[]
  connectors: readonly Connector[]
  canvas: { width: number; height: number }
  rootId: string
}

// D-06: findRootId — eldest person with no parents
export function findRootId(people: Person[]): string {
  const root = people.find(p => p.parentIds.length === 0)
  if (!root) throw new Error('No root person found (person with empty parentIds[])')
  return root.id
}

// Map Person.gender to relatives-tree Gender (no 'other' in the library)
function toRTGender(person: Person): 'male' | 'female' {
  if (person.gender === 'male') return 'male'
  if (person.gender === 'female') return 'female'
  return 'male'  // default for 'other' and undefined
}

// D-03–D-05: Multi-spouse flattening (see full algorithm in Topic 2 above)
function flattenMultiSpouses(nodes: RTInputNode[]): RTInputNode[] {
  // ... (full algorithm as documented in Topic 2)
}

// Transform Person[] → RTInputNode[]
function toRTNodes(people: Person[]): RTInputNode[] {
  return people.map(person => ({
    id: person.id,
    gender: toRTGender(person),
    parents: person.parentIds.map(id => ({ id, type: 'blood' as RelType })),
    children: person.childIds.map(id => ({ id, type: 'blood' as RelType })),
    siblings: [],  // let relatives-tree infer siblings from shared parents
    spouses: person.spouseIds.map(id => ({ id, type: 'married' as RelType })),
  }))
}

// D-06: getTreeData — entry point called from tree/page.tsx
export function getTreeData(rootId?: string): TreeData {
  const people = getPeople()
  if (people.length === 0) return { nodes: [], connectors: [], canvas: { width: 0, height: 0 }, rootId: '' }

  const root = rootId ?? findRootId(people)
  const rtNodes = toRTNodes(people)
  const flattened = flattenMultiSpouses(rtNodes)

  const result: RelData = calcTree(flattened, { rootId: root })

  return {
    nodes: result.nodes,
    connectors: result.connectors,
    canvas: result.canvas,
    rootId: root,
  }
}
```

### Relation Label Computation (TREE-03)

The relation label (e.g., "GRANDFATHER", "FATHER") is relative to the root person. relatives-tree does NOT compute this — we derive it from the data.

```typescript
// Simple generation-based label (sufficient for Phase 4)
// More sophisticated label computation (SPOUSE, CHILD, etc.) can be Phase 5
function getRelationLabel(person: Person, rootId: string, people: Person[]): string {
  if (person.id === rootId) return 'ROOT'

  // BFS from root to find generation depth
  const personById = new Map(people.map(p => [p.id, p]))
  const visited = new Set<string>()
  const queue: { id: string; depth: number }[] = [{ id: rootId, depth: 0 }]

  while (queue.length) {
    const { id, depth } = queue.shift()!
    if (visited.has(id)) continue
    visited.add(id)
    if (id === person.id) {
      if (depth === 1) return 'CHILD'
      if (depth === 2) return 'GRANDCHILD'
      if (depth === -1) return 'PARENT'
      if (depth === -2) return 'GRANDPARENT'
      return depth > 0 ? 'DESCENDANT' : 'ANCESTOR'
    }
    const p = personById.get(id)
    if (!p) continue
    p.childIds.forEach(cid => queue.push({ id: cid, depth: depth + 1 }))
    p.parentIds.forEach(pid => queue.push({ id: pid, depth: depth - 1 }))
  }

  return 'RELATIVE'
}
```

For Phase 4, a simpler approach: pass generation depth as a number from the server (count parent hops from root) and map `0→'Root', 1→'Child', -1→'Parent', -2→'Grandparent'` etc. The exact label computation is Claude's discretion.

---

## Validation Architecture

Test framework for this project: TypeScript type-check + `next build` (per `package.json` "test" script: `tsc --noEmit && next build`).

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Command | File Exists? |
|--------|----------|-----------|---------|-------------|
| TREE-01 | `/tree` renders | build smoke | `npm run build` | n/a — build gate |
| TREE-02 | Root is eldest person with no parents | unit (manual) | `npm run build` + browser check | No — Wave 0 |
| TREE-03 | Name + relation label on each node | browser visual | `npm run dev` + visit /tree | No — Wave 0 |
| TREE-04 | Active node: navy/ivory/gold dot | browser visual | click a node | No — Wave 0 |
| TREE-05 | Connector lines visible, stone color | browser visual | visit /tree | No — Wave 0 |
| TREE-06 | Tree data server-side, canvas client | type check | `tsc --noEmit` | No — Wave 0 |
| TREE-07 | Multi-spouse mitigation: both children visible | browser visual | verify stub data | No — Wave 0 |
| TREE-08 | Clicking node opens PersonPanel | browser interaction | click a node | No — Wave 0 |
| TREE-09 | Panel shows bio + photos | browser visual | click a node | No — Wave 0 |
| TREE-10 | Photo carousel crossfades | browser visual | open panel with photos | No — Wave 0 |
| TREE-11 | Active dot gold | browser visual | open panel with photos | No — Wave 0 |

**Sampling rate:**
- Per task commit: `tsc --noEmit` (fast type check, catches structural errors)
- Per wave merge: `npm run build` (full static analysis + compilation)
- Phase gate: `npm run build` green + browser walkthrough of multi-spouse test case

### Wave 0 Gaps

- [ ] `lib/tree.ts` — does not exist; must be created in Wave 1
- [ ] `components/tree/` directory — does not exist
- [ ] Stub data with multi-spouse case — `content/family.json` must be updated before any tree work

---

## Security Domain

No new auth surfaces introduced in Phase 4. The tree page is behind `(protected)/layout.tsx` which already calls `await auth()`. No new API routes, no new data inputs from users, no server actions.

| ASVS Category | Applies | Note |
|---------------|---------|------|
| V2 Authentication | No | Existing auth gate covers tree page |
| V5 Input Validation | Partial | `calcTree(rootId)` receives the rootId string from server-side `findRootId()` — not user input. No user-supplied IDs are passed to calcTree. |

---

## Open Questions

1. **Siblings field in RTInputNode — pass empty or compute?**
   - What we know: relatives-tree can infer siblings from shared parents. The `siblings[]` field in the input is optional metadata — leaving it empty works.
   - What's unclear: does leaving `siblings: []` cause any layout differences vs. populating it?
   - Recommendation: pass `siblings: []` for all nodes in Phase 4 (let relatives-tree infer from parent structure). Add explicit siblings in Phase 5 if needed.

2. **PersonPanel position: `absolute` vs `fixed`?**
   - What we know: D-14 says "within the tree section" — this means `position: absolute` relative to the tree container, not `position: fixed` over the whole viewport.
   - What's unclear: if the tree canvas is wider than the viewport and horizontally scrolled, an `absolute` panel on the right edge may be off-screen.
   - Recommendation: use `position: absolute` for Phase 4 (D-14 decision is locked). Flag for Phase 5 responsive review.

3. **`siblings` field for Emily's entry in stub data — emily has a parent (james) but no spouse for james**
   - What we know: james has no spouseIds, but emily has `parentIds: ['james-curry']` with only one parent.
   - What's unclear: does relatives-tree handle single-parent entries correctly?
   - Recommendation: Confirmed safe — in `getChildUnitsFunc`, `const [first, second] = parents` → if `second` is undefined, `hasSameRelation(undefined)` returns `!undefined` = `true`, so ALL of first's children pass. Single-parent works correctly.

---

## Environment Availability

Step 2.6: SKIPPED — this phase adds no new external dependencies. All required packages (`relatives-tree`, `motion`, `zod`) are already installed and confirmed in `node_modules`.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `motion/react` is a transparent re-export of `framer-motion` | Topic 5 | LOW — confirmed from `node_modules/motion/dist/cjs/react.js` which literally does `var framerMotion = require('framer-motion')` and re-exports everything |
| A2 | Leaving `siblings: []` in RTInputNode lets relatives-tree infer siblings from shared parents | Open Questions | LOW — if wrong, sibling spacing may be suboptimal but nodes still render |
| A3 | `position: absolute` for PersonPanel is sufficient for Phase 4 (Phase 5 refines for mobile) | Topic 5 | LOW — worst case: panel is off-screen on narrow viewports; Phase 5 fixes |

**All critical claims (coordinate system, bug mechanism, AnimatePresence mode, schema migration) are VERIFIED from source code in node_modules, not assumed.**

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `framer-motion` package | `motion` package (rebrand) | 2024 | Import from `motion/react`, not `framer-motion` |
| `react-family-tree` wrapper | Direct `calcTree()` output rendering | Phase 4 decision | Eliminates 4-year-old wrapper; ~50 lines of canvas code |

---

## Sources

### Primary (HIGH confidence — verified from installed source code)

- `node_modules/relatives-tree/src/types.ts` — all type definitions including `ExtNode`, `Connector`, `RelData`, `Node`, `Gender`
- `node_modules/relatives-tree/src/constants.ts` — `SIZE = 2` confirmed
- `node_modules/relatives-tree/src/utils/getExtendedNodes.ts` — `top`/`left` formula confirmed
- `node_modules/relatives-tree/src/children/create.ts` — bug mechanism confirmed (`hasSameRelation` filter)
- `node_modules/relatives-tree/src/connectors/parents.ts` — axis-aligned-only confirmed
- `node_modules/relatives-tree/samples/` — input shape examples (simple-family, several-spouses, diff-parents)
- `node_modules/framer-motion/dist/types/index.d.ts` — `AnimatePresenceProps` with `mode: "sync" | "popLayout" | "wait"` confirmed
- `node_modules/motion/dist/cjs/react.js` — confirmed motion/react is a direct re-export of framer-motion
- `lib/types.ts` — current PersonSchema (source of truth for migration)
- `lib/content.ts` — validateBidirectionalRefs pattern (source of truth for extension)
- `content/family.json` — current 3-person stub (source of truth for migration)
- `package.json` — all installed versions confirmed

### Secondary (MEDIUM confidence)

- `.planning/phases/04-family-tree/04-CONTEXT.md` — 25 locked decisions, canonical for this phase
- `.planning/research/PITFALLS.md` — Pitfall 5 (multi-spouse), Pitfall 3 (use client), Pitfall 4 (AnimatePresence cross-page)
- `.planning/research/SUMMARY.md` — stack confirmation

---

## Metadata

**Confidence breakdown:**
- relatives-tree API: HIGH — read directly from installed source
- Multi-spouse bug mechanism: HIGH — code path traced in `children/create.ts`
- Coordinate system: HIGH — `SIZE = 2`, formula in `getExtendedNodes.ts`, confirmed
- motion AnimatePresence: HIGH — type declarations read directly
- Schema migration: HIGH — existing PersonSchema read directly, Zod `.optional()` is established
- Bidirectional validator: HIGH — existing function read directly, extension pattern straightforward

**Research date:** 2026-04-29
**Valid until:** 2026-05-29 (stable libraries; relatives-tree 3.2.2 is pinned)
