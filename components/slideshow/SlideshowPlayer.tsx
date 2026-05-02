'use client'
// components/slideshow/SlideshowPlayer.tsx
// Ambient slideshow player — full-screen auto-advance through shuffled photos.
// D-14 (v2.1 Feedback): 8s auto-advance, crossfade 1.2s, keyboard ←/→, controls auto-hide after 3s.
// Phase 15 standard: prefers-reduced-motion respected via useReducedMotion().
// Phase 16 standard: blurDataUrl placeholder flows naturally from PhotoSchema.
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import type { Photo } from '@/lib/types'
import { getPhotoUrl } from '@/lib/utils'

const ADVANCE_MS = 8000
const CONTROLS_HIDE_AFTER_MS = 3000

interface Props {
  photos: Photo[]
  collectionTitle: string | null
}

export default function SlideshowPlayer({ photos, collectionTitle }: Props) {
  const reduce = useReducedMotion()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Shuffle photos once on mount for ambient randomness
  const shuffled = useRef<Photo[]>([])
  useEffect(() => {
    shuffled.current = [...photos].sort(() => Math.random() - 0.5)
    // Lock body scroll while slideshow is active
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [photos])

  // Auto-advance every 8 seconds
  useEffect(() => {
    if (shuffled.current.length === 0) return
    const t = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % shuffled.current.length)
    }, ADVANCE_MS)
    return () => clearInterval(t)
  }, [])

  // Auto-hide controls after 3s of mouse inactivity
  function handleMouseMove() {
    setShowControls(true)
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current)
    controlsTimerRef.current = setTimeout(() => setShowControls(false), CONTROLS_HIDE_AFTER_MS)
  }

  // Keyboard navigation: ← / → to step through manually
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') {
        setCurrentIndex((i) => (i + 1) % shuffled.current.length)
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((i) => (i - 1 + shuffled.current.length) % shuffled.current.length)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  // Empty state
  if (photos.length === 0) {
    return (
      <main className="fixed inset-0 z-50 bg-navy text-white flex flex-col items-center justify-center text-center p-8">
        <p className="eyebrow text-stone mb-3">FAMILY ARCHIVE</p>
        <h1 className="font-serif text-3xl mb-4">No photographs to show</h1>
        <p className="font-serif italic text-stone mb-8">
          The archive doesn&apos;t have any photos to play yet.
        </p>
        <Link
          href="/"
          className="eyebrow text-gold hover:text-white transition-colors"
        >
          Return home →
        </Link>
      </main>
    )
  }

  const photo = shuffled.current[currentIndex] ?? photos[0]

  return (
    <main
      className="fixed inset-0 z-50 bg-[#0F1840] flex items-center justify-center"
      onMouseMove={handleMouseMove}
    >
      {/* Per-photo crossfade — key={photo.id} triggers AnimatePresence */}
      <AnimatePresence mode="wait">
        <motion.div
          key={photo.id}
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={reduce ? { duration: 0 } : { duration: 1.2, ease: 'easeInOut' }}
          className="flex items-center justify-center max-w-[92vw] max-h-[88vh]"
        >
          <Image
            src={getPhotoUrl(photo)}
            alt={photo.caption ?? ''}
            width={2400}
            height={1800}
            className="max-w-full max-h-[88vh] object-contain w-auto h-auto"
            priority
            {...(photo.blurDataUrl
              ? { placeholder: 'blur' as const, blurDataURL: photo.blurDataUrl }
              : {})}
          />
        </motion.div>
      </AnimatePresence>

      {/* Caption + date overlay — always visible at bottom */}
      {(photo.caption || photo.dateLabel) && (
        <div className="absolute bottom-12 left-0 right-0 text-center px-8 pointer-events-none">
          {photo.caption && (
            <p className="font-serif italic text-white/90 text-xl mb-1">{photo.caption}</p>
          )}
          {photo.dateLabel && (
            <p className="eyebrow text-stone text-xs">
              {photo.circa ? 'Circa ' : ''}
              {photo.dateLabel}
            </p>
          )}
        </div>
      )}

      {/* Controls overlay — auto-hides after 3s of mouse inactivity */}
      <motion.div
        initial={false}
        animate={{ opacity: showControls ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute top-6 right-6 flex items-center gap-4"
      >
        <p className="text-stone uppercase tracking-[0.22em] text-[10px]">
          {collectionTitle ?? 'All photographs'} · {currentIndex + 1} /{' '}
          {shuffled.current.length || photos.length}
        </p>
        <Link
          href="/"
          className="eyebrow text-gold hover:text-white transition-colors text-[10px] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1840] px-2 py-1 rounded"
        >
          Exit ×
        </Link>
      </motion.div>
    </main>
  )
}
