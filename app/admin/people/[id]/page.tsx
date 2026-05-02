// app/admin/people/[id]/page.tsx
// Admin edit page for a single person's bio.
// Auth gate is enforced by requireAdminOrRedirect() in the page (NOT the layout —
// see app/admin/layout.tsx for the rationale).
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPersonById } from '@/lib/content'
import { requireAdminOrRedirect } from '@/lib/admin'
import EditPersonBioForm from './EditPersonBioForm'

export function generateMetadata({ params }: { params: { id: string } }) {
  const person = getPersonById(params.id)
  if (!person) return { title: 'Person not found · Admin · The Curry Family' }
  return { title: `Edit ${person.name} · Admin · The Curry Family` }
}

export default async function AdminEditPersonPage({ params }: { params: { id: string } }) {
  await requireAdminOrRedirect()
  const person = getPersonById(params.id)
  if (!person) notFound()

  return (
    <div className="py-11 px-7 md:px-11 max-w-3xl mx-auto">
      <Link
        href="/admin/people"
        className="text-quiet text-xs uppercase tracking-[0.22em] hover:text-navy transition-colors mb-6 inline-block"
      >
        ← Back to people
      </Link>
      <p className="eyebrow text-gold-deep mb-3">EDITING · {person.name.toUpperCase()}</p>
      <h1 className="font-serif text-navy text-4xl mb-1">{person.name}</h1>
      {person.datesLabel && (
        <p className="font-serif italic text-muted text-base mb-9">{person.datesLabel}</p>
      )}

      <EditPersonBioForm
        personId={person.id}
        initialBio={person.bio ?? ''}
        personName={person.name}
      />
    </div>
  )
}
