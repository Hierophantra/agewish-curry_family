// components/video/YouTubePlayer.tsx
// Server Component - thin wrapper around the YouTubeFacade client island.
//
// Earlier versions used @next/third-parties YouTubeEmbed. That component
// hardcoded the hqdefault.jpg thumbnail (4:3 with black bars). We replaced
// it with YouTubeFacade, which uses maxresdefault.jpg (true 16:9, up to
// 1280x720) with an automatic hqdefault.jpg fallback.
//
// The optional `interactive` flag is forwarded to the facade. When false,
// the facade renders a static thumbnail + decorative play button (no inner
// button, no click handler). Used when a parent owns the click - e.g.
// VideoCard inside a lightbox grid, so the card opens the lightbox without
// also autoplaying an inline iframe.
import YouTubeFacade from '@/components/video/YouTubeFacade'

interface YouTubePlayerProps {
  videoId: string
  title: string
  interactive?: boolean
}

export default function YouTubePlayer({ videoId, title, interactive = true }: YouTubePlayerProps) {
  return <YouTubeFacade videoId={videoId} title={title} interactive={interactive} />
}
