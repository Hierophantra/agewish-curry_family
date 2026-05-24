// components/video/VimeoFacade.tsx
// 'use client' - owns the loaded-state toggle when interactive.
//
// Click-to-play facade for Vimeo videos. Mirrors YouTubeFacade.
//
// Why not just render the iframe directly:
//   The /videos page can have 60+ video cards. If each one mounted a
//   Vimeo iframe on first paint, the page would download ~200kB of
//   Vimeo player code per card. The facade defers that cost - only the
//   thumbnail image loads up front; the iframe is mounted only after
//   the user clicks play.
//
// Two render modes (matches YouTubeFacade):
//
//   interactive=true (default): clicking the facade swaps to a live
//     iframe that autoplays.
//
//   interactive=false: renders a purely decorative thumbnail with a
//     play button overlay (no <button>, no click handler). Used when
//     a parent owns the click (e.g. VideoCard inside PlaylistVideoGrid
//     opens a lightbox).
'use client'

import { useState } from 'react'
import VimeoThumb from '@/components/video/VimeoThumb'

interface VimeoFacadeProps {
  videoId: string
  title: string
  /** Cached thumbnail URL from Vimeo OEmbed (baked into videos.json). */
  thumbnailUrl?: string
  /**
   * When true (default) the facade is a button that swaps to a live
   * iframe on click. When false it's a static thumbnail + play decoration -
   * use when a parent owns the click.
   */
  interactive?: boolean
}

export default function VimeoFacade({ videoId, title, thumbnailUrl, interactive = true }: VimeoFacadeProps) {
  const [loaded, setLoaded] = useState(false)

  if (interactive && loaded) {
    // Iframe takes over once the user clicks play.
    // allow="autoplay; ..." lets the iframe play immediately since the
    // click counts as a user gesture (browser requirement).
    return (
      <div className="relative aspect-video bg-black overflow-hidden">
        <iframe
          src={`https://player.vimeo.com/video/${videoId}?autoplay=1&title=0&byline=0&portrait=0`}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
          style={{ border: 0 }}
        />
      </div>
    )
  }

  // Shared visual: thumbnail + gradient + play button. Identical to YouTube
  // facade's pre-click chrome so the two platforms read the same in the grid.
  const visual = (
    <>
      {thumbnailUrl ? (
        <VimeoThumb
          src={thumbnailUrl}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        // No cached thumbnail - use a quiet navy panel so the play button
        // still has the same affordance.
        <div className="absolute inset-0 bg-navy" />
      )}

      {/* Subtle gradient at the bottom for play-button contrast */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      {/* Vimeo-blue play button (matches Vimeo's own player on hover). */}
      <span
        className="
          absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
          flex items-center justify-center
          w-16 h-11 md:w-20 md:h-14
          rounded-lg bg-[#212121]/85
          transition-all duration-200
          group-hover:bg-[#00adef] group-hover:scale-110
          group-focus-visible:bg-[#00adef] group-focus-visible:scale-110
        "
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" className="w-7 h-7 md:w-9 md:h-9 fill-white">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </>
  )

  if (!interactive) {
    return (
      <div className="relative aspect-video w-full overflow-hidden bg-black group">
        {visual}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setLoaded(true)}
      aria-label={`Play video: ${title}`}
      className="
        relative aspect-video w-full overflow-hidden bg-black
        group cursor-pointer
        focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2
      "
    >
      {visual}
    </button>
  )
}
