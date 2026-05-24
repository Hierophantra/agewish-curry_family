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
    // Cached thumbnail URL went stale. Show a quiet navy panel rather than
    // a broken-image icon. The user can re-bake thumbnails via the ingest
    // script when this happens at scale.
    return <div className={`bg-navy ${className}`} />
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
