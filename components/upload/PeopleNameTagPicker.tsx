'use client'
// components/upload/PeopleNameTagPicker.tsx
// FREE-TEXT people tagger for family uploads ("who is in it").
//
// Cloned from components/admin/PeopleTagPicker.tsx, but it stores arbitrary
// NAMES (string[]) instead of person IDs: family members tag people who may not
// have a family-tree record. The search box autocompletes from `suggestions`
// (prior upload names + family-tree names) AND lets you add any new name by
// typing it and pressing Enter / clicking "Add". This is name entry, NOT
// face-detection.
//
// Controlled component — the parent owns the `value` array and persists it.
import { useState, useMemo } from 'react'

interface Props {
  /** Autocomplete pool: prior upload names ∪ family-tree names. */
  suggestions: string[]
  /** Currently tagged names (free text). */
  value: string[]
  onChange: (next: string[]) => void
  disabled?: boolean
}

export default function PeopleNameTagPicker({ suggestions, value, onChange, disabled }: Props) {
  const [query, setQuery] = useState('')

  // Case-insensitive set of already-tagged names for de-dupe checks.
  const takenLower = useMemo(
    () => new Set(value.map((n) => n.trim().toLowerCase())),
    [value],
  )

  // Suggestions not yet tagged that match the query (name contains).
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    return suggestions
      .filter((name) => !takenLower.has(name.trim().toLowerCase()))
      .filter((name) => (q ? name.toLowerCase().includes(q) : true))
      .slice(0, 8)
  }, [suggestions, takenLower, query])

  // The trimmed query is addable as a brand-new name when it is non-empty and
  // not already tagged or already an exact suggestion in the list.
  const trimmed = query.trim()
  const canAddNew =
    trimmed.length > 0 &&
    !takenLower.has(trimmed.toLowerCase()) &&
    !matches.some((m) => m.toLowerCase() === trimmed.toLowerCase())

  function add(name: string) {
    const clean = name.trim()
    if (!clean || takenLower.has(clean.toLowerCase())) return
    onChange([...value, clean])
    setQuery('')
  }
  function remove(name: string) {
    onChange(value.filter((n) => n !== name))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault() // don't submit the form
      if (canAddNew) add(trimmed)
      else if (matches.length > 0) add(matches[0])
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Tagged chips */}
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {value.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-surface-subtle)] border border-[color:var(--color-border)] pl-3 pr-1.5 py-1 text-sm text-navy"
            >
              {name}
              <button
                type="button"
                onClick={() => remove(name)}
                disabled={disabled}
                aria-label={`Remove ${name}`}
                className="w-5 h-5 grid place-items-center rounded-full text-quiet hover:text-navy hover:bg-stone/30 transition-colors disabled:opacity-50"
              >
                {'×'}
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="font-serif italic text-quiet text-sm">No one tagged in this photo yet.</p>
      )}

      {/* Search / add box */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Type a name — pick a suggestion or add a new one"
          className="w-full px-4 py-2.5 border border-stone rounded font-sans text-base text-navy bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-50"
        />
        {/* Dropdown: shown while typing. Lists matching suggestions + an
            "Add" row for a brand-new name. */}
        {trimmed && (matches.length > 0 || canAddNew) && (
          <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-[color:var(--color-border)] rounded shadow-md max-h-64 overflow-y-auto">
            {matches.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => add(name)}
                className="w-full text-left px-4 py-2.5 hover:bg-[color:var(--color-surface-subtle)] transition-colors font-sans text-sm text-navy"
              >
                {name}
              </button>
            ))}
            {canAddNew && (
              <button
                type="button"
                onClick={() => add(trimmed)}
                className="w-full text-left px-4 py-2.5 hover:bg-[color:var(--color-surface-subtle)] transition-colors flex items-center justify-between gap-3 border-t border-[color:var(--color-border)]"
              >
                <span className="font-sans text-sm text-navy">Add &ldquo;{trimmed}&rdquo;</span>
                <span className="text-quiet text-xs">new name</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
