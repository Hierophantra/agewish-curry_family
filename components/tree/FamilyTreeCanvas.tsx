// components/tree/FamilyTreeCanvas.tsx
// 'use client' - owns selectedId state; renders positioned nodes + connectors.
//
// v3.6 admin tree authoring:
//   - Initial view auto-centers on the eldest couple (Ernest & Nina).
//   - Connectors are recomputed client-side from the CURRENT node positions
//     (components/tree/connectors.ts) so dragged nodes stay wired up.
//   - Admin "Arrange" mode: drag nodes (snap to a 0.5-unit grid), recolor a
//     node, then Save & publish to content/tree-layout.json.
//   - PersonPanel gains admin quick-edit (passed isAdmin + allPeople).
'use client'
import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { AnimatePresence } from 'motion/react'
import type { ExtNode, Connector } from 'relatives-tree/lib/types'
import type { Person, Photo, TreeLayout, TreeNodeLayout } from '@/lib/types'
import { showsInPersonTree } from '@/lib/visibility'
import PersonNode from './PersonNode'
import PersonPanel from './PersonPanel'
import { computeTreeConnectors, type NodeBox } from './connectors'

// Layout constants - keep in sync with lib/tree.ts (cannot import lib/tree.ts here:
// it has `import 'server-only'` which would fail in the client bundle).
const NODE_WIDTH = 200   // px
const NODE_HEIGHT = 88   // px
const H_UNIT = 240       // px per horizontal grid unit (200px node + 40px gap)
const V_UNIT = 132       // px per vertical grid unit  (88px node + 44px gap)

// Snap granularity for admin drag, in grid units. 0.5 unit = 120px / 66px -
// fine enough to nudge, coarse enough that nodes stay aligned and tidy.
const SNAP = 0.5

// The eldest couple - the initial view centers here instead of the far-left
// edge (which was Robert's branch).
const FOCUS_IDS = ['ernest-curry-sr', 'nina-curry']

// Quiet stone line, matching the previous connector treatment.
const LINE_COLOR = 'color-mix(in oklab, var(--color-stone) 70%, transparent)'

export interface FamilyTreeCanvasProps {
  nodes: readonly ExtNode[]
  connectors: readonly Connector[] // no longer rendered (recomputed client-side); kept for API compat
  canvas: { width: number; height: number }
  people: Person[]
  photos: Photo[]
  isAdmin?: boolean
  treeLayout?: TreeLayout
}

