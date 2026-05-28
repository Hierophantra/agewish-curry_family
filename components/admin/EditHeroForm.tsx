'use client'
// components/admin/EditHeroForm.tsx
// Client component - editor for the home page hero rotator config.
//
// For each image in public/images/hero/:
//   - Enabled toggle (off without deleting the file)
//   - Opacity slider (0-100%)
//   - Horizontal focal point slider (0-100%, default 50% = center)
//   - Vertical focal point slider (0-100%, default 50% = center)
//   - Live preview thumbnail showing how the image renders at current settings
//
// Global controls:
//   - Rotation interval (seconds between cross-fades)
//   - Transition duration (cross-fade speed in seconds)
//
// Save -> POST /api/admin/hero with the full config. The API commits
// content/hero.json via GitHub and Vercel rebuilds within ~90s.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Hero, HeroImage } from '@/lib/types'

interface Props {
  initial: Hero
  // Images discovered in the public/images/hero/ folder that don't yet have a
  // config entry. The form treats them as opt-in additions with sensible defaults.
  newlyDiscovered: string[]
}

// Convert "50% 30%" / "center" / "top" into { x, y } in percentage form
// for the sliders. Default to center when not parseable.
function parseObjectPosition(pos: string): { x: number; y: number } {
  if (!pos || pos === 'center') return { x: 50, y: 50 }
  const keywordX: Record<string, number> = { left: 0, center: 50, right: 100 }
  const keywordY: Record<string, number> = { top: 0, center: 50, bottom: 100 }
  const parts = pos.trim().split(/\s+/)
  // Single keyword like "top" - applies to Y
  if (parts.length === 1) {
    if (keywordY[parts[0]] !== undefined) return { x: 50, y: keywordY[parts[0]] }
    if (keywordX[parts[0]] !== undefined) return { x: keywordX[parts[0]], y: 50 }
  }
  // Two values "left top" or "30% 50%"
  if (parts.length === 2) {
    const [a, b] = parts
    const x = keywordX[a] !== undefined ? keywordX[a] : parseFloat(a)
    const y = keywordY[b] !== undefined ? keywordY[b] : parseFloat(b)
    if (!isNaN(x) && !isNaN(y)) return { x, y }
  }
  return { x: 50, y: 50 }
}

function formatObjectPosition(x: number, y: number): string {
  if (x === 50 && y === 50) return 'center'
  return `${Math.round(x)}% ${Math.round(y)}%`
}

interface FormImage extends HeroImage {
  focalX: number  // 0-100, derived from objectPosition
  focalY: number
}

function toFormImage(img: HeroImage): FormImage {
  const { x, y } = parseObjectPosition(img.objectPosition)
  return { ...img, focalX: x, focalY: y }
}

function toHeroImage(img: FormImage): HeroImage {
  const { focalX, focalY, ...rest } = img
  return { ...rest, objectPosition: formatObjectPosition(focalX, focalY) }
}

