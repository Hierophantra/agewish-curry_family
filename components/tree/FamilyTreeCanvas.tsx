// components/tree/FamilyTreeCanvas.tsx
// 'use client' — owns selectedId state; renders positioned nodes + connectors
'use client'
import { useState } from 'react'
import { AnimatePresence } from 'motion/react'
import type { ExtNode, Connector } from 'relatives-tree/lib/types'
import type { Person, Photo } from '@/lib/types'
import { NODE_WIDTH, NODE_HEIGHT, H_UNIT, V_UNIT } from '@/lib/tree'
import PersonNode from './PersonNode'
import ConnectorLine from './ConnectorLine'
// PersonPanel imported in Plan 04-03 — leave a TODO comment here for now:
// import PersonPanel from './PersonPanel'

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
    for (const childId of person.childIds) {
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
    if (nodePerson.childIds.some((c) => rootParents.includes(c) || c === rootId)) return 'PARENT'
  }

  return 'FAMILY'
}

export default function FamilyTreeCanvas({
  nodes,
  connectors,
  canvas,
  people,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  photos: _photos,  // _photos unused until PersonPanel wired in Plan 04-03
}: FamilyTreeCanvasProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const canvasWidth = canvas.width * H_UNIT
  const canvasHeight = canvas.height * V_UNIT

  // Build person lookup for name + relation resolution
  const peopleById = new Map(people.map((p) => [p.id, p]))
  const rootId = nodes[0]?.id ?? ''

  return (
    // D-10: overflow-x-auto enables horizontal scroll on narrow viewports
    <div className="overflow-x-auto">
      {/* Relative-positioned canvas — all nodes + connectors are absolutely positioned children */}
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
          const label = getRelationLabel(node, rootId, people)
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

      {/* PersonPanel slot — wired in Plan 04-03 */}
      {/* AnimatePresence is placed here so it wraps PersonPanel correctly */}
      <AnimatePresence mode="wait">
        {/* TODO(04-03): render PersonPanel when selectedId is set */}
        {null}
      </AnimatePresence>
    </div>
  )
}
