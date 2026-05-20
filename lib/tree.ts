// lib/tree.ts
// Server-side adapter: transforms Person[] to relatives-tree input shape,
// applies multi-spouse flattening mitigation, runs calcTree, returns layout data.
// NO 'use client' - this module must never run in the browser.
import 'server-only'
import calcTree from 'relatives-tree'
import type { ExtNode, Connector, Node as RelNode } from 'relatives-tree/lib/types'
import { getPeople } from './content'
import type { Person } from './types'

// ── Layout constants (exported so FamilyTreeCanvas can import them) ──
// D-13: node dimensions
// v3 visual upgrade: bumped from 160x60 to 200x88 for readability and warmth.
// H_UNIT/V_UNIT must stay larger than NODE so connector geometry has gap.
export const NODE_WIDTH = 200  // px
export const NODE_HEIGHT = 88  // px
// RESEARCH §Topic 3: use padding multipliers for visual breathing room
export const H_UNIT = 240  // px per horizontal grid unit (200px node + 40px gap)
export const V_UNIT = 132  // px per vertical grid unit  (88px node + 44px gap)

// ── Internal types ──
// The shape calcTree expects as input. Matches relatives-tree Node type exactly.
// 'gender' only accepts 'male'|'female' - no 'other' (library constraint, RESEARCH §Topic 1)
type RelType = 'blood' | 'married' | 'divorced' | 'adopted' | 'half'
type Relation = { id: string; type: RelType }
type RelativesTreeNode = {
  id: string
  gender: 'male' | 'female'
  parents: Relation[]
  children: Relation[]
  siblings: Relation[]
  spouses: Relation[]
}

// ── Public exports ──

export type TreeData = {
  nodes: readonly ExtNode[]
  connectors: readonly Connector[]
  canvas: { width: number; height: number }
  people: Person[]
}

/**
 * Returns the ID of the root person (eldest ancestor with no parents).
 * Default: 'william-curry' when family.json has the standard stub data.
 * Falls back to the first person in the array if no parentless person is found.
 */
export function findRootId(): string {
  const people = getPeople()
  const root = people.find((p) => p.parentIds.length === 0)
  return root?.id ?? people[0]?.id ?? 'william-curry'
}

/**
 * Computes the full layout for the family tree rooted at rootId.
 * Steps:
 *   1. Load Person[] from content/family.json
 *   2. Transform Person[] → RelativesTreeNode[] (adapt field names + map gender)
 *   3. Apply flattenMultiSpouses() to mitigate relatives-tree GitHub #24
 *   4. Call calcTree() from relatives-tree
 *   5. Return nodes, connectors, canvas bounding box, and original people array
 *
 * Throws ReferenceError if rootId is not found in the node array (calcTree behaviour).
 */
export function getTreeData(rootId: string): TreeData {
  const people = getPeople()

  // Step 2: adapt Person[] → RelativesTreeNode[]
  const rawNodes: RelativesTreeNode[] = people.map((p) => ({
    id: p.id,
    gender: personGender(p),
    // relatives-tree uses 'parents', 'children', 'siblings', 'spouses' (plural noun arrays)
    parents: p.parentIds.map((id) => ({ id, type: 'blood' as RelType })),
    children: p.childIds.map((id) => ({ id, type: 'blood' as RelType })),
    siblings: [],  // not tracked in our Person schema - relatives-tree discovers them via shared parents
    spouses: p.spouseIds.map((id) => ({ id, type: 'married' as RelType })),
  }))

  // Step 3: apply multi-spouse flattening mitigation (D-03, D-04, D-05)
  const flattenedNodes = flattenMultiSpouses(rawNodes)

  // Step 4: run calcTree
  // Cast to RelNode[] - our RelativesTreeNode is structurally identical to RelNode,
  // but relatives-tree uses const enum Gender/RelType in its .d.ts which TypeScript
  // treats as opaque types incompatible with plain string literals (isolatedModules constraint).
  const result = calcTree(flattenedNodes as unknown as readonly RelNode[], { rootId })

  return {
    nodes: result.nodes,
    connectors: result.connectors,
    canvas: result.canvas,
    people,  // original Person[] - PersonPanel reads from this (not from ExtNode)
  }
}

