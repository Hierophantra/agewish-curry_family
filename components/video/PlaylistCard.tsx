// components/video/PlaylistCard.tsx
// Server Component — renders one playlist cover card with YouTube thumbnail.
// Mirrors CollectionCard but uses video thumbnail instead of a photo.
// YouTube thumbnails: https://img.youtube.com/vi/{sourceId}/hqdefault.jpg
//   (img.youtube.com is whitelisted in next.config.mjs images.remotePatterns)
// Vimeo thumbnails require an API call — falls back to a solid navy background.
// D-07 (inherited): Hover lift (-translate-y-0.5 + shadow-md) on the card.
import Image from 'next/image'
import Link from 'next/link'
import type { Playlist } from '@/lib/types'
import { getVideos } from '@/lib/content'

interface PlaylistCardProps {
  playlist: Playlist
  videoCount: number
}

export default function PlaylistCard({ playlist, videoCount }: PlaylistCardProps) {
  // Resolve cover video to get its source info for thumbnail generation.
  const cover = getVideos().find((v) => v.id === playlist.coverVideoId)

  // Build thumbnail URL only for YouTube; Vimeo requires an API call (fallback to navy bg).
  const isYouTube = cover?.source === 'youtube'
  const thumbUrl = isYouTube
    ? `https://img.youtube.com/vi/${cover!.sourceId}/hqdefault.jpg`
    : null

  return (
    <Link
      href={`/videos/${playlist.id}`}
      className="group relative block aspect-video overflow-hidden rounded-lg border hairline bg-navy transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* Cover thumbnail — YouTube hqdefault; fills card with subtle hover zoom */}
      {thumbUrl ? (
        <Image
          src={thumbUrl}
          alt=""
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
      ) : (
        <div className="absolute inset-0 bg-navy" />
      )}

      {/* Gradient overlay: dark at bottom, fades upward — ensures text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/30 to-transparent" />

      {/* Play indicator — centered, subtle circle with gold triangle */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-14 h-14 rounded-full bg-white/15 border-[1.25px] border-white flex items-center justify-center group-hover:bg-white/25 group-hover:scale-105 transition-all">
          <svg viewBox="0 0 12 12" width="14" height="14" fill="none" aria-hidden="true">
            <path d="M3 2 L9 6 L3 10 Z" fill="#E8A91F" />
          </svg>
        </div>
      </div>

      {/* Card metadata: title + subtitle + video count */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <h3 className="font-serif text-white text-xl leading-tight mb-1">{playlist.title}</h3>
        {playlist.subtitle && (
          <p className="font-serif italic text-white/85 text-sm">{playlist.subtitle}</p>
        )}
        <p className="eyebrow text-white/60 mt-2 text-[10px]">
          {videoCount} {videoCount === 1 ? 'video' : 'videos'}
        </p>
      </div>
    </Link>
  )
}
