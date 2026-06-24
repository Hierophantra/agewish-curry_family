// app/(protected)/upload/page.tsx
// Family image-upload page. Available to ANY logged-in family member (NOT just
// admins): gated by await auth() here, independently of middleware (defence in
// depth, CVE-2025-29927), in addition to the (protected) layout's own gate.
//
// Server Component: gathers the people-name autocomplete pool (prior upload
// names ∪ family-tree names) and hands it to the client form.
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getPeopleNameSuggestions, isBlobConfigured } from '@/lib/uploads'
import FamilyUploadForm from '@/components/upload/FamilyUploadForm'

export const metadata = {
  title: 'Add a photo · The Curry Family',
}

// Blob listing happens at request time — never prerender.
export const dynamic = 'force-dynamic'

export default async function UploadPage() {
  const session = await auth()
  if (!session) {
    redirect('/login')
  }

  const peopleSuggestions = await getPeopleNameSuggestions()
  const blobReady = isBlobConfigured()

  return (
    <main className="py-14 md:py-20 px-7 md:px-11 lg:px-15">
      <div className="max-w-3xl mx-auto">
        {/* Header — matching the editorial rhythm of the other pages. */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-5" aria-hidden="true">
            <span className="block w-10 h-px bg-gold-deep" />
            <span className="block w-1.5 h-1.5 rounded-full bg-gold" />
          </div>
          <p className="eyebrow text-gold-deep mb-4">Family archive</p>
          <h1 className="font-serif text-navy text-4xl md:text-5xl mb-4 leading-tight">
            Add a photo
          </h1>
          <p className="font-serif italic text-muted text-lg leading-relaxed">
            Share a photograph with the family. Tell us who is in it and when it was taken, if you know.
          </p>
        </header>

        {!blobReady && (
          <div className="mb-8 rounded border border-[color:var(--color-border)] bg-[color:var(--color-surface-subtle)] px-5 py-4">
            <p className="font-serif italic text-muted text-sm">
              Photo storage is not configured yet, so uploads will not save. An administrator needs to
              connect a Vercel Blob store (the <span className="font-sans">BLOB_READ_WRITE_TOKEN</span>{' '}
              environment variable) and redeploy.
            </p>
          </div>
        )}

        <FamilyUploadForm peopleSuggestions={peopleSuggestions} />
      </div>
    </main>
  )
}
