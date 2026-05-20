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
  /**
   * True when this person married into the family (no parents in the archive,
   * at least one spouse in the archive, not a founder or alt-parent).
   * Computed in FamilyTreeCanvas from the person record. Renders the node
   * with a cool navy tint to distinguish from blood descendants.
   */
  isSpouseByMarriage?: boolean
  onClick: () => void
  onRef: (el: HTMLButtonElement | null) => void  // allows canvas to imperatively focus nodes
  style: CSSProperties
}

// node is accepted as a prop (required by FamilyTreeCanvas) but not rendered directly
// - we render `name` (resolved by canvas) instead of node.id
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function PersonNode({ node: _node, name, isActive, isFocused, relationLabel, deathYear, isSpouseByMarriage, onClick, onRef, style }: PersonNodeProps) {
  // Founders get a warm gold treatment so the eye starts at the top of the tree.
  const isFounder = relationLabel === 'PATRIARCH' || relationLabel === 'MATRIARCH'

  // Alt-parent records (e.g. Laurie Darrisaw, recorded only as the mother of
  // Trace) use a quieter, dashed-border treatment so they visually read as
  // "the other parent, not a fully-archived family member".
  const isAltParent = relationLabel === 'MOTHER' || relationLabel === 'FATHER'
    || relationLabel.startsWith('MOTHER OF') || relationLabel.startsWith('FATHER OF')

  // Visual color logic:
  //   - Founders          : warm ivory + gold border    (the roots)
  //   - Spouses-by-marriage: cool navy-tinted card      (joined by marriage)
  //   - Alt-parents       : dashed + faded ivory        (noted only)
  //   - Default (descendants): neutral white + ivory    (Curry lineage)
  // Active/focused states (the user's current interaction) override everything.

  return (
    <button
      ref={onRef}
      type="button"
      onClick={onClick}
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
              : isAltParent
                ? 'bg-ivory/70 border border-dashed border-stone shadow-none opacity-90 hover:opacity-100 hover:border-gold-deep/60 hover:-translate-y-0.5'
                : isSpouseByMarriage
                  ? 'bg-gradient-to-br from-white to-navy/[0.06] border-[0.5px] border-navy/30 shadow-sm hover:shadow-md hover:border-navy hover:-translate-y-0.5'
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

      {/* Tiny navy ring indicator in the corner for married-in spouses.
          A small, quiet "this person is here by marriage" cue. */}
      {!isActive && isSpouseByMarriage && (
        <span
          className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full border border-navy/60"
          aria-hidden="true"
          title="Married into the family"
        />
      )}

      {/* Name - font-serif. Alt-parent records render slightly smaller and in
          italic to read as "noted but not fully archived". */}
      <span
        className={[
          'font-serif leading-tight truncate w-full',
          isAltParent ? 'text-muted text-sm italic' : 'text-navy text-base',
        ].join(' ')}
      >
        {name}
      </span>

      {/* Relation label - uppercase eyebrow.
          Founders -> gold.  Spouses-by-marriage -> navy.  Alt-parents -> muted italic. */}
      <span
        className={[
          'eyebrow mt-1 truncate w-full',
          isFounder
            ? 'text-gold-deep'
            : isAltParent
              ? 'text-quiet italic normal-case tracking-normal text-xs'
              : isSpouseByMarriage
                ? 'text-navy/70'
                : 'text-quiet',
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
