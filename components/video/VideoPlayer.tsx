// components/video/VideoPlayer.tsx
// Server Component - source abstraction boundary.
// Switches on video.source to render the correct platform player.
// No 'use client' needed - delegates to YouTubePlayer or VimeoPlayer (both Server Components).
// Adding a new platform: add one branch here + create a new player component.
import type { Video } from '@/lib/types'
import YouTubePlayer from '@/components/video/YouTubePlayer'
import VimeoPlayer from '@/components/video/VimeoPlayer'

interface VideoPlayerProps {
  video: Video
}

export default function VideoPlayer({ video }: VideoPlayerProps) {
  if (video.source === 'youtube') {
    return <YouTubePlayer videoId={video.sourceId} title={video.title} />
  }
  if (video.source === 'vimeo') {
    return <VimeoPlayer videoId={video.sourceId} title={video.title} />
  }
  // TypeScript exhaustiveness guard - Zod enforces the enum at load time,
  // but this makes future additions visible at compile time.
  throw new Error(`Unknown video source: ${(video as { source: string }).source}`)
}
