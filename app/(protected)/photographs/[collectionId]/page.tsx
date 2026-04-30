// app/(protected)/photographs/[collectionId]/page.tsx
// Placeholder — Phase 8 implements collection detail view (photo grid filtered by collection).
// D-24: Stub only; returns "Coming in Phase 8" message.
import { getCollectionById, getCollections } from '@/lib/content'
import { notFound } from 'next/navigation'

interface Props {
  params: { collectionId: string }
}

export default function CollectionPage({ params }: Props) {
  const collection = getCollectionById(params.collectionId)
  if (!collection) notFound()
  return (
    <main className="py-11 px-7">
      <p className="eyebrow text-quiet mb-3">FAMILY ARCHIVE · COLLECTION</p>
      <h1 className="font-serif text-navy text-3xl mb-2">{collection.title}</h1>
      <p className="text-muted text-sm mb-6">Coming in Phase 8 — photo grid filtered by this collection.</p>
    </main>
  )
}

export async function generateStaticParams() {
  return getCollections().map((c) => ({ collectionId: c.id }))
}
