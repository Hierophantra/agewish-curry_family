'use client'
// components/home/HeroBackdrop.tsx
// Client island - subtle slow-rotating background images for the hero section.
//
// Reads from a hardcoded list of files in public/images/hero/. To swap or
// extend, drop new files into that folder and update the IMAGES array below.
//
// UX:
//   - Cross-fade between images every ~8 seconds (slow on purpose)
//   - 2.2s ease-in-out transition - reverent, not snappy
//   - Photos render at 22% opacity over the ivory page background - the
//     family is visible behind the title without competing with it for
//     focus
//   - A vertical ivory gradient overlay keeps the top (eyebrow + star) and
//     bottom (subtitle + attribution) clean for typography
//   - Respects prefers-reduced-motion: shows only the first image, no
//     rotation, no transitions
//
// Uses next/image with `fill` + `priority` on the first image for the
// best initial paint. Subsequent images load naturally as the rotation
// gets to them.
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useReducedMotion } from 'motion/react'

const IMAGES: Array<{ src: string }> = [
  { src: '/images/hero/575A1328.jpg' },
  { src: '/images/hero/DSC00004.JPG' },
  { src: '/images/hero/IMG_2729.jpg.jpeg' },
  { src: '/images/hero/ps_2021_11_23___19_49_00.jpg' },
]

const ROTATION_MS = 8000        // how long each image stays visible
const TRANSITION_MS = 2200      // cross-fade duration
const VISIBLE_OPACITY = 0.22    // peak opacity for the active image

export default function HeroBackdrop() {
  const reduce = useReducedMotion()
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (reduce) return
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % IMAGES.length)
    }, ROTATION_MS)
    return () => clearInterval(id)
  }, [reduce])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {IMAGES.map((img, i) => {
        const isActive = i === idx
        return (
          <Image
            key={img.src}
            src={img.src}
            alt=""
            fill
            priority={i === 0}
            sizes="100vw"
            className="object-cover transition-opacity ease-in-out"
            style={{
              opacity: isActive ? VISIBLE_OPACITY : 0,
              transitionDuration: `${TRANSITION_MS}ms`,
            }}
          />
        )
      })}

      {/* Vertical ivory overlay - keeps the top and bottom of the hero clean
          so the eyebrow, star, and attribution typography don't sit over a
          high-contrast photo region. Middle band is more transparent so the
          family photo can read through behind the title. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, var(--color-ivory) 0%, color-mix(in oklab, var(--color-ivory) 55%, transparent) 38%, color-mix(in oklab, var(--color-ivory) 55%, transparent) 62%, var(--color-ivory) 100%)',
        }}
      />
    </div>
  )
}
