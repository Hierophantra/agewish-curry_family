// components/tree/PersonNode.tsx
// 'use client' — needs onClick for selectedId state in parent canvas
'use client'
import type { ExtNode } from 'relatives-tree/lib/types'
import type { CSSProperties } from 'react'

interface PersonNodeProps {
  node: ExtNode
  name: string           // person's display name from Person[] lookup in canvas
  isActive: boolean
  relationLabel: string  // e.g., "GRANDFATHER", "FATHER" — computed by canvas
  onClick: () => void
  style: CSSProperties
}

// node is accepted as a prop (required by FamilyTreeCanvas) but not rendered directly
// — we render `name` (resolved by canvas) instead of node.id
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function PersonNode({ node: _node, name, isActive, relationLabel, onClick, style }: PersonNodeProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      // D-13: 160px × 60px node
      // Inactive: white bg, stone border (hairline 0.5px)
      // Active (D-11): ivory bg, navy border (hairline-emphasis 1.25px)
      // cursor-pointer: makes the tree feel interactive
      // overflow-hidden: clips the gold dot to top-right corner
      className={[
        'relative flex flex-col items-start justify-center px-3',
        'text-left cursor-pointer overflow-hidden',
        'transition-colors duration-150',
        isActive
          ? 'bg-ivory hairline-emphasis border-navy'
          : 'bg-white hairline border-stone hover:bg-ivory',
      ].join(' ')}
      style={style}
    >
      {/* D-11: gold active dot, top-right corner */}
      {isActive && (
        <span
          className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-gold"
          aria-hidden="true"
        />
      )}

      {/* Name — D-13: font-serif, navy, sentence case */}
      <span className="font-serif text-navy text-sm leading-tight truncate w-full">
        {name}
      </span>

      {/* Relation label — D-13: eyebrow class (uppercase + tracking) */}
      <span className="eyebrow text-quiet mt-0.5">{relationLabel}</span>
    </button>
  )
}
