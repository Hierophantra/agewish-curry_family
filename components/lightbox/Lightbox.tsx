// components/lightbox/Lightbox.tsx
// 'use client' - owns keyboard listeners, body scroll lock, and open/close animation.
// Receives a pre-filtered photos array (collection's photos) and the current index.
// D-09: Triggered by CollectionPhotoGrid (Phase 8) or future PersonPanel carousel (Phase 10).
// D-10: Backdrop rgba(15, 24, 64, 0.95) - navy-derived dark overlay.
// D-15: Keyboard nav: Escape → close, ArrowLeft → prev, ArrowRight → next.
// D-16: Backdrop click closes; click on image container does NOT propagate.
// D-17: AnimatePresence opacity fade-in/out 250ms; per-photo cross-fade via key={photo.id}.
// D-18: Body scroll locked while open; restored on unmount.
// D-19: Wraps around at boundaries (∞ navigation).
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import type { Photo } from '@/lib/types'
import { useFocusTrap } from '@/lib/focus-trap'
import { getPhotoUrl } from '@/lib/utils'

// Zoom config - tuned for a calm photo-viewer feel, not a harsh snap.
const ZOOM_MIN = 1          // never zoom out past the fitted size
const ZOOM_MAX = 4          // 4x is plenty for inspecting faces / detail
const ZOOM_SENSITIVITY = 0.0016  // wheel delta -> scale factor. Lower = gentler.

