// app/admin/collections/[id]/page.tsx
// Admin edit page for a single collection. Auth gate enforced by requireAdminOrRedirect().
// Renders EditCollectionForm in update mode with the collection's current values.
// Returns notFound() if the collection id doesn't exist in content/collections.json.
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCollectionById, getPhotos } from '@/lib/content'
import { requireAdminOrRedirect } from '@/lib/admin'
import EditCollectionForm from '@/components/admin/EditCollectionForm'

export function generateMetadata({ params }: { params: { id: string } }) {
  const collection = getCollectionById(params.id)
  if (!collection) return { title: 'Collection not found · Admin · The Curry Family' }
  return { title: `Edit ${collection.title} · Admin · The Curry Family` }
}

export default async function AdminEditCollectionPage({ params }: { params: { id: string } }) {
  await requireAdminOrRedirect()

  const collection = getCollectionById(params.id)
  if (!collection) notFound()

  const allPhotos = getPhotos()

  // Pre-populate form with current collection values; empty string for absent optional fields.
  const initial = {
    id: collection.id,
    title: collection.title,
    subtitle: collection.subtitle ?? '',
    description: collection.description ?? '',
    dateLabel: collection.dateLabel ?? '',
    date: collection.date ?? '',
    coverPhotoId: collection.coverPhotoId,
  }

  return (
    <div className="py-11 px-7 md:px-11 max-w-3xl mx-auto">
      <Link
        href="/admin/collections"
        className="text-quiet text-xs uppercase tracking-[0.22em] hover:text-navy transition-colors mb-6 inline-block"
      >
        ← Back to collections
      </Link>
      <p className="eyebrow text-gold-deep mb-3">EDITING · {collection.title.toUpperCase()}</p>
      <h1 className="font-serif text-navy text-4xl mb-1">{collection.title}</h1>
      {collection.dateLabel && (
        <p className="font-serif italic text-muted text-base mb-9">{collection.dateLabel}</p>
      )}

      <EditCollectionForm
        mode="update"
        collectionId={collection.id}
        initial={initial}
        allPhotos={allPhotos}
      />
    </div>
  )
}
