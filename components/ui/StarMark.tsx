// components/ui/StarMark.tsx
// Server Component — no 'use client'. Inline SVG needs no JavaScript or interactivity.
// Three appearances per page: TopNav (size=14), Hero (size=36), Footer (size=20).
// aria-hidden="true" because this is decorative — not informational content.
import { cn } from '@/lib/utils'

interface StarMarkProps {
  size?: number      // px — use 14 (nav), 36 (hero), 20 (footer)
  className?: string
}

// Generates the SVG path for a regular 7-pointed star (heptagram).
// outerR: outer point radius; innerR: inner valley radius; points: 7
// Geometry: 14 total points alternating outer/inner, starting from 12 o'clock.
// Inner radius ratio ~0.45 produces an aesthetically balanced star.
function generateStarPath(outerR: number, innerR: number, points: number): string {
  const step = Math.PI / points // angle increment between outer and inner point
  const parts: string[] = []

  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR
    // Subtract Math.PI / 2 to start from the top (12 o'clock position)
    const angle = i * step - Math.PI / 2
    const x = outerR + r * Math.cos(angle)
    const y = outerR + r * Math.sin(angle)
    parts.push(i === 0 ? `M ${x.toFixed(3)} ${y.toFixed(3)}` : `L ${x.toFixed(3)} ${y.toFixed(3)}`)
  }

  return parts.join(' ') + ' Z'
}

export default function StarMark({ size = 20, className }: StarMarkProps) {
  const outerR = size / 2
  const innerR = outerR * 0.45 // Standard heptagram inner radius ratio
  const d = generateStarPath(outerR, innerR, 7)

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      aria-hidden="true"
      className={cn(className)}
    >
      <path d={d} fill="#E8A91F" />
    </svg>
  )
}
