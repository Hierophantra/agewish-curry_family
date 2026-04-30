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
  return (
    <div className="relative aspect-video bg-ivory overflow-hidden">
      <YouTubeEmbed
        videoid={videoId}
        playlabel={title}
        params="modestbranding=1"
      />
    </div>
  )
}
