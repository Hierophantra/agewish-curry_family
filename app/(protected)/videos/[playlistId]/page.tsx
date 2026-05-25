// app/(protected)/videos/[playlistId]/page.tsx
// Playlist detail page - Server Component.
//
// v3.1: cinematic collection header instead of a small headline + grid.
// Left column: eyebrow + large serif title + date + count + description.
// Right column: featured frame from the cover video (lazy-loaded thumbnail
// inside an inset media well). The page reads as "opening a collection",
// not "rendering an API result".
//
// PlaylistVideoGrid (Client) owns the VideoLightbox state.
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPlaylistById, getVideosInPlaylist, getPlaylists, getVideoById } from '@/lib/content'
import PlaylistVideoGrid from '@/components/video/PlaylistVideoGrid'
import VimeoThumb from '@/components/video/VimeoThumb'
import YouTubeThumb from '@/components/video/YouTubeThumb'

interface Props {
  params: { playlistId: string }
}

export default function PlaylistDetailPage({ params }: Props) {
  const playlist = getPlaylistById(params.playlistId)
  if (!playlist) notFound()

  const videos = getVideosInPlaylist(params.playlistId)
  const cover = getVideoById(playlist.coverVideoId)
  const totalDuration = formatTotal(videos.map((v) => v.duration))

  return (
    <main className="pb-16 px-7 md:px-11 lg:px-15">
      {/* Back link - quiet, sits in the gutter above the header */}
      <div className="pt-10">
        <Link
          href="/videos"
          className="text-sm text-muted hover:text-navy transition-colors inline-flex items-center gap-1.5"
        >
          <span aria-hidden="true">{'←'}</span>
          Videos
        </Link>
      </div>

      {/* Cinematic collection header */}
      <header className="pt-8 pb-12 grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-end max-w-7xl mx-auto">
        <div>
          <p className="eyebrow text-gold-deep mb-4">Video collection</p>
          <h1 className="font-serif text-navy text-5xl md:text-6xl leading-[1.05] tracking-[-0.015em] mb-5">
            {playlist.title}
          </h1>
          {playlist.subtitle && (
            <p className="font-serif italic text-muted text-lg md:text-xl leading-relaxed mb-5 max-w-prose">
              {playlist.subtitle}
            </p>
          )}
          {/* Stat row: count, duration. Quiet metadata. */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-quiet">
            <span>{videos.length} {videos.length === 1 ? 'film' : 'films'}</span>
            {totalDuration && (
              <>
                <span aria-hidden="true">·</span>
                <span>{totalDuration} total</span>
              </>
            )}
          </div>
          {playlist.description && (
            <p className="text-muted text-base max-w-prose mt-5 leading-relaxed">
              {playlist.description}
            </p>
          )}
        </div>

        {/* Featured frame - the cover video's thumbnail in an inset well.
            Purely decorative at the header level; the cards below handle
            interaction. */}
        {cover && (
          <div className="surface-inset overflow-hidden border border-[color:var(--color-border)] aspect-video shadow-[0_24px_70px_-30px_rgba(31,45,92,0.20)]">
            {cover.source === 'youtube' ? (
              <YouTubeThumb
                videoId={cover.sourceId}
                className="w-full h-full object-cover"
              />
            ) : cover.source === 'vimeo' && cover.thumbnailUrl ? (
              <VimeoThumb
                src={cover.thumbnailUrl}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-navy" />
            )}
          </div>
        )}
      </header>

      {/* Client wrapper that owns lightbox state */}
      <div className="max-w-7xl mx-auto">
        <PlaylistVideoGrid videos={videos} />
      </div>
    </main>
  )
}

// Sum durations from "M:SS" or "H:MM:SS" strings and re-format as "Nm" / "Nh Nm"
function formatTotal(durations: Array<string | undefined>): string | null {
  let secs = 0
  let anyParsed = false
  for (const d of durations) {
    if (!d) continue
    const parts = d.split(':').map((n) => parseInt(n, 10))
    if (parts.some(isNaN)) continue
    anyParsed = true
    if (parts.length === 3) secs += parts[0] * 3600 + parts[1] * 60 + parts[2]
    else if (parts.length === 2) secs += parts[0] * 60 + parts[1]
  }
  if (!anyParsed) return null
  const h = Math.floor(secs / 3600)
  const m = Math.round((secs % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m`
  return null
}

// Pre-render all playlist detail pages at build time.
export async function generateStaticParams() {
  return getPlaylists().map((p) => ({ playlistId: p.id }))
}
