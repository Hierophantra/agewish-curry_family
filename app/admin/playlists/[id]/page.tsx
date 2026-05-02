// app/admin/playlists/[id]/page.tsx
// Admin edit page for a single playlist. Auth gate enforced by requireAdminOrRedirect().
// Renders EditPlaylistForm in update mode with the playlist's current values.
// Returns notFound() if the playlist id doesn't exist in content/playlists.json.
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPlaylistById, getVideos } from '@/lib/content'
import { requireAdminOrRedirect } from '@/lib/admin'
import EditPlaylistForm from '@/components/admin/EditPlaylistForm'

export function generateMetadata({ params }: { params: { id: string } }) {
  const playlist = getPlaylistById(params.id)
  if (!playlist) return { title: 'Playlist not found · Admin · The Curry Family' }
  return { title: `Edit ${playlist.title} · Admin · The Curry Family` }
}

export default async function AdminEditPlaylistPage({ params }: { params: { id: string } }) {
  await requireAdminOrRedirect()

  const playlist = getPlaylistById(params.id)
  if (!playlist) notFound()

  const allVideos = getVideos()

  // Pre-populate form with current playlist values; empty string for absent optional fields.
  const initial = {
    id: playlist.id,
    title: playlist.title,
    subtitle: playlist.subtitle ?? '',
    description: playlist.description ?? '',
    coverVideoId: playlist.coverVideoId,
  }

  return (
    <div className="py-11 px-7 md:px-11 max-w-3xl mx-auto">
      <Link
        href="/admin/playlists"
        className="text-quiet text-xs uppercase tracking-[0.22em] hover:text-navy transition-colors mb-6 inline-block"
      >
        ← Back to playlists
      </Link>
      <p className="eyebrow text-gold-deep mb-3">EDITING · {playlist.title.toUpperCase()}</p>
      <h1 className="font-serif text-navy text-4xl mb-1">{playlist.title}</h1>
      {playlist.subtitle && (
        <p className="font-serif italic text-muted text-base mb-9">{playlist.subtitle}</p>
      )}

      <EditPlaylistForm
        mode="update"
        playlistId={playlist.id}
        initial={initial}
        allVideos={allVideos}
      />
    </div>
  )
}
