// components/gallery/PhotoCard.tsx
// 'use client' — supports optional onClick prop for lightbox integration (Phase 8, D-20..D-22).
// When onClick is absent: renders with Link to /person/[id] (original Server-compat behavior).
// When onClick is present: renders as a <button> — no Link — click opens lightbox.
// D-07: Hover lift (shadow-md + -translate-y-0.5) applied to outermost element per render path.
'use client'
import Image from 'next/image'
import Link from 'next/link'
import type { Photo } from '@/lib/types'

interface PhotoCardProps {
  photo: Photo
  /** When provided, suppresses Link wrapping and fires this handler instead. */
  onClick?: () => void
}

export default function PhotoCard({ photo, onClick }: PhotoCardProps) {
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

  const innerContent = (
    <>
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
          <p className="font-serif text-navy text-base leading-snug">{photo.caption}</p>
        )}
      </div>
    </>
  )

  // D-21/D-22: When onClick is provided (e.g. CollectionPhotoGrid lightbox integration),
  // render as a button — no Link navigation. Hover lift preserved.
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="block w-full text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      >
        <article className="flex flex-col">{innerContent}</article>
      </button>
    )
  }

  // Wrap in Link only when photo has a person reference (per D-20).
  // Links to the primary person on this photo (peopleIds[0]).
  // Hover lift on outermost element in each render path.
  if (hasPersonLink) {
    return (
      <Link
        href={`/person/${photo.peopleIds[0]}`}
        className="block transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      >
        <article className="flex flex-col">{innerContent}</article>
      </Link>
    )
  }

  return (
    <article className="flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {innerContent}
    </article>
  )
}
