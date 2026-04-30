// components/lightbox/Lightbox.tsx
// 'use client' — owns keyboard listeners, body scroll lock, and open/close animation.
// Receives a pre-filtered photos array (collection's photos) and the current index.
// D-09: Triggered by CollectionPhotoGrid (Phase 8) or future PersonPanel carousel (Phase 10).
// D-10: Backdrop rgba(15, 24, 64, 0.95) — navy-derived dark overlay.
// D-15: Keyboard nav: Escape → close, ArrowLeft → prev, ArrowRight → next.
// D-16: Backdrop click closes; click on image container does NOT propagate.
// D-17: AnimatePresence opacity fade-in/out 250ms; per-photo cross-fade via key={photo.id}.
// D-18: Body scroll locked while open; restored on unmount.
// D-19: Wraps around at boundaries (∞ navigation).
'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'motion/react'
import type { Photo } from '@/lib/types'

interface LightboxProps {
  photos: Photo[]
  currentIndex: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

export default function Lightbox({ photos, currentIndex, onClose, onPrev, onNext }: LightboxProps) {
  const photo = photos[currentIndex]

  // D-18: Lock body scroll while lightbox is open; restore on unmount.
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // D-15: Register keyboard handlers; clean up on unmount to prevent leaks.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') onPrev()
      else if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose, onPrev, onNext])

  if (!photo) return null

  // Resolve display label — prefer dateLabel (v2 canonical), fall back to date string.
  const displayDate = photo.dateLabel ?? photo.dateTaken ?? null

  return (
    <AnimatePresence>
      {/* D-10: Backdrop — click to close (D-16) */}
      <motion.div
        key="lightbox-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ background: 'rgba(15, 24, 64, 0.95)' }}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label={`Photo: ${photo.caption ?? photo.id}`}
      >
        {/* Close button — top-right, D-14 */}
        <button
          onClick={(e) => { e.stopPropagation(); onClose() }}
          className="absolute top-6 right-6 text-gold w-8 h-8 flex items-center justify-center text-3xl hover:scale-110 transition-transform"
          aria-label="Close lightbox"
        >
          ×
        </button>

        {/* Prev button — D-13 */}
        <button
          onClick={(e) => { e.stopPropagation(); onPrev() }}
          className="absolute left-6 top-1/2 -translate-y-1/2 text-gold w-11 h-11 flex items-center justify-center text-2xl hover:scale-110 transition-transform"
          aria-label="Previous photo"
        >
          ‹
        </button>

        {/* Next button — D-13 */}
        <button
          onClick={(e) => { e.stopPropagation(); onNext() }}
          className="absolute right-6 top-1/2 -translate-y-1/2 text-gold w-11 h-11 flex items-center justify-center text-2xl hover:scale-110 transition-transform"
          aria-label="Next photo"
        >
          ›
        </button>

        {/* D-17: Per-photo cross-fade via key={photo.id}; image container stops propagation (D-16) */}
        <motion.div
          key={photo.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-center gap-4 max-w-[90vw] max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* D-11: Image — object-contain, constrained to viewport */}
          <div className="relative max-w-[90vw] max-h-[80vh] flex items-center justify-center">
            <Image
              src={`/photos/${photo.filename}`}
              alt={photo.caption ?? ''}
              width={1600}
              height={1200}
              className="max-w-full max-h-[80vh] object-contain w-auto h-auto"
              priority
            />
          </div>

          {/* D-12: Caption + dateLabel below image */}
          {(photo.caption || displayDate) && (
            <div className="text-center px-4">
              {photo.caption && (
                <p className="text-white text-sm">{photo.caption}</p>
              )}
              {displayDate && (
                <p className="text-stone uppercase tracking-[0.22em] text-xs mt-1">{displayDate}</p>
              )}
              {/* Photo index counter (D-13 / Claude's discretion) */}
              <p className="text-stone uppercase tracking-[0.22em] text-[10px] mt-2">
                {currentIndex + 1} / {photos.length}
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