// ── Internal helpers ──

/**
 * Maps Person.gender to the 'male'|'female' values relatives-tree expects.
 * 'other' and undefined both default to 'male' - gender only affects layout symmetry,
 * not displayed anywhere in our renderer (RESEARCH §Topic 7).
 */
function personGender(person: Person): 'male' | 'female' {
  if (person.gender === 'male') return 'male'
  if (person.gender === 'female') return 'female'
  return 'male'  // default for 'other' and undefined
}

/**
 * Multi-spouse flattening mitigation - addresses relatives-tree GitHub #24.
 * https://github.com/SanichKotikov/relatives-tree/issues/24
 *
 * Bug mechanism (verified from node_modules/relatives-tree/src/children/create.ts):
 *   calcTree's getChildUnitsFunc filters children with first.children.filter(hasSameRelation(second))
 *   - only children that BOTH parents share are included. Children from a non-primary spouse
 *   pairing are silently dropped because that spouse doesn't claim them.
 *
 * Mitigation (D-03):
 *   For each person with >1 spouse:
 *     - Keep only the PRIMARY (first) spouse in spouses[] for layout
 *     - Ensure primary spouse's children[] includes ALL children from ALL pairings
 *     - Rewrite children's parents[] to reference primary spouse instead of non-primary
 *     - Remove non-primary spouse nodes from the layout entirely
 *   PersonPanel reads from the original Person.spouseIds[] (untouched) to show all spouses.
 *
 * Per D-04: runs unconditionally - single-spouse cases pass through unchanged.
 * Per D-05: documented inline here; if GitHub #24 is fixed upstream, this function
 *   can be simplified to a no-op while keeping the same signature.
 */
function flattenMultiSpouses(nodes: RelativesTreeNode[]): RelativesTreeNode[] {
  // Build a mutable map for O(1) lookup and in-place updates
  const byId = new Map(nodes.map((n) => [n.id, { ...n }]))

  for (const node of nodes) {
    // D-04: unconditional - single-spouse (or no-spouse) nodes pass through
    if (node.spouses.length <= 1) continue

    const primarySpouseId = node.spouses[0]!.id
    const nonPrimarySpouseIds = new Set(node.spouses.slice(1).map((s) => s.id))

    // Update this node: keep only primary spouse in spouses[]
    // children[] remains unchanged - it already has all children from all pairings
    byId.set(node.id, {
      ...byId.get(node.id)!,
      spouses: [node.spouses[0]!],
    })

    // Update primary spouse: add any children from this node that primary doesn't yet claim
    const primarySpouse = byId.get(primarySpouseId)
    if (primarySpouse) {
      const existingChildIds = new Set(primarySpouse.children.map((c) => c.id))
      const missingChildren = node.children.filter((c) => !existingChildIds.has(c.id))
      byId.set(primarySpouseId, {
        ...primarySpouse,
        children: [...primarySpouse.children, ...missingChildren],
      })
    }

    // For each non-primary spouse: redirect their children to claim primary spouse as parent
    for (const nonPrimaryId of nonPrimarySpouseIds) {
      const allChildIds = new Set(node.children.map((c) => c.id))

      for (const childId of allChildIds) {
        const child = byId.get(childId)
        if (!child) continue

        const hasNonPrimaryAsParent = child.parents.some((p) => p.id === nonPrimaryId)
        if (hasNonPrimaryAsParent) {
          // Replace non-primary parent ref with primary spouse ref
          byId.set(childId, {
            ...child,
            parents: child.parents.map((p) =>
              p.id === nonPrimaryId ? { id: primarySpouseId, type: p.type } : p
            ),
          })
        }
      }

      // Remove non-primary spouse from layout (PersonPanel shows them via Person.spouseIds[])
      byId.delete(nonPrimaryId)
    }
  }

  // Return only nodes still present in byId (non-primary spouses were deleted above)
  return nodes
    .filter((n) => byId.has(n.id))
    .map((n) => byId.get(n.id)!)
}
