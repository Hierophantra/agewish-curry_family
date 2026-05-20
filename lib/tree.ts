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
 *   - only children that BOTH parents share are included. A child whose
 *   parents[] lists only one member of a couple gets dropped from the layout.
 *
 * v3 change - "Option A" alt-parent treatment:
 *   This function now only flattens a non-primary spouse when that spouse has
 *   NO children of their own in the graph. Those spouses are pure layout
 *   placeholders and the original mitigation still applies: their kids get
 *   re-pointed to the primary spouse so the library doesn't drop them.
 *
 *   When the non-primary spouse DOES have their own children list (e.g.
 *   Laurie Darrisaw is Trace's mother, recorded as a minimal record with
 *   childrenIds=[trace]), we leave the spouse and her children alone. The
 *   library handles multi-spouse rendering correctly when each (parent,
 *   spouse, child) triangle is mutually reciprocal in the data - the bug
 *   only bites when one side of the triangle is missing.
 *
 *   The result is bio-accurate: Trace appears under a "Galen + Laurie"
 *   couple-unit rather than the misleading "Galen + Cheryl" unit.
 *
 * Per D-04: runs unconditionally - single-spouse cases pass through unchanged.
 */
function flattenMultiSpouses(nodes: RelativesTreeNode[]): RelativesTreeNode[] {
  // Build a mutable map for O(1) lookup and in-place updates
  const byId = new Map(nodes.map((n) => [n.id, { ...n }]))

  for (const node of nodes) {
    // Single-spouse (or no-spouse) nodes pass through untouched
    if (node.spouses.length <= 1) continue

    // Partition non-primary spouses into two buckets:
    //   - "placeholder" spouses with no children of their own -> flatten away
    //   - "alt-parent" spouses with their own children list -> leave visible
    const primarySpouseId = node.spouses[0]!.id
    const nonPrimarySpouseIds = node.spouses.slice(1).map((s) => s.id)
    const placeholderIds: string[] = []
    const altParentIds: string[] = []

    for (const sid of nonPrimarySpouseIds) {
      const spouse = byId.get(sid)
      if (!spouse) continue
      if (spouse.children.length === 0) {
        placeholderIds.push(sid)
      } else {
        altParentIds.push(sid)
      }
    }

    // If no placeholders to flatten, the library can handle this multi-spouse
    // case natively - leave everything as-is.
    if (placeholderIds.length === 0) continue

    // Compute the spouses we keep visible after flattening: primary + any
    // alt-parents that have their own children.
    const survivingSpouseIds = [primarySpouseId, ...altParentIds]
    byId.set(node.id, {
      ...byId.get(node.id)!,
      spouses: survivingSpouseIds.map(
        (id) => node.spouses.find((s) => s.id === id)!,
      ),
    })

    // Add any orphan-from-placeholder children to the primary spouse so the
    // library renders them under the (primary) couple unit.
    const placeholderSet = new Set(placeholderIds)
    const orphanChildIds = new Set<string>()
    for (const pid of placeholderIds) {
      const placeholder = byId.get(pid)
      if (!placeholder) continue
      for (const c of placeholder.children) orphanChildIds.add(c.id)
    }

    const primarySpouse = byId.get(primarySpouseId)
    if (primarySpouse && orphanChildIds.size > 0) {
      const existing = new Set(primarySpouse.children.map((c) => c.id))
      const missing = [...orphanChildIds]
        .filter((id) => !existing.has(id))
        .map((id) => ({ id, type: 'blood' as RelType }))
      byId.set(primarySpouseId, {
        ...primarySpouse,
        children: [...primarySpouse.children, ...missing],
      })
    }

    // Rewrite each orphan's parents[] to swap the placeholder for the primary
    // spouse, so the library can find a matching couple unit.
    for (const childId of orphanChildIds) {
      const child = byId.get(childId)
      if (!child) continue
      const hasPlaceholderParent = child.parents.some((p) => placeholderSet.has(p.id))
      if (!hasPlaceholderParent) continue
      byId.set(childId, {
        ...child,
        parents: child.parents.map((p) =>
          placeholderSet.has(p.id) ? { id: primarySpouseId, type: p.type } : p,
        ),
      })
    }

    // Remove placeholder spouses from the layout entirely
    for (const pid of placeholderIds) byId.delete(pid)
  }

  // Return only nodes still present in byId
  return nodes
    .filter((n) => byId.has(n.id))
    .map((n) => byId.get(n.id)!)
}
