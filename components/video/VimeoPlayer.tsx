// components/video/VimeoPlayer.tsx
// Server Component - thin wrapper around the VimeoFacade client island.
//
// Earlier versions mounted a Vimeo iframe directly. With ~60 videos per
// playlist page, that meant 60 simultaneous iframe loads (and ~200kB of
// Vimeo player code per card). Now defers to VimeoFacade which loads only
// a thumbnail on first paint and mounts the iframe on click.
//
// The optional `interactive` flag is forwarded to the facade - when false
// the facade renders a static thumbnail + decorative play button (no inner
// button, no click handler) so a parent like VideoCard can own the click.
import VimeoFacade from '@/components/video/VimeoFacade'

interface VimeoPlayerProps {
  videoId: string
  title: string
  thumbnailUrl?: string
  interactive?: boolean
}

export default function VimeoPlayer({ videoId, title, thumbnailUrl, interactive = true }: VimeoPlayerProps) {
  return <VimeoFacade videoId={videoId} title={title} thumbnailUrl={thumbnailUrl} interactive={interactive} />
}
