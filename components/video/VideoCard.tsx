// components/video/VideoCard.tsx
// Server Component — renders one video card: player + date eyebrow + title + optional description.
// Card structure per D-11: VideoPlayer → date eyebrow → title → description.
// Stays server-side — VideoPlayer and its children render on the server.
// D-07: Hover lift (shadow-md + -translate-y-0.5) on the article wrapper.
import type { Video } from '@/lib/types'
import VideoPlayer from '@/components/video/VideoPlayer'

interface VideoCardProps {
  video: Video
}

export default function VideoCard({ video }: VideoCardProps) {
  // Format dateTaken "YYYY-MM-DD" → "MONTH YYYY" eyebrow string.
  // Noon UTC prevents timezone-off-by-one on YYYY-MM-DD date strings.
  function formatDate(dateTaken?: string): string | null {
    if (!dateTaken) return null
    const d = new Date(dateTaken + 'T12:00:00Z')
    return d
      .toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
      .toUpperCase()
  }

  const dateLabel = formatDate(video.dateTaken)

  return (
    <article className="flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* 16:9 player — YouTubeEmbed facade handles thumbnail + deferred iframe internally */}
      <VideoPlayer video={video} />

      {/* Card metadata */}
      <div className="pt-3 flex flex-col gap-1">
        {dateLabel && (
          <p className="eyebrow text-quiet">{dateLabel}</p>
        )}
        <h2 className="font-serif text-navy text-lg leading-snug">{video.title}</h2>
        {video.description && (
          <p className="text-muted text-sm leading-relaxed">{video.description}</p>
        )}
      </div>
    </article>
  )
}
