// components/video/PlaylistVideoGrid.tsx
// 'use client' — owns VideoLightbox open/close state for a playlist's video grid.
// Manages lightboxIndex (null = closed, number = open at that index).
// Each VideoCard receives onClick that sets lightboxIndex, opening the lightbox.
// Renders VideoLightbox conditionally; prev/next wrap around (∞ navigation).
'use client'

import { useState } from 'react'
import VideoCard from './VideoCard'
import VideoLightbox from '@/components/lightbox/VideoLightbox'
import type { Video } from '@/lib/types'

interface PlaylistVideoGridProps {
  videos: Video[]
}

export default function PlaylistVideoGrid({ videos }: PlaylistVideoGridProps) {
  // null = lightbox closed; number = lightbox open at that index
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (videos.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="eyebrow text-quiet mb-3">FAMILY ARCHIVE</p>
        <h2 className="font-serif text-navy text-2xl mb-2">No videos in this playlist yet</h2>
        <p className="text-muted text-sm">Videos tagged with this playlist will appear here.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-7">
        {videos.map((v, i) => (
          <VideoCard key={v.id} video={v} onClick={() => setLightboxIndex(i)} />
        ))}
      </div>

      {/* Lightbox rendered conditionally so AnimatePresence exit works */}
      {lightboxIndex !== null && (
        <VideoLightbox
          videos={videos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((i) => (i! - 1 + videos.length) % videos.length)}
          onNext={() => setLightboxIndex((i) => (i! + 1) % videos.length)}
        />
      )}
    </>
  )
}
