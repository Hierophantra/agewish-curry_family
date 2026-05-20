// components/gallery/CollectionGrid.tsx
// Server Component - fetches all collections and renders a responsive grid of CollectionCards.
// D-03: 1 col mobile / 2 cols tablet / 3 cols desktop - collections are large, need breathing room.
// D-26: Replaces the flat PhotoGrid on /photographs.
import CollectionCard from './CollectionCard'
import { getCollections, getPhotosInCollection } from '@/lib/content'

export default function CollectionGrid() {
  const collections = getCollections()

  if (collections.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="eyebrow text-quiet mb-3">FAMILY ARCHIVE</p>
        <h2 className="font-serif text-navy text-2xl mb-2">No collections yet</h2>
        <p className="text-muted text-sm">
          Collections of photographs will appear here as they are gathered into the archive.
        </p>
      </div>
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
