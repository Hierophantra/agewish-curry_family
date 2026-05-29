// app/(protected)/page.tsx
// Home page - Server Component. The HUB.
//
// v3.1 visual upgrade (per design crit):
//   - One surface primitive across all cards (was: gradient + custom shadow)
//   - Gold reserved as a signal, not decoration:
//       * one eyebrow on the section header
//       * one arrow color
//       * border lights up gold on hover (not all the time)
//   - Numerals demoted from giant tabular display to a quiet supporting line
//   - Italic descriptors replaced with plain Inter body (italic stays in hero
//     and footer dedication only)
//   - Card description is now genuine product copy, not flourish
//   - Card title scaled down from 4xl/5xl to 2xl/3xl - the SECTION should
//     read big, the cards should read consistent
//
// Intentional design choice: the home page is NOT a preview surface. It's a
// calm landing that gives the family a clear menu of where to go. Optimized
// for a "10-foot UI" feel so it reads well on TV / tablet / laptop.
//
// Star motif rule: TopNav = star 1, Hero = star 2, Footer = star 3.
import Link from 'next/link'
import Hero from '@/components/home/Hero'
import { getPeople, getPhotos, getCollections, getVideos, getPlaylists, getChronicles, getHero } from '@/lib/content'

export default function HomePage() {
  const people = getPeople()
  const photos = getPhotos()
  const collections = getCollections()
  const videos = getVideos()
  const playlists = getPlaylists()
  const chronicles = getChronicles()
  const heroConfig = getHero()

  // Generation depth = longest parent-to-child chain from the root patriarch.
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

  // Hub card data. The numerals are no longer a centerpiece - they're a
  // supporting line under the description, weighted equal to the descriptor.
  const cards: Array<{
    id: string
    href: string
    eyebrow: string
    title: string
    description: string
    stat: string
  }> = [
    {
      id: 'tree',
      href: '/tree',
      eyebrow: 'Family tree',
      title: 'The family',
      description: 'See how everyone connects, from the patriarch down through every branch.',
      stat: `${people.length} people · ${genWord} generations`,
    },
    {
      id: 'photographs',
      href: '/photographs',
      eyebrow: 'Photographs',
      title: 'Photographs',
      description: 'Albums and collections, from the earliest pictures to the most recent.',
      stat: photos.length > 0
        ? `${photos.length} photograph${photos.length === 1 ? '' : 's'}${collections.length > 0 ? ` · ${collections.length} collection${collections.length === 1 ? '' : 's'}` : ''}`
        : 'Waiting for the first',
    },
    {
      id: 'videos',
      href: '/videos',
      eyebrow: 'Videos',
      title: 'Home movies',
      description: 'Recorded moments, gathered by occasion. Birthdays, trips, holidays, dinners.',
      stat: videos.length > 0
        ? `${videos.length} film${videos.length === 1 ? '' : 's'} · ${playlists.length} collection${playlists.length === 1 ? '' : 's'}`
        : 'Waiting for the first',
    },
    {
      id: 'chronicles',
      href: '/chronicles',
      eyebrow: 'Chronicles',
      title: 'Stories told',
      description: 'Written accounts and oral histories of the people and the times they lived in.',
      stat: chronicles.length > 0
        ? `${chronicles.length} stor${chronicles.length === 1 ? 'y' : 'ies'}`
        : 'Waiting for the first',
    },
  ]

  return (
    <>
      <Hero heroConfig={heroConfig} />

      {/* Hub grid section. bg-ivory with a soft top gradient. */}
      <section className="relative bg-gradient-to-b from-ivory via-ivory to-ivory-deep border-t border-stone/60 py-20 md:py-28 px-7 md:px-11">
        <div className="max-w-7xl mx-auto">
          {/* Section header - one small eyebrow with a hairline rule.
              Reduced from "two gold rules + dot" to a single understated line. */}
          <div className="flex flex-col items-center mb-14">
            <div
              data-edit-id="explore-rule"
              data-edit-label="Explore divider"
              data-edit-kind="box"
              className="flex items-center gap-3 mb-5"
              aria-hidden="true"
            >
              <span className="block w-10 h-px bg-gold-deep" />
              <span className="block w-1.5 h-1.5 rounded-full bg-gold" />
              <span className="block w-10 h-px bg-gold-deep" />
            </div>
            <p
              data-edit-id="explore-eyebrow"
              data-edit-label="Explore eyebrow"
              data-edit-kind="text"
              className="eyebrow text-gold-deep text-sm tracking-[0.28em]"
            >
              Explore the archive
            </p>
          </div>

          {/* Card grid. The surface-card utility is the one shared primitive.
              No gradient backgrounds, no giant numerals - just typography and
              spacing carrying the design. */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                data-edit-id={`card-${c.id}`}
                data-edit-label={`Card: ${c.title}`}
                data-edit-kind="box"
                className="
                  group relative flex flex-col
                  surface-card
                  p-7 md:p-8 min-h-[280px] lg:min-h-[300px]
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2
                "
              >
                {/* Top section: eyebrow (quiet now, not gold) + serif title + descriptor */}
                <div className="flex-1">
                  <p
                    data-edit-id={`card-${c.id}-eyebrow`}
                    data-edit-label={`${c.title} · eyebrow`}
                    data-edit-kind="text"
                    className="eyebrow text-quiet mb-3"
                  >
                    {c.eyebrow}
                  </p>
                  <h2
                    data-edit-id={`card-${c.id}-title`}
                    data-edit-label={`${c.title} · title`}
                    data-edit-kind="text"
                    className="font-serif text-navy text-2xl md:text-3xl leading-tight mb-3"
                  >
                    {c.title}
                  </h2>
                  <p
                    data-edit-id={`card-${c.id}-desc`}
                    data-edit-label={`${c.title} · text`}
                    data-edit-kind="text"
                    className="font-sans text-muted text-base leading-7"
                  >
                    {c.description}
                  </p>
                </div>

                {/* Bottom row: stat + quiet "Open" link. Top border replaces
                    the previous mid-card gold separator. */}
                <div className="mt-6 pt-4 border-t border-[color:var(--color-border)] flex items-baseline justify-between gap-3">
                  <p
                    data-edit-id={`card-${c.id}-stat`}
                    data-edit-label={`${c.title} · stat`}
                    data-edit-kind="text"
                    className="font-sans text-quiet text-sm"
                  >
                    {c.stat}
                  </p>
                  <span
                    className="
                      eyebrow text-gold-deep transition-transform duration-200
                      group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5
                    "
                    aria-hidden="true"
                  >
                    Open
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
