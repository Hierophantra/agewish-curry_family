// components/video/VimeoThumb.tsx
// 'use client' - owns the broken-image fallback state.
//
// Vimeo doesn't expose a simple maxresdefault-style URL like YouTube does.
// The real frame thumbnail has to be discovered via the OEmbed API and the
// resulting CDN URL contains a hash that can rotate. Our build pipeline
// bakes the OEmbed thumbnail_url into each Vimeo video's record (the
// thumbnailUrl field on Video) - this component just renders it.
//
// If the cached URL goes stale (returns 404 or fails to load), we fall back
// to a small Vimeo-blue colored panel so the card never shows a broken image.
'use client'

import { useState } from 'react'

interface VimeoThumbProps {
  src: string
  alt?: string
  className?: string
}

export default function VimeoThumb({ src, alt = '', className = '' }: VimeoThumbProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    // Cached thumbnail URL went stale. Show a branded archival fallback
    // (small italic line on the inset color) rather than a broken image or
    // a flat navy panel - a fallback should still feel authored.
    return (
      <div
        className={`grid place-items-center bg-[linear-gradient(135deg,var(--color-ivory-deep),var(--color-inset))] ${className}`}
      >
        <span className="font-serif italic text-quiet text-xs">
          Film preview unavailable
        </span>
      </div>
    )
  }

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  )
}
