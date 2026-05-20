// app/admin/collections/new/page.tsx
// Admin new-collection page - renders EditCollectionForm in create mode.
// Auth gate is enforced by requireAdminOrRedirect() (not the layout).
import Link from 'next/link'
import { getPhotos } from '@/lib/content'
import { requireAdminOrRedirect } from '@/lib/admin'
import EditCollectionForm from '@/components/admin/EditCollectionForm'
import type { CollectionFormValues } from '@/components/admin/EditCollectionForm'

export const metadata = {
  title: 'New collection · Admin · The Curry Family',
}

const EMPTY_INITIAL: CollectionFormValues = {
  id: '',
  title: '',
  subtitle: '',
  description: '',
  dateLabel: '',
  date: '',
  coverPhotoId: '',
}

export default async function AdminNewCollectionPage() {
  await requireAdminOrRedirect()

  const allPhotos = getPhotos()

  return (
    <div className="py-11 px-7 md:px-11 max-w-3xl mx-auto">
      <Link
        href="/admin/collections"
        className="text-quiet text-xs uppercase tracking-[0.22em] hover:text-navy transition-colors mb-6 inline-block"
      >
        ← Back to collections
      </Link>
      <p className="eyebrow text-gold-deep mb-3">FAMILY ARCHIVE · ADMIN</p>
      <h1 className="font-serif text-navy text-4xl mb-8">New collection</h1>

      <EditCollectionForm
        mode="create"
        initial={EMPTY_INITIAL}
        allPhotos={allPhotos}
      />
    </div>
  )
}
