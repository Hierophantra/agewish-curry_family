// components/tree/FamilyTreeCanvas.tsx
// 'use client' — owns selectedId state; renders positioned nodes + connectors
'use client'
import { useState } from 'react'
import { AnimatePresence } from 'motion/react'
import type { ExtNode, Connector } from 'relatives-tree/lib/types'
import type { Person, Photo } from '@/lib/types'
import PersonNode from './PersonNode'
import ConnectorLine from './ConnectorLine'
import PersonPanel from './PersonPanel'

// Layout constants — keep in sync with lib/tree.ts (cannot import lib/tree.ts here:
// it has `import 'server-only'` which would fail in the client bundle).
// D-13: node dimensions; RESEARCH §Topic 3: padding multipliers for visual breathing room
const NODE_WIDTH = 160   // px
const NODE_HEIGHT = 60   // px
const H_UNIT = 200       // px per horizontal grid unit (160px node + 40px gap)
const V_UNIT = 100       // px per vertical grid unit  (60px node  + 40px gap)

export interface FamilyTreeCanvasProps {
  nodes: readonly ExtNode[]
  connectors: readonly Connector[]
  canvas: { width: number; height: number }
  people: Person[]
  photos: Photo[]
}

// Simple depth-based relation labels relative to tree root.
// Positive depth = descendant; negative = ancestor (not used in Phase 4 since root has no parents).
// 'other' catches spouses, siblings, in-laws at same generation.
function getRelationLabel(node: ExtNode, rootId: string, people: Person[]): string {
  // Find generational depth relative to root by BFS on childIds
  const personMap = new Map(people.map((p) => [p.id, p]))

  function depth(id: string, target: string, visited = new Set<string>()): number | null {
    if (id === target) return 0
    if (visited.has(id)) return null
    visited.add(id)
    const person = personMap.get(id)
    if (!person) return null
    // v2 canonical childrenIds; v1 childIds back-compat fallback
    const children = person.childrenIds.length > 0 ? person.childrenIds : person.childIds
    for (const childId of children) {
      const d = depth(childId, target, visited)
      if (d !== null) return d + 1
    }
    return null
  }

  const d = depth(rootId, node.id)
  if (d === 0) return 'ROOT'
  if (d === 1) return 'CHILD'
  if (d === 2) return 'GRANDCHILD'
  if (d !== null && d > 2) return 'DESCENDANT'

  // Check if node is a spouse of the root
  const rootPerson = personMap.get(rootId)
  if (rootPerson?.spouseIds.includes(node.id)) return 'SPOUSE'

  // Check parent relationships
  const nodePerson = personMap.get(node.id)
  if (nodePerson) {
    const rootParents = rootPerson?.parentIds ?? []
    const nodeChildren = nodePerson.childrenIds.length > 0 ? nodePerson.childrenIds : nodePerson.childIds
    if (nodeChildren.some((c) => rootParents.includes(c) || c === rootId)) return 'PARENT'
  }

  return 'FAMILY'
}

export default function FamilyTreeCanvas({
  nodes,
  connectors,
  canvas,
  people,
  photos,
}: FamilyTreeCanvasProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const canvasWidth = canvas.width * H_UNIT
  const canvasHeight = canvas.height * V_UNIT

  // Build person lookup for name + relation resolution
  const peopleById = new Map(people.map((p) => [p.id, p]))
  const rootId = nodes[0]?.id ?? ''

  return (
    // D-12: relative wrapper hosts the right-edge gradient indicator
    <div className="relative">
      {/* Right-edge gradient fade — signals there is more content to scroll to on mobile.
          pointer-events-none so it does not block horizontal scroll touch events.
          lg:hidden hides it on laptop+ where the tree typically fits the viewport. */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-full w-12 z-20 lg:hidden"
        style={{ background: 'linear-gradient(to right, transparent, white)' }}
        aria-hidden="true"
      />
      {/* D-10: overflow-x-auto enables horizontal scroll on narrow viewports.
          Tree container stays at full width regardless of panel state — panel no longer
          shrinks the tree (panel is now fixed/viewport-positioned, not docked inside). */}
      <div className="overflow-x-auto">
        {/* Relative-positioned canvas — all nodes + connectors are absolutely positioned children. */}
        <div
          className="relative"
          style={{ width: canvasWidth, height: canvasHeight, minHeight: 120 }}
        >
        {/* Connector lines rendered BEFORE nodes so nodes appear on top */}
        {connectors.map(([x1, y1, x2, y2], i) => (
          <ConnectorLine key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
        ))}

        {/* Person nodes — absolutely positioned by transform: translate(left*H_UNIT, top*V_UNIT) */}
        {nodes.map((node) => {
          const person = peopleById.get(node.id)
          const name = person?.name ?? node.id
          // v2: prefer person.relationLabel (e.g. "GRANDFATHER", "SON", "GRANDDAUGHTER");
          // fall back to computed label for people without this field
          const label = person?.relationLabel ?? getRelationLabel(node, rootId, people)
          return (
            <PersonNode
              key={node.id}
              node={node}
              name={name}
              isActive={selectedId === node.id}
              relationLabel={label}
              onClick={() => setSelectedId(node.id === selectedId ? null : node.id)}
              style={{
                position: 'absolute',
                transform: `translate(${node.left * H_UNIT}px, ${node.top * V_UNIT}px)`,
                width: NODE_WIDTH,
                height: NODE_HEIGHT,
              }}
            />
          )
        })}
        </div>
      </div>

      {/* PersonPanel — fixed-position right sheet (viewport-anchored, not docked inside tree).
          Slides in from the right edge of the screen; tree width is NOT affected.
          AnimatePresence fires exit animation when selectedId becomes null or changes.
          key={selectedId} is CRITICAL: forces remount on person change so exit fires between selections. */}
      <AnimatePresence mode="wait">
        {selectedId && (() => {
          const person = people.find((p) => p.id === selectedId)
          if (!person) return null
          const personPhotos = photos.filter((ph) => person.photoIds.includes(ph.id))
          return (
            <PersonPanel
              key={selectedId}          // CRITICAL: key forces remount on person change
              person={person}           // so exit animation fires between selections
              photos={personPhotos}
              people={people}
              onClose={() => setSelectedId(null)}
            />
          )
        })()}
      </AnimatePresence>
    </div>
  )
}
