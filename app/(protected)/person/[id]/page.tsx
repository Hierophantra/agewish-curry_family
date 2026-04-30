// app/(protected)/person/[id]/page.tsx
// Placeholder — Phase 6 implements individual person detail pages.
// Person.id slug format is kebab-case (e.g., /person/william-curry).
// The [id] param must stay kebab-case — it is used across all content types.
export default function PersonPage({ params }: { params: { id: string } }) {
  return (
    <main className="py-11 px-7">
      <h1 className="font-serif text-navy text-2xl">Person: {params.id}</h1>
      <p className="text-muted mt-2 text-sm">Coming in Phase 6.</p>
    </main>
  )
}
