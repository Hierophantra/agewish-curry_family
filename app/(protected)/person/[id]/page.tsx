// app/(protected)/person/[id]/page.tsx
// Server Component — individual person detail page.
// Fetches person by id slug; calls notFound() if person not in family.json.
// All 6 person pages are pre-rendered at build time (static site generation).
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPeople, getPersonById, getPhotos } from '@/lib/content'
import PhotoGrid from '@/components/gallery/PhotoGrid'

// Pre-render every person page at build time (per D-04).
// Returns [{ id: "william-curry" }, { id: "mary-curry" }, ...] — one entry per person.
export function generateStaticParams() {
  return getPeople().map((p) => ({ id: p.id }))
}

// dynamicParams = true is the Next.js default — if a new person is added without rebuild,
// the page generates on first request. Explicit declaration kept for clarity (per D-05).
export const dynamicParams = true

interface PersonPageProps {
  params: { id: string }
}

export default async function PersonPage({ params }: PersonPageProps) {
  const person = getPersonById(params.id)

  // If person id doesn't exist in family.json, return proper 404 (per D-01, D-15).
  if (!person) {
    notFound()
  }

  // Resolve relation names for display and linking (per D-09).
  const allPeople = getPeople()
  const peopleById = new Map(allPeople.map((p) => [p.id, p]))

  // Filter photos to only this person's photos (per D-03).
  // Use peopleIds[] on Photo (not person.photoIds) — photos tag people, not the reverse.
  const personPhotos = getPhotos().filter((photo) =>
    photo.peopleIds.includes(person.id)
  )

  // Format year range for the date eyebrow (per D-03 layout step 3).
  // "1920–1998" | "b. 1920" | null if no birthYear at all.
  function formatYears(birthYear?: number, deathYear?: number): string | null {
    if (!birthYear) return null
    if (deathYear) return `${birthYear}–${deathYear}`
    return `b. ${birthYear}`
  }

  const years = formatYears(person.birthYear, person.deathYear)

  const spouses = person.spouseIds.flatMap((sid) => {
    const s = peopleById.get(sid)
    return s ? [s] : []
  })
  const children = person.childIds.flatMap((cid) => {
    const c = peopleById.get(cid)
    return c ? [c] : []
  })
  const parents = person.parentIds.flatMap((pid) => {
    const p = peopleById.get(pid)
    return p ? [p] : []
  })

  return (
    <main className="py-11 px-7 md:px-11 lg:px-15 max-w-3xl">
      {/* Back link — easy navigation to tree */}
      <Link
        href="/tree"
        className="eyebrow text-quiet hover:text-navy transition-colors inline-flex items-center gap-1 mb-8"
      >
        ← Family tree
      </Link>

      {/* FAMILY ARCHIVE eyebrow (per D-02 step 1) */}
      <p className="eyebrow text-quiet mb-3">FAMILY ARCHIVE</p>

      {/* Person name — serif h1 (per D-02 step 2) */}
      <h1 className="font-serif text-navy text-3xl md:text-4xl mb-2">{person.name}</h1>

      {/* Date eyebrow — hidden if no birthYear (per D-02 step 3, D-12) */}
      {years && (
        <p className="eyebrow text-quiet mb-4">{years}</p>
      )}

      {/* Birthplace — hidden if absent (per D-02 step 4, D-13) */}
      {person.birthPlace && (
        <p className="font-serif italic text-muted text-sm mb-6">
          Born in {person.birthPlace}
        </p>
      )}

      {/* Bio — hidden if absent or blank (per D-02 step 5, D-11) */}
      {person.bio && person.bio.trim().length > 0 && (
        <p className="font-serif text-navy leading-relaxed max-w-prose mb-8">
          {person.bio}
        </p>
      )}

      {/* Relations section — only shown when at least one block is non-empty (per D-14) */}
      {(spouses.length > 0 || children.length > 0 || parents.length > 0) && (
        <div className="border-t hairline pt-6 mb-8 flex flex-col gap-5">

          {/* Spouses block (per D-02 step 6, D-09) */}
          {spouses.length > 0 && (
            <div>
              <p className="eyebrow text-quiet mb-2">
                {spouses.length === 1 ? 'Married to' : 'Marriages'}
              </p>
              <ul className="flex flex-col gap-1">
                {spouses.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/person/${s.id}`}
                      className="font-serif text-navy hover:text-gold transition-colors"
                    >
                      {s.name}
                    </Link>
                    {s.birthYear && (
                      <span className="text-quiet text-xs ml-2">
                        ({formatYears(s.birthYear, s.deathYear)})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Children block (per D-02 step 7, D-09) */}
          {children.length > 0 && (
            <div>
              <p className="eyebrow text-quiet mb-2">Children</p>
              <ul className="flex flex-col gap-1">
                {children.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/person/${c.id}`}
                      className="font-serif text-navy hover:text-gold transition-colors"
                    >
                      {c.name}
                    </Link>
                    {c.birthYear && (
                      <span className="text-quiet text-xs ml-2">
                        ({formatYears(c.birthYear, c.deathYear)})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Parents block (per D-02 step 8, D-09) */}
          {parents.length > 0 && (
            <div>
              <p className="eyebrow text-quiet mb-2">Parents</p>
              <ul className="flex flex-col gap-1">
                {parents.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/person/${p.id}`}
                      className="font-serif text-navy hover:text-gold transition-colors"
                    >
                      {p.name}
                    </Link>
                    {p.birthYear && (
                      <span className="text-quiet text-xs ml-2">
                        ({formatYears(p.birthYear, p.deathYear)})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      )}

      {/* Photos section (per D-02 steps 9–10) */}
      <section>
        <p className="eyebrow text-quiet mb-5">
          Photographs of {person.name}
        </p>
        {/* PhotoGrid with filtered photos prop — empty state handled inside PhotoGrid (per D-10) */}
        <PhotoGrid photos={personPhotos} />
      </section>
    </main>
  )
}
