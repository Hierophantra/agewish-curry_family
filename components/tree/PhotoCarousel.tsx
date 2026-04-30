// components/tree/PhotoCarousel.tsx
// 'use client' — uses useState, useEffect, motion/react
'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { Photo } from '@/lib/types'

// D-15 (Claude's discretion): 6s auto-advance
const AUTO_ADVANCE_MS = 6000

interface PhotoCarouselProps {
  photos: Photo[]
}

export default function PhotoCarousel({ photos }: PhotoCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  // Auto-advance with cleanup — CRITICAL: return () => clearTimeout(timer)
  // Without cleanup: each node click leaves a timer running; after 5 clicks,
  // 5 timers advance the carousel simultaneously (RESEARCH §Topic 6 gotcha)
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

  if (photos.length === 0) {
    return (
      <div className="aspect-[4/3] bg-ivory flex items-center justify-center">
        <p className="eyebrow text-quiet text-xs">No photographs</p>
      </div>
    )
  }

  const activePhoto = photos[activeIndex]!

  return (
    <div>
      {/* D-15: 4:3 aspect container; overflow-hidden clips exiting image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-ivory">
        <AnimatePresence mode="wait">
          <motion.img
            key={activeIndex}                          // drives crossfade: new key = new enter animation
            src={`/photos/${activePhoto.filename}`}
            alt={activePhoto.caption ?? 'Family photograph'}
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}             // D-15: 600ms crossfade
          />
        </AnimatePresence>
      </div>

      {/* Dot indicators — TREE-11: gold active, stone inactive */}
      {photos.length > 1 && (
        <div className="flex gap-1.5 justify-center mt-2">
          {photos.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Photo ${i + 1}`}
              // Static Tailwind class strings — NOT bg-${color} (purged in production)
              className={
                i === activeIndex
                  ? 'w-2 h-2 rounded-full bg-gold'
                  : 'w-2 h-2 rounded-full bg-stone'
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
