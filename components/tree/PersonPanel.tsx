// components/tree/PersonPanel.tsx
// 'use client' — uses motion/react for slide-in animation
'use client'
import { motion, useReducedMotion } from 'motion/react'
import Link from 'next/link'
import type { Person, Photo } from '@/lib/types'
import PhotoCarousel from './PhotoCarousel'
import { useFocusTrap } from '@/lib/focus-trap'

interface PersonPanelProps {
  person: Person
  photos: Photo[]      // pre-filtered to this person's photos (passed from FamilyTreeCanvas)
  people: Person[]     // full list — needed to resolve childrenIds → child names
  onClose: () => void
}

export default function PersonPanel({ person, photos, people, onClose }: PersonPanelProps) {
  const peopleById = new Map(people.map((p) => [p.id, p]))

  // prefers-reduced-motion: skip slide-in animation entirely when OS setting is enabled.
  const reduce = useReducedMotion()

  // Focus trap — panel is always open when mounted; returns focus to the tree node on close.
  const trapRef = useFocusTrap<HTMLElement>(true)

  // Resolve children names — v2 canonical childrenIds with v1 childIds fallback
  const resolvedChildrenIds = person.childrenIds.length > 0 ? person.childrenIds : person.childIds
  const childNames = resolvedChildrenIds
    .map((cid) => peopleById.get(cid)?.name ?? cid)

  // Format a full ISO date like "1920-04-12" as "April 12, 1920"
  function formatDateISO(iso: string): string {
    const [year, month, day] = iso.split('-').map(Number)
    if (!year || !month || !day) return iso
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ]
    const monthName = months[month - 1]!
    return `${monthName} ${day}, ${year}`
  }

  // Build "Born" label — prefer birthDate (full formatted), fall back to birthYear
  const bornLabel = person.birthDate
    ? formatDateISO(person.birthDate)
    : person.birthYear
      ? String(person.birthYear)
      : null

  // Birthplace — v2 canonical birthplace with v1 birthPlace fallback
  const birthplaceLabel = person.birthplace ?? person.birthPlace ?? null

  // Spouse — v2 spouseLabel (plain display string from JSON)
  const spouseLabel = person.spouseLabel ?? null

  // Children — comma-separated resolved names; show "(none)" if array is empty
  const childrenLabel =
    childNames.length > 0 ? childNames.join(', ') : '(none)'

  // Build meta rows — skip rows with no data
  type MetaRow = [string, string]
  const metaRows: MetaRow[] = []
  if (bornLabel) metaRows.push(['Born', bornLabel])
  if (birthplaceLabel) metaRows.push(['Birthplace', birthplaceLabel])
  if (spouseLabel) metaRows.push(['Spouse', spouseLabel])
  // Always show Children row (shows "(none)" when empty) if person could have children
  // (show only if childrenIds/childIds were defined, even if empty, to match prototype)
  metaRows.push(['Children', childrenLabel])

  return (
    // D-16: mobile bottom-sheet (fixed, full-width, slides from bottom, rounded top corners)
    // md+: fixed right sheet — anchored to viewport right edge, full screen height.
    //      Does NOT shrink the tree container — tree gets its full width regardless.
    //      z-40: above tree nodes (z-20 gradient, z-10 nodes) but below TopNav (z-50).
    //      Shadow on left edge creates visual separation from tree without a backdrop.
    // ARIA: role="dialog" aria-modal="true" — panel traps focus and overlays the tree.
    // aria-labelledby points at the h2 (person name) so screen readers announce
    // "William Curry dialog" when the panel opens.
    // D-A11Y: aria-modal=true because Tab IS trapped within the panel (useFocusTrap).
    <motion.aside
      ref={trapRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`person-panel-name-${person.id}`}
      className="fixed bottom-0 inset-x-0 max-h-[80vh] rounded-t-xl md:top-0 md:right-0 md:bottom-auto md:inset-x-auto md:h-screen md:w-[400px] md:rounded-none bg-ivory border-t hairline md:border-t-0 md:border-l z-40 flex flex-col overflow-y-auto"
      style={{ boxShadow: '-8px 0 24px -12px rgba(0,0,0,0.15)' }}
      initial={reduce ? false : { x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={reduce ? { opacity: 0 } : { x: '100%', opacity: 0 }}
      transition={reduce ? { duration: 0 } : { duration: 0.25, ease: 'easeInOut' }}
    >
      {/* Panel top: eyebrow + close button — matches .panel-top */}
      <div className="flex items-center justify-between px-[22px] pt-[22px] pb-0 mb-0">
        {/* panel-eyebrow: 10px, 0.22em tracking, uppercase, gold-deep */}
        <span
          className="text-gold-deep uppercase tracking-[0.22em] leading-none"
          style={{ fontSize: '10px' }}
        >
          {person.eyebrow ?? person.relationLabel ?? ''}
        </span>

        {/* panel-close: quiet color, 24px × character, 28px hit target */}
        <button
          type="button"
          onClick={onClose}
          className="text-quiet hover:text-navy transition-colors flex items-center justify-center w-7 h-7 text-2xl leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1"
          aria-label="Close panel"
        >
          ×
        </button>
      </div>

      {/* panel-name: serif 30px, navy, weight 400
          id referenced by aria-labelledby on the dialog element above */}
      <h2
        id={`person-panel-name-${person.id}`}
        className="font-serif text-navy px-[22px] mt-[22px]"
        style={{ fontSize: '30px', fontWeight: 400, lineHeight: 1.1 }}
      >
        {person.name}
      </h2>

      {/* panel-dates: v2 datesLabel preferred; italic serif 14px, text-muted */}
      {person.datesLabel && (
        <p
          className="font-serif italic text-muted px-[22px] mt-1 mb-[26px]"
          style={{ fontSize: '14px' }}
        >
          {person.datesLabel}
        </p>
      )}

      {/* Photo carousel — 4:5 aspect, Lightbox integration (Task 2) */}
      <div className="px-[22px]">
        <PhotoCarousel photos={photos} />
      </div>

      {/* panel-meta: key-value rows with hairline top border, 22px padding-top, 14px row gap */}
      {metaRows.length > 0 && (
        <div
          className="flex flex-col border-t hairline mt-0 px-[22px]"
          style={{ paddingTop: '22px', gap: '14px' }}
        >
          {metaRows.map(([k, v]) => (
            <div
              key={k}
              className="flex justify-between"
              style={{ fontSize: '13px', gap: '16px' }}
            >
              <span className="text-quiet flex-shrink-0">{k}</span>
              <span className="text-navy text-right">{v}</span>
            </div>
          ))}
        </div>
      )}

      {/* Bio intentionally removed — panel shows info + photos only.
          Full bio appears on the person detail page at /person/[id]. */}

      {/* View full page link — eyebrow style, subtle gold on hover (Phase 6 / D-08) */}
      <div className="px-[22px] pb-[22px] mt-auto pt-4">
        <Link
          href={`/person/${person.id}`}
          className="eyebrow text-quiet hover:text-gold transition-colors"
        >
          View full page →
        </Link>
      </div>
    </motion.aside>
  )
}
