// app/(protected)/videos/page.tsx
// Protected page - videos landing. Shows every playlist as a cover card.
// No featured section: the home page is the hub, and the videos page is the
// full catalog of playlists.
// Server Component: no 'use client' - PlaylistGrid handles its own data fetching.
//
// v3 visual upgrade: scaled header (text-5xl), italic serif subtitle, gold
// accent rule - matches the tree page treatment for cross-page consistency.
import PlaylistGrid from '@/components/video/PlaylistGrid'

export default function VideosPage() {
  return (
    <main className="py-14 md:py-20 px-7 md:px-11 lg:px-15">
      {/* Page header - editorial scale matching tree page */}
      <header className="mb-12 max-w-4xl">
        <div className="flex items-center gap-3 mb-5" aria-hidden="true">
          <span className="block w-10 h-px bg-gold-deep" />
          <span className="block w-1.5 h-1.5 rounded-full bg-gold" />
        </div>
        <p className="eyebrow text-gold-deep mb-4">Family archive</p>
        <h1 className="font-serif text-navy text-5xl md:text-6xl mb-4 leading-tight">
          Home movies
        </h1>
        <p className="font-serif italic text-muted text-lg md:text-xl leading-relaxed">
          Recorded moments, gathered by occasion. Birthdays, trips, holidays, dinners.
        </p>
      </header>

      {/* All playlists as cover cards */}
      <PlaylistGrid />
    </main>
  )
}
