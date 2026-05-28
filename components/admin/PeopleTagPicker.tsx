'use client'
// components/admin/PeopleTagPicker.tsx
// Searchable people tagger. Replaces the long checkbox list in the photo /
// video editors with: selected people shown as removable chips + a search box
// that filters the family by name (and relation label) to add more.
//
// Controlled component - parent owns the selectedIds array and persists it.
// Scales to a large family far better than a 30-row checkbox column.
import { useState, useMemo } from 'react'
import type { Person } from '@/lib/types'

interface Props {
  allPeople: Person[]
  selectedIds: string[]
  onChange: (next: string[]) => void
  disabled?: boolean
  /** Noun for the empty/placeholder copy, e.g. "photo" or "video". */
  mediaNoun?: string
}

export default function PeopleTagPicker({ allPeople, selectedIds, onChange, disabled, mediaNoun = 'item' }: Props) {
  const [query, setQuery] = useState('')

  const byId = useMemo(() => new Map(allPeople.map((p) => [p.id, p])), [allPeople])
  const selected = selectedIds.map((id) => byId.get(id)).filter(Boolean) as Person[]

  // Filter the unselected people by the query (name + relation label).
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allPeople
      .filter((p) => !selectedIds.includes(p.id))
      .filter((p) => {
        if (!q) return true
        return (
          p.name.toLowerCase().includes(q) ||
          (p.relationLabel ?? '').toLowerCase().includes(q) ||
          (p.eyebrow ?? '').toLowerCase().includes(q)
        )
      })
      .slice(0, 8) // keep the dropdown tidy
  }, [allPeople, selectedIds, query])

  function add(id: string) {
    if (selectedIds.includes(id)) return
    onChange([...selectedIds, id])
    setQuery('')
  }
  function remove(id: string) {
    onChange(selectedIds.filter((x) => x !== id))
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Selected chips */}
      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selected.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-surface-subtle)] border border-[color:var(--color-border)] pl-3 pr-1.5 py-1 text-sm text-navy"
            >
              {p.name}
              <button
                type="button"
                onClick={() => remove(p.id)}
                disabled={disabled}
                aria-label={`Remove ${p.name}`}
                className="w-5 h-5 grid place-items-center rounded-full text-quiet hover:text-navy hover:bg-stone/30 transition-colors disabled:opacity-50"
              >
                {'×'}
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="font-serif italic text-quiet text-sm">No one tagged in this {mediaNoun} yet.</p>
      )}

      {/* Search box */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={disabled}
          placeholder="Search family by name to tag..."
          className="w-full px-4 py-2.5 border border-stone rounded font-sans text-base text-navy bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-50"
        />
        {/* Results - only shown while typing, or always show first few when focused.
            We render the list below the input when there's a query or matches. */}
        {query.trim() && (
          <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-[color:var(--color-border)] rounded shadow-md max-h-64 overflow-y-auto">
            {matches.length === 0 ? (
              <p className="px-4 py-3 text-sm text-quiet font-serif italic">No matches.</p>
            ) : (
              matches.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => add(p.id)}
                  className="w-full text-left px-4 py-2.5 hover:bg-[color:var(--color-surface-subtle)] transition-colors flex items-center justify-between gap-3"
                >
                  <span className="font-sans text-sm text-navy">{p.name}</span>
                  {p.relationLabel && (
                    <span className="text-quiet text-xs">{p.relationLabel}</span>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
