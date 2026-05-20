// app/(protected)/videos/page.tsx
// Protected page - videos landing. Shows every playlist as a cover card.
// No featured section: the home page is the hub, and the videos page is the
// full catalog of playlists.
// Server Component: no 'use client' - PlaylistGrid handles its own data fetching.
import PlaylistGrid from '@/components/video/PlaylistGrid'

export default function VideosPage() {
  return (
    <main className="py-11 px-7 md:px-11 lg:px-15">
      {/* Page header */}
      <header className="mb-9">
        <p className="eyebrow text-gold-deep mb-3">FAMILY ARCHIVE</p>
        <h1 className="font-serif text-navy text-4xl mb-2">Videos</h1>
        <p className="text-muted text-base">Home movies and recordings, organized by playlist.</p>
      </header>

      {/* All playlists as cover cards */}
      <PlaylistGrid />
    </main>
  )
}
