// components/video/VideoGrid.tsx
// Server Component - fetches all videos, sorts chronologically, renders grid or empty state.
// No 'use client' - data fetching and rendering happen entirely on the server.
import { getVideos } from '@/lib/content'
import VideoCard from '@/components/video/VideoCard'

export default function VideoGrid() {
  const videos = getVideos()

  // Sort chronologically: oldest first (per D-14).
  // Videos with empty/missing dateTaken sort to the end.
  const sorted = [...videos].sort((a, b) => {
    if (!a.dateTaken && !b.dateTaken) return 0
    if (!a.dateTaken) return 1
    if (!b.dateTaken) return -1
    return a.dateTaken.localeCompare(b.dateTaken)
  })

  // Inline empty state (per D-15) - no error, no blank white void
  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-7 text-center">
        <p className="eyebrow text-quiet mb-4">FAMILY ARCHIVE</p>
        <h2 className="font-serif text-navy text-xl mb-3">No films yet</h2>
        <p className="text-muted text-sm max-w-sm">
          Family films will appear here as they are added to the archive.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-7">
      {sorted.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  )
}
