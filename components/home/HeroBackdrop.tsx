'use client'
// components/home/HeroBackdrop.tsx
// Client island - slow-rotating background images for the hero section.
//
// Config-driven: reads rotationMs, transitionMs, and per-image opacity +
// objectPosition from props (originating in content/hero.json). The admin
// page at /admin/hero edits that config; this component just renders it.
//
// UX:
//   - Cross-fade between enabled images on the configured interval
//   - Each image has its own opacity (set per-image in admin)
//   - Each image has its own objectPosition (CSS keyword or "X% Y%") so
//     the maintainer can dial which part of the photo is in frame
//   - An ivory gradient overlay keeps the top + bottom clean for typography
//   - Respects prefers-reduced-motion: shows only the first enabled image
//     with no rotation, no transitions
//
// Uses next/image with `fill` + `priority` on the first enabled image for
// the best initial paint; later images load naturally as rotation reaches
// them.
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useReducedMotion } from 'motion/react'
import type { Hero } from '@/lib/types'

interface HeroBackdropProps {
  config: Hero
}

export default function HeroBackdrop({ config }: HeroBackdropProps) {
  const reduce = useReducedMotion()
  const visible = config.images.filter((img) => img.enabled)
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (reduce || visible.length <= 1) return
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % visible.length)
    }, config.rotationMs)
    return () => clearInterval(id)
  }, [reduce, visible.length, config.rotationMs])

  // Nothing to show - render only the gradient overlay so the hero looks
  // intentional rather than broken.
  if (visible.length === 0) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none bg-ivory" aria-hidden="true" />
    )
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {visible.map((img, i) => {
        const isActive = i === idx
        return (
          <Image
            key={img.src}
            src={img.src}
            alt=""
            fill
            priority={i === 0}
            sizes="100vw"
            className="transition-opacity ease-in-out"
            style={{
              opacity: isActive ? img.opacity : 0,
              objectFit: img.fit,
              objectPosition: img.objectPosition,
              transitionDuration: `${config.transitionMs}ms`,
            }}
          />
        )
      })}

      {/* Edge fades. Split into top + bottom layers so the bottom glow's
          strength is independently editable via Shift+E (data-edit-id +
          element opacity). The top fade blends from the translucent sticky nav;
          the bottom fade eases into the ivory hub section below. */}
      <div
        className="absolute inset-x-0 top-0 h-[22%]"
        style={{ background: 'linear-gradient(to bottom, var(--color-ivory) 0%, transparent 100%)' }}
      />
      <div
        data-edit-id="hero-bottom-glow"
        data-edit-label="Hero bottom glow"
        data-edit-kind="box"
        className="absolute inset-x-0 bottom-0 h-[22%]"
        style={{ background: 'linear-gradient(to top, var(--color-ivory) 0%, transparent 100%)' }}
      />
    </div>
  )
}
