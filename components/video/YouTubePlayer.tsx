// components/video/YouTubePlayer.tsx
// Server Component - thin wrapper around the YouTubeFacade client island.
//
// Earlier versions used @next/third-parties YouTubeEmbed (a wrapper for the
// lite-youtube web component). That component hardcoded the hqdefault.jpg
// thumbnail, which is 4:3 with black bars - cropping the top/bottom of the
// actual video in our 16:9 card. We replaced it with YouTubeFacade, which
// pulls the maxresdefault.jpg (true 16:9, up to 1280x720) with an automatic
// hqdefault.jpg fallback for videos that lack an HD upload.
//
// Behavior is otherwise the same as before: only the thumbnail image loads
// on first paint, and the iframe is mounted only after the user clicks play.
import YouTubeFacade from '@/components/video/YouTubeFacade'

interface YouTubePlayerProps {
  videoId: string
  title: string
}

export default function YouTubePlayer({ videoId, title }: YouTubePlayerProps) {
  return <YouTubeFacade videoId={videoId} title={title} />
}
