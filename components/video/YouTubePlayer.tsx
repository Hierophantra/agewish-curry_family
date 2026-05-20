// components/video/YouTubePlayer.tsx
// Server Component — wraps @next/third-parties YouTubeEmbed (deferred iframe facade).
// The iframe does NOT load on page render; it loads only when the user clicks play.
// No 'use client' needed — YouTubeEmbed handles its own interactivity internally.
import { YouTubeEmbed } from '@next/third-parties/google'

interface YouTubePlayerProps {
  videoId: string
  title: string
}

export default function YouTubePlayer({ videoId, title }: YouTubePlayerProps) {
  // YouTubeEmbed renders a <lite-youtube> web component whose intrinsic size is
  // capped at 720×405 (max-width: 720px in its built-in stylesheet). Without the
  // arbitrary-selector overrides below, wider parent containers show ivory
  // padding around the embed and the thumbnail facade doesn't fill the card.
  // The same selectors apply to the inner thumbnail <img> so the preview image
  // covers the whole 16:9 area before the user clicks play.
  return (
    <div
      className={[
        'relative aspect-video bg-ivory overflow-hidden',
        '[&_lite-youtube]:!w-full',
        '[&_lite-youtube]:!h-full',
        '[&_lite-youtube]:!max-w-none',
        '[&_lite-youtube>img]:!w-full',
        '[&_lite-youtube>img]:!h-full',
        '[&_lite-youtube>img]:!object-cover',
        '[&_iframe]:!w-full',
        '[&_iframe]:!h-full',
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
