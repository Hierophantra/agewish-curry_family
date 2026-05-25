// components/tree/ConnectorLine.tsx
// 'use client' - co-located with canvas; positioned divs require DOM calculations
'use client'

// H_UNIT and V_UNIT from lib/tree.ts - keep in sync if changed
// v3.1: stone-default connector lines (was gold-deep/35). Reserving gold for
// selected-lineage emphasis would require connector-to-node mapping, which
// the relatives-tree library doesn't expose. For now: quiet uniform lines.
// The selected-lineage feature works via NODE dimming instead.
const H_UNIT = 240
const V_UNIT = 132

interface ConnectorLineProps {
  x1: number
  y1: number
  x2: number
  y2: number
}

export default function ConnectorLine({ x1, y1, x2, y2 }: ConnectorLineProps) {
  const left = Math.min(x1, x2) * H_UNIT
  const top = Math.min(y1, y2) * V_UNIT
  const width = Math.abs(x2 - x1) * H_UNIT
  const height = Math.abs(y2 - y1) * V_UNIT

  // All relatives-tree connectors are axis-aligned: either horizontal or vertical.
  const isHorizontal = y1 === y2

  return (
    <div
      // Quiet stone lines so branches read as "the structure" rather than "the
      // visual focal point". Gold connectors looked precious; stone reads as
      // wireframe-clean.
      // pointer-events-none so connectors don't intercept node clicks.
      className="absolute pointer-events-none"
      style={{
        left,
        top,
        width: isHorizontal ? width : 1.25,
        height: isHorizontal ? 1.25 : height,
        backgroundColor: 'color-mix(in oklab, var(--color-stone) 70%, transparent)',
      }}
    />
  )
}
