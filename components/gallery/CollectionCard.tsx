// components/gallery/CollectionCard.tsx
// Server Component - renders one collection cover card.
// D-01: Cover image (4:3 aspect), overlay gradient, serif title + dateLabel eyebrow + photo count.
// D-02: Wraps a <Link href="/photographs/{collectionId}"> - no client state needed.
// D-07 (inherited): Hover lift (-translate-y-0.5 + shadow-md) on the card.
import Image from 'next/image'
import Link from 'next/link'
import type { Collection } from '@/lib/types'
import { getPhotos } from '@/lib/content'
import { getPhotoUrl } from '@/lib/utils'

interface CollectionCardProps {
  collection: Collection
  photoCount: number
}

export default function CollectionCard({ collection, photoCount }: CollectionCardProps) {
  // Resolve cover photo from photos list to get its filename.
  // getPhotos() reads from content/photos.json - server-only, safe here.
  const cover = getPhotos().find((p) => p.id === collection.coverPhotoId)

  return (
    <Link
      href={`/photographs/${collection.id}`}
      className="group relative block aspect-[4/3] overflow-hidden rounded-lg border hairline bg-ivory transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* Cover image - fills the card, subtle zoom on hover */}
      {cover && (
        <Image
          src={getPhotoUrl(cover)}
          alt=""
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          {...(cover.blurDataUrl
            ? { placeholder: 'blur' as const, blurDataURL: cover.blurDataUrl }
            : {})}
        />
      )}

      {/* Gradient overlay: dark at bottom, fades upward - ensures text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/20 to-transparent" />

      {/* Card metadata: dateLabel eyebrow + title + subtitle + photo count */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        {collection.dateLabel && (
          <p className="eyebrow text-white/80 mb-1.5 text-[10px]">{collection.dateLabel}</p>
        )}
        <h3 className="font-serif text-white text-xl leading-tight mb-1">{collection.title}</h3>
        {collection.subtitle && (
          <p className="font-serif italic text-white/85 text-sm">{collection.subtitle}</p>
        )}
        <p className="eyebrow text-white/60 mt-2 text-[10px]">
          {photoCount} {photoCount === 1 ? 'photograph' : 'photographs'}
        </p>
      </div>
    </Link>
  )
}
