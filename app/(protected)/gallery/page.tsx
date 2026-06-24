// app/(protected)/gallery/page.tsx
// Family upload gallery. Available to ANY logged-in family member — gated by
// await auth() here, independently of middleware (defence in depth), in addition
// to the (protected) layout's own gate.
//
// Lists family-uploaded images from Vercel Blob (uploads/meta/ prefix) at request
// time, so a fresh upload appears without a rebuild. Separate from /photographs
// (the curated, collection-organised admin archive).
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getUploads } from '@/lib/uploads'
import UploadCard from '@/components/gallery/UploadCard'

export const metadata = {
  title: 'Family gallery · The Curry Family',
}

// Blob listing happens at request time — never prerender.
export const dynamic = 'force-dynamic'

export default async function GalleryPage() {
  const session = await auth()
  if (!session) {
    redirect('/login')
  }

  const uploads = await getUploads()

  return (
    <main className="py-14 md:py-20 px-7 md:px-11 lg:px-15">
      {/* Header */}
      <header className="mb-12 max-w-4xl">
        <div className="flex items-center gap-3 mb-5" aria-hidden="true">
          <span className="block w-10 h-px bg-gold-deep" />
          <span className="block w-1.5 h-1.5 rounded-full bg-gold" />
        </div>
        <p className="eyebrow text-gold-deep mb-4">Family archive</p>
        <h1 className="font-serif text-navy text-5xl md:text-6xl mb-4 leading-tight">Gallery</h1>
        <p className="font-serif italic text-muted text-lg md:text-xl leading-relaxed">
          Photographs shared by the family.
        </p>
        <Link
          href="/upload"
          className="eyebrow text-gold-deep hover:text-gold transition-colors mt-6 inline-block"
        >
          Add a photo {'→'}
        </Link>
      </header>

      {uploads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-7 text-center">
          <p className="eyebrow text-quiet mb-4">Family archive</p>
          <h2 className="font-serif text-navy text-xl mb-3">No photographs yet</h2>
          <p className="text-muted text-sm max-w-sm mb-6">
            Be the first to share a family photograph. It will appear here for everyone.
          </p>
          <Link
            href="/upload"
            className="bg-navy text-white px-6 py-2.5 rounded font-sans text-base hover:bg-navy-light transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
          >
            Add a photo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7">
          {uploads.map((upload) => (
            <UploadCard key={upload.id} upload={upload} />
          ))}
        </div>
      )}
    </main>
  )
}
