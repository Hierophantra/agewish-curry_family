// components/lightbox/VideoLightbox.tsx
// 'use client' — owns keyboard listeners, body scroll lock, and open/close animation.
// Receives a pre-filtered videos array (playlist's videos) and the current index.
// D-09 (video variant): Triggered by PlaylistVideoGrid (Phase 9).
// Mirrors Lightbox.tsx but embeds VideoPlayer instead of next/image.
// D-10: Backdrop rgba(15, 24, 64, 0.95) — navy-derived dark overlay.
// D-15: Keyboard nav: Escape → close, ArrowLeft → prev, ArrowRight → next.
// D-16: Backdrop click closes; click on video container does NOT propagate.
// D-17: AnimatePresence opacity fade-in/out 250ms; per-video cross-fade via key={video.id}.
// D-18: Body scroll locked while open; restored on unmount.
// D-19: Wraps around at boundaries (∞ navigation).
// D-9.6: No autoplay on open — user must click play themselves.
'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import VideoPlayer from '@/components/video/VideoPlayer'
import type { Video } from '@/lib/types'
import { useFocusTrap } from '@/lib/focus-trap'

interface VideoLightboxProps {
  videos: Video[]
  currentIndex: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

export default function VideoLightbox({ videos, currentIndex, onClose, onPrev, onNext }: VideoLightboxProps) {
  const video = videos[currentIndex]

  // Focus trap — active whenever the VideoLightbox component is mounted (always open when rendered).
  // Returns focus to the trigger element (e.g. video thumbnail) when lightbox unmounts.
  const trapRef = useFocusTrap<HTMLDivElement>(true)

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

  if (!video) return null

  return (
    <AnimatePresence>
      {/* D-10: Backdrop — click to close (D-16) */}
      <motion.div
        ref={trapRef}
        key="video-lightbox-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ background: 'rgba(15, 24, 64, 0.95)' }}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label={`Video: ${video.title}`}
      >
        {/* Close button — top-right */}
        <button
          onClick={(e) => { e.stopPropagation(); onClose() }}
          className="absolute top-6 right-6 text-gold w-8 h-8 flex items-center justify-center text-3xl hover:scale-110 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
          aria-label="Close lightbox"
        >
          ×
        </button>

        {/* Prev / Next buttons — only shown when there is more than one video */}
        {videos.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onPrev() }}
              className="absolute left-6 top-1/2 -translate-y-1/2 text-gold w-11 h-11 flex items-center justify-center text-2xl hover:scale-110 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
              aria-label="Previous video"
            >
              ‹
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onNext() }}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-gold w-11 h-11 flex items-center justify-center text-2xl hover:scale-110 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
              aria-label="Next video"
            >
              ›
            </button>
          </>
        )}

        {/* D-17: Per-video cross-fade via key={video.id}; container stops propagation (D-16) */}
        <motion.div
          key={video.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-center gap-4 max-w-[1024px] w-full px-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Video player — constrained to 16:9 aspect ratio */}
          <div className="aspect-video w-full">
            <VideoPlayer video={video} />
          </div>

          {/* Video meta: title + dateLabel + duration */}
          <div className="text-center px-4">
            <p className="text-white text-base font-serif">{video.title}</p>
            {(video.dateLabel || video.duration) && (
              <p className="text-stone uppercase tracking-[0.22em] text-xs mt-1.5">
                {[video.dateLabel, video.duration].filter(Boolean).join(' · ')}
              </p>
            )}
            {videos.length > 1 && (
              <p className="text-stone uppercase tracking-[0.22em] text-[10px] mt-2">
                {currentIndex + 1} / {videos.length}
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
