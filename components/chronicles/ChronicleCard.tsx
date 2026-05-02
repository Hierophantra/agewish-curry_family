// components/chronicles/ChronicleCard.tsx
// Server Component — renders one chronicle card for the /chronicles landing grid.
// Shows: cover photo (if present) + title + subtitle + dateLabel + duration + first ~150 words preview.
// Wraps a <Link href="/chronicles/{chronicle.id}">.
import Image from 'next/image'
import Link from 'next/link'
import type { Chronicle } from '@/lib/types'
import { getPhotos } from '@/lib/content'
import { getPhotoUrl } from '@/lib/utils'

interface ChronicleCardProps {
  chronicle: Chronicle
}

/** Extract the first ~150 words of the markdown body as a plain text preview. */
function bodyPreview(markdown: string, maxWords = 150): string {
  // Strip markdown syntax: headers, bold, italic, blockquotes, links, code
  const plain = markdown
    .replace(/#{1,6}\s+/g, '')          // headings
    .replace(/\*\*(.+?)\*\*/g, '$1')    // bold
    .replace(/\*(.+?)\*/g, '$1')        // italic
    .replace(/^>\s*/gm, '')             // blockquotes
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // links
    .replace(/`(.+?)`/g, '$1')          // inline code
    .replace(/\n+/g, ' ')               // collapse newlines
    .trim()

  const words = plain.split(/\s+/)
  if (words.length <= maxWords) return plain
  return words.slice(0, maxWords).join(' ') + '…'
}

export default function ChronicleCard({ chronicle }: ChronicleCardProps) {
  const cover = chronicle.coverPhotoId
    ? getPhotos().find((p) => p.id === chronicle.coverPhotoId)
    : null

  const preview = bodyPreview(chronicle.body)

  return (
    <Link
      href={`/chronicles/${chronicle.id}`}
      className="group block border hairline rounded-lg bg-white hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 overflow-hidden"
    >
      {/* Cover photo — 16:9 aspect, fills top of card */}
      {cover && (
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={getPhotoUrl(cover)}
            alt=""
            fill
            sizes="(min-width: 1024px) 50vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            {...(cover.blurDataUrl
              ? { placeholder: 'blur' as const, blurDataURL: cover.blurDataUrl }
              : {})}
          />
        </div>
      )}

      {/* Card body */}
      <div className="p-6">
        {/* Date + duration eyebrow */}
        {(chronicle.dateLabel || chronicle.audioDuration) && (
          <p className="eyebrow text-quiet text-[10px] mb-2">
            {[
              chronicle.circa ? `Circa ${chronicle.dateLabel}` : chronicle.dateLabel,
              chronicle.audioDuration ? `${chronicle.audioDuration} narration` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}

        {/* Title */}
        <h3 className="font-serif text-navy text-xl leading-tight mb-1">
          {chronicle.title}
        </h3>

        {/* Subtitle */}
        {chronicle.subtitle && (
          <p className="font-serif italic text-muted text-sm mb-3">
            {chronicle.subtitle}
          </p>
        )}

        {/* Body preview */}
        <p className="text-muted text-sm leading-relaxed line-clamp-4 mt-2">
          {preview}
        </p>

        {/* Read link */}
        <p className="eyebrow text-gold-deep text-[10px] mt-4 group-hover:text-gold transition-colors">
          Read the chronicle →
        </p>
      </div>
    </Link>
  )
}
