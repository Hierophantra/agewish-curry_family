// app/admin/audio/[id]/page.tsx
// Admin edit page for a single audio recording. Auth gate enforced by requireAdminOrRedirect().
// Renders EditAudioForm in update mode with the recording's current values.
// Returns notFound() if the audio id doesn't exist in content/audio.json.
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAudioById, getPeople, getCollections } from '@/lib/content'
import { requireAdminOrRedirect } from '@/lib/admin'
import EditAudioForm from '@/components/admin/EditAudioForm'

export function generateMetadata({ params }: { params: { id: string } }) {
  const audio = getAudioById(params.id)
  if (!audio) return { title: 'Recording not found · Admin · The Curry Family' }
  return { title: `Edit ${audio.title} · Admin · The Curry Family` }
}

export default async function AdminEditAudioPage({ params }: { params: { id: string } }) {
  await requireAdminOrRedirect()

  const audio = getAudioById(params.id)
  if (!audio) notFound()

  const allPeople = getPeople()
  const allCollections = getCollections()

  // Pre-populate form with current audio values; empty string for absent optional fields.
  const initial = {
    id: audio.id,
    title: audio.title,
    description: audio.description ?? '',
    date: audio.date ?? '',
    dateLabel: audio.dateLabel ?? '',
    duration: audio.duration ?? '',
    peopleIds: audio.peopleIds,
    collectionIds: audio.collectionIds,
  }

  return (
    <div className="py-11 px-7 md:px-11 max-w-3xl mx-auto">
      <Link
        href="/admin/audio"
        className="text-quiet text-xs uppercase tracking-[0.22em] hover:text-navy transition-colors mb-6 inline-block"
      >
        ← Back to audio recordings
      </Link>
      <p className="eyebrow text-gold-deep mb-3">
        EDITING · {audio.title.toUpperCase()}
      </p>
      <h1 className="font-serif text-navy text-4xl mb-1">
        {audio.title}
      </h1>
      {audio.dateLabel && (
        <p className="font-serif italic text-muted text-base mb-9">{audio.dateLabel}</p>
      )}

      <EditAudioForm
        mode="update"
        audioId={audio.id}
        currentFilename={audio.filename}
        initial={initial}
        allPeople={allPeople}
        allCollections={allCollections}
      />
    </div>
  )
}
