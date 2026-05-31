'use client'
// components/admin/VisibilityPicker.tsx
// Shared, controlled visibility control for the admin photo/video editors.
// A single-choice BASE visibility (radio-like segmented control) plus, for
// photos, a separate multi-choice "hero rotation" add-on that combines with any
// base. Parent owns the state and persists it on form submit.
//
// Base options mirror lib/types VisibilitySchema (v3.6):
//   hidden | profile-tree | gallery | gallery-profile | everywhere
// The "gallery" label is kind-aware: "Photos only" vs "Videos only".
import type { Visibility } from '@/lib/types'

interface Props {
  kind: 'photo' | 'video'
  value: Visibility
  onChange: (next: Visibility) => void
  /** Hero rotation add-on (photos only). Combinable with any base visibility. */
  inHero?: boolean
  onHeroChange?: (next: boolean) => void
  showHero?: boolean
  disabled?: boolean
}

export default function VisibilityPicker({ kind, value, onChange, inHero = false, onHeroChange, showHero = false, disabled }: Props) {
  const sectionName = kind === 'photo' ? 'Photographs gallery' : 'Videos section'
  const galleryLabel = kind === 'photo' ? 'Photos only' : 'Videos only'
  const galleryProfileLabel = kind === 'photo' ? 'Photos + profile' : 'Videos + profile'

  const options: Array<{ value: Visibility; label: string; help: string }> = [
    { value: 'hidden', label: 'Hidden', help: 'Shown nowhere on the site' },
    { value: 'profile-tree', label: 'Profile + tree', help: 'The full profile page and the family-tree summary — not the gallery' },
    { value: 'gallery', label: galleryLabel, help: `Only in the ${sectionName}, not profiles or the tree` },
    { value: 'gallery-profile', label: galleryProfileLabel, help: `The ${sectionName} and the full profile page, but not the family-tree summary` },
    { value: 'everywhere', label: 'Everywhere', help: 'Gallery, full profile, and the family-tree summary' },
  ]

  const active = options.find((o) => o.value === value) ?? options[4]

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

      {/* Hero rotation add-on (photos only) — independent of the base choice. */}
      {showHero && onHeroChange && (
        <label className="flex items-center gap-2 mt-2 text-sm text-navy cursor-pointer">
          <input
            type="checkbox"
            checked={inHero}
            onChange={(e) => onHeroChange(e.target.checked)}
            disabled={disabled}
            className="w-4 h-4 accent-navy"
          />
          Also in hero rotation
          <span className="text-quiet font-serif italic text-xs">— adds this photo to the home-page hero, on top of the choice above.</span>
        </label>
      )}
    </div>
  )
}
