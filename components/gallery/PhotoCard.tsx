// components/gallery/PhotoCard.tsx
// Server Component — renders one photo card with image, date eyebrow, caption.
// No 'use client' — this runs entirely on the server.
import Image from 'next/image'
import Link from 'next/link'
import type { Photo } from '@/lib/types'

interface PhotoCardProps {
  photo: Photo
}

export default function PhotoCard({ photo }: PhotoCardProps) {
  // Format dateTaken "YYYY-MM-DD" → "MONTH YYYY" eyebrow string.
  // Use noon UTC to avoid timezone-off-by-one (a "1950-01-01" at midnight UTC
  // can flip to Dec 31 1949 in negative-offset zones if parsed as local time).
  function formatDate(dateTaken?: string): string | null {
    if (!dateTaken) return null
    const d = new Date(dateTaken + 'T12:00:00Z')
    return d
      .toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
      .toUpperCase()
  }

  const dateLabel = formatDate(photo.dateTaken)
  const hasPersonLink = photo.peopleIds.length > 0

  const cardContent = (
    <article className="flex flex-col">
      {/* Image container — 4:3 aspect ratio, ivory placeholder while loading */}
      <div className="relative aspect-[4/3] bg-ivory overflow-hidden">
        <Image
          src={`/photos/${photo.filename}`}
          alt={photo.caption ?? 'Family photograph'}
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      {/* Card metadata */}
      <div className="pt-3 flex flex-col gap-1">
        {dateLabel && (
          <p className="eyebrow text-quiet">{dateLabel}</p>
        )}
        {photo.caption && (
          <p className="font-serif text-navy text-sm leading-snug">{photo.caption}</p>
        )}
      </div>
    </article>
  )

  // Wrap in Link only when photo has a person reference (per D-20).
  // Links to the primary person on this photo (peopleIds[0]).
  if (hasPersonLink) {
    return (
      <Link href={`/person/${photo.peopleIds[0]}`} className="block">
        {cardContent}
      </Link>
    )
  }

  return cardContent
}
