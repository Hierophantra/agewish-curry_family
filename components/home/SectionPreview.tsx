// components/home/SectionPreview.tsx
// Server Component. Three text-forward preview cards for tree, photographs, films.
// D-33: Section name (serif), 1-line description, "→" arrow link.
// D-33: NO preview images in v1 — text-forward archival aesthetic.
// D-34: bg-ivory background (alternating with white hero).
// D-15: Section padding py-11 px-7.
import Link from 'next/link'

const SECTIONS = [
  {
    href: '/tree',
    title: 'Family tree',
    description: 'Explore the full family tree, generation by generation.',
  },
  {
    href: '/photographs',
    title: 'Photographs',
    description: 'A curated archive of family photographs across the decades.',
  },
  {
    href: '/films',
    title: 'Films',
    description: 'Family film recordings, preserved and accessible.',
  },
] as const

export default function SectionPreview() {
  return (
    <section className="bg-ivory py-11 px-7">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {SECTIONS.map((section) => (
          <div key={section.href} className="flex flex-col gap-2">
            {/* Section name — serif heading, sentence case */}
            <h2 className="font-serif text-navy text-xl font-normal">
              {section.title}
            </h2>

            {/* One-line description — sentence case */}
            <p className="text-muted text-sm font-normal leading-relaxed">
              {section.description}
            </p>

            {/* Arrow link — sentence case */}
            <Link
              href={section.href}
              className="text-sm text-navy font-medium mt-1 hover:text-gold transition-colors"
            >
              Explore →
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}
