// app/(protected)/films/page.tsx
// Protected page — renders the FAMILY ARCHIVE page header and the video grid.
// Server Component: no 'use client' — VideoGrid handles its own data fetching.
import VideoGrid from '@/components/video/VideoGrid'

export default function FilmsPage() {
  return (
    <main className="py-11 px-7 md:px-11 lg:px-15">
      {/* Page header */}
      <header className="mb-9">
        <p className="eyebrow text-quiet mb-3">FAMILY ARCHIVE</p>
        <h1 className="font-serif text-navy text-3xl mb-2">Films</h1>
        <p className="text-muted text-sm">
          Home movies and recordings, preserved across the decades.
        </p>
      </header>

      {/* Video grid — handles its own empty state */}
      <VideoGrid />
    </main>
  )
}
