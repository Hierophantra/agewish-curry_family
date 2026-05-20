// app/(protected)/chronicles/page.tsx
// Chronicles landing page - Server Component.
// D-06: Loads all chronicles, sorted by date descending, renders via ChronicleGrid.
import ChronicleGrid from '@/components/chronicles/ChronicleGrid'

export default function ChroniclesPage() {
  return (
    <main className="py-11 px-7 md:px-11 lg:px-15">
      <div className="max-w-5xl mx-auto">
        {/* Page header */}
        <header className="mb-11">
          <p className="eyebrow text-gold-deep mb-3">FAMILY ARCHIVE</p>
          <h1 className="font-serif text-navy text-4xl mb-2">Chronicles</h1>
          <p className="font-serif italic text-muted text-base max-w-prose">
            Written stories from the family - founding moments, ordinary summers, lives at their turning points.
          </p>
          <div className="h-px bg-gold w-12 mt-7" aria-hidden="true" />
        </header>

        {/* Chronicle grid - sorted by date desc, empty state handled inside */}
        <ChronicleGrid />
      </div>
    </main>
  )
}
