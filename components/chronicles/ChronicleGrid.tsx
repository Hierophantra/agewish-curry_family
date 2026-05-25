// components/chronicles/ChronicleGrid.tsx
// Server Component - loads all chronicles, sorts by date descending, renders ChronicleCard grid.
// D-06: /chronicles landing sorts newest-first.
// D-09: Server Component; no client state needed.
import ChronicleCard from './ChronicleCard'
import { getChronicles } from '@/lib/content'

export default function ChronicleGrid() {
  const chronicles = getChronicles()

  if (chronicles.length === 0) {
    // v3.1 empty state - dignified placeholder rather than "nothing here".
    // A single manuscript-style preview card hints at the editorial treatment
    // chronicles will receive: serif body, gold-deep eyebrow for "turning
    // point", a small italic dedication. Reads as a place with intent.
    return (
      <section className="py-12 md:py-16">
        <div className="max-w-3xl">
          <p className="eyebrow text-[color:var(--color-rose-memory)] mb-4">Chronicles</p>
          <h2 className="font-serif text-navy text-3xl md:text-4xl leading-tight mb-4">
            Stories not yet placed into words
          </h2>
          <p className="text-muted text-base md:text-lg leading-relaxed">
            Written memories, family notes, dates, places, and reflections will
            be preserved here as the archive grows. Each will live alongside
            the photographs and recordings that belong to it.
          </p>
        </div>

        {/* Manuscript-style preview card - hint at the future treatment. */}
        <div className="mt-12 max-w-2xl">
          <div className="surface-card-static p-8 md:p-10">
            <p className="eyebrow text-[color:var(--color-rose-memory)] mb-4">
              A turning point
            </p>
            <h3 className="font-serif text-navy text-2xl md:text-3xl leading-tight mb-4">
              The first chronicle will appear here
            </h3>
            <p className="font-serif text-navy text-lg leading-8 italic">
              A short passage of family writing, an oral history, a memory
              gathered into words.
            </p>
            <p className="mt-5 text-sm text-quiet">Author, date placed</p>
          </div>
        </div>
      </section>
    )
  }

  // Sort by date descending - chronicles without a date sort to the end
  const sorted = [...chronicles].sort((a, b) => {
    const da = a.date ?? ''
    const db = b.date ?? ''
    return db.localeCompare(da)
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
      {sorted.map((chronicle) => (
        <ChronicleCard key={chronicle.id} chronicle={chronicle} />
      ))}
    </div>
  )
}
