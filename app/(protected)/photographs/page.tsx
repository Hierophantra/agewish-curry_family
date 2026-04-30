// app/(protected)/photographs/page.tsx
// Protected page — renders the FAMILY ARCHIVE page header and the photo grid.
// Server Component: no 'use client' — PhotoGrid handles its own data fetching.
import PhotoGrid from '@/components/gallery/PhotoGrid'

export default function PhotographsPage() {
  return (
    <main className="py-11 px-7 md:px-11 lg:px-15">
      {/* Page header */}
      <header className="mb-9">
        <p className="eyebrow text-quiet mb-3">FAMILY ARCHIVE</p>
        <h1 className="font-serif text-navy text-3xl mb-2">Photographs</h1>
        <p className="text-muted text-sm">
          Scanned and curated from the family archive.
        </p>
      </header>

      {/* Photo grid — handles its own empty state */}
      <PhotoGrid />
    </main>
  )
}
