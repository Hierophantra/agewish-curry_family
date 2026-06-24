// components/gallery/UploadCard.tsx
// Server-compatible card for one family upload in the /gallery grid.
// Shows the image + title + people chips + date + description. No navigation —
// uploads have no detail route (yet), so this is a presentational card.
//
// Date display respects the precision marker so a year-only date reads "1979",
// not "January 1, 1979".
import Image from 'next/image'
import type { FamilyUpload } from '@/lib/types'

interface Props {
  upload: FamilyUpload
}

// Format an upload's date for display, honouring its precision marker. Uses noon
// UTC to dodge the timezone off-by-one when parsing a bare ISO date.
function formatUploadDate(upload: FamilyUpload): string | null {
  if (upload.datePrecision === 'unknown' || !upload.date) return null
  const raw = upload.date.trim()

  if (upload.datePrecision === 'year') {
    return raw.slice(0, 4)
  }
  if (upload.datePrecision === 'month') {
    // Expect "YYYY-MM" (or longer); render "Month YYYY".
    const [y, m] = raw.split('-')
    if (y && m) {
      const d = new Date(`${y}-${m}-01T12:00:00Z`)
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
      }
    }
    return raw
  }
  // Exact date → "Month D, YYYY".
  const d = new Date(`${raw}T12:00:00Z`)
  if (Number.isNaN(d.getTime())) return raw
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

export default function UploadCard({ upload }: Props) {
  const dateLabel = formatUploadDate(upload)

  return (
    <article className="flex flex-col">
      {/* Image — 4:3, blur placeholder while loading. */}
      <div className="relative aspect-[4/3] bg-ivory overflow-hidden rounded">
        <Image
          src={upload.fileUrl}
          alt={upload.title}
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
          {...(upload.blurDataUrl
            ? { placeholder: 'blur' as const, blurDataURL: upload.blurDataUrl }
            : {})}
        />
      </div>

      {/* Metadata */}
      <div className="pt-3 flex flex-col gap-2">
        {dateLabel && <p className="eyebrow text-quiet">{dateLabel}</p>}
        <p className="font-serif text-navy text-base leading-snug">{upload.title}</p>

        {upload.description && (
          <p className="font-serif italic text-muted text-sm leading-relaxed">{upload.description}</p>
        )}

        {upload.people.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {upload.people.map((name) => (
              <span
                key={name}
                className="inline-flex items-center rounded-full bg-[color:var(--color-surface-subtle)] border border-[color:var(--color-border)] px-2.5 py-0.5 text-xs text-navy"
              >
                {name}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
