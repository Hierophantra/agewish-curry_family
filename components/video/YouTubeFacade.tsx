// components/video/YouTubeFacade.tsx
// 'use client' - owns the loaded-state toggle when interactive.
//
// Why we hand-rolled this instead of using @next/third-parties YouTubeEmbed:
// YouTubeEmbed wraps the lite-youtube web component, which hardcodes the
// hqdefault.jpg thumbnail. That asset is 480x360 in a 4:3 frame (YouTube pads
// the actual 16:9 footage with black bars to fit a 4:3 box), so when forced
// into our 16:9 card with object-cover the top/bottom got cropped.
//
// Two render modes:
//
//   interactive=true (default): clicking the facade swaps to a live iframe
//     that autoplays. Used wherever the player should play in place.
//
//   interactive=false: renders a purely decorative thumbnail with a play
//     button overlay (no <button>, no click handler). Used when this player
//     is nested inside a parent that owns the click (e.g. VideoCard inside
//     PlaylistVideoGrid, where the parent opens a lightbox). Without this
//     mode we'd have nested buttons and the click would both swap to an
//     iframe AND open the lightbox - two players autoplaying at once.
//
// Performance behavior matches lite-youtube: only the thumbnail image loads
// on first paint; the iframe is mounted only after the user clicks play.
'use client'

import { useState } from 'react'
import YouTubeThumb from '@/components/video/YouTubeThumb'

interface YouTubeFacadeProps {
  videoId: string
  title: string
  /**
   * When true (default), facade renders a button that swaps to an iframe on
   * click. When false, renders a static thumbnail + play-button decoration -
   * use this when a parent owns the click (e.g. opens a lightbox).
   */
  interactive?: boolean
}

export default function YouTubeFacade({ videoId, title, interactive = true }: YouTubeFacadeProps) {
  const [loaded, setLoaded] = useState(false)

  if (interactive && loaded) {
    // Iframe takes over once the user clicks play. autoplay=1 starts playback
    // immediately since the click counts as user gesture (required by browsers).
    return (
      <div className="relative aspect-video bg-black overflow-hidden">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`}
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

  // Shared visual content: thumbnail + gradient + play button. Used by both
  // render branches below so the appearance is identical regardless of mode.
  const visual = (
    <>
      <YouTubeThumb
        videoId={videoId}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Subtle gradient at the bottom for play-button contrast on light footage */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      {/* YouTube-style red play button. In interactive mode the parent button's
          group-hover/group-focus drive the hover effect; in non-interactive
          mode the play button is purely decorative (parent group handles it). */}
      <span
        className="
          absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
          flex items-center justify-center
          w-16 h-11 md:w-20 md:h-14
          rounded-lg bg-[#212121]/85
          transition-all duration-200
          group-hover:bg-[#ff0000] group-hover:scale-110
          group-focus-visible:bg-[#ff0000] group-focus-visible:scale-110
        "
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          className="w-7 h-7 md:w-9 md:h-9 fill-white"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </>
  )

  // Non-interactive mode: just a div. The parent (e.g. VideoCard's outer
  // button) owns the click - no nested button, no event bubbling surprises.
  if (!interactive) {
    return (
      <div className="relative aspect-video w-full overflow-hidden bg-black group">
        {visual}
      </div>
    )
  }

  // Interactive mode: button element gives us free keyboard activation
  // (Enter/Space) and focus ring; click swaps to the iframe.
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
