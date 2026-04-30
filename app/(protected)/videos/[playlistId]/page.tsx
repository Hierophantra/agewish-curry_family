// app/(protected)/videos/[playlistId]/page.tsx
// Placeholder — Phase 9 implements playlist detail view (video grid filtered by playlist).
// D-24: Stub only; returns "Coming in Phase 9" message.
import { getPlaylistById, getPlaylists } from '@/lib/content'
import { notFound } from 'next/navigation'

interface Props {
  params: { playlistId: string }
}

export default function PlaylistPage({ params }: Props) {
  const playlist = getPlaylistById(params.playlistId)
  if (!playlist) notFound()
  return (
    <main className="py-11 px-7">
      <p className="eyebrow text-quiet mb-3">FAMILY ARCHIVE · PLAYLIST</p>
      <h1 className="font-serif text-navy text-3xl mb-2">{playlist.title}</h1>
      <p className="text-muted text-sm mb-6">Coming in Phase 9 — video list filtered by this playlist.</p>
    </main>
  )
}

export async function generateStaticParams() {
  return getPlaylists().map((p) => ({ playlistId: p.id }))
}