// Simple depth-based relation labels relative to tree root.
function getRelationLabel(node: ExtNode, rootId: string, people: Person[]): string {
  const personMap = new Map(people.map((p) => [p.id, p]))
  function depth(id: string, target: string, visited = new Set<string>()): number | null {
    if (id === target) return 0
    if (visited.has(id)) return null
    visited.add(id)
    const person = personMap.get(id)
    if (!person) return null
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
  const rootPerson = personMap.get(rootId)
  if (rootPerson?.spouseIds.includes(node.id)) return 'SPOUSE'
  const nodePerson = personMap.get(node.id)
  if (nodePerson) {
    const rootParents = rootPerson?.parentIds ?? []
    const nodeChildren = nodePerson.childrenIds.length > 0 ? nodePerson.childrenIds : nodePerson.childIds
    if (nodeChildren.some((c) => rootParents.includes(c) || c === rootId)) return 'PARENT'
  }
  return 'FAMILY'
}

interface NodeDrag {
  id: string
  el: HTMLButtonElement
  startX: number
  startY: number
  baseLeft: number
  baseTop: number
  lastLeft: number
  lastTop: number
  moved: boolean
}

export default function FamilyTreeCanvas({
  nodes,
  connectors: _connectors, // eslint-disable-line @typescript-eslint/no-unused-vars
  canvas,
  people,
  photos,
  isAdmin = false,
  treeLayout,
}: FamilyTreeCanvasProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const urlPerson = searchParams.get('person')

  const [selectedId, setSelectedId] = useState<string | null>(urlPerson)
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null)
  const nodeRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const scrollRef = useRef<HTMLDivElement>(null)

  // ── Admin manual arrangement state ──
  const [overrides, setOverrides] = useState<Record<string, TreeNodeLayout>>(
    () => ({ ...(treeLayout?.nodes ?? {}) }),
  )
  const [arrange, setArrange] = useState(false)
  const [arrangeSelId, setArrangeSelId] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [layoutStatus, setLayoutStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [layoutError, setLayoutError] = useState<string | null>(null)
  const dragRef = useRef<NodeDrag | null>(null)
  const dragMoved = useRef(false)

  // Effective grid position for a node id (override wins over auto-layout).
  const effLeft = useCallback(
    (id: string, fallback: number) => overrides[id]?.x ?? fallback,
    [overrides],
  )
  const effTop = useCallback(
    (id: string, fallback: number) => overrides[id]?.y ?? fallback,
    [overrides],
  )

  // Sync URL → local state for back/forward browser navigation.
  useEffect(() => {
    if (urlPerson !== selectedId) setSelectedId(urlPerson)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlPerson])

  // Zoom.
  const ZOOM_MIN = 0.5
  const ZOOM_MAX = 2.0
  const ZOOM_STEP = 0.1
  const [zoom, setZoom] = useState(1)
  const zoomIn = () => setZoom((z) => Math.min(ZOOM_MAX, Math.round((z + ZOOM_STEP) * 10) / 10))
  const zoomOut = () => setZoom((z) => Math.max(ZOOM_MIN, Math.round((z - ZOOM_STEP) * 10) / 10))
  const zoomReset = () => setZoom(1)

  const peopleById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people])

  // Effective canvas size - grow to fit any nodes dragged past the auto bounds.
  const { canvasWidth, canvasHeight } = useMemo(() => {
    let maxX = canvas.width
    let maxY = canvas.height
    for (const n of nodes) {
      maxX = Math.max(maxX, (overrides[n.id]?.x ?? n.left) + 1)
      maxY = Math.max(maxY, (overrides[n.id]?.y ?? n.top) + 1)
    }
    return { canvasWidth: maxX * H_UNIT, canvasHeight: maxY * V_UNIT }
  }, [nodes, overrides, canvas.width, canvas.height])

  // Recompute connectors from current positions whenever nodes/overrides change.
  const treeLines = useMemo(() => {
    const boxes = new Map<string, NodeBox>()
    for (const n of nodes) {
      const leftPx = (overrides[n.id]?.x ?? n.left) * H_UNIT
      const topPx = (overrides[n.id]?.y ?? n.top) * V_UNIT
      boxes.set(n.id, {
        cx: leftPx + NODE_WIDTH / 2,
        cy: topPx + NODE_HEIGHT / 2,
        topY: topPx,
        bottomY: topPx + NODE_HEIGHT,
      })
    }
    return computeTreeConnectors(boxes, people)
  }, [nodes, overrides, people])

  function isSpouseByMarriage(person: Person | undefined): boolean {
    if (!person) return false
    const noParents = (person.parentIds ?? []).length === 0
    const hasSpouse = (person.spouseIds ?? []).length > 0
    const label = person.relationLabel ?? ''
    const isFounder = label === 'PATRIARCH' || label === 'MATRIARCH'
    const isAltParent = label.startsWith('MOTHER OF') || label.startsWith('FATHER OF')
      || label === 'MOTHER' || label === 'FATHER'
    return noParents && hasSpouse && !isFounder && !isAltParent
  }
  const rootId = nodes[0]?.id ?? ''

  // Lineage detection (unchanged) - dim non-lineage nodes when one is selected.
  const lineageIds: Set<string> | null = (() => {
    if (!selectedId) return null
    const set = new Set<string>([selectedId])
    const visit = (id: string, dir: 'up' | 'down', seen: Set<string>) => {
      if (seen.has(id)) return
      seen.add(id)
      const p = peopleById.get(id)
      if (!p) return
      if (dir === 'up') {
        for (const pid of p.parentIds ?? []) { set.add(pid); visit(pid, 'up', seen) }
      } else {
        const kids = p.childrenIds?.length ? p.childrenIds : (p.childIds ?? [])
        for (const cid of kids) { set.add(cid); visit(cid, 'down', seen) }
      }
    }
    visit(selectedId, 'up', new Set())
    visit(selectedId, 'down', new Set())
    const selected = peopleById.get(selectedId)
    if (selected) {
      for (const sid of selected.spouseIds ?? []) set.add(sid)
      for (const parentId of selected.parentIds ?? []) {
        const parent = peopleById.get(parentId)
        const sibs = parent?.childrenIds?.length ? parent.childrenIds : (parent?.childIds ?? [])
        for (const sib of sibs) set.add(sib)
      }
    }
    return set
  })()

  function handleSelect(id: string) {
    setSelectedId(id)
    setFocusedNodeId(id)
    const params = new URLSearchParams(searchParams.toString())
    params.set('person', id)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  function handleClose() {
    setSelectedId(null)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('person')
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  // ── Center the initial view on the eldest couple (run once after mount) ──
  const centeredRef = useRef(false)
  useEffect(() => {
    if (centeredRef.current) return
    const container = scrollRef.current
    if (!container) return
    const focusNodes = nodes.filter((n) => FOCUS_IDS.includes(n.id))
    const targets = focusNodes.length > 0 ? focusNodes : nodes.filter((n) => n.id === rootId)
    if (targets.length === 0) return
    const centerXs = targets.map((n) => (overrides[n.id]?.x ?? n.left) * H_UNIT + NODE_WIDTH / 2)
    const topYs = targets.map((n) => (overrides[n.id]?.y ?? n.top) * V_UNIT)
    const centerX = centerXs.reduce((a, b) => a + b, 0) / centerXs.length
    const minTop = Math.min(...topYs)
    container.scrollLeft = Math.max(0, centerX * zoom - container.clientWidth / 2)
    container.scrollTop = Math.max(0, minTop * zoom - 24)
    centeredRef.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes])

  // ── Arrange mode: enter/exit ──
  function toggleArrange() {
    setArrange((on) => {
      const next = !on
      if (next) handleClose() // close panel so it doesn't overlap arranging
      else setArrangeSelId(null)
      return next
    })
  }

  // ── Node drag (admin Arrange mode only) ──
  const onNodeMove = useCallback((e: PointerEvent) => {
    const d = dragRef.current
    if (!d) return
    const dxUnits = (e.clientX - d.startX) / (H_UNIT * zoom)
    const dyUnits = (e.clientY - d.startY) / (V_UNIT * zoom)
    const nx = d.baseLeft + dxUnits
    const ny = d.baseTop + dyUnits
    if (Math.abs(e.clientX - d.startX) > 3 || Math.abs(e.clientY - d.startY) > 3) d.moved = true
    d.lastLeft = nx
    d.lastTop = ny
    d.el.style.transform = `translate(${nx * H_UNIT}px, ${ny * V_UNIT}px)`
  }, [zoom])

  const onNodeUp = useCallback(() => {
    const d = dragRef.current
    window.removeEventListener('pointermove', onNodeMove)
    if (d) {
      dragMoved.current = d.moved
      if (d.moved) {
        const snap = (v: number) => Math.max(0, Math.round(v / SNAP) * SNAP)
        const nx = snap(d.lastLeft)
        const ny = snap(d.lastTop)
        d.el.style.transform = `translate(${nx * H_UNIT}px, ${ny * V_UNIT}px)`
        setOverrides((prev) => ({ ...prev, [d.id]: { ...prev[d.id], x: nx, y: ny } }))
        setDirty(true)
        if (layoutStatus === 'saved') setLayoutStatus('idle')
      }
    }
    dragRef.current = null
  }, [onNodeMove, layoutStatus])

  function startNodeDrag(e: React.PointerEvent<HTMLButtonElement>, node: ExtNode) {
    if (!arrange || !isAdmin) return
    const el = nodeRefs.current.get(node.id)
    if (!el) return
    e.preventDefault()
    e.stopPropagation()
    dragRef.current = {
      id: node.id,
      el,
      startX: e.clientX,
      startY: e.clientY,
      baseLeft: effLeft(node.id, node.left),
      baseTop: effTop(node.id, node.top),
      lastLeft: effLeft(node.id, node.left),
      lastTop: effTop(node.id, node.top),
      moved: false,
    }
    window.addEventListener('pointermove', onNodeMove)
    window.addEventListener('pointerup', onNodeUp, { once: true })
  }

  // Color + reset for the arrange-selected node.
  function setNodeColor(color: string | undefined) {
    if (!arrangeSelId) return
    setOverrides((prev) => {
      const next = { ...prev }
      const entry = { ...next[arrangeSelId] }
      if (color) entry.color = color
      else delete entry.color
      if (entry.x === undefined && entry.y === undefined && entry.color === undefined) delete next[arrangeSelId]
      else next[arrangeSelId] = entry
      return next
    })
    setDirty(true)
    if (layoutStatus === 'saved') setLayoutStatus('idle')
  }

  function resetNode(id: string) {
    setOverrides((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setDirty(true)
    if (layoutStatus === 'saved') setLayoutStatus('idle')
  }

  async function saveLayout() {
    setLayoutStatus('saving')
    setLayoutError(null)
    // Drop empty entries before committing.
    const cleaned: Record<string, TreeNodeLayout> = {}
    for (const [id, v] of Object.entries(overrides)) {
      if (v && (v.x !== undefined || v.y !== undefined || v.color !== undefined)) cleaned[id] = v
    }
    try {
      const res = await fetch('/api/admin/tree-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes: cleaned }),
      })
      if (!res.ok) throw new Error((await res.text()) || `${res.status}`)
      setLayoutStatus('saved')
      setDirty(false)
    } catch (err) {
      setLayoutStatus('error')
      setLayoutError(err instanceof Error ? err.message : String(err))
    }
  }

  function discardLayout() {
    setOverrides({ ...(treeLayout?.nodes ?? {}) })
    setDirty(false)
    setArrangeSelId(null)
    setLayoutStatus('idle')
  }

  // Arrow-key spatial navigation - uses EFFECTIVE positions so it matches what
  // the user sees after rearranging.
  const handleCanvasKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const navKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Escape']
      if (!navKeys.includes(e.key)) return
      if (e.key === 'Escape') {
        if (selectedId) { handleClose(); return }
        setFocusedNodeId(null)
        ;(e.currentTarget as HTMLElement).blur()
        return
      }
      e.preventDefault()
      const eL = (n: ExtNode) => overrides[n.id]?.x ?? n.left
      const eT = (n: ExtNode) => overrides[n.id]?.y ?? n.top
      const currentId = focusedNodeId ?? selectedId ?? (nodes[0]?.id ?? null)
      const currentNode = nodes.find((n) => n.id === currentId)
      if (!currentNode) {
        const first = nodes[0]
        if (first) { setFocusedNodeId(first.id); nodeRefs.current.get(first.id)?.focus() }
        return
      }
      const cL = eL(currentNode)
      const cT = eT(currentNode)
      let target: ExtNode | undefined
      if (e.key === 'ArrowRight') {
        const sameRow = nodes.filter((n) => eT(n) === cT && n.id !== currentNode.id)
        const rightOf = sameRow.filter((n) => eL(n) > cL)
        target = rightOf.reduce<ExtNode | undefined>((c, n) => (!c ? n : eL(n) < eL(c) ? n : c), undefined)
      } else if (e.key === 'ArrowLeft') {
        const sameRow = nodes.filter((n) => eT(n) === cT && n.id !== currentNode.id)
        const leftOf = sameRow.filter((n) => eL(n) < cL)
        target = leftOf.reduce<ExtNode | undefined>((c, n) => (!c ? n : eL(n) > eL(c) ? n : c), undefined)
      } else if (e.key === 'ArrowDown') {
        const below = nodes.filter((n) => eT(n) > cT)
        if (below.length > 0) {
          const nextRow = Math.min(...below.map((n) => eT(n)))
          const rowNodes = below.filter((n) => eT(n) === nextRow)
          target = rowNodes.reduce<ExtNode | undefined>((c, n) => (!c ? n : Math.abs(eL(n) - cL) < Math.abs(eL(c) - cL) ? n : c), undefined)
        }
      } else if (e.key === 'ArrowUp') {
        const above = nodes.filter((n) => eT(n) < cT)
        if (above.length > 0) {
          const prevRow = Math.max(...above.map((n) => eT(n)))
          const rowNodes = above.filter((n) => eT(n) === prevRow)
          target = rowNodes.reduce<ExtNode | undefined>((c, n) => (!c ? n : Math.abs(eL(n) - cL) < Math.abs(eL(c) - cL) ? n : c), undefined)
        }
      }
      if (target) { setFocusedNodeId(target.id); nodeRefs.current.get(target.id)?.focus() }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [focusedNodeId, selectedId, nodes, overrides]
  )

  const arrangeSelPerson = arrangeSelId ? peopleById.get(arrangeSelId) : undefined

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute right-0 top-0 h-full w-12 z-20 lg:hidden"
        style={{ background: 'linear-gradient(to right, transparent, white)' }}
        aria-hidden="true"
      />
      {/* Toolbar */}
      <div className="relative z-30 flex items-center justify-between gap-4 px-4 py-3 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-subtle)]/60">
        <p className="font-sans text-xs text-quiet truncate min-w-0">
          {arrange
            ? 'Arrange mode: drag people to move them. Click one to recolor it.'
            : selectedId
              ? `Selected: ${peopleById.get(selectedId)?.name ?? selectedId}. Click anywhere to deselect.`
              : 'Click a person to focus their lineage. Arrow keys to navigate.'}
        </p>

        <div className="flex items-center gap-2 shrink-0">
          {/* Admin: Arrange toggle */}
          {isAdmin && (
            <button
              type="button"
              onClick={toggleArrange}
              className={[
                'px-3 py-1.5 rounded-md text-xs border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                arrange
                  ? 'border-navy bg-navy text-white'
                  : 'border-[color:var(--color-border)] text-muted hover:text-navy bg-[color:var(--color-surface)]',
              ].join(' ')}
            >
              {arrange ? 'Done arranging' : 'Arrange'}
            </button>
          )}

          {/* Zoom cluster */}
          <div
            className="flex items-stretch bg-[color:var(--color-surface)] border border-[color:var(--color-border)] rounded-md shadow-sm"
            role="group"
            aria-label="Zoom controls"
          >
            <button type="button" onClick={zoomOut} disabled={zoom <= ZOOM_MIN} aria-label="Zoom out"
              className="px-2.5 py-1 text-navy text-base leading-none hover:bg-[color:var(--color-surface-subtle)] disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded-l-md">
              -
            </button>
            <button type="button" onClick={zoomReset} aria-label={`Reset zoom (currently ${Math.round(zoom * 100)} percent)`}
              className="px-2 py-1 text-quiet text-xs tabular-nums border-l border-r border-[color:var(--color-border)] hover:bg-[color:var(--color-surface-subtle)] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              style={{ minWidth: 48 }}>
              {Math.round(zoom * 100)}%
            </button>
            <button type="button" onClick={zoomIn} disabled={zoom >= ZOOM_MAX} aria-label="Zoom in"
              className="px-2.5 py-1 text-navy text-base leading-none hover:bg-[color:var(--color-surface-subtle)] disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded-r-md">
              +
            </button>
          </div>
        </div>
      </div>

      {/* Arrange sub-bar (admin, only while arranging) */}
      {arrange && isAdmin && (
        <div className="relative z-30 flex items-center flex-wrap gap-3 px-4 py-2.5 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
          {arrangeSelPerson ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-quiet">Color of</span>
              <span className="text-xs text-navy font-medium">{arrangeSelPerson.name}</span>
              <input
                type="color"
                value={overrides[arrangeSelId!]?.color ?? '#FFFDF7'}
                onChange={(e) => setNodeColor(e.target.value)}
                className="w-7 h-7 rounded border border-[color:var(--color-border)] cursor-pointer"
                aria-label="Node color"
              />
              {overrides[arrangeSelId!]?.color && (
                <button type="button" onClick={() => setNodeColor(undefined)} className="text-xs text-quiet hover:text-navy">Reset color</button>
              )}
              <button type="button" onClick={() => resetNode(arrangeSelId!)} className="text-xs text-quiet hover:text-navy underline underline-offset-2">Reset position + color</button>
            </div>
          ) : (
            <span className="text-xs text-quiet">Click a person to recolor it. Drag to move.</span>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {dirty && <span className="text-xs text-quiet">Unsaved changes</span>}
            <button
              type="button"
              onClick={saveLayout}
              disabled={!dirty || layoutStatus === 'saving'}
              className="bg-navy text-white px-3.5 py-1.5 rounded-md text-xs hover:opacity-90 transition-opacity disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              {layoutStatus === 'saving' ? 'Publishing…' : 'Save & publish'}
            </button>
            <button type="button" onClick={discardLayout} disabled={!dirty} className="text-xs text-muted hover:text-navy disabled:opacity-40">Discard</button>
            {layoutStatus === 'saved' && <span className="font-serif italic text-gold-deep text-xs">Live in ~90s</span>}
            {layoutStatus === 'error' && <span className="font-serif italic text-red-600 text-xs">{layoutError}</span>}
          </div>
        </div>
      )}

      <div ref={scrollRef} className="overflow-auto" style={{ maxHeight: '80vh' }}>
        <div style={{ width: canvasWidth * zoom, height: Math.max(canvasHeight * zoom, 120) }}>
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
            {/* Connectors - recomputed from current positions; follow dragged nodes. */}
            <svg
              className="absolute inset-0 pointer-events-none"
              width={canvasWidth}
              height={canvasHeight}
              aria-hidden="true"
            >
              {treeLines.parents.map((d, i) => (
                <path key={`p${i}`} d={d} fill="none" stroke={LINE_COLOR} strokeWidth={1.25} />
              ))}
              {treeLines.spouses.map((d, i) => (
                <path key={`s${i}`} d={d} fill="none" stroke={LINE_COLOR} strokeWidth={1.25} />
              ))}
            </svg>

            {nodes.map((node) => {
              const person = peopleById.get(node.id)
              const name = person?.name ?? node.id
              const label = person?.relationLabel ?? getRelationLabel(node, rootId, people)
              const deathYear =
                person?.deathYear ??
                (person?.deathDate ? Number(person.deathDate.slice(0, 4)) : undefined)
              const left = effLeft(node.id, node.left)
              const top = effTop(node.id, node.top)
              return (
                <PersonNode
                  key={node.id}
                  node={node}
                  name={name}
                  isActive={!arrange && selectedId === node.id}
                  isFocused={arrange ? arrangeSelId === node.id : focusedNodeId === node.id}
                  relationLabel={label}
                  deathYear={deathYear}
                  isSpouseByMarriage={isSpouseByMarriage(person)}
                  isDimmed={!arrange && lineageIds !== null && !lineageIds.has(node.id)}
                  colorOverride={overrides[node.id]?.color}
                  draggable={arrange && isAdmin}
                  onPointerDown={arrange && isAdmin ? (e) => startNodeDrag(e, node) : undefined}
                  onClick={() => {
                    if (arrange && isAdmin) {
                      if (dragMoved.current) { dragMoved.current = false; return }
                      setArrangeSelId(node.id)
                      return
                    }
                    if (node.id === selectedId) handleClose()
                    else handleSelect(node.id)
                  }}
                  onRef={(el) => {
                    if (el) nodeRefs.current.set(node.id, el)
                    else nodeRefs.current.delete(node.id)
                  }}
                  style={{
                    position: 'absolute',
                    transform: `translate(${left * H_UNIT}px, ${top * V_UNIT}px)`,
                    width: NODE_WIDTH,
                    height: NODE_HEIGHT,
                  }}
                />
              )
            })}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!arrange && selectedId && (() => {
          const person = people.find((p) => p.id === selectedId)
          if (!person) return null
          // Photos linked to this person (regardless of visibility), for the
          // curated-order lookup below.
          const linked = photos.filter((ph) => ph.peopleIds?.includes(person.id) || person.photoIds.includes(ph.id))
          const order = person.treeCarouselPhotoIds ?? []
          let personPhotos: typeof photos
          if (order.length > 0) {
            // Curated selection wins over the visibility filter and sets the order.
            const byId = new Map(linked.map((p) => [p.id, p]))
            personPhotos = order.map((id) => byId.get(id)).filter((p): p is Photo => Boolean(p)).slice(0, 5)
          } else {
            // Default: all photos this person is allowed to show in the tree panel.
            personPhotos = linked.filter((ph) => showsInPersonTree(ph.visibility, ph.peopleVisibility?.[person.id]))
          }
          return (
            <PersonPanel
              key={selectedId}
              person={person}
              photos={personPhotos}
              people={people}
              isAdmin={isAdmin}
              onClose={handleClose}
            />
          )
        })()}
      </AnimatePresence>
    </div>
  )
}
