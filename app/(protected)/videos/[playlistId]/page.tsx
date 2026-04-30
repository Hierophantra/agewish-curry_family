// app/(protected)/videos/[playlistId]/page.tsx
// Playlist detail page — Server Component.
// Fetches playlist + filtered videos server-side; delegates interactivity to PlaylistVideoGrid.
// Header shows FAMILY ARCHIVE · PLAYLIST eyebrow, serif h1, italic subtitle, description, count.
// "← Back to all playlists" link above the header.
// PlaylistVideoGrid (Client) owns the VideoLightbox state — clicking a video opens lightbox.
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPlaylistById, getVideosInPlaylist, getPlaylists } from '@/lib/content'
import PlaylistVideoGrid from '@/components/video/PlaylistVideoGrid'

interface Props {
  params: { playlistId: string }
}

export default function PlaylistDetailPage({ params }: Props) {
  const playlist = getPlaylistById(params.playlistId)
  if (!playlist) notFound()

  const videos = getVideosInPlaylist(params.playlistId)

  return (
    <main className="py-11 px-7 md:px-11 lg:px-15">
      {/* Back link */}
      <Link
        href="/videos"
        className="text-quiet text-xs uppercase tracking-[0.22em] hover:text-navy transition-colors mb-6 inline-block"
      >
        ← Back to all playlists
      </Link>

      {/* Playlist header */}
      <header className="mb-9">
        <p className="eyebrow text-quiet mb-3">FAMILY ARCHIVE · PLAYLIST</p>
        <h1 className="font-serif text-navy text-4xl mb-2">{playlist.title}</h1>
        {playlist.subtitle && (
          <p className="font-serif italic text-muted text-base mb-3 max-w-prose">
            {playlist.subtitle}
          </p>
        )}
        {playlist.description && (
          <p className="text-muted text-sm max-w-prose mt-3">{playlist.description}</p>
        )}
        <p className="eyebrow text-quiet mt-3 text-[10px]">
          {videos.length} {videos.length === 1 ? 'video' : 'videos'}
        </p>
      </header>

      {/* Client wrapper that owns lightbox state */}
      <PlaylistVideoGrid videos={videos} />
    </main>
  )
}

// Pre-render all playlist detail pages at build time.
export async function generateStaticParams() {
  return getPlaylists().map((p) => ({ playlistId: p.id }))
}
