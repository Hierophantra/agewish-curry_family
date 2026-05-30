// components/tree/connectors.ts
// Pure helpers (no 'use client' needed) that recompute tree connector geometry
// from the CURRENT node positions + the relationship graph. This replaces the
// relatives-tree pre-computed connectors so that when an admin drags a node,
// its lines follow it. Coordinates are unscaled canvas pixels.
import type { Person } from '@/lib/types'

export interface NodeBox {
  cx: number      // center x
  cy: number      // center y
  topY: number    // top edge
  bottomY: number // bottom edge
}

export interface TreeConnectors {
  parents: string[] // SVG path `d` strings: parent-couple → child elbows
  spouses: string[] // SVG path `d` strings: spouse links
}

// Build connector path data from a map of nodeId → box (current pixel position)
// and the people graph. Only nodes present in `boxes` participate (the rendered
// set, post multi-spouse flatten).
export function computeTreeConnectors(
  boxes: Map<string, NodeBox>,
  people: Person[],
): TreeConnectors {
  const parents: string[] = []
  const spouses: string[] = []
  const present = (id: string) => boxes.has(id)

  // Parent → child elbows. For each child, anchor at the midpoint of its present
  // parents and draw an orthogonal elbow down to the child's top-center:
  //   M anchorX,anchorY  →  V midY  →  H childX  →  V childTop
  // Children of the same couple share the anchor, so they fan out cleanly.
  for (const person of people) {
    if (!present(person.id)) continue
    const parentIds = (person.parentIds ?? []).filter(present)
    if (parentIds.length === 0) continue
    const child = boxes.get(person.id)!
    const pboxes = parentIds.map((id) => boxes.get(id)!)
    const anchorX = pboxes.reduce((s, b) => s + b.cx, 0) / pboxes.length
    const anchorY = Math.max(...pboxes.map((b) => b.bottomY)) // below the lower parent
    const childX = child.cx
    const childTop = child.topY
    const midY = anchorY + (childTop - anchorY) / 2
    parents.push(
      `M ${r(anchorX)} ${r(anchorY)} L ${r(anchorX)} ${r(midY)} L ${r(childX)} ${r(midY)} L ${r(childX)} ${r(childTop)}`,
    )
  }

  // Spouse links: a straight segment between the two partners' centers, deduped
  // by id pair so each couple draws one line.
  const seen = new Set<string>()
  for (const person of people) {
    if (!present(person.id)) continue
    for (const sid of person.spouseIds ?? []) {
      if (!present(sid)) continue
      const key = [person.id, sid].sort().join('|')
      if (seen.has(key)) continue
      seen.add(key)
      const a = boxes.get(person.id)!
      const b = boxes.get(sid)!
      spouses.push(`M ${r(a.cx)} ${r(a.cy)} L ${r(b.cx)} ${r(b.cy)}`)
    }
  }

  return { parents, spouses }
}

// Round to 1 decimal to keep path strings compact and stable.
function r(n: number): number {
  return Math.round(n * 10) / 10
}
