// app/(protected)/page.tsx
// Home page - Server Component. The HUB.
//
// Intentional design choice: the home page is NOT a preview surface for
// the rest of the site. It is a calm landing that gives the family a clear
// menu of where to go. Optimised for a "10-foot UI" feel so it reads well
// on a TV or tablet as well as a laptop.
//
// v3 visual upgrade:
//   - Hub cards scaled up (min-h 360 / lg:420, text-4xl/5xl titles)
//   - Each card has a thematic mono numeral (huge serif stat) plus the
//     prose stat - the numeral becomes a visual anchor
//   - Subtle ivory gradient background on the section + on each card
//   - Gold rule separators inside the cards for editorial feel
//   - Decorative gold rule + "Explore the archive" eyebrow centered above
//     the grid
//   - Footer flourish line at the bottom of the section
//
// Composition: Hero (bg-white to ivory gradient) -> Hub grid (bg-ivory).
// Star motif rule: TopNav = star 1, Hero = star 2, Footer = star 3.
import Link from 'next/link'
import Hero from '@/components/home/Hero'
import { getPeople, getPhotos, getCollections, getVideos, getPlaylists, getChronicles } from '@/lib/content'

export default function HomePage() {
  // Pull just the counts we need for the hub-card stat tags.
  const people = getPeople()
  const photos = getPhotos()
  const collections = getCollections()
  const videos = getVideos()
  const playlists = getPlaylists()
  const chronicles = getChronicles()

  // Generation depth = longest parent-to-child chain from the root patriarch.
  // BFS from each parentless person, take the deepest result.
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

  // Each card has a "big numeral" (the count that matters most) and a one-line
  // descriptor of what that numeral refers to.
  const cards: Array<{
    href: string
    eyebrow: string
    title: string
    description: string
    numeral: string | null   // null = no count yet, shown as a gold dash
    numeralLabel: string     // what the numeral counts
    subStat?: string         // optional second stat line
  }> = [
    {
      href: '/tree',
      eyebrow: 'Family tree',
      title: 'The family',
      description: 'See how everyone connects, from the patriarch down through every branch.',
      numeral: String(people.length),
      numeralLabel: people.length === 1 ? 'person' : 'people',
      subStat: `Across ${genWord} generations`,
    },
    {
      href: '/photographs',
      eyebrow: 'Photographs',
      title: 'Photographs',
      description: 'Albums and collections, from the earliest pictures to the most recent.',
      numeral: photos.length > 0 ? String(photos.length) : null,
      numeralLabel: photos.length === 1 ? 'photograph' : 'photographs',
      subStat: collections.length > 0
        ? `In ${collections.length} collection${collections.length === 1 ? '' : 's'}`
        : 'Add your first',
    },
    {
      href: '/videos',
      eyebrow: 'Videos',
      title: 'Home movies',
      description: 'Recorded moments, gathered by occasion. Birthdays, trips, holidays, dinners.',
      numeral: videos.length > 0 ? String(videos.length) : null,
      numeralLabel: videos.length === 1 ? 'home movie' : 'home movies',
      subStat: playlists.length > 0
        ? `Across ${playlists.length} playlist${playlists.length === 1 ? '' : 's'}`
        : 'Add your first',
    },
    {
      href: '/chronicles',
      eyebrow: 'Chronicles',
      title: 'Stories told',
      description: 'Written accounts and oral histories of the people and the times they lived in.',
      numeral: chronicles.length > 0 ? String(chronicles.length) : null,
      numeralLabel: chronicles.length === 1 ? 'story' : 'stories',
      subStat: chronicles.length > 0 ? 'Read and listen' : 'Add your first',
    },
  ]

  return (
    <>
      <Hero />

      {/* Hub grid section. bg-ivory with a soft top gradient to deepen the
          page's color palette without losing the calm. */}
      <section
        className="
          relative bg-gradient-to-b from-ivory via-ivory to-ivory-deep
          border-t border-stone py-20 md:py-28 px-7 md:px-11
        "
      >
        <div className="max-w-7xl mx-auto">
          {/* Section header - decorative gold rule + centered eyebrow */}
          <div className="flex flex-col items-center mb-14">
            <div className="flex items-center gap-3 mb-5" aria-hidden="true">
              <span className="block w-10 h-px bg-gold-deep" />
              <span className="block w-1.5 h-1.5 rounded-full bg-gold" />
              <span className="block w-10 h-px bg-gold-deep" />
            </div>
            <p className="eyebrow text-gold-deep text-sm tracking-[0.28em]">
              Explore the archive
            </p>
          </div>

          {/* Card grid: 1-col mobile, 2-col tablet, 4-col desktop.
              Generous gap so each card has breathing room. */}
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="
                  group relative flex flex-col
                  bg-gradient-to-br from-white to-ivory
                  hairline border-stone rounded-xl
                  p-8 md:p-10 min-h-[360px] lg:min-h-[420px]
                  shadow-editorial transition-all duration-300
                  hover:-translate-y-1 hover:shadow-editorial-hover hover:border-gold
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2
                "
              >
                {/* Top section: eyebrow + serif title + descriptor */}
                <div className="flex-1">
                  <p className="eyebrow text-gold-deep mb-4">{c.eyebrow}</p>
                  <h2 className="font-serif text-navy text-4xl lg:text-5xl leading-[1.1] mb-4">
                    {c.title}
                  </h2>
                  <p className="font-serif italic text-muted text-base lg:text-lg leading-relaxed">
                    {c.description}
                  </p>
                </div>

                {/* Mid: gold hairline separator */}
                <div className="my-6 flex items-center gap-2" aria-hidden="true">
                  <span className="block h-px bg-gold-deep/40 flex-1" />
                  <span className="block w-1 h-1 rounded-full bg-gold-deep/40" />
                  <span className="block h-px bg-gold-deep/40 flex-1" />
                </div>

                {/* Bottom: big numeral + label + sub-stat + arrow */}
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="font-serif text-navy text-5xl lg:text-6xl leading-none tabular-nums">
                      {c.numeral ?? <span className="text-gold-deep">0</span>}
                    </p>
                    <p className="eyebrow text-quiet mt-2">{c.numeralLabel}</p>
                    {c.subStat && (
                      <p className="font-serif italic text-muted text-sm mt-2">{c.subStat}</p>
                    )}
                  </div>
                  {/* Arrow indicator - slides on hover/focus */}
                  <span
                    className="
                      text-gold-deep text-3xl leading-none
                      transition-transform duration-300
                      group-hover:translate-x-1 group-focus-visible:translate-x-1
                    "
                    aria-hidden="true"
                  >
                    {'→'}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Footer flourish under the grid - same gold rule motif as the header */}
          <div className="flex flex-col items-center mt-16" aria-hidden="true">
            <div className="flex items-center gap-3 mb-4">
              <span className="block w-8 h-px bg-gold-deep" />
              <span className="block w-1 h-1 rounded-full bg-gold-deep" />
              <span className="block w-8 h-px bg-gold-deep" />
            </div>
            <p className="font-serif italic text-quiet text-sm">
              Held in trust for those who come after.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
