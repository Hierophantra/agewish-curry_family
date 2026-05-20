// components/tree/ConnectorLine.tsx
// 'use client' - co-located with canvas; positioned divs require DOM calculations
'use client'

// H_UNIT and V_UNIT from lib/tree.ts - keep in sync if changed
// D-12: connector lines are 1px stone (#C9C4B0) positioned divs, NOT SVG
const H_UNIT = 200
const V_UNIT = 100

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

  // All relatives-tree connectors are axis-aligned: either horizontal (y1===y2) or vertical (x1===x2)
  // Horizontal line: 1px tall, full width
  // Vertical line:   1px wide, full height
  const isHorizontal = y1 === y2

  return (
    <div
      // bg-stone: D-12 specifies stone color #C9C4B0 for connector lines
      // pointer-events-none: connectors must not intercept clicks intended for nodes
      className="absolute bg-stone pointer-events-none"
      style={{
        left,
        top,
        width: isHorizontal ? width : 1,
        height: isHorizontal ? 1 : height,
      }}
    />
  )
}
