// components/video/VimeoPlayer.tsx
// Server Component - plain Vimeo iframe with lazy loading.
// No facade needed for Vimeo (no per-page-load third-party cost unlike YouTube).
// No 'use client' needed - no interactivity in this component.

interface VimeoPlayerProps {
  videoId: string
  title: string
}

export default function VimeoPlayer({ videoId, title }: VimeoPlayerProps) {
  return (
    <div className="relative aspect-video bg-ivory overflow-hidden">
      <iframe
        src={`https://player.vimeo.com/video/${videoId}`}
        title={title}
        loading="lazy"
        allow="autoplay; fullscreen; picture-in-picture"
        className="absolute inset-0 w-full h-full"
        style={{ border: 0 }}
      />
    </div>
  )
}
