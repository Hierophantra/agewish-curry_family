// components/video/VideoCard.tsx
// 'use client' - supports optional onClick prop for lightbox integration (Phase 9).
// When onClick is absent: renders as a plain article (original behavior, no Link needed for videos).
// When onClick is present: renders as a <button> - click opens lightbox.
// D-07: Hover lift (shadow-md + -translate-y-0.5) on outermost element per render path.
'use client'

import type { Video } from '@/lib/types'
import VideoPlayer from '@/components/video/VideoPlayer'

interface VideoCardProps {
  video: Video
  /** When provided, renders as a button that fires this handler instead of default behavior. */
  onClick?: () => void
}

export default function VideoCard({ video, onClick }: VideoCardProps) {
  // Prefer v2 dateLabel field; fall back to formatting the v1 date/dateTaken field.
  // Noon UTC prevents timezone-off-by-one on YYYY-MM-DD date strings.
  function formatDate(dateStr?: string): string | null {
    if (!dateStr) return null
    const d = new Date(dateStr + 'T12:00:00Z')
    return d
      .toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
      .toUpperCase()
  }

  const dateLabel = video.dateLabel ?? formatDate(video.date ?? video.dateTaken)

  // When onClick is set, the parent owns the click - render the player as a
  // non-interactive thumbnail so we do not get nested buttons (which would
  // autoplay an inline iframe in the background while the lightbox opens).
  const interactive = onClick === undefined

  const innerContent = (
    <>
      {/* 16:9 player. interactive=true plays in place when clicked.
          interactive=false renders a thumbnail-only decoration so the outer
          button (lightbox trigger) is the only click target. */}
      <VideoPlayer video={video} interactive={interactive} />

      {/* Card metadata */}
      <div className="pt-3 flex flex-col gap-1">
        {dateLabel && (
          <p className="eyebrow text-quiet">{dateLabel}</p>
        )}
        <h2 className="font-serif text-navy text-xl leading-snug">{video.title}</h2>
        {video.description && (
          <p className="text-muted text-base leading-relaxed">{video.description}</p>
        )}
      </div>
    </>
  )

  // When onClick is provided (e.g. PlaylistVideoGrid lightbox integration),
  // render as a button - no navigation. Hover lift preserved.
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="block w-full text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
      >
        <article className="flex flex-col">{innerContent}</article>
      </button>
    )
  }

  // Default: plain article with hover lift (no Link - videos don't have detail pages).
  return (
    <article className="flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {innerContent}
    </article>
  )
}
