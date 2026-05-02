// app/admin/photos/new/page.tsx
// Admin new-photograph page — renders EditPhotoForm in create mode.
// Auth gate is enforced by requireAdminOrRedirect() (not the layout).
import Link from 'next/link'
import { getPeople, getCollections } from '@/lib/content'
import { requireAdminOrRedirect } from '@/lib/admin'
import EditPhotoForm from '@/components/admin/EditPhotoForm'
import type { PhotoFormValues } from '@/components/admin/EditPhotoForm'

export const metadata = {
  title: 'Upload photo · Admin · The Curry Family',
}

const EMPTY_INITIAL: PhotoFormValues = {
  id: '',
  caption: '',
  date: '',
  dateLabel: '',
  location: '',
  notes: '',
  peopleIds: [],
  collectionIds: [],
}

export default async function AdminNewPhotoPage() {
  await requireAdminOrRedirect()

  const allPeople = getPeople()
  const allCollections = getCollections()

  return (
    <div className="py-11 px-7 md:px-11 max-w-3xl mx-auto">
      <Link
        href="/admin/photos"
        className="text-quiet text-xs uppercase tracking-[0.22em] hover:text-navy transition-colors mb-6 inline-block"
      >
        ← Back to photographs
      </Link>
      <p className="eyebrow text-gold-deep mb-3">FAMILY ARCHIVE · ADMIN</p>
      <h1 className="font-serif text-navy text-4xl mb-2">Upload photograph</h1>
      <p className="font-serif italic text-muted text-base mb-8">
        Choose a JPEG, PNG, or WebP image (4MB max). It will be uploaded to secure cloud storage,
        and a JSON entry will be committed to the archive within 90 seconds.
      </p>

      <EditPhotoForm
        mode="create"
        initial={EMPTY_INITIAL}
        allPeople={allPeople}
        allCollections={allCollections}
      />
    </div>
  )
}
