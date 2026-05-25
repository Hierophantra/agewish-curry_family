// components/gallery/CollectionGrid.tsx
// Server Component - fetches all collections and renders a responsive grid of CollectionCards.
// D-03: 1 col mobile / 2 cols tablet / 3 cols desktop - collections are large, need breathing room.
// D-26: Replaces the flat PhotoGrid on /photographs.
import CollectionCard from './CollectionCard'
import { getCollections, getPhotosInCollection } from '@/lib/content'

export default function CollectionGrid() {
  const collections = getCollections()

  if (collections.length === 0) {
    // v3.1 empty state - dignified placeholder rather than "nothing here".
    // Three inset wells in a 3-col grid evoke the future album layout so
    // the visitor sees a place with purpose, not an unfinished page.
    return (
      <section className="py-12 md:py-16">
        <div className="max-w-3xl">
          <p className="eyebrow text-gold-deep mb-4">Photographs</p>
          <h2 className="font-serif text-navy text-3xl md:text-4xl leading-tight mb-4">
            A place for the family image record
          </h2>
          <p className="text-muted text-base md:text-lg leading-relaxed">
            Family photographs will be gathered here as albums, portraits,
            places, and moments. Each will sit in a collection alongside the
            stories that belong with it.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl">
          {['Album', 'Portrait', 'Moment'].map((label) => (
            <div
              key={label}
              className="surface-inset aspect-[4/3] border border-[color:var(--color-border)] grid place-items-center"
              aria-hidden="true"
            >
              <span className="font-serif italic text-quiet text-sm">{label}</span>
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
      {collections.map((c) => (
        <CollectionCard
          key={c.id}
          collection={c}
          photoCount={getPhotosInCollection(c.id).length}
        />
      ))}
    </div>
  )
}
