// app/(protected)/page.tsx
// Home page — Server Component. The HUB.
//
// Intentional design choice: the home page is NOT a preview surface for
// recent photos / featured videos / latest chronicles. It is a calm landing
// that gives the family a clear menu of where to go. Optimised for a
// "10-foot UI" feel — large typography, generous hit targets, minimal
// visual noise — so it reads well on a TV or tablet as well as a laptop.
//
// Composition: Hero (bg-white) → Hub card grid (bg-ivory).
// Star motif rule: TopNav = star 1, Hero = star 2, Footer = star 3.
import Link from 'next/link'
import Hero from '@/components/home/Hero'
import { getPeople, getPhotos, getCollections, getVideos, getPlaylists, getChronicles } from '@/lib/content'

export default function HomePage() {
  // Pull just the counts we need for the hub-card descriptors.
  // Single-line stats keep the cards "alive" without becoming a content preview.
  const people = getPeople()
  const photos = getPhotos()
  const collections = getCollections()
  const videos = getVideos()
  const playlists = getPlaylists()
  const chronicles = getChronicles()

  // Generation depth = longest parent-to-child chain from the root patriarch.
  // BFS from each parentless person, take the deepest result. Defaults to "many"
  // if the graph is empty (e.g. fresh install with no family records yet).
  function maxGenerationDepth(): number {
    const byId = new Map(people.map((p) => [p.id, p]))
    const roots = people.filter((p) => (p.parentIds ?? []).length === 0)
    let max = 1
    for (const root of roots) {
      const visited = new Set<string>()
      const stack: Array<{ id: string; depth: number }> = [{ id: root.id, depth: 1 }]
      while (stack.length) {
        const { id, depth } = stack.pop()!
        if (visited.has(id)) continue
        visited.add(id)
        if (depth > max) max = depth
        const person = byId.get(id)
        if (!person) continue
        const kids = person.childrenIds.length > 0 ? person.childrenIds : person.childIds
        for (const cid of kids) stack.push({ id: cid, depth: depth + 1 })
      }
    }
    return max
  }
  const genCount = maxGenerationDepth()
  const genWord = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven'][genCount] ?? String(genCount)

  // Stat strings shown on each hub card. Kept short on purpose.
  const treeStat = people.length > 0
    ? `${people.length} people across ${genWord} generations`
    : 'No family records yet'

  const photoStat = photos.length > 0
    ? `${photos.length} photograph${photos.length === 1 ? '' : 's'}${
        collections.length > 0 ? ` in ${collections.length} collection${collections.length === 1 ? '' : 's'}` : ''
      }`
    : 'No photographs yet'

  const videoStat = videos.length > 0
    ? `${playlists.length} playlist${playlists.length === 1 ? '' : 's'}, ${videos.length} home movies`
    : 'No videos yet'

  const chronicleStat = chronicles.length > 0
    ? `${chronicles.length} stor${chronicles.length === 1 ? 'y' : 'ies'}`
    : 'No stories yet'

  // Cards data — order matches the TopNav reading order so muscle memory transfers.
  const cards: Array<{
    href: string
    eyebrow: string
    title: string
    description: string
    stat: string
  }> = [
    {
      href: '/tree',
      eyebrow: 'FAMILY TREE',
      title: 'The family',
      description: 'See how everyone connects — from the patriarch down through every branch.',
      stat: treeStat,
    },
    {
      href: '/photographs',
      eyebrow: 'PHOTOGRAPHS',
      title: 'Photographs',
      description: 'Albums and collections, from the earliest pictures to the most recent.',
      stat: photoStat,
    },
    {
      href: '/videos',
      eyebrow: 'VIDEOS',
      title: 'Home movies',
      description: 'Recorded moments, gathered by occasion — birthdays, trips, holidays, dinners.',
      stat: videoStat,
    },
    {
      href: '/chronicles',
      eyebrow: 'CHRONICLES',
      title: 'Stories told',
      description: 'Written accounts and oral histories of the people and the times they lived in.',
      stat: chronicleStat,
    },
  ]

  return (
    <>
      <Hero />

      {/* Hub grid — bg-ivory (alternates with white hero above).
          2-col on tablet, 4-col on desktop. Larger cards on lg+ for TV-style scanning. */}
      <section className="bg-ivory border-t border-stone py-16 px-7 md:px-11">
        <div className="max-w-6xl mx-auto">
          <p className="eyebrow text-gold-deep mb-7 text-center">EXPLORE THE ARCHIVE</p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="
                  group relative flex flex-col justify-between
                  bg-white hairline border-stone rounded-lg
                  p-7 md:p-8 min-h-[260px] lg:min-h-[300px]
                  transition-all duration-200
                  hover:-translate-y-1 hover:shadow-md hover:border-gold
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2
                "
              >
                <div>
                  <p className="eyebrow text-gold-deep mb-3">{c.eyebrow}</p>
                  <h2 className="font-serif text-navy text-3xl lg:text-4xl leading-tight mb-3">
                    {c.title}
                  </h2>
                  <p className="font-serif italic text-muted text-base leading-relaxed">
                    {c.description}
                  </p>
                </div>

                <div className="mt-6 flex items-end justify-between gap-3">
                  <p className="text-quiet text-xs uppercase tracking-[0.18em] leading-snug">
                    {c.stat}
                  </p>
                  {/* Arrow indicator — slides on hover/focus */}
                  <span
                    className="text-gold-deep text-2xl leading-none transition-transform duration-200 group-hover:translate-x-1 group-focus-visible:translate-x-1"
                    aria-hidden="true"
                  >
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
