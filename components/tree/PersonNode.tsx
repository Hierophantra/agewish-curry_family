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
   * Renders the node with a calm blue-remembrance tint to distinguish from
   * blood descendants without crowding navy's active-state meaning.
   */
  isSpouseByMarriage?: boolean
  /**
   * Lineage dim mode. When a different person is selected and THIS node is
   * not part of their lineage (ancestors + descendants + siblings + spouse),
   * we dim it so the user can scan the lineage at a glance.
   */
  isDimmed?: boolean
  onClick: () => void
  onRef: (el: HTMLButtonElement | null) => void  // allows canvas to imperatively focus nodes
  style: CSSProperties
}

// node is accepted as a prop (required by FamilyTreeCanvas) but not rendered directly
// - we render `name` (resolved by canvas) instead of node.id
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function PersonNode({ node: _node, name, isActive, isFocused, relationLabel, deathYear, isSpouseByMarriage, isDimmed, onClick, onRef, style }: PersonNodeProps) {
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
          ? 'bg-[color:var(--color-surface)] border-[1.25px] border-navy shadow-md'
          : isFocused
            ? 'bg-[color:var(--color-surface)] ring-2 ring-gold ring-offset-1 border-[0.5px] border-stone'
            : isFounder
              ? 'bg-gradient-to-br from-[color:var(--color-surface)] to-[color:var(--color-ivory-deep)] border-[1px] border-gold-deep/60 shadow-sm hover:shadow-md hover:border-gold hover:-translate-y-0.5'
              : isAltParent
                ? 'bg-[color:var(--color-surface-subtle)]/80 border border-dashed border-stone shadow-none hover:border-stone hover:-translate-y-0.5'
                : isSpouseByMarriage
                  ? 'bg-[color:var(--color-surface)] border-[1px] border-[color:color-mix(in_oklab,var(--color-blue-remembrance)_40%,var(--color-border))] shadow-sm hover:shadow-md hover:border-[color:var(--color-blue-remembrance)] hover:-translate-y-0.5'
                  : 'bg-[color:var(--color-surface)] border-[0.5px] border-stone shadow-sm hover:shadow-md hover:border-gold-deep hover:-translate-y-0.5',
        isDimmed ? 'opacity-35 saturate-[0.85] hover:opacity-60' : '',
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

      {/* Tiny indicator dot in the corner for married-in spouses.
          Blue-remembrance to match the border treatment. */}
      {!isActive && isSpouseByMarriage && (
        <span
          className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[color:var(--color-blue-remembrance)]"
          aria-hidden="true"
          title="Married into the family"
        />
      )}

      {/* Name - font-serif. Alt-parent name no longer italic (italic on the
          name itself can read as lesser legitimacy). Muted color + dashed
          border + small label below carry the "noted only" meaning instead. */}
      <span
        className={[
          'font-serif leading-tight truncate w-full',
          isAltParent ? 'text-muted text-sm' : 'text-navy text-base',
        ].join(' ')}
      >
        {name}
      </span>

      {/* Relation label - uppercase eyebrow.
          Founders -> gold.  Spouses -> blue-remembrance.  Alt-parents -> muted lowercase. */}
      <span
        className={[
          'eyebrow mt-1 truncate w-full',
          isFounder
            ? 'text-gold-deep'
            : isAltParent
              ? 'text-quiet normal-case tracking-normal text-xs'
              : isSpouseByMarriage
                ? 'text-[color:var(--color-blue-remembrance)]'
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
