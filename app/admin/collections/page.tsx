// app/admin/collections/page.tsx
// Admin collections list - shows all collections with title, subtitle, dateLabel,
// photo count, and an edit link.
// Auth gate is enforced by requireAdminOrRedirect() (not the layout).
import Link from 'next/link'
import { getCollections, getPhotosInCollection } from '@/lib/content'
import { requireAdminOrRedirect } from '@/lib/admin'

export const metadata = {
  title: 'Collections · Admin · The Curry Family',
}

export default async function AdminCollectionsListPage() {
  await requireAdminOrRedirect()
  const collections = getCollections()

  return (
    <div className="py-11 px-7 md:px-11 max-w-5xl mx-auto">
      <Link
        href="/admin"
        className="text-quiet text-xs uppercase tracking-[0.22em] hover:text-navy transition-colors mb-6 inline-block"
      >
        ← Back to admin
      </Link>
      <p className="eyebrow text-gold-deep mb-3">FAMILY ARCHIVE · ADMIN</p>
      <div className="flex items-end justify-between mb-2 gap-4">
        <h1 className="font-serif text-navy text-4xl">Collections</h1>
        <Link
          href="/admin/collections/new"
          className="bg-navy text-white px-5 py-2 rounded font-sans text-sm hover:bg-navy-light transition-colors shrink-0"
        >
          + New collection
        </Link>
      </div>
      <p className="font-serif italic text-muted text-base mb-9">
        {collections.length} {collections.length === 1 ? 'collection' : 'collections'} in the archive.
      </p>
      <ul className="flex flex-col divide-y divide-stone">
        {collections.map((c) => {
          const photoCount = getPhotosInCollection(c.id).length
          return (
            <li key={c.id} className="py-5 flex items-center justify-between gap-4">
              <div>
                {c.dateLabel && (
                  <p className="eyebrow text-quiet text-[10px] mb-1">{c.dateLabel}</p>
                )}
                <p className="font-serif text-navy text-xl">{c.title}</p>
                {c.subtitle && (
                  <p className="font-serif italic text-muted text-sm mt-0.5">{c.subtitle}</p>
                )}
                <p className="text-quiet text-xs mt-0.5">
                  {photoCount} {photoCount === 1 ? 'photo' : 'photos'}
                </p>
              </div>
              <Link
                href={`/admin/collections/${c.id}`}
                className="eyebrow text-gold-deep hover:text-gold transition-colors text-[10px] shrink-0"
              >
                Edit →
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
