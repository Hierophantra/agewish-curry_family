// app/(protected)/person/[id]/page.tsx
// Server Component — individual person detail page (v2 schema, Phase 11).
// Fetches person by id slug; calls notFound() if person not in family.json.
// All 8 person pages are pre-rendered at build time (static site generation).
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPeople, getPersonById, getPhotosByPersonId, getVideosByPersonId } from '@/lib/content'
import CollectionPhotoGrid from '@/components/gallery/CollectionPhotoGrid'
import PlaylistVideoGrid from '@/components/video/PlaylistVideoGrid'
import type { Person } from '@/lib/types'

// Pre-render every person page at build time (per D-04).
// Returns [{ id: "william-curry" }, { id: "robert-curry" }, ...] — one entry per person.
export function generateStaticParams() {
  return getPeople().map((p) => ({ id: p.id }))
}

// dynamicParams = true is the Next.js default — if a new person is added without rebuild,
// the page generates on first request. Explicit declaration kept for clarity.
export const dynamicParams = true

interface PersonPageProps {
  params: { id: string }
}

export default async function PersonPage({ params }: PersonPageProps) {
  const person = getPersonById(params.id)

  // If person id doesn't exist in family.json, return proper 404.
  if (!person) {
    notFound()
  }

  const photos = getPhotosByPersonId(person.id)
  const videos = getVideosByPersonId(person.id)
  const allPeople = getPeople()

  // Format Born from birthDate ISO if present, else fall back to birthYear.
  // Uses noon UTC to avoid timezone-off-by-one on YYYY-MM-DD strings.
  const bornStr = person.birthDate
    ? new Date(person.birthDate + 'T12:00:00Z').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      })
    : person.birthYear
    ? String(person.birthYear)
    : null

  // Resolve children — v2 canonical childrenIds with v1 childIds fallback.
  const childIdList =
    person.childrenIds && person.childrenIds.length > 0
      ? person.childrenIds
      : person.childIds ?? []
  const children = childIdList
    .map((cid) => allPeople.find((p) => p.id === cid))
    .filter((c): c is Person => c !== undefined)

  // Resolve parents.
  const parents = (person.parentIds ?? [])
    .map((pid) => allPeople.find((p) => p.id === pid))
    .filter((p): p is Person => p !== undefined)

  // Build metadata rows — each row only shown when value is present.
  type MetaEntry = { k: string; v: React.ReactNode }
  const meta: MetaEntry[] = []

  if (bornStr) meta.push({ k: 'Born', v: bornStr })

  // Birthplace — v2 canonical with v1 birthPlace back-compat.
  const birthplaceValue = person.birthplace ?? person.birthPlace
  if (birthplaceValue) meta.push({ k: 'Birthplace', v: birthplaceValue })

  // Spouse — v2 spouseLabel is a plain display string (no separate Person record).
  if (person.spouseLabel) meta.push({ k: 'Spouse', v: person.spouseLabel })

  if (parents.length > 0) {
    meta.push({
      k: 'Parents',
      v: (
        <>
          {parents.map((p, i) => (
            <span key={p.id}>
              <Link
                href={`/person/${p.id}`}
                className="hover:text-gold transition-colors"
              >
                {p.name}
              </Link>
              {i < parents.length - 1 ? ', ' : ''}
            </span>
          ))}
        </>
      ),
    })
  }

  if (children.length > 0) {
    meta.push({
      k: 'Children',
      v: (
        <>
          {children.map((c, i) => (
            <span key={c.id}>
              <Link
                href={`/person/${c.id}`}
                className="hover:text-gold transition-colors"
              >
                {c.name}
              </Link>
              {i < children.length - 1 ? ', ' : ''}
            </span>
          ))}
        </>
      ),
    })
  }

  return (
    <main className="py-11 px-7 md:px-11 lg:px-15 max-w-5xl mx-auto">
      {/* Back link */}
      <Link
        href="/tree"
        className="text-quiet text-xs uppercase tracking-[0.22em] hover:text-navy transition-colors mb-6 inline-block"
      >
        ← Back to family tree
      </Link>

      {/* Header: eyebrow + name + dates */}
      <header className="mb-10 pb-9 border-b hairline">
        {/* v2 eyebrow: "Patriarch of the family", "Son of William" etc. */}
        <p className="eyebrow text-gold-deep mb-3">
          {person.eyebrow ?? person.relationLabel ?? 'FAMILY ARCHIVE'}
        </p>
        <h1 className="font-serif text-navy text-6xl mb-2 leading-tight">
          {person.name}
        </h1>
        {/* v2 datesLabel: "1920 — 2008", "1952 — present" */}
        {person.datesLabel && (
          <p className="font-serif italic text-muted text-lg">
            {person.datesLabel}
          </p>
        )}
      </header>

      {/* Metadata rows: Born, Birthplace, Spouse, Parents, Children */}
      {meta.length > 0 && (
        <section className="mb-10">
          <dl className="flex flex-col gap-3.5 max-w-md">
            {meta.map(({ k, v }) => (
              <div key={k} className="flex justify-between gap-4 text-base">
                <dt className="text-quiet flex-shrink-0">{k}</dt>
                <dd className="text-navy text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* Bio — hidden if absent */}
      {person.bio && (
        <section className="mb-12 pt-9 border-t hairline max-w-prose">
          <p className="font-serif italic text-muted text-base leading-[1.75]">
            {person.bio}
          </p>
        </section>
      )}

      {/* Photo grid — CollectionPhotoGrid is the Phase 8 Client wrapper;
          clicking a photo opens the shared Lightbox filtered to this person's photos */}
      {photos.length > 0 && (
        <section className="mb-14">
          <h2 className="eyebrow text-quiet mb-6 text-xs">
            PHOTOGRAPHS OF {person.name.toUpperCase()}
          </h2>
          <CollectionPhotoGrid photos={photos} />
        </section>
      )}

      {/* Video grid — PlaylistVideoGrid is the Phase 9 Client wrapper;
          clicking a video opens VideoLightbox filtered to this person's videos */}
      {videos.length > 0 && (
        <section className="mb-14">
          <h2 className="eyebrow text-quiet mb-6 text-xs">
            VIDEOS FEATURING {person.name.toUpperCase()}
          </h2>
          <PlaylistVideoGrid videos={videos} />
        </section>
      )}

      {/* Combined empty state — only shown when BOTH photos AND videos are absent */}
      {photos.length === 0 && videos.length === 0 && (
        <section className="py-12 border-t hairline">
          <p className="text-muted text-sm">
            No photographs or videos of this person yet.
          </p>
        </section>
      )}
    </main>
  )
}
