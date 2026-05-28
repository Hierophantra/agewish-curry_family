'use client'
// components/admin/VisibilityPicker.tsx
// Shared, controlled visibility segmented-control for the admin photo/video
// editors. Pure presentational - the parent owns the value and persists it on
// form submit (unlike PersonMediaManager, which saves each change immediately).
//
// Four options mirror lib/types VisibilitySchema:
//   hidden | profile | gallery | everywhere
// The "gallery" label is kind-aware: "Photos only" vs "Videos only".
import type { Visibility } from '@/lib/types'

interface Props {
  kind: 'photo' | 'video'
  value: Visibility
  onChange: (next: Visibility) => void
  disabled?: boolean
}

export default function VisibilityPicker({ kind, value, onChange, disabled }: Props) {
  const galleryLabel = kind === 'photo' ? 'Photos only' : 'Videos only'
  const options: Array<{ value: Visibility; label: string; help: string }> = [
    { value: 'hidden', label: 'Hidden', help: 'Linked for the record, shown nowhere' },
    { value: 'profile', label: 'Profile + tree', help: 'A linked person’s page and the family-tree snippet only' },
    { value: 'gallery', label: galleryLabel, help: `Shows only in the ${kind === 'photo' ? 'Photographs gallery' : 'Videos section'}, not profiles or the tree` },
    { value: 'everywhere', label: 'Everywhere', help: 'Profiles, tree, and the main section' },
  ]

  const active = options.find((o) => o.value === value) ?? options[3]

  return (
    <div className="flex flex-col gap-1.5">
      <div role="group" aria-label="Visibility" className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const isActive = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              disabled={disabled}
              title={opt.help}
              aria-pressed={isActive}
              className={[
                'px-3 py-1.5 rounded text-sm border transition-colors',
                isActive
                  ? 'border-navy bg-navy text-white'
                  : 'border-[color:var(--color-border)] text-muted hover:text-navy hover:border-stone',
                disabled ? 'opacity-60 cursor-not-allowed' : '',
              ].join(' ')}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
      <span className="text-quiet font-serif italic text-xs">{active.help}.</span>
    </div>
  )
}
