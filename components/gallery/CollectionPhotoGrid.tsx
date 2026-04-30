// components/gallery/CollectionPhotoGrid.tsx
// 'use client' — owns lightbox open/close state for a collection's photo grid.
// D-23: Manages lightboxIndex (null = closed, number = open at index).
// D-24: Each PhotoCard receives onClick that sets lightboxIndex, opening the lightbox.
// D-25: Renders <Lightbox> conditionally; prev/next wrap around (∞ navigation, D-13/D-19).
'use client'

import { useState } from 'react'
import PhotoCard from './PhotoCard'
import Lightbox from '@/components/lightbox/Lightbox'
import type { Photo } from '@/lib/types'

interface CollectionPhotoGridProps {
  photos: Photo[]
}

export default function CollectionPhotoGrid({ photos }: CollectionPhotoGridProps) {
  // null = lightbox closed; number = lightbox open at that index
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (photos.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="eyebrow text-quiet mb-3">FAMILY ARCHIVE</p>
        <h2 className="font-serif text-navy text-2xl mb-2">No photographs in this collection yet</h2>
        <p className="text-muted text-sm">Photographs tagged with this collection will appear here.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7">
        {photos.map((photo, i) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            onClick={() => setLightboxIndex(i)}
          />
        ))}
      </div>

      {/* D-25: Lightbox rendered conditionally so AnimatePresence exit works */}
      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((i) => ((i ?? 0) - 1 + photos.length) % photos.length)}
          onNext={() => setLightboxIndex((i) => ((i ?? 0) + 1) % photos.length)}
        />
      )}
    </>
  )
}
