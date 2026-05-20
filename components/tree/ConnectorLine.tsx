// components/tree/ConnectorLine.tsx
// 'use client' - co-located with canvas; positioned divs require DOM calculations
'use client'

// H_UNIT and V_UNIT from lib/tree.ts - keep in sync if changed
// v3 visual upgrade: connector lines are 1.5px gold-deep/40 for subtle warmth.
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

  // All relatives-tree connectors are axis-aligned: either horizontal (y1===y2) or vertical (x1===x2)
  // Horizontal line: 1px tall, full width
  // Vertical line:   1px wide, full height
  const isHorizontal = y1 === y2

  return (
    <div
      // v3: subtle gold connector lines instead of stone gray. 1.5px gives
      // them just enough presence to read as "branches" of a tree without
      // shouting. pointer-events-none so connectors don't intercept node clicks.
      className="absolute pointer-events-none"
      style={{
        left,
        top,
        width: isHorizontal ? width : 1.5,
        height: isHorizontal ? 1.5 : height,
        backgroundColor: 'rgba(184, 133, 26, 0.35)',
      }}
    />
  )
}
