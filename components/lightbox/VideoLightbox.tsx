// components/lightbox/VideoLightbox.tsx
// 'use client' - owns keyboard listeners, body scroll lock, and open/close animation.
//
// v3.1 viewing-room upgrade:
//   - Backdrop now uses --color-navy-ink (#0F162C) at 90% - deeper and cooler
//     than the previous rgba(15,24,64,.95), so the player visually pops without
//     fighting the navy brand color.
//   - Controls are glassy white/12 with white/10 borders + backdrop-blur,
//     instead of bare gold links. Matches modern media-app conventions and
//     stays visible against any video frame.
//   - Player frame has subtle ring + heavy soft shadow to feel like a framed
//     viewing window rather than a borderless iframe.
//   - "3 of 9" film index moved up next to the title rather than buried below
//     the metadata stack.
//   - Subtle scale-fade entrance for the player container (per the design crit's
//     modal motion pattern). Backdrop fade unchanged.
//   - Visible focus rings on every control. Focus trap + focus return preserved.
//   - All controls have proper aria-labels; arrow buttons disabled at boundaries
//     handled by the existing wrap-around logic (always enabled), so visible
//     state is fine.
//
// D-15 keyboard: Escape -> close, ArrowLeft -> prev, ArrowRight -> next.
// D-16 backdrop click closes; click inside player container does not propagate.
// D-18 body scroll locked while open.
'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
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

// Shared button classes - glassy pill, white text, subtle border, blurs the
// backdrop behind. Used for close, prev, next, and any future viewing-room
// control.
const GLASSY_BTN = [
  'grid place-items-center',
  'rounded-full',
  'bg-white/8 hover:bg-white/14',
  'border border-white/12',
  'text-white backdrop-blur-md',
  'transition-all duration-200 hover:scale-105',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-navy-ink)]',
].join(' ')

export default function VideoLightbox({ videos, currentIndex, onClose, onPrev, onNext }: VideoLightboxProps) {
  const video = videos[currentIndex]
  const reduce = useReducedMotion()

  // Focus trap active whenever VideoLightbox is mounted; returns focus to the
  // trigger element (e.g. video thumbnail) when the lightbox unmounts.
  const trapRef = useFocusTrap<HTMLDivElement>(true)

  // Lock body scroll while lightbox is open; restore on unmount.
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // Keyboard handlers; clean up on unmount to prevent leaks.
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

  const hasMultiple = videos.length > 1

  return (
    <AnimatePresence>
      <motion.div
        ref={trapRef}
        key="video-lightbox-backdrop"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={reduce ? { opacity: 1 } : { opacity: 0 }}
        transition={reduce ? { duration: 0 } : { duration: 0.25 }}
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ background: 'rgba(15, 22, 44, 0.88)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="video-lightbox-title"
      >
        {/* Close button - top-right corner of the viewing room. */}
        <button
          onClick={(e) => { e.stopPropagation(); onClose() }}
          className={`${GLASSY_BTN} absolute top-5 right-5 md:top-6 md:right-6 w-10 h-10 text-xl`}
          aria-label="Close lightbox"
        >
          {'×'}
        </button>

        {/* Prev / Next - vertically centered on sides at desktop, hidden on
            mobile (handled by below-player control row instead). */}
        {hasMultiple && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onPrev() }}
              className={`${GLASSY_BTN} hidden md:grid absolute left-5 top-1/2 -translate-y-1/2 w-11 h-11`}
              aria-label="Previous video"
            >
              {'‹'}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onNext() }}
              className={`${GLASSY_BTN} hidden md:grid absolute right-5 top-1/2 -translate-y-1/2 w-11 h-11`}
              aria-label="Next video"
            >
              {'›'}
            </button>
          </>
        )}

        {/* Player + metadata container. Cross-fades per-video via key=video.id.
            Subtle scale-fade entrance per the modal motion grammar. */}
        <motion.div
          key={video.id}
          initial={reduce ? false : { opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduce ? { opacity: 1 } : { opacity: 0, scale: 0.985 }}
          transition={reduce ? { duration: 0 } : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-5 w-full max-w-[min(1100px,92vw)] px-4 md:px-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Player frame - a real viewing window. Subtle white ring +
              heavy shadow, black bg so the iframe sits crisp. */}
          <div
            className="
              aspect-video w-full
              rounded-2xl overflow-hidden
              bg-black border border-white/10
              shadow-[0_30px_100px_rgba(0,0,0,0.50)]
            "
          >
            <VideoPlayer video={video} />
          </div>

          {/* Metadata row - title left, film index right.
              id="video-lightbox-title" referenced by aria-labelledby above. */}
          <div className="w-full flex items-start justify-between gap-4 text-white">
            <div className="min-w-0 flex-1">
              <p
                id="video-lightbox-title"
                className="font-serif text-xl md:text-2xl leading-tight truncate"
              >
                {video.title}
              </p>
              {(video.dateLabel || video.duration) && (
                <p className="mt-1.5 text-sm text-white/65">
                  {[video.dateLabel, video.duration].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
            {hasMultiple && (
              <span
                className="
                  shrink-0
                  rounded-full border border-white/12 bg-white/8 backdrop-blur-md
                  px-3 py-1 text-xs text-white/75 tabular-nums
                "
                aria-label={`Film ${currentIndex + 1} of ${videos.length}`}
              >
                {currentIndex + 1} of {videos.length}
              </span>
            )}
          </div>

          {/* Mobile-only Prev/Next row - placed below player so thumb taps
              don't conflict with the side arrows on small screens. */}
          {hasMultiple && (
            <div className="md:hidden flex items-center justify-center gap-3 pt-2">
              <button
                onClick={(e) => { e.stopPropagation(); onPrev() }}
                className={`${GLASSY_BTN} w-11 h-11`}
                aria-label="Previous video"
              >
                {'‹'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onNext() }}
                className={`${GLASSY_BTN} w-11 h-11`}
                aria-label="Next video"
              >
                {'›'}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
