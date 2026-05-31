// app/admin/photos/page.tsx
// Admin photographs list - thumbnail grid with edit links and an upload button.
// Auth gate enforced by requireAdminOrRedirect() (not the layout).
import Image from 'next/image'
import Link from 'next/link'
import { getPhotos } from '@/lib/content'
import { getPhotoUrl } from '@/lib/utils'
import { requireAdminOrRedirect } from '@/lib/admin'
import type { Photo } from '@/lib/types'
import ImportHeroButton from '@/components/admin/ImportHeroButton'

export const metadata = {
  title: 'Photographs · Admin · The Curry Family',
}

// Shared thumbnail grid for a set of photos.
function PhotoGridSection({ photos }: { photos: Photo[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {photos.map((photo) => (
        <div key={photo.id} className="flex flex-col gap-2">
          <Link
            href={`/admin/photos/${photo.id}`}
            className="group block relative aspect-[4/3] bg-ivory overflow-hidden rounded border hairline hover:border-navy transition-colors"
          >
            <Image
              src={getPhotoUrl(photo)}
              alt={photo.caption ?? 'Family photograph'}
              fill
              sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
              {...(photo.blurDataUrl ? { placeholder: 'blur' as const, blurDataURL: photo.blurDataUrl } : {})}
            />
          </Link>
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              {photo.dateLabel && <p className="eyebrow text-quiet text-[10px] truncate">{photo.dateLabel}</p>}
              {photo.caption
                ? <p className="font-serif text-navy text-xs leading-snug line-clamp-2">{photo.caption}</p>
                : <p className="font-serif italic text-muted text-xs">{photo.id}</p>}
            </div>
            <Link href={`/admin/photos/${photo.id}`} className="eyebrow text-gold-deep hover:text-gold transition-colors text-[10px] shrink-0">
              Edit →
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}

export default async function AdminPhotosListPage() {
  await requireAdminOrRedirect()
  const photos = getPhotos()

  // Sort by date descending - newest first
  const sorted = [...photos].sort((a, b) => {
    const da = a.date ?? a.dateTaken ?? ''
    const db = b.date ?? b.dateTaken ?? ''
    if (!da && !db) return 0
    if (!da) return 1
    if (!db) return -1
    return db.localeCompare(da)
  })
  // Hero images are admin-only (visibility hidden) — show them as a separate
  // "Hero images" folder so they can be cropped/tagged, kept out of the main
  // gallery list. The public never sees them (hidden + no collection).
  const heroPhotos = sorted.filter((p) => p.inHero)
  const regularPhotos = sorted.filter((p) => !p.inHero)

  return (
    <div className="py-11 px-7 md:px-11 max-w-6xl mx-auto">
      <Link
        href="/admin"
        className="text-quiet text-xs uppercase tracking-[0.22em] hover:text-navy transition-colors mb-6 inline-block"
      >
        ← Back to admin
      </Link>
      <p className="eyebrow text-gold-deep mb-3">FAMILY ARCHIVE · ADMIN</p>
      <div className="flex items-end justify-between mb-2 gap-4">
        <h1 className="font-serif text-navy text-4xl">Photographs</h1>
        <Link
          href="/admin/photos/new"
          className="bg-navy text-white px-5 py-2 rounded font-sans text-sm hover:bg-navy-light transition-colors shrink-0"
        >
          + Upload photo
        </Link>
      </div>
      <p className="font-serif italic text-muted text-base mb-9">
        {regularPhotos.length} {regularPhotos.length === 1 ? 'photograph' : 'photographs'} in the archive.
      </p>

      {/* Hero images folder - admin-only; croppable/taggable like any photo but
          never shown in the public gallery (visibility hidden, no collection). */}
      <section className="mb-12 surface-card-static p-6">
        <div className="flex items-end justify-between gap-4 mb-1">
          <h2 className="font-serif text-navy text-2xl">Hero images</h2>
          <ImportHeroButton />
        </div>
        <p className="text-quiet text-xs mb-5 max-w-2xl">
          The home-page rotation images. Admin-only — these never appear in the public Photographs gallery. Open one to crop a person out of it and tag them; set that person&rsquo;s visibility to show the cropped image on their profile or tree. Click &ldquo;Import hero images&rdquo; once to bring your current rotation in.
        </p>
        {heroPhotos.length === 0 ? (
          <p className="text-muted text-sm font-serif italic">No hero images imported yet. Click &ldquo;Import hero images&rdquo; to pull in your current rotation.</p>
        ) : (
          <PhotoGridSection photos={heroPhotos} />
        )}
      </section>

      {regularPhotos.length === 0 ? (
        <p className="text-muted text-sm font-serif italic">No photographs yet. Upload the first one.</p>
      ) : (
        <PhotoGridSection photos={regularPhotos} />
      )}
    </div>
  )
}
