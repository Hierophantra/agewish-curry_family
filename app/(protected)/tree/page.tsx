// app/(protected)/tree/page.tsx
// Server Component — data fetch + page layout.
// Calls server-only lib/tree.ts and lib/content.ts.
// Passes layout data to FamilyTreeCanvas (client island).
import { getPhotos } from '@/lib/content'
import { getTreeData, findRootId } from '@/lib/tree'
import FamilyTreeCanvas from '@/components/tree/FamilyTreeCanvas'

export default function TreePage() {
  const rootId = findRootId()
  const { nodes, connectors, canvas, people } = getTreeData(rootId)
  const photos = getPhotos()

  return (
    <main className="py-11 px-7 md:px-11 lg:px-15">
      {/* D-16: page header — eyebrow + serif h1 + muted subtitle */}
      <header className="mb-9">
        <p className="eyebrow text-gold-deep mb-3">FAMILY ARCHIVE</p>
        <h1 className="font-serif text-navy text-4xl mb-2">Family tree</h1>
        {/* D-17: subtitle copy — placeholder adapts to real data later */}
        <p className="text-muted text-base">
          From William Curry, born 1920 in London, the family expanded across generations.
        </p>
      </header>

      {/* D-18: empty state — same pattern as PhotoGrid and VideoGrid */}
      {people.length === 0 ? (
        <div className="py-16 text-center">
          <p className="eyebrow text-quiet mb-3">FAMILY ARCHIVE</p>
          <p className="font-serif text-navy text-xl mb-2">No family members yet</p>
          <p className="text-muted text-sm">
            Add people to content/family.json to populate the tree.
          </p>
        </div>
      ) : (
        // Tree canvas — relative container needed for PersonPanel absolute positioning (D-14)
        <section className="relative border hairline overflow-hidden">
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
