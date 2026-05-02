// app/admin/chronicles/[id]/page.tsx
// Admin edit page for a single chronicle. Auth gate is enforced by requireAdminOrRedirect().
// Renders EditChronicleForm in update mode with the chronicle's current values.
// Returns notFound() if the chronicle id doesn't exist in content/chronicles.json.
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getChronicleById, getPeople, getCollections, getPhotos } from '@/lib/content'
import { requireAdminOrRedirect } from '@/lib/admin'
import EditChronicleForm from '@/components/admin/EditChronicleForm'

export function generateMetadata({ params }: { params: { id: string } }) {
  const chronicle = getChronicleById(params.id)
  if (!chronicle) return { title: 'Chronicle not found · Admin · The Curry Family' }
  return { title: `Edit ${chronicle.title} · Admin · The Curry Family` }
}

export default async function AdminEditChroniclePage({ params }: { params: { id: string } }) {
  await requireAdminOrRedirect()

  const chronicle = getChronicleById(params.id)
  if (!chronicle) notFound()

  const allPeople = getPeople()
  const allCollections = getCollections()
  const allPhotos = getPhotos()

  // Pre-populate form with current chronicle values; empty string for absent optional fields.
  const initial = {
    id: chronicle.id,
    title: chronicle.title,
    subtitle: chronicle.subtitle ?? '',
    date: chronicle.date ?? '',
    dateLabel: chronicle.dateLabel ?? '',
    body: chronicle.body,
    peopleIds: chronicle.peopleIds,
    collectionIds: chronicle.collectionIds,
    coverPhotoId: chronicle.coverPhotoId ?? '',
    audioFilename: chronicle.audioFilename ?? '',
    audioDuration: chronicle.audioDuration ?? '',
  }

  return (
    <div className="py-11 px-7 md:px-11 max-w-3xl mx-auto">
      <Link
        href="/admin/chronicles"
        className="text-quiet text-xs uppercase tracking-[0.22em] hover:text-navy transition-colors mb-6 inline-block"
      >
        ← Back to chronicles
      </Link>
      <p className="eyebrow text-gold-deep mb-3">EDITING · {chronicle.title.toUpperCase()}</p>
      <h1 className="font-serif text-navy text-4xl mb-1">{chronicle.title}</h1>
      {chronicle.dateLabel && (
        <p className="font-serif italic text-muted text-base mb-9">{chronicle.dateLabel}</p>
      )}

      <EditChronicleForm
        mode="update"
        chronicleId={chronicle.id}
        initial={initial}
        allPeople={allPeople}
        allCollections={allCollections}
        allPhotos={allPhotos}
      />
    </div>
  )
}
