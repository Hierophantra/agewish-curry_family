// app/(protected)/page.tsx
// Home page — Server Component.
// Composition: Hero (bg-white) → Tree preview (bg-ivory) → Photos preview (bg-white) → Videos preview (bg-ivory).
// Ivory alternation per D-34. No 'use client' — all previews are server-rendered.
// Star motif rule: TopNav = star 1, Hero = star 2, Footer = star 3. No extra stars in preview sections.
import Link from 'next/link'
import Hero from '@/components/home/Hero'
import PhotoCard from '@/components/gallery/PhotoCard'
import VideoCard from '@/components/video/VideoCard'
import { getPeople, getPhotos, getFeaturedVideos } from '@/lib/content'

export default function HomePage() {
  const people = getPeople()
  const photos = getPhotos()
  const featured = getFeaturedVideos()

  // Patriarch detection: person with no parentIds (generic — works with any root person)
  const patriarch = people.find((p) => (p.parentIds ?? []).length === 0)

  // First generation = direct children of the patriarch
  const firstGen = patriarch
    ? people.filter((p) => (p.parentIds ?? []).includes(patriarch.id))
    : []

  // Latest 6 photos sorted by date descending
  const latestPhotos = [...photos]
    .sort((a, b) => {
      const da = a.date ?? a.dateTaken ?? ''
      const db = b.date ?? b.dateTaken ?? ''
      return db.localeCompare(da)
    })
    .slice(0, 6)

  return (
    <>
      <Hero />

      {/* Family tree preview — bg-ivory (alternates with white hero above) */}
      <section className="bg-ivory border-t border-stone py-14 px-7 md:px-11">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-baseline justify-between mb-7">
            <div>
              <p className="eyebrow text-gold-deep mb-2">FAMILY TREE</p>
              <h2 className="font-serif text-navy text-3xl">The family</h2>
            </div>
            <Link
              href="/tree"
              className="eyebrow text-gold-deep hover:text-gold transition-colors"
            >
              Explore the full tree →
            </Link>
          </div>
          {patriarch && (
            <p className="font-serif italic text-muted text-base mb-7 max-w-prose">
              From {patriarch.name}{patriarch.datesLabel ? `, ${patriarch.datesLabel}` : ''}, the family branched across the generations.
            </p>
          )}
          {firstGen.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-7">
              {firstGen.map((p) => (
                <Link
                  key={p.id}
                  href={`/person/${p.id}`}
                  className="block p-5 border hairline rounded-lg bg-white hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200"
                >
                  {p.relationLabel && (
                    <p className="eyebrow text-quiet mb-2">{p.relationLabel}</p>
                  )}
                  <p className="font-serif text-navy text-2xl mb-1">{p.name}</p>
                  {p.datesLabel && (
                    <p className="font-serif italic text-muted text-base">{p.datesLabel}</p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Photographs preview — bg-white */}
      <section className="bg-white border-t border-stone py-14 px-7 md:px-11">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-baseline justify-between mb-7">
            <div>
              <p className="eyebrow text-gold-deep mb-2">PHOTOGRAPHS</p>
              <h2 className="font-serif text-navy text-3xl">Recent photographs</h2>
            </div>
            <Link
              href="/photographs"
              className="eyebrow text-gold-deep hover:text-gold transition-colors"
            >
              Browse all collections →
            </Link>
          </div>
          {latestPhotos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
              {latestPhotos.map((photo) => (
                <PhotoCard key={photo.id} photo={photo} />
              ))}
            </div>
          ) : (
            <p className="font-serif italic text-muted text-base">No photographs yet.</p>
          )}
        </div>
      </section>

      {/* Videos preview — bg-ivory (alternates back to ivory) */}
      {featured.length > 0 && (
        <section className="bg-ivory border-t border-stone py-14 px-7 md:px-11">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-baseline justify-between mb-7">
              <div>
                <p className="eyebrow text-gold-deep mb-2">VIDEOS</p>
                <h2 className="font-serif text-navy text-3xl">Featured films</h2>
              </div>
              <Link
                href="/videos"
                className="eyebrow text-gold-deep hover:text-gold transition-colors"
              >
                Browse all playlists →
              </Link>
            </div>
            <div
              className={`grid gap-7 ${
                featured.length === 1
                  ? 'grid-cols-1 max-w-3xl mx-auto'
                  : 'grid-cols-1 md:grid-cols-2'
              }`}
            >
              {featured.slice(0, 2).map((v) => (
                <VideoCard key={v.id} video={v} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
