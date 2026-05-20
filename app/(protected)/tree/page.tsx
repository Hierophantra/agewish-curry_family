// app/(protected)/tree/page.tsx
// Server Component - data fetch + page layout.
// Calls server-only lib/tree.ts and lib/content.ts.
// Passes layout data to FamilyTreeCanvas (client island).
//
// v3 visual upgrade: scaled header (text-5xl), italic subtitle in serif,
// gold rule above the eyebrow, ivory-tinted tree canvas frame with a
// rounded corner and subtle shadow so the tree feels like a framed plate
// rather than a flat box.
import { getPhotos } from '@/lib/content'
import { getTreeData, findRootId } from '@/lib/tree'
import FamilyTreeCanvas from '@/components/tree/FamilyTreeCanvas'

export default function TreePage() {
  const rootId = findRootId()
  const { nodes, connectors, canvas, people } = getTreeData(rootId)
  const photos = getPhotos()

  return (
    <main className="py-14 md:py-20 px-7 md:px-11 lg:px-15">
      {/* Page header - editorial scale, gold rule, large serif title */}
      <header className="mb-12 max-w-4xl">
        <div className="flex items-center gap-3 mb-5" aria-hidden="true">
          <span className="block w-10 h-px bg-gold-deep" />
          <span className="block w-1.5 h-1.5 rounded-full bg-gold" />
        </div>
        <p className="eyebrow text-gold-deep mb-4">Family archive</p>
        <h1 className="font-serif text-navy text-5xl md:text-6xl mb-4 leading-tight">
          Family tree
        </h1>
        <p className="font-serif italic text-muted text-lg md:text-xl leading-relaxed">
          From Ernest E Curry, born 1930, the family expanded across generations.
        </p>
      </header>

      {/* Empty state - same pattern as the other grids */}
      {people.length === 0 ? (
        <div className="py-20 text-center bg-ivory rounded-xl border hairline">
          <p className="eyebrow text-quiet mb-3">Family archive</p>
          <p className="font-serif text-navy text-2xl mb-2">No family members yet</p>
          <p className="text-muted text-base">
            Add people to content/family.json to populate the tree.
          </p>
        </div>
      ) : (
        // Tree canvas - framed plate with ivory backdrop and editorial shadow.
        <section className="relative bg-gradient-to-br from-ivory to-ivory-deep border hairline border-stone rounded-xl overflow-hidden shadow-editorial">
          <FamilyTreeCanvas
            nodes={nodes}
            connectors={connectors}
            canvas={canvas}
            people={people}
            photos={photos}
          />
        </section>
      )}
    </main>
  )
}
