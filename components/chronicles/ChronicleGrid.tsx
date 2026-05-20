// components/chronicles/ChronicleGrid.tsx
// Server Component - loads all chronicles, sorts by date descending, renders ChronicleCard grid.
// D-06: /chronicles landing sorts newest-first.
// D-09: Server Component; no client state needed.
import ChronicleCard from './ChronicleCard'
import { getChronicles } from '@/lib/content'

export default function ChronicleGrid() {
  const chronicles = getChronicles()

  if (chronicles.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="eyebrow text-quiet mb-3">FAMILY ARCHIVE</p>
        <h2 className="font-serif text-navy text-2xl mb-2">No chronicles yet</h2>
        <p className="text-muted text-sm max-w-sm mx-auto">
          Written family stories will appear here as they are added to the archive.
        </p>
      </div>
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
