// app/admin/photos/[id]/page.tsx
// Admin edit page for a single photograph. Auth gate enforced by requireAdminOrRedirect().
// Renders EditPhotoForm in update mode with the photo's current values.
// Returns notFound() if the photo id doesn't exist in content/photos.json.
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPhotoById, getPeople, getCollections } from '@/lib/content'
import { requireAdminOrRedirect } from '@/lib/admin'
import EditPhotoForm from '@/components/admin/EditPhotoForm'

export function generateMetadata({ params }: { params: { id: string } }) {
  const photo = getPhotoById(params.id)
  if (!photo) return { title: 'Photo not found · Admin · The Curry Family' }
  return { title: `Edit ${photo.caption ?? photo.id} · Admin · The Curry Family` }
}

export default async function AdminEditPhotoPage({ params }: { params: { id: string } }) {
  await requireAdminOrRedirect()

  const photo = getPhotoById(params.id)
  if (!photo) notFound()

  const allPeople = getPeople()
  const allCollections = getCollections()

  // Pre-populate form with current photo values; empty string for absent optional fields.
  const initial = {
    id: photo.id,
    caption: photo.caption ?? '',
    date: photo.date ?? photo.dateTaken ?? '',
    dateLabel: photo.dateLabel ?? '',
    location: photo.location ?? '',
    notes: photo.notes ?? '',
    visibility: photo.visibility ?? 'everywhere',
    inHero: photo.inHero ?? false,
    peopleIds: photo.peopleIds,
    collectionIds: photo.collectionIds,
    regions: photo.regions ?? [],
    peopleVisibility: photo.peopleVisibility ?? {},
  }

  return (
    <div className="py-11 px-7 md:px-11 max-w-3xl mx-auto">
      <Link
        href="/admin/photos"
        className="text-quiet text-xs uppercase tracking-[0.22em] hover:text-navy transition-colors mb-6 inline-block"
      >
        ← Back to photographs
      </Link>
      <p className="eyebrow text-gold-deep mb-3">
        EDITING · {(photo.caption ?? photo.id).toUpperCase()}
      </p>
      <h1 className="font-serif text-navy text-4xl mb-1">
        {photo.caption ?? photo.id}
      </h1>
      {photo.dateLabel && (
        <p className="font-serif italic text-muted text-base mb-9">{photo.dateLabel}</p>
      )}

      <EditPhotoForm
        mode="update"
        photoId={photo.id}
        currentFilename={photo.filename}
        initial={initial}
        allPeople={allPeople}
        allCollections={allCollections}
      />
    </div>
  )
}
