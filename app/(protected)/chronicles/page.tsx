// app/(protected)/chronicles/page.tsx
// Chronicles landing page - Server Component.
// D-06: Loads all chronicles, sorted by date descending, renders via ChronicleGrid.
//
// v3 visual upgrade: scaled header matching the tree, photographs, and videos
// pages so the cross-page rhythm is consistent.
import ChronicleGrid from '@/components/chronicles/ChronicleGrid'

export default function ChroniclesPage() {
  return (
    <main className="py-14 md:py-20 px-7 md:px-11 lg:px-15">
      <div className="max-w-5xl mx-auto">
        {/* Page header - editorial scale matching the tree page */}
        <header className="mb-12 max-w-4xl">
          <div className="flex items-center gap-3 mb-5" aria-hidden="true">
            <span className="block w-10 h-px bg-gold-deep" />
            <span className="block w-1.5 h-1.5 rounded-full bg-gold" />
          </div>
          <p data-edit-id="chronicles-page-eyebrow" data-edit-label="Chronicles · page eyebrow" data-edit-kind="text" className="eyebrow text-gold-deep mb-4">Family archive</p>
          <h1 data-edit-id="chronicles-page-title" data-edit-label="Chronicles · page title" data-edit-kind="text" className="font-serif text-navy text-5xl md:text-6xl mb-4 leading-tight">
            Chronicles
          </h1>
          <p data-edit-id="chronicles-page-subtitle" data-edit-label="Chronicles · page subtitle" data-edit-kind="text" className="font-serif italic text-muted text-lg md:text-xl leading-relaxed">
            Written stories from the family: founding moments, ordinary summers,
            lives at their turning points.
          </p>
        </header>

        {/* Chronicle grid - sorted by date desc, empty state handled inside */}
        <ChronicleGrid />
      </div>
    </main>
  )
}
