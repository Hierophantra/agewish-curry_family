// app/(protected)/videos/page.tsx
// Protected page — videos landing with featured section + playlist grid.
// D-26 (video variant): Replaced flat VideoGrid with PlaylistGrid — /videos shows playlist covers.
// Featured section shows up to 2 featured videos above the playlist grid.
// Server Component: no 'use client' — PlaylistGrid and VideoCard handle their own data fetching.
import { getFeaturedVideos } from '@/lib/content'
import PlaylistGrid from '@/components/video/PlaylistGrid'
import VideoCard from '@/components/video/VideoCard'

export default function VideosPage() {
  const featured = getFeaturedVideos()

  return (
    <main className="py-11 px-7 md:px-11 lg:px-15">
      {/* Page header */}
      <header className="mb-9">
        <p className="eyebrow text-quiet mb-3">FAMILY ARCHIVE</p>
        <h1 className="font-serif text-navy text-3xl mb-2">Videos</h1>
        <p className="text-muted text-sm">Home movies and recordings, organized by playlist.</p>
      </header>

      {/* Featured section — only shown when featured videos exist */}
      {featured.length > 0 && (
        <section className="mb-14">
          <h2 className="eyebrow text-gold-deep mb-5 text-xs">FEATURED</h2>
          <div className={`grid gap-7 ${featured.length === 1 ? 'grid-cols-1 max-w-3xl' : 'grid-cols-1 md:grid-cols-2'}`}>
            {featured.slice(0, 2).map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </div>
        </section>
      )}

      {/* Playlist grid — all playlists as cover cards */}
      <section>
        <h2 className="eyebrow text-quiet mb-5 text-xs">ALL PLAYLISTS</h2>
        <PlaylistGrid />
      </section>
    </main>
  )
}
