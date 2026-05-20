// components/tree/FamilyTreeCanvas.tsx
// 'use client' - owns selectedId state; renders positioned nodes + connectors
'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { AnimatePresence } from 'motion/react'
import type { ExtNode, Connector } from 'relatives-tree/lib/types'
import type { Person, Photo } from '@/lib/types'
import PersonNode from './PersonNode'
import ConnectorLine from './ConnectorLine'
import PersonPanel from './PersonPanel'

// Layout constants - keep in sync with lib/tree.ts (cannot import lib/tree.ts here:
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
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const urlPerson = searchParams.get('person')

  // Initialise from URL so direct visits to /tree?person=<id> open the panel immediately.
  const [selectedId, setSelectedId] = useState<string | null>(urlPerson)
  // focusedNodeId tracks keyboard focus within the tree canvas (separate from panel selection).
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null)
  const nodeRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  // Sync URL → local state for back/forward browser navigation.
  // Guard: only update when the value actually differs to avoid infinite loops.
  useEffect(() => {
    if (urlPerson !== selectedId) {
      setSelectedId(urlPerson)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlPerson])

  // Zoom: clamp to a sensible range. 1.0 == native size.
  // Step matches the increments shown in the control cluster.
  const ZOOM_MIN = 0.5
  const ZOOM_MAX = 2.0
  const ZOOM_STEP = 0.1
  const [zoom, setZoom] = useState(1)
  const zoomIn = () => setZoom((z) => Math.min(ZOOM_MAX, Math.round((z + ZOOM_STEP) * 10) / 10))
  const zoomOut = () => setZoom((z) => Math.max(ZOOM_MIN, Math.round((z - ZOOM_STEP) * 10) / 10))
  const zoomReset = () => setZoom(1)

  const canvasWidth = canvas.width * H_UNIT
  const canvasHeight = canvas.height * V_UNIT

  // Build person lookup for name + relation resolution
  const peopleById = new Map(people.map((p) => [p.id, p]))
  const rootId = nodes[0]?.id ?? ''

  // handleSelect: push to history so the back button closes the panel naturally.
  function handleSelect(id: string) {
    setSelectedId(id)
    setFocusedNodeId(id)
    const params = new URLSearchParams(searchParams.toString())
    params.set('person', id)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  // handleClose: replace (no extra history entry - back button goes to previous page, not just un-opens panel).
  function handleClose() {
    setSelectedId(null)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('person')
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  // Arrow-key spatial navigation:
  // ArrowRight/Left: same row (top), closest horizontal neighbour
  // ArrowDown/Up: move to nearest node one row below/above
  // We measure row by the node.top value. Horizontal position by node.left.
  const handleCanvasKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const navKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Escape']
      if (!navKeys.includes(e.key)) return

      // Escape with no panel open: blur tree entirely
      if (e.key === 'Escape') {
        if (selectedId) {
          handleClose()
          return
        }
        setFocusedNodeId(null)
        ;(e.currentTarget as HTMLElement).blur()
        return
      }

      e.preventDefault()

      // Determine current node
      const currentId = focusedNodeId ?? selectedId ?? (nodes[0]?.id ?? null)
      const currentNode = nodes.find((n) => n.id === currentId)
      if (!currentNode) {
        // No focused node yet - move focus to first node
        const first = nodes[0]
        if (first) {
          setFocusedNodeId(first.id)
          nodeRefs.current.get(first.id)?.focus()
        }
        return
      }

      let target: ExtNode | undefined

      if (e.key === 'ArrowRight') {
        // Same row, next to the right
        const sameRow = nodes.filter((n) => n.top === currentNode.top && n.id !== currentNode.id)
        const rightOf = sameRow.filter((n) => n.left > currentNode.left)
        target = rightOf.reduce<ExtNode | undefined>((closest, n) => {
          if (!closest) return n
          return n.left < closest.left ? n : closest
        }, undefined)
      } else if (e.key === 'ArrowLeft') {
        // Same row, next to the left
        const sameRow = nodes.filter((n) => n.top === currentNode.top && n.id !== currentNode.id)
        const leftOf = sameRow.filter((n) => n.left < currentNode.left)
        target = leftOf.reduce<ExtNode | undefined>((closest, n) => {
          if (!closest) return n
          return n.left > closest.left ? n : closest
        }, undefined)
      } else if (e.key === 'ArrowDown') {
        // Row below current row - find horizontally closest node
        const belowRows = nodes.filter((n) => n.top > currentNode.top)
        if (belowRows.length > 0) {
          const nextRow = Math.min(...belowRows.map((n) => n.top))
          const nextRowNodes = belowRows.filter((n) => n.top === nextRow)
          target = nextRowNodes.reduce<ExtNode | undefined>((closest, n) => {
            if (!closest) return n
            return Math.abs(n.left - currentNode.left) < Math.abs(closest.left - currentNode.left)
              ? n
              : closest
          }, undefined)
        }
      } else if (e.key === 'ArrowUp') {
        // Row above current row - find horizontally closest node
        const aboveRows = nodes.filter((n) => n.top < currentNode.top)
        if (aboveRows.length > 0) {
          const prevRow = Math.max(...aboveRows.map((n) => n.top))
          const prevRowNodes = aboveRows.filter((n) => n.top === prevRow)
          target = prevRowNodes.reduce<ExtNode | undefined>((closest, n) => {
            if (!closest) return n
            return Math.abs(n.left - currentNode.left) < Math.abs(closest.left - currentNode.left)
              ? n
              : closest
          }, undefined)
        }
      }

      if (target) {
        setFocusedNodeId(target.id)
        nodeRefs.current.get(target.id)?.focus()
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [focusedNodeId, selectedId, nodes]
  )

  return (
    // D-12: relative wrapper hosts the right-edge gradient indicator
    <div className="relative">
      {/* Right-edge gradient fade - signals there is more content to scroll to on mobile.
          pointer-events-none so it does not block horizontal scroll touch events.
          lg:hidden hides it on laptop+ where the tree typically fits the viewport. */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-full w-12 z-20 lg:hidden"
        style={{ background: 'linear-gradient(to right, transparent, white)' }}
        aria-hidden="true"
      />
      {/* Zoom controls - floating cluster in the top-right of the tree area.
          z-30 sits above the right-edge gradient (z-20) and tree nodes. */}
      <div
        className="absolute right-3 top-3 z-30 flex items-stretch bg-white hairline border-stone rounded shadow-sm"
        role="group"
        aria-label="Zoom controls"
      >
        <button
          type="button"
          onClick={zoomOut}
          disabled={zoom <= ZOOM_MIN}
          aria-label="Zoom out"
          className="px-2.5 py-1 text-navy text-base leading-none hover:bg-ivory disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          −
        </button>
        <button
          type="button"
          onClick={zoomReset}
          aria-label={`Reset zoom (currently ${Math.round(zoom * 100)} percent)`}
          className="px-2 py-1 text-quiet text-xs tabular-nums border-l border-r border-stone hover:bg-ivory focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          style={{ minWidth: 48 }}
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          onClick={zoomIn}
          disabled={zoom >= ZOOM_MAX}
          aria-label="Zoom in"
          className="px-2.5 py-1 text-navy text-base leading-none hover:bg-ivory disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          +
        </button>
      </div>
      {/* D-10: overflow-x-auto enables horizontal scroll on narrow viewports.
          Tree container stays at full width regardless of panel state - panel no longer
          shrinks the tree (panel is now fixed/viewport-positioned, not docked inside).
          Outer wrapper is sized to the SCALED canvas so the scrollbars track zoom. */}
      <div className="overflow-auto" style={{ maxHeight: '80vh' }}>
        <div style={{ width: canvasWidth * zoom, height: Math.max(canvasHeight * zoom, 120) }}>
          {/* Relative-positioned canvas - all nodes + connectors are absolutely positioned children.
              onKeyDown handles arrow-key spatial navigation between nodes.
              role="group" + aria-label groups the tree for screen reader context.
              transform: scale() zooms everything; transform-origin top-left keeps (0,0) anchored. */}
          <div
            className="relative"
            style={{
              width: canvasWidth,
              height: canvasHeight,
              minHeight: 120,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
            }}
            onKeyDown={handleCanvasKeyDown}
            role="group"
            aria-label="Family tree - use arrow keys to navigate between family members, Enter to open panel, Escape to close"
          >
        {/* Connector lines rendered BEFORE nodes so nodes appear on top */}
        {connectors.map(([x1, y1, x2, y2], i) => (
          <ConnectorLine key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
        ))}

          {/* Person nodes - absolutely positioned by transform: translate(left*H_UNIT, top*V_UNIT) */}
          {nodes.map((node) => {
          const person = peopleById.get(node.id)
          const name = person?.name ?? node.id
          // v2: prefer person.relationLabel (e.g. "GRANDFATHER", "SON", "GRANDDAUGHTER");
          // fall back to computed label for people without this field
          const label = person?.relationLabel ?? getRelationLabel(node, rootId, people)
          // Compute death year for the node card. Prefer explicit deathYear, fall back
          // to parsing the year from deathDate (ISO YYYY-MM-DD).
          const deathYear =
            person?.deathYear ??
            (person?.deathDate ? Number(person.deathDate.slice(0, 4)) : undefined)
          return (
            <PersonNode
              key={node.id}
              node={node}
              name={name}
              isActive={selectedId === node.id}
              isFocused={focusedNodeId === node.id}
              relationLabel={label}
              deathYear={deathYear}
              onClick={() => {
                if (node.id === selectedId) {
                  handleClose()
                } else {
                  handleSelect(node.id)
                }
              }}
              onRef={(el) => {
                if (el) nodeRefs.current.set(node.id, el)
                else nodeRefs.current.delete(node.id)
              }}
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
      </div>

      {/* PersonPanel - fixed-position right sheet (viewport-anchored, not docked inside tree).
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
              onClose={handleClose}
            />
          )
        })()}
      </AnimatePresence>
    </div>
  )
}
