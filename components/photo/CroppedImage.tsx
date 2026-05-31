'use client'
// components/photo/CroppedImage.tsx
// Shows a normalized sub-rectangle of an image (a person's crop region) zoomed
// to fill a frame — no separate image file is generated. Used only in
// per-person contexts (tree summary panel, profile page) so a group photo can
// display "just this person". The gallery + lightbox still show the full image.
//
// Pure CSS: loads the image, reads its natural size, measures the frame, then
// scales + translates so the region covers the frame (centered). Works for any
// photo (incl. ones tagged before this) since it derives everything at runtime.
import { useEffect, useRef, useState } from 'react'
import type { PhotoRegion } from '@/lib/types'

interface Props {
  src: string
  region: Pick<PhotoRegion, 'x' | 'y' | 'w' | 'h'>
  alt?: string
  className?: string
}

export default function CroppedImage({ src, region, alt = '', className = '' }: Props) {
  const frameRef = useRef<HTMLDivElement>(null)
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null)
  const [frame, setFrame] = useState<{ w: number; h: number } | null>(null)

  useEffect(() => {
    const el = frameRef.current
    if (!el) return
    const update = () => setFrame({ w: el.clientWidth, h: el.clientHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const ready = nat && frame && region.w > 0 && region.h > 0 && frame.w > 0 && frame.h > 0

  let imgStyle: React.CSSProperties = { opacity: 0, position: 'absolute', top: 0, left: 0 }
  if (ready) {
    const rw = region.w * nat.w
    const rh = region.h * nat.h
    const rx = region.x * nat.w
    const ry = region.y * nat.h
    const scale = Math.max(frame.w / rw, frame.h / rh) // cover the frame with the region
    const tx = -rx * scale + (frame.w - rw * scale) / 2
    const ty = -ry * scale + (frame.h - rh * scale) / 2
    imgStyle = {
      position: 'absolute',
      top: 0,
      left: 0,
      width: nat.w * scale,
      height: nat.h * scale,
      maxWidth: 'none',
      transform: `translate(${tx}px, ${ty}px)`,
      opacity: 1,
      transition: 'opacity 200ms ease-out',
    }
  }

  return (
    <div ref={frameRef} className={`relative overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        onLoad={(e) => setNat({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
        style={imgStyle}
      />
    </div>
  )
}
