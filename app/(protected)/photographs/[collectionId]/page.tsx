// app/(protected)/photographs/[collectionId]/page.tsx
// Collection detail page - Server Component.
// D-04: Fetches collection + filtered photos server-side; delegates interactivity to CollectionPhotoGrid.
// D-05: Header shows FAMILY ARCHIVE · COLLECTION eyebrow, serif h1, italic subtitle, dateLabel, count, description.
// D-06: Photo grid via CollectionPhotoGrid (Client); each photo click opens Lightbox at that index.
// D-07: Empty collection - header renders, CollectionPhotoGrid handles empty state.
// D-08: "← Back to all collections" link above the header.
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCollectionById, getPhotosInCollection, getCollections } from '@/lib/content'
import CollectionPhotoGrid from '@/components/gallery/CollectionPhotoGrid'

// [collectionId] detail page - Server Component.
// D-04: Fetches collection + filtered photos server-side; delegates interactivity to CollectionPhotoGrid.
// D-08: "← Back to all collections" link above the header.
// 18-02: "Play this collection as a slideshow →" link in header.

interface Props {
  params: { collectionId: string }
}

export default function CollectionDetailPage({ params }: Props) {
  const collection = getCollectionById(params.collectionId)
  if (!collection) notFound()

  const photos = getPhotosInCollection(params.collectionId)

  return (
    <main className="py-11 px-7 md:px-11 lg:px-15">
      {/* D-08: Back link */}
      <Link
        href="/photographs"
        className="text-quiet text-xs uppercase tracking-[0.22em] hover:text-navy transition-colors mb-6 inline-block"
      >
        ← Back to all collections
      </Link>

      {/* D-05: Collection header */}
      <header className="mb-9">
        <p className="eyebrow text-quiet mb-3">FAMILY ARCHIVE · COLLECTION</p>
        <h1 className="font-serif text-navy text-4xl mb-2">{collection.title}</h1>
        {collection.subtitle && (
          <p className="font-serif italic text-muted text-base mb-3 max-w-prose">
            {collection.subtitle}
          </p>
        )}
        {collection.dateLabel && collection.dateLabel !== collection.subtitle && (
          <p className="eyebrow text-quiet mb-2">{collection.dateLabel}</p>
        )}
        {collection.description && (
          <p className="text-muted text-sm max-w-prose mt-3">{collection.description}</p>
        )}
        <p className="eyebrow text-quiet mt-3 text-[10px]">
          {photos.length} {photos.length === 1 ? 'photograph' : 'photographs'}
        </p>
        <Link
          href={`/slideshow?collection=${params.collectionId}`}
          className="eyebrow text-gold-deep hover:text-gold transition-colors text-[10px] mt-2 inline-block"
        >
          Play this collection as a slideshow →
        </Link>
      </header>

      {/* D-06: Client wrapper that owns lightbox state */}
      <CollectionPhotoGrid photos={photos} />
    </main>
  )
}

// Pre-render all collection detail pages at build time.
export async function generateStaticParams() {
  return getCollections().map((c) => ({ collectionId: c.id }))
}
