// app/admin/audio/new/page.tsx
// Admin new-audio page - renders EditAudioForm in create mode.
// Auth gate is enforced by requireAdminOrRedirect() (not the layout).
import Link from 'next/link'
import { getPeople, getCollections } from '@/lib/content'
import { requireAdminOrRedirect } from '@/lib/admin'
import EditAudioForm from '@/components/admin/EditAudioForm'
import type { AudioFormValues } from '@/components/admin/EditAudioForm'

export const metadata = {
  title: 'Upload audio · Admin · The Curry Family',
}

const EMPTY_INITIAL: AudioFormValues = {
  id: '',
  title: '',
  description: '',
  date: '',
  dateLabel: '',
  duration: '',
  peopleIds: [],
  collectionIds: [],
}

export default async function AdminNewAudioPage() {
  await requireAdminOrRedirect()

  const allPeople = getPeople()
  const allCollections = getCollections()

  return (
    <div className="py-11 px-7 md:px-11 max-w-3xl mx-auto">
      <Link
        href="/admin/audio"
        className="text-quiet text-xs uppercase tracking-[0.22em] hover:text-navy transition-colors mb-6 inline-block"
      >
        ← Back to audio recordings
      </Link>
      <p className="eyebrow text-gold-deep mb-3">FAMILY ARCHIVE · ADMIN</p>
      <h1 className="font-serif text-navy text-4xl mb-2">Upload audio recording</h1>
      <p className="font-serif italic text-muted text-base mb-8">
        Choose an MP3, M4A, AAC, or WAV file (4MB max). It will be uploaded to secure cloud storage,
        and a JSON entry will be committed to the archive within 90 seconds.
      </p>

      <EditAudioForm
        mode="create"
        initial={EMPTY_INITIAL}
        allPeople={allPeople}
        allCollections={allCollections}
      />
    </div>
  )
}
