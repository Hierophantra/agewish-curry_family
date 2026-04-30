// app/(protected)/photographs/page.tsx
// Protected page — the FAMILY ARCHIVE collection landing page.
// D-26/D-27: Replaced flat PhotoGrid with CollectionGrid — /photographs now shows collection covers.
// Server Component: no 'use client' — CollectionGrid handles its own data fetching.
import CollectionGrid from '@/components/gallery/CollectionGrid'

export default function PhotographsPage() {
  return (
    <main className="py-11 px-7 md:px-11 lg:px-15">
      {/* Page header */}
      <header className="mb-9">
        <p className="eyebrow text-quiet mb-3">FAMILY ARCHIVE</p>
        <h1 className="font-serif text-navy text-3xl mb-2">Photographs</h1>
        <p className="text-muted text-sm">Collected memories, organized by theme.</p>
      </header>

      {/* Collection grid — replaces flat photo grid (Phase 8) */}
      <CollectionGrid />
    </main>
  )
}
