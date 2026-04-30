// components/gallery/PhotoGrid.tsx
// Server Component — fetches all photos, sorts chronologically, renders grid or empty state.
// No 'use client' — data fetching and rendering happen entirely on the server.
import { getPhotos } from '@/lib/content'
import PhotoCard from '@/components/gallery/PhotoCard'

export default function PhotoGrid() {
  const photos = getPhotos()

  // Sort chronologically: oldest first (per D-13).
  // Photos with empty/missing dateTaken sort to the end.
  const sorted = [...photos].sort((a, b) => {
    if (!a.dateTaken && !b.dateTaken) return 0
    if (!a.dateTaken) return 1
    if (!b.dateTaken) return -1
    return a.dateTaken.localeCompare(b.dateTaken)
  })

  // Empty state (per D-03, D-14) — no error, no blank white void
  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-7 text-center">
        <p className="eyebrow text-quiet mb-4">FAMILY ARCHIVE</p>
        <h2 className="font-serif text-navy text-xl mb-3">No photographs yet</h2>
        <p className="text-muted text-sm max-w-sm">
          Photographs will appear here as they are added to the archive.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7">
      {sorted.map((photo) => (
        <PhotoCard key={photo.id} photo={photo} />
      ))}
    </div>
  )
}
