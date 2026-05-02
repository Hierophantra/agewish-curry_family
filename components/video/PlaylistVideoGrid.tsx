// components/video/PlaylistVideoGrid.tsx
// 'use client' — owns VideoLightbox open/close state for a playlist's video grid.
// Manages lightboxIndex (null = closed, number = open at that index).
// Each VideoCard receives onClick that sets lightboxIndex, opening the lightbox.
// Renders VideoLightbox conditionally; prev/next wrap around (∞ navigation).
// Phase 16: URL state — ?video=<id> persists lightbox across refresh and enables deep links.
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import VideoCard from './VideoCard'
import VideoLightbox from '@/components/lightbox/VideoLightbox'
import type { Video } from '@/lib/types'

interface PlaylistVideoGridProps {
  videos: Video[]
}

export default function PlaylistVideoGrid({ videos }: PlaylistVideoGridProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const urlVideoId = searchParams.get('video')

  // Resolve URL param to an index. null = lightbox closed.
  function indexFromId(id: string | null): number | null {
    if (id === null) return null
    const idx = videos.findIndex((v) => v.id === id)
    return idx >= 0 ? idx : null
  }

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(
    () => indexFromId(urlVideoId)
  )

  // Sync URL → local state for back/forward browser navigation.
  // Guard: only update when the resolved index actually differs.
  useEffect(() => {
    const next = indexFromId(urlVideoId)
    if (next !== lightboxIndex) {
      setLightboxIndex(next)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlVideoId])

  if (videos.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="eyebrow text-quiet mb-3">FAMILY ARCHIVE</p>
        <h2 className="font-serif text-navy text-2xl mb-2">No videos in this playlist yet</h2>
        <p className="text-muted text-sm">Videos tagged with this playlist will appear here as they are gathered.</p>
      </div>
    )
  }

  // openVideo: push to history so back button closes the lightbox naturally.
  function openVideo(index: number) {
    const video = videos[index]
    if (!video) return
    setLightboxIndex(index)
    const params = new URLSearchParams(searchParams.toString())
    params.set('video', video.id)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  // closeVideo: replace so back button returns to the previous page, not just un-opens lightbox.
  function closeVideo() {
    setLightboxIndex(null)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('video')
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  // navigateVideo: replace so each prev/next doesn't pollute history — back button closes modal.
  function navigateVideo(index: number) {
    const video = videos[index]
    if (!video) return
    setLightboxIndex(index)
    const params = new URLSearchParams(searchParams.toString())
    params.set('video', video.id)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-7">
        {videos.map((v, i) => (
          <VideoCard key={v.id} video={v} onClick={() => openVideo(i)} />
        ))}
      </div>

      {/* Lightbox rendered conditionally so AnimatePresence exit works */}
      {lightboxIndex !== null && (
        <VideoLightbox
          videos={videos}
          currentIndex={lightboxIndex}
          onClose={closeVideo}
          onPrev={() => navigateVideo((lightboxIndex - 1 + videos.length) % videos.length)}
          onNext={() => navigateVideo((lightboxIndex + 1) % videos.length)}
        />
      )}
    </>
  )
}
