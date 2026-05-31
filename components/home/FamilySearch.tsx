'use client'
// components/home/FamilySearch.tsx
// Home-page search: type a name → dropdown of matching family members → selecting
// navigates to that person's profile. Combobox pattern with keyboard support.
import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export interface PersonLite {
  id: string
  name: string
  relationLabel?: string
}

export default function FamilySearch({ people }: { people: PersonLite[] }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return people
      .filter((p) => p.name.toLowerCase().includes(q) || (p.relationLabel ?? '').toLowerCase().includes(q))
      .slice(0, 8)
  }, [people, query])

  function go(id: string) {
    setOpen(false)
    router.push(`/person/${id}`)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || matches.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % matches.length) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a - 1 + matches.length) % matches.length) }
    else if (e.key === 'Enter') { e.preventDefault(); const m = matches[active]; if (m) go(m.id) }
    else if (e.key === 'Escape') { setOpen(false) }
  }

  const showList = open && query.trim().length > 0

  return (
    <div className="max-w-md mx-auto w-full">
      <div className="relative">
        <input
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls="family-search-list"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setActive(0); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => { blurTimer.current = setTimeout(() => setOpen(false), 120) }}
          onKeyDown={onKeyDown}
          placeholder="Search for a family member…"
          className="w-full rounded-full border border-stone bg-[color:var(--color-surface)] px-5 py-3 pl-11 font-sans text-base text-navy shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          aria-label="Search for a family member"
        />
        {/* magnifier glyph */}
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-quiet" aria-hidden="true">⌕</span>

        {showList && (
          <ul
            id="family-search-list"
            role="listbox"
            className="absolute z-20 left-0 right-0 mt-2 bg-[color:var(--color-surface)] border border-[color:var(--color-border)] rounded-xl shadow-lg overflow-hidden max-h-72 overflow-y-auto"
          >
            {matches.length === 0 ? (
              <li className="px-4 py-3 text-sm text-quiet font-serif italic">No family member found.</li>
            ) : (
              matches.map((p, i) => (
                <li key={p.id} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    // onMouseDown (not onClick) so it fires before the input blur closes the list
                    onMouseDown={(e) => { e.preventDefault(); go(p.id) }}
                    onMouseEnter={() => setActive(i)}
                    className={[
                      'w-full text-left px-4 py-2.5 flex items-center justify-between gap-3 transition-colors',
                      i === active ? 'bg-[color:var(--color-surface-subtle)]' : '',
                    ].join(' ')}
                  >
                    <span className="font-serif text-navy text-base">{p.name}</span>
                    {p.relationLabel && <span className="eyebrow text-quiet text-[10px]">{p.relationLabel}</span>}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  )
}
