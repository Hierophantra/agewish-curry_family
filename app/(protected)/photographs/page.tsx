// app/(protected)/photographs/page.tsx
// Protected page - the FAMILY ARCHIVE collection landing page.
// D-26/D-27: Replaced flat PhotoGrid with CollectionGrid - /photographs now
// shows collection covers.
// Server Component: no 'use client' - CollectionGrid handles its own data fetching.
//
// v3 visual upgrade: scaled header matching the tree and videos pages so the
// cross-page rhythm is consistent.
import Link from 'next/link'
import CollectionGrid from '@/components/gallery/CollectionGrid'
import { getScreens } from '@/lib/content'

export default function PhotographsPage() {
  const screens = getScreens()
  return (
    <main className="py-14 md:py-20 px-7 md:px-11 lg:px-15">
      {/* Page header - editorial scale matching the tree page */}
      <header className="mb-12 max-w-4xl">
        <div className="flex items-center gap-3 mb-5" aria-hidden="true">
          <span className="block w-10 h-px bg-gold-deep" />
          <span className="block w-1.5 h-1.5 rounded-full bg-gold" />
        </div>
        <p data-edit-id="photographs-page-eyebrow" data-edit-label="Photographs · page eyebrow" data-edit-kind="text" className="eyebrow text-gold-deep mb-4">Family archive</p>
        <h1 data-edit-id="photographs-page-title" data-edit-label="Photographs · page title" data-edit-kind="text" className="font-serif text-navy text-5xl md:text-6xl mb-4 leading-tight">
          Photographs
        </h1>
        <p data-edit-id="photographs-page-subtitle" data-edit-label="Photographs · page subtitle" data-edit-kind="text" className="font-serif italic text-muted text-lg md:text-xl leading-relaxed">
          Collected memories, organized by theme.
        </p>
        {screens.photographs.showSlideshowLink && (
          <Link
            href="/slideshow"
            className="eyebrow text-gold-deep hover:text-gold transition-colors mt-6 inline-block"
          >
            Play ambient slideshow {'→'}
          </Link>
        )}
      </header>

      {/* Collection grid - replaces flat photo grid (Phase 8) */}
      <CollectionGrid />
    </main>
  )
}
