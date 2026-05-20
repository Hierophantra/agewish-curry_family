// components/video/PlaylistGrid.tsx
// Server Component - fetches all playlists and renders a responsive grid of PlaylistCards.
// Mirrors CollectionGrid but for video playlists.
// D-03 (adapted): 1 col mobile / 2 cols tablet / 3 cols desktop.
import PlaylistCard from './PlaylistCard'
import { getPlaylists, getVideosInPlaylist } from '@/lib/content'

export default function PlaylistGrid() {
  const playlists = getPlaylists()

  if (playlists.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="eyebrow text-quiet mb-3">FAMILY ARCHIVE</p>
        <h2 className="font-serif text-navy text-2xl mb-2">No playlists yet</h2>
        <p className="text-muted text-sm">
          Playlists of family films will appear here as they are organized.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
      {playlists.map((p) => (
        <PlaylistCard
          key={p.id}
          playlist={p}
          videoCount={getVideosInPlaylist(p.id).length}
        />
      ))}
    </div>
  )
}
