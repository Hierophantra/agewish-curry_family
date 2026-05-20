// components/gallery/CollectionPhotoGrid.tsx
// 'use client' - owns lightbox open/close state for a collection's photo grid.
// D-23: Manages lightboxIndex (null = closed, number = open at index).
// D-24: Each PhotoCard receives onClick that sets lightboxIndex, opening the lightbox.
// D-25: Renders <Lightbox> conditionally; prev/next wrap around (∞ navigation, D-13/D-19).
// Phase 16: URL state - ?photo=<id> persists lightbox across refresh and enables deep links.
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import PhotoCard from './PhotoCard'
import Lightbox from '@/components/lightbox/Lightbox'
import type { Photo } from '@/lib/types'

interface CollectionPhotoGridProps {
  photos: Photo[]
}

export default function CollectionPhotoGrid({ photos }: CollectionPhotoGridProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const urlPhotoId = searchParams.get('photo')

  // Resolve URL param to an index. null = lightbox closed.
  function indexFromId(id: string | null): number | null {
    if (id === null) return null
    const idx = photos.findIndex((p) => p.id === id)
    return idx >= 0 ? idx : null
  }

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(
    () => indexFromId(urlPhotoId)
  )

  // Sync URL → local state for back/forward browser navigation.
  // Guard: only update when the resolved index actually differs.
  useEffect(() => {
    const next = indexFromId(urlPhotoId)
    if (next !== lightboxIndex) {
      setLightboxIndex(next)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlPhotoId])

  if (photos.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="eyebrow text-quiet mb-3">FAMILY ARCHIVE</p>
        <h2 className="font-serif text-navy text-2xl mb-2">No photographs in this collection yet</h2>
        <p className="text-muted text-sm">Photographs tagged with this collection will appear here as they are added.</p>
      </div>
    )
  }

  // openPhoto: push to history so back button closes the lightbox naturally.
  function openPhoto(index: number) {
    const photo = photos[index]
    if (!photo) return
    setLightboxIndex(index)
    const params = new URLSearchParams(searchParams.toString())
    params.set('photo', photo.id)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  // closePhoto: replace so back button returns to the previous page, not just un-opens lightbox.
  function closePhoto() {
    setLightboxIndex(null)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('photo')
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  // navigatePhoto: replace so each prev/next doesn't pollute history - back button closes modal.
  function navigatePhoto(index: number) {
    const photo = photos[index]
    if (!photo) return
    setLightboxIndex(index)
    const params = new URLSearchParams(searchParams.toString())
    params.set('photo', photo.id)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7">
        {photos.map((photo, i) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            onClick={() => openPhoto(i)}
          />
        ))}
      </div>

      {/* D-25: Lightbox rendered conditionally so AnimatePresence exit works */}
      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          currentIndex={lightboxIndex}
          onClose={closePhoto}
          onPrev={() => navigatePhoto((lightboxIndex - 1 + photos.length) % photos.length)}
          onNext={() => navigatePhoto((lightboxIndex + 1) % photos.length)}
        />
      )}
    </>
  )
}
