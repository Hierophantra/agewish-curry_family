// components/ui/StarMark.tsx
// Server Component - no 'use client'. Wraps next/image referencing the brand PNG.
// The PNG already contains: navy-bordered circle + gold 8-pointed star.
// aria-hidden="true" because this is decorative - not informational content.
// Three appearances per page: TopNav (size=36), Hero (size=56), Footer (size=28).
import Image from 'next/image'

interface StarMarkProps {
  size?: number
  className?: string
}

export default function StarMark({ size = 20, className = '' }: StarMarkProps) {
  return (
    <Image
      src="/images/aw-symbol-2x.png"
      alt=""
      width={size}
      height={size}
      className={className}
      priority={size >= 36}
      aria-hidden="true"
    />
  )
}
