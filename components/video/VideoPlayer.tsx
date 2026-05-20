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
  /**
   * When false, the inner player renders as a static thumbnail with a
   * decorative play button - no click handler, no iframe load. Use this
   * when a parent owns the click (e.g. VideoCard inside a lightbox grid)
   * so the inline player does not autoplay alongside the lightbox.
   * Defaults to true (plays in place when clicked).
   */
  interactive?: boolean
}

export default function VideoPlayer({ video, interactive = true }: VideoPlayerProps) {
  if (video.source === 'youtube') {
    return <YouTubePlayer videoId={video.sourceId} title={video.title} interactive={interactive} />
  }
  if (video.source === 'vimeo') {
    // Vimeo player is a static iframe and does not autoplay on render, so
    // the dual-playback problem does not apply. The interactive flag is
    // accepted but ignored for Vimeo until we add a Vimeo facade.
    return <VimeoPlayer videoId={video.sourceId} title={video.title} />
  }
  // TypeScript exhaustiveness guard - Zod enforces the enum at load time,
  // but this makes future additions visible at compile time.
  throw new Error(`Unknown video source: ${(video as { source: string }).source}`)
}