export default function EditHeroForm({ initial, newlyDiscovered }: Props) {
  const router = useRouter()
  const [rotationSec, setRotationSec] = useState(initial.rotationMs / 1000)
  const [transitionSec, setTransitionSec] = useState(initial.transitionMs / 1000)
  const [images, setImages] = useState<FormImage[]>(initial.images.map(toFormImage))
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  function updateImage(idx: number, patch: Partial<FormImage>) {
    setImages((prev) => prev.map((img, i) => (i === idx ? { ...img, ...patch } : img)))
    if (status === 'saved') setStatus('idle')
  }

  function moveImage(idx: number, dir: -1 | 1) {
    setImages((prev) => {
      const next = [...prev]
      const target = idx + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next
    })
    if (status === 'saved') setStatus('idle')
  }

  function removeImage(idx: number) {
    if (!confirm('Remove this image from the rotation? The file in public/images/hero/ stays on disk - this just removes the config entry.')) return
    setImages((prev) => prev.filter((_, i) => i !== idx))
    if (status === 'saved') setStatus('idle')
  }

  function addDiscoveredImage(src: string) {
    setImages((prev) => [
      ...prev,
      {
        src,
        opacity: 0.22,
        objectPosition: 'center',
        enabled: true,
        focalX: 50,
        focalY: 50,
      },
    ])
    if (status === 'saved') setStatus('idle')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('saving')
    setErrorMessage(null)

    const body: Hero = {
      rotationMs: Math.round(rotationSec * 1000),
      transitionMs: Math.round(transitionSec * 1000),
      images: images.map(toHeroImage),
    }

    try {
      const res = await fetch('/api/admin/hero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `${res.status} ${res.statusText}`)
      }
      setStatus('saved')
      router.refresh()
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : String(err))
    }
  }

  const labelClass = 'eyebrow text-quiet text-[10px]'
  const helpClass = 'text-quiet font-serif italic text-xs mt-1'
  const sliderClass = 'w-full accent-navy'
  const isDisabled = status === 'saving'

  // Files discovered in the folder that aren't yet in the config
  const newPaths = newlyDiscovered.filter((p) => !images.some((img) => img.src === p))

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-10">

      {/* Global timing controls */}
      <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-6 surface-card-static p-6">
        <legend className="sr-only">Timing</legend>

        <label className="flex flex-col gap-2">
          <span className={labelClass}>Rotation interval ({rotationSec.toFixed(1)} seconds)</span>
          <input
            type="range"
            min={2}
            max={30}
            step={0.5}
            value={rotationSec}
            onChange={(e) => { setRotationSec(parseFloat(e.target.value)); if (status === 'saved') setStatus('idle') }}
            disabled={isDisabled}
            className={sliderClass}
          />
          <span className={helpClass}>How long each image stays visible before transitioning.</span>
        </label>

        <label className="flex flex-col gap-2">
          <span className={labelClass}>Transition duration ({transitionSec.toFixed(1)} seconds)</span>
          <input
            type="range"
            min={0.2}
            max={5}
            step={0.1}
            value={transitionSec}
            onChange={(e) => { setTransitionSec(parseFloat(e.target.value)); if (status === 'saved') setStatus('idle') }}
            disabled={isDisabled}
            className={sliderClass}
          />
          <span className={helpClass}>How long the cross-fade takes between images.</span>
        </label>
      </fieldset>

      {/* Per-image controls */}
      <div className="flex flex-col gap-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-navy text-2xl">Hero images</h2>
          <p className="text-quiet text-sm">{images.length} {images.length === 1 ? 'image' : 'images'} in rotation</p>
        </div>

        {images.length === 0 && (
          <p className="font-serif italic text-muted text-base surface-card-static p-6">
            No hero images configured. Add files to <code className="font-sans text-sm text-navy">public/images/hero/</code> and they will appear below.
          </p>
        )}

        {images.map((img, idx) => (
          <article key={img.src + idx} className="surface-card-static p-6 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
            {/* Live preview - actual rendered look at current settings */}
            <div>
              <div className="surface-inset border border-[color:var(--color-border)] aspect-video overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.src}
                  alt=""
                  className="w-full h-full"
                  style={{
                    opacity: img.opacity,
                    objectFit: 'cover',
                    objectPosition: formatObjectPosition(img.focalX, img.focalY),
                  }}
                />
              </div>
              <p className="text-quiet text-xs mt-2 font-mono truncate" title={img.src}>{img.src}</p>
              <div className="flex items-center gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => moveImage(idx, -1)}
                  disabled={idx === 0 || isDisabled}
                  className="text-xs text-muted hover:text-navy disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Move up"
                >
                  {'↑ Up'}
                </button>
                <button
                  type="button"
                  onClick={() => moveImage(idx, 1)}
                  disabled={idx === images.length - 1 || isDisabled}
                  className="text-xs text-muted hover:text-navy disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Move down"
                >
                  {'↓ Down'}
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  disabled={isDisabled}
                  className="text-xs text-red-600 hover:text-red-800 ml-auto disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Remove
                </button>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-5">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={img.enabled}
                  onChange={(e) => updateImage(idx, { enabled: e.target.checked })}
                  disabled={isDisabled}
                  className="w-4 h-4 accent-navy"
                />
                <span className="font-sans text-sm text-navy">
                  {img.enabled ? 'Included in rotation' : 'Hidden from rotation'}
                </span>
              </label>

              <label className="flex flex-col gap-2">
                <span className={labelClass}>Opacity ({Math.round(img.opacity * 100)}%)</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={img.opacity}
                  onChange={(e) => updateImage(idx, { opacity: parseFloat(e.target.value) })}
                  disabled={isDisabled || !img.enabled}
                  className={sliderClass}
                />
                <span className={helpClass}>How visible the image is behind the hero text. Lower values let the typography dominate.</span>
              </label>

              <label className="flex flex-col gap-2">
                <span className={labelClass}>Horizontal focal point ({Math.round(img.focalX)}%)</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={img.focalX}
                  onChange={(e) => updateImage(idx, { focalX: parseFloat(e.target.value) })}
                  disabled={isDisabled || !img.enabled}
                  className={sliderClass}
                />
                <span className={helpClass}>0 favors the left edge of the photo; 100 favors the right.</span>
              </label>

              <label className="flex flex-col gap-2">
                <span className={labelClass}>Vertical focal point ({Math.round(img.focalY)}%)</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={img.focalY}
                  onChange={(e) => updateImage(idx, { focalY: parseFloat(e.target.value) })}
                  disabled={isDisabled || !img.enabled}
                  className={sliderClass}
                />
                <span className={helpClass}>0 favors the top of the photo; 100 favors the bottom. Useful for portrait-oriented images.</span>
              </label>
            </div>
          </article>
        ))}
      </div>

      {/* Newly-discovered files (not yet in config) */}
      {newPaths.length > 0 && (
        <div className="surface-card-static p-6">
          <h2 className="font-serif text-navy text-xl mb-2">New files in /images/hero/</h2>
          <p className="text-muted text-sm mb-4">
            These files exist on disk but haven&apos;t been added to the rotation yet.
            Click to add with default settings.
          </p>
          <div className="flex flex-col gap-2">
            {newPaths.map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => addDiscoveredImage(src)}
                disabled={isDisabled}
                className="flex items-center gap-3 text-left p-3 rounded hover:bg-[color:var(--color-surface-subtle)] transition-colors"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="w-16 h-12 object-cover rounded border border-[color:var(--color-border)]" />
                <span className="font-mono text-xs text-navy flex-1 truncate">{src}</span>
                <span className="eyebrow text-gold-deep text-[10px]">Add</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Save bar */}
      <div className="sticky bottom-0 -mx-7 px-7 py-4 bg-[color:var(--color-ivory)]/90 backdrop-blur border-t border-[color:var(--color-border)] flex items-center gap-4">
        <button
          type="submit"
          disabled={isDisabled}
          className="bg-navy text-white px-6 py-2.5 rounded font-sans text-base hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        >
          {status === 'saving' ? 'Saving...' : 'Save hero config'}
        </button>
        {status === 'saved' && (
          <p className="font-serif italic text-gold-deep text-sm">
            Saved. The live site will update in about 90 seconds.
          </p>
        )}
        {status === 'error' && (
          <p className="font-serif italic text-red-600 text-sm">
            Error: {errorMessage}
          </p>
        )}
      </div>
    </form>
  )
}
