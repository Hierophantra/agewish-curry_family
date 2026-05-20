// components/tree/PersonNode.tsx
// 'use client' - needs onClick for selectedId state in parent canvas
'use client'
import type { ExtNode } from 'relatives-tree/lib/types'
import type { CSSProperties } from 'react'

interface PersonNodeProps {
  node: ExtNode
  name: string           // person's display name from Person[] lookup in canvas
  isActive: boolean
  isFocused: boolean     // keyboard focus indicator (separate from panel-open selection)
  relationLabel: string  // e.g., "PATRIARCH", "SECOND GENERATION" - computed by canvas
  deathYear?: number     // shown as "d. YYYY" line for deceased people
  onClick: () => void
  onRef: (el: HTMLButtonElement | null) => void  // allows canvas to imperatively focus nodes
  style: CSSProperties
}

// node is accepted as a prop (required by FamilyTreeCanvas) but not rendered directly
// - we render `name` (resolved by canvas) instead of node.id
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function PersonNode({ node: _node, name, isActive, isFocused, relationLabel, deathYear, onClick, onRef, style }: PersonNodeProps) {
  // Founders get a distinct visual treatment so the eye starts at the top of
  // the tree. Subtle gold accent rather than a loud highlight.
  const isFounder = relationLabel === 'PATRIARCH' || relationLabel === 'MATRIARCH'

  return (
    <button
      ref={onRef}
      type="button"
      onClick={onClick}
      // v3 upgraded sizing and treatment:
      //   - 200 x 88 px (was 160 x 60) for breathing room and readability
      //   - rounded-md corners feel less mechanical than sharp rectangles
      //   - gradient surface for subtle depth instead of flat white
      //   - shadow-sm baseline -> shadow-md on hover for lift
      //   - founders: ivory background + gold border for emphasis
      //   - active: navy border + ivory background + gold corner dot
      className={[
        'relative flex flex-col items-start justify-center px-4 py-2.5',
        'text-left cursor-pointer overflow-hidden rounded-md',
        'transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2',
        isActive
          ? 'bg-ivory border-[1.25px] border-navy shadow-md'
          : isFocused
            ? 'bg-ivory ring-2 ring-gold ring-offset-1 border-[0.5px] border-stone'
            : isFounder
              ? 'bg-gradient-to-br from-ivory to-ivory-deep border-[1px] border-gold-deep/60 shadow-sm hover:shadow-md hover:border-gold hover:-translate-y-0.5'
              : 'bg-gradient-to-br from-white to-ivory border-[0.5px] border-stone shadow-sm hover:shadow-md hover:border-gold hover:-translate-y-0.5',
      ].join(' ')}
      style={style}
    >
      {/* Active dot - gold, top-right */}
      {isActive && (
        <span
          className="absolute top-2 right-2 w-2 h-2 rounded-full bg-gold"
          aria-hidden="true"
        />
      )}

      {/* Name - font-serif, navy, larger size for readability at any zoom */}
      <span className="font-serif text-navy text-base leading-tight truncate w-full">
        {name}
      </span>

      {/* Relation label - uppercase eyebrow, gold for founders, quiet otherwise */}
      <span
        className={[
          'eyebrow mt-1 truncate w-full',
          isFounder ? 'text-gold-deep' : 'text-quiet',
        ].join(' ')}
      >
        {relationLabel}
      </span>

      {/* Deceased indicator - italic, only shown when deathYear is set */}
      {deathYear && (
        <span className="text-quiet text-[11px] leading-none mt-1 italic">
          d. {deathYear}
        </span>
      )}
    </button>
  )
}
