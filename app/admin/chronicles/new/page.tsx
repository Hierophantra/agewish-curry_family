// app/admin/chronicles/new/page.tsx
// Admin new-chronicle page - renders EditChronicleForm in create mode.
// Auth gate is enforced by requireAdminOrRedirect() (not the layout).
import Link from 'next/link'
import { getPeople, getCollections, getPhotos } from '@/lib/content'
import { requireAdminOrRedirect } from '@/lib/admin'
import EditChronicleForm from '@/components/admin/EditChronicleForm'
import type { ChronicleFormValues } from '@/components/admin/EditChronicleForm'

export const metadata = {
  title: 'New chronicle · Admin · The Curry Family',
}

const EMPTY_INITIAL: ChronicleFormValues = {
  id: '',
  title: '',
  subtitle: '',
  date: '',
  dateLabel: '',
  body: '',
  peopleIds: [],
  collectionIds: [],
  coverPhotoId: '',
  audioFilename: '',
  audioDuration: '',
}

export default async function AdminNewChroniclePage() {
  await requireAdminOrRedirect()

  const allPeople = getPeople()
  const allCollections = getCollections()
  const allPhotos = getPhotos()

  return (
    <div className="py-11 px-7 md:px-11 max-w-3xl mx-auto">
      <Link
        href="/admin/chronicles"
        className="text-quiet text-xs uppercase tracking-[0.22em] hover:text-navy transition-colors mb-6 inline-block"
      >
        ← Back to chronicles
      </Link>
      <p className="eyebrow text-gold-deep mb-3">FAMILY ARCHIVE · ADMIN</p>
      <h1 className="font-serif text-navy text-4xl mb-8">New chronicle</h1>

      <EditChronicleForm
        mode="create"
        initial={EMPTY_INITIAL}
        allPeople={allPeople}
        allCollections={allCollections}
        allPhotos={allPhotos}
      />
    </div>
  )
}
