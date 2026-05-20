// components/video/YouTubeThumb.tsx
// 'use client' - owns the maxres -> hqdefault fallback state.
//
// Reusable client island for any place that needs a high-quality YouTube
// thumbnail (PlaylistCard, future surfaces). YouTube's hqdefault.jpg is
// 4:3 with black bars; maxresdefault.jpg is true 16:9 up to 1280x720 but
// returns a placeholder for videos that weren't uploaded at HD. On image
// error we swap to hqdefault, which is always present.
//
// Uses a plain <img> rather than next/image because next/image's onError
// hook fires AFTER the broken image has already painted briefly. A plain
// <img> with onError lets us swap atomically before any flash.
'use client'

import { useState } from 'react'

interface YouTubeThumbProps {
  videoId: string
  alt?: string
  className?: string
}

export default function YouTubeThumb({ videoId, alt = '', className = '' }: YouTubeThumbProps) {
  const [src, setSrc] = useState(`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`)
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => {
        if (!src.endsWith('hqdefault.jpg')) {
          setSrc(`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`)
        }
      }}
      className={className}
    />
  )
}