interface LightboxProps {
  photos: Photo[]
  currentIndex: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

export default function Lightbox({ photos, currentIndex, onClose, onPrev, onNext }: LightboxProps) {
  const photo = photos[currentIndex]

  // prefers-reduced-motion: skip fade animations entirely when OS setting is enabled.
  const reduce = useReducedMotion()

  // Focus trap - active whenever the Lightbox component is mounted (it is always open when rendered).
  // Returns focus to the trigger element (e.g. photo thumbnail) when lightbox unmounts.
  const trapRef = useFocusTrap<HTMLDivElement>(true)

  // Portal to document.body so the overlay escapes the protected layout's
  // <main class="relative z-10"> stacking context — otherwise the sticky
  // TopNav (z-40) paints OVER this lightbox. Mounted guard keeps SSR happy.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

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

  // ── Mousewheel zoom + drag pan ──
  // scale: current zoom. tx/ty: pan offset in px (relative to center).
  // The transform is `translate(tx,ty) scale(scale)` with a center origin.
  // Wheel zooms toward the cursor by adjusting tx/ty so the point under the
  // pointer stays put. A short CSS transition keeps it smooth (not harsh).
  const zoomWrapRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [tx, setTx] = useState(0)
  const [ty, setTy] = useState(0)
  const [animating, setAnimating] = useState(true)  // CSS transition on by default
  const [isDragging, setIsDragging] = useState(false)
  const dragState = useRef<{ active: boolean; startX: number; startY: number; baseTx: number; baseTy: number }>({
    active: false, startX: 0, startY: 0, baseTx: 0, baseTy: 0,
  })

  // Reset zoom whenever the photo changes (per-photo key) or on close.
  const photoId = photo?.id
  useEffect(() => {
    setScale(1)
    setTx(0)
    setTy(0)
  }, [photoId])

  // Non-passive wheel listener so we can preventDefault (React's onWheel is
  // passive by default and can't block page scroll).
  useEffect(() => {
    const el = zoomWrapRef.current
    if (!el) return

    function onWheel(e: WheelEvent) {
      e.preventDefault()
      const rect = el!.getBoundingClientRect()
      // Cursor position relative to the container center.
      const cx = e.clientX - rect.left - rect.width / 2
      const cy = e.clientY - rect.top - rect.height / 2

      setScale((prevScale) => {
        const nextScale = Math.min(
          ZOOM_MAX,
          Math.max(ZOOM_MIN, prevScale * Math.exp(-e.deltaY * ZOOM_SENSITIVITY)),
        )
        if (nextScale === prevScale) return prevScale
        const ratio = nextScale / prevScale
        // Keep the point under the cursor fixed: tx' = C - (C - tx) * ratio
        setTx((prevTx) => {
          const next = cx - (cx - prevTx) * ratio
          return nextScale === 1 ? 0 : next
        })
        setTy((prevTy) => {
          const next = cy - (cy - prevTy) * ratio
          return nextScale === 1 ? 0 : next
        })
        setAnimating(true)  // smooth the zoom step
        return nextScale
      })
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [photoId])

  // Drag-to-pan when zoomed in. Pointer events cover mouse + touch + pen.
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (scale <= 1) return
    dragState.current = { active: true, startX: e.clientX, startY: e.clientY, baseTx: tx, baseTy: ty }
    setAnimating(false)  // drag should track 1:1, no easing lag
    setIsDragging(true)
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }, [scale, tx, ty])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState.current.active) return
    setTx(dragState.current.baseTx + (e.clientX - dragState.current.startX))
    setTy(dragState.current.baseTy + (e.clientY - dragState.current.startY))
  }, [])

  const onPointerUp = useCallback(() => {
    dragState.current.active = false
    setIsDragging(false)
  }, [])

  // Double-click toggles between fit (1x) and a gentle 2x at the click point.
  const onDoubleClick = useCallback((e: React.MouseEvent) => {
    const el = zoomWrapRef.current
    if (!el) return
    setAnimating(true)
    if (scale > 1) {
      setScale(1); setTx(0); setTy(0)
      return
    }
    const rect = el.getBoundingClientRect()
    const cx = e.clientX - rect.left - rect.width / 2
    const cy = e.clientY - rect.top - rect.height / 2
    const next = 2
    setScale(next)
    setTx(cx - cx * next)
    setTy(cy - cy * next)
  }, [scale])

  if (!photo) return null

  const isZoomed = scale > 1

  // Resolve display label - prefer dateLabel (v2 canonical), fall back to date string.
  const displayDate = photo.dateLabel ?? photo.dateTaken ?? null

  const overlay = (
    <AnimatePresence>
      {/* D-10: Backdrop - click to close (D-16) */}
      <motion.div
        ref={trapRef}
        key="lightbox-backdrop"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={reduce ? { opacity: 1 } : { opacity: 0 }}
        transition={reduce ? { duration: 0 } : { duration: 0.25 }}
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ background: 'rgba(12, 19, 50, 0.985)' }}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lightbox-caption"
      >
        {/* Close button - obvious circular control, top-right */}
        <button
          onClick={(e) => { e.stopPropagation(); onClose() }}
          className="absolute top-5 right-5 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 text-white flex items-center justify-center text-3xl leading-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
          aria-label="Close photo"
          title="Close (Esc)"
        >
          ×
        </button>

        {/* Prev button - larger hit target + glyph */}
        <button
          onClick={(e) => { e.stopPropagation(); onPrev() }}
          className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-10 w-14 h-14 rounded-full bg-white/8 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center text-4xl leading-none pb-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
          aria-label="Previous photo"
        >
          ‹
        </button>

        {/* Next button - larger hit target + glyph */}
        <button
          onClick={(e) => { e.stopPropagation(); onNext() }}
          className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-10 w-14 h-14 rounded-full bg-white/8 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center text-4xl leading-none pb-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
          aria-label="Next photo"
        >
          ›
        </button>

        {/* D-17: Per-photo cross-fade via key={photo.id}; image container stops propagation (D-16) */}
        <motion.div
          key={photo.id}
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? { opacity: 1 } : { opacity: 0 }}
          transition={reduce ? { duration: 0 } : { duration: 0.2 }}
          className="flex flex-col items-center gap-4 max-w-[94vw] max-h-[92vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Image - object-contain, constrained to viewport.
              The zoom wrapper owns the wheel + pointer handlers and applies the
              translate/scale transform. overflow-hidden clips the zoomed image
              to its box so panning stays within the frame. */}
          <div
            ref={zoomWrapRef}
            className="relative max-w-[92vw] max-h-[88vh] flex items-center justify-center overflow-hidden touch-none select-none"
            style={{ cursor: isZoomed ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onDoubleClick={onDoubleClick}
          >
            <Image
              src={getPhotoUrl(photo)}
              alt={photo.caption ?? ''}
              width={1600}
              height={1200}
              className="max-w-full max-h-[80vh] object-contain w-auto h-auto"
              priority
              draggable={false}
              style={{
                transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
                transformOrigin: 'center center',
                transition: animating ? 'transform 0.18s ease-out' : 'none',
                willChange: 'transform',
              }}
              {...(photo.blurDataUrl
                ? { placeholder: 'blur' as const, blurDataURL: photo.blurDataUrl }
                : {})}
            />
          </div>

          {/* D-12: Caption + dateLabel below image
              id="lightbox-caption" is referenced by aria-labelledby on the dialog element */}
          {(photo.caption || displayDate) && (
            <div id="lightbox-caption" className="text-center px-4">
              {photo.caption && (
                <p className="text-white text-sm">{photo.caption}</p>
              )}
              {displayDate && (
                <p className="text-stone uppercase tracking-[0.22em] text-xs mt-1">
                  {photo.circa ? 'Circa ' : ''}{displayDate}
                </p>
              )}
              {/* Provenance: source attribution - shown only when field is present */}
              {photo.source && (
                <p className="text-stone/70 text-[10px] tracking-[0.18em] uppercase mt-1.5">
                  From {photo.source}
                </p>
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

  return mounted ? createPortal(overlay, document.body) : null
}
