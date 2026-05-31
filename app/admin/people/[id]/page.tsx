// app/admin/people/[id]/page.tsx
// Admin edit page for a single person's information.
// Fetches allPeople for the parent/child relationship pickers.
//
// Auth gate is enforced by requireAdminOrRedirect() in the page (NOT the layout -
// see app/admin/layout.tsx for the rationale).
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPersonById, getPeople, getAllPhotosByPersonId, getAllVideosByPersonId } from '@/lib/content'
import { requireAdminOrRedirect } from '@/lib/admin'
import EditPersonForm from './EditPersonForm'
import PersonMediaManager from '@/components/admin/PersonMediaManager'
import type { PersonFormValues } from './EditPersonForm'

export function generateMetadata({ params }: { params: { id: string } }) {
  const person = getPersonById(params.id)
  if (!person) return { title: 'Person not found · Admin · The Curry Family' }
  return { title: `Edit ${person.name} · Admin · The Curry Family` }
}

export default async function AdminEditPersonPage({ params }: { params: { id: string } }) {
  await requireAdminOrRedirect()
  const person = getPersonById(params.id)
  if (!person) notFound()

  const allPeople = getPeople()
  // ALL linked media (incl. hidden) so the admin can manage visibility.
  const linkedPhotos = getAllPhotosByPersonId(person.id)
  const linkedVideos = getAllVideosByPersonId(person.id)

  // Pre-populate the form with current values; empty string for absent optional fields.
  // birthplace falls back to the v1 birthPlace alias for old records that haven't migrated.
  const initial: PersonFormValues = {
    id: person.id,
    name: person.name,
    relationLabel: person.relationLabel ?? '',
    eyebrow: person.eyebrow ?? '',
    birthDate: person.birthDate ?? '',
    deathDate: person.deathDate ?? '',
    datesLabel: person.datesLabel ?? '',
    birthplace: person.birthplace ?? person.birthPlace ?? '',
    spouseLabel: person.spouseLabel ?? '',
    gender: person.gender ?? '',
    motherName: person.motherName ?? '',
    fatherName: person.fatherName ?? '',
    bio: person.bio ?? '',
    notes: person.notes ?? '',
    parentIds: person.parentIds ?? [],
    childrenIds: person.childrenIds ?? [],
  }

  return (
    <div className="py-11 px-7 md:px-11 max-w-3xl mx-auto">
      <Link
        href="/admin/people"
        className="text-quiet text-xs uppercase tracking-[0.22em] hover:text-navy transition-colors mb-6 inline-block"
      >
        {'←'} Back to people
      </Link>
      <p className="eyebrow text-gold-deep mb-3">EDITING · {person.name.toUpperCase()}</p>
      <h1 className="font-serif text-navy text-4xl mb-1">{person.name}</h1>
      {person.datesLabel && (
        <p className="font-serif italic text-muted text-base mb-9">{person.datesLabel}</p>
      )}

      <EditPersonForm
        mode="update"
        personId={person.id}
        initial={initial}
        allPeople={allPeople}
      />

      {/* Per-person photo + video management: link new uploads to this person
          and control where each item appears. */}
      <PersonMediaManager
        personId={person.id}
        personName={person.name}
        photos={linkedPhotos}
        videos={linkedVideos}
        treeCarouselPhotoIds={person.treeCarouselPhotoIds ?? []}
      />
    </div>
  )
}
