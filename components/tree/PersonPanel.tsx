// components/tree/PersonPanel.tsx
// 'use client' — uses motion/react for slide-in animation
'use client'
import { motion } from 'motion/react'
import type { Person, Photo } from '@/lib/types'
import PhotoCarousel from './PhotoCarousel'

interface PersonPanelProps {
  person: Person
  photos: Photo[]       // pre-filtered by FamilyTreeCanvas to person.photoIds
  people: Person[]      // full people array — for resolving spouse names
  onClose: () => void
}

export default function PersonPanel({ person, photos, people, onClose }: PersonPanelProps) {
  // Build spouse lookup for display names
  const peopleById = new Map(people.map((p) => [p.id, p]))

  // Format year range: "1920–1998" or "b. 1920" if no death year
  function formatYears(birthYear?: number, deathYear?: number): string | null {
    if (!birthYear) return null
    if (deathYear) return `${birthYear}–${deathYear}`
    return `b. ${birthYear}`
  }

  const years = formatYears(person.birthYear, person.deathYear)

  return (
    // D-14: slides in from right, absolute positioned, contained within tree container
    // w-80 = 320px on desktop; full-width on mobile via responsive override
    // z-10: appears above canvas nodes without covering the full page
    <motion.aside
      className="absolute top-0 right-0 h-full w-80 bg-ivory border-l hairline z-10 flex flex-col overflow-y-auto"
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
    >
      {/* Panel header: close button + person name */}
      <div className="flex items-start justify-between px-5 pt-5 pb-3">
        <div className="flex-1 min-w-0">
          <h2 className="font-serif text-navy text-lg leading-tight">{person.name}</h2>
          {years && <p className="eyebrow text-quiet mt-0.5">{years}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="ml-3 mt-0.5 text-quiet hover:text-navy transition-colors text-lg leading-none"
          aria-label="Close panel"
        >
          ×
        </button>
      </div>

      {/* Photo carousel — D-15 */}
      <div className="px-5 pb-4">
        <PhotoCarousel photos={photos} />
      </div>

      {/* Person details */}
      <div className="px-5 pb-5 flex flex-col gap-3 flex-1">
        {/* Birthplace */}
        {person.birthPlace && (
          <div>
            <p className="eyebrow text-quiet mb-1">Birthplace</p>
            <p className="text-navy text-sm">{person.birthPlace}</p>
          </div>
        )}

        {/* Bio */}
        {person.bio && person.bio.trim().length > 0 && (
          <div>
            <p className="eyebrow text-quiet mb-1">About</p>
            <p className="text-muted text-sm leading-relaxed">{person.bio}</p>
          </div>
        )}

        {/* Spouses — D-03: render ALL spouses from Person.spouseIds[] (the unflattened list) */}
        {person.spouseIds.length > 0 && (
          <div>
            <p className="eyebrow text-quiet mb-1">
              {person.spouseIds.length === 1 ? 'Spouse' : 'Spouses'}
            </p>
            <ul className="flex flex-col gap-1">
              {person.spouseIds.map((sid) => {
                const spouse = peopleById.get(sid)
                return (
                  <li key={sid} className="text-navy text-sm">
                    {spouse?.name ?? sid}
                    {spouse?.birthYear && (
                      <span className="text-quiet ml-1 text-xs">
                        ({formatYears(spouse.birthYear, spouse.deathYear)})
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </motion.aside>
  )
}
