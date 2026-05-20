// components/video/YouTubePlayer.tsx
// Server Component - wraps @next/third-parties YouTubeEmbed (deferred iframe facade).
// The iframe does NOT load on page render; it loads only when the user clicks play.
// No 'use client' needed - YouTubeEmbed handles its own interactivity internally.
import { YouTubeEmbed } from '@next/third-parties/google'

interface YouTubePlayerProps {
  videoId: string
  title: string
}

export default function YouTubePlayer({ videoId, title }: YouTubePlayerProps) {
  // YouTubeEmbed renders a <lite-youtube> web component whose intrinsic size is
  // capped at 720×405 (max-width: 720px). Without the overrides below, wider
  // parent containers show ivory padding around the embed and the thumbnail
  // facade doesn't fill the card.
  //
  // CRITICAL: do NOT force !h-full on <lite-youtube> - the element uses its own
  // padding-top: 56.25% aspect-ratio trick to size itself. Setting both height:
  // 100% AND a percentage padding-top makes the absolutely-positioned iframe
  // render past the container's bottom edge, clipping the YouTube player's
  // control bar (including the fullscreen button). Let lite-youtube self-size
  // to width:100% - its built-in padding gives it the correct 16:9 height.
  //
  // The wrapper keeps aspect-video as a fallback in case lite-youtube fails
  // to load, and bg-ivory as the loading placeholder color.
  return (
    <div
      className={[
        'relative aspect-video bg-ivory overflow-hidden',
        '[&_lite-youtube]:!w-full',
        '[&_lite-youtube]:!max-w-none',
        '[&_lite-youtube>img]:!w-full',
        '[&_lite-youtube>img]:!h-full',
        '[&_lite-youtube>img]:!object-cover',
      ].join(' ')}
    >
      <YouTubeEmbed
        videoid={videoId}
        playlabel={title}
        params="modestbranding=1"
        width={1280}
        height={720}
      />
    </div>
  )
}
