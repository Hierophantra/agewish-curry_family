// components/tree/PhotoCarousel.tsx
// 'use client' — uses useState, useEffect; integrates Lightbox on image click
'use client'
import { useState, useEffect } from 'react'
import type { Photo } from '@/lib/types'
import Lightbox from '@/components/lightbox/Lightbox'

// Prototype .panel-img { transition: opacity 1.2s ease-in-out } → 1200ms crossfade
// Prototype startCrossfade setInterval(..., 4000) → 4s auto-advance
const AUTO_ADVANCE_MS = 4000
const CROSSFADE_MS = 1200

interface PhotoCarouselProps {
  photos: Photo[]
}

export default function PhotoCarousel({ photos }: PhotoCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  // Auto-advance with cleanup — CRITICAL: clearTimeout on each change prevents timer pile-up
  // (RESEARCH §Topic 6 gotcha: multiple timers advancing carousel simultaneously)
  useEffect(() => {
    if (photos.length <= 1) return

    const timer = setTimeout(() => {
      setActiveIndex((i) => (i + 1) % photos.length)
    }, AUTO_ADVANCE_MS)

    return () => clearTimeout(timer)
  }, [activeIndex, photos.length])

  // Reset to first photo when the photos array changes (new person selected)
  useEffect(() => {
    setActiveIndex(0)
  }, [photos])

  // Empty state: 4:5 ivory placeholder with italic serif text
  if (photos.length === 0) {
    return (
      <div className="aspect-[4/5] bg-ivory border hairline rounded-sm flex items-center justify-center">
        <p className="font-serif italic text-muted text-xs text-center px-4">
          No photographs of this person yet
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* 4:5 aspect container — prototype .panel-img-wrap { aspect-ratio: 4/5 }
          ivory bg, 0.5px border, rounded-sm (border-radius: 6px in prototype)
          overflow-hidden clips all stacked images to container boundary */}
      <div className="relative aspect-[4/5] overflow-hidden bg-ivory border hairline rounded-sm">
        {photos.map((photo, i) => (
          /* Each image is absolute/inset-0; opacity transitions handle crossfade.
             Crossfade: 1.2s ease-in-out per prototype .panel-img { transition: opacity 1.2s ease-in-out }
             Click opens Lightbox at this index. */
          <button
            key={photo.id}
            type="button"
            aria-label={`View ${photo.caption ?? 'photograph'} full screen`}
            className="absolute inset-0 w-full h-full cursor-pointer p-0 border-0 bg-transparent"
            onClick={() => setLightboxIndex(i)}
            style={{
              opacity: i === activeIndex ? 1 : 0,
              transition: `opacity ${CROSSFADE_MS}ms ease-in-out`,
              // Ensure active photo stacks above inactive (avoids click-through on invisible photos)
              zIndex: i === activeIndex ? 1 : 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/photos/${photo.filename}`}
              alt={photo.caption ?? 'Family photograph'}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Dot indicators — prototype .panel-dot: 5×5px, border-radius 50%, gap 6px
          Active: bg-gold (prototype var(--gold)); inactive: bg-stone (prototype #D8D3C2) */}
      {photos.length > 1 && (
        <div className="flex justify-center mt-2" style={{ gap: '6px' }}>
          {photos.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Photo ${i + 1}`}
              // Static Tailwind class strings — NOT bg-${color} (purged in production)
              className={
                i === activeIndex
                  ? 'rounded-full bg-gold'
                  : 'rounded-full bg-stone'
              }
              style={{ width: '5px', height: '5px', border: 'none', padding: 0, cursor: 'pointer' }}
            />
          ))}
        </div>
      )}

      {/* Lightbox — shared component (D-09/Phase 8); receives same photos array (D-19: wraps at boundaries) */}
      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() =>
            setLightboxIndex((idx) =>
              idx !== null ? (idx - 1 + photos.length) % photos.length : 0
            )
          }
          onNext={() =>
            setLightboxIndex((idx) =>
              idx !== null ? (idx + 1) % photos.length : 0
            )
          }
        />
      )}
    </div>
  )
}
