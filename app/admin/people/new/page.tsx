// app/admin/people/new/page.tsx
// Admin new-person page - renders EditPersonForm in create mode.
// Auth gate is enforced by requireAdminOrRedirect() (not the layout).
import Link from 'next/link'
import { getPeople } from '@/lib/content'
import { requireAdminOrRedirect } from '@/lib/admin'
import EditPersonForm from '@/app/admin/people/[id]/EditPersonForm'
import type { PersonFormValues } from '@/app/admin/people/[id]/EditPersonForm'

export const metadata = {
  title: 'New person · Admin · The Curry Family',
}

const EMPTY_INITIAL: PersonFormValues = {
  id: '',
  name: '',
  relationLabel: '',
  eyebrow: '',
  birthDate: '',
  deathDate: '',
  datesLabel: '',
  birthplace: '',
  spouseLabel: '',
  parentIds: [],
  childrenIds: [],
}

export default async function AdminNewPersonPage() {
  await requireAdminOrRedirect()
  const allPeople = getPeople()

  return (
    <div className="py-11 px-7 md:px-11 max-w-3xl mx-auto">
      <Link
        href="/admin/people"
        className="text-quiet text-xs uppercase tracking-[0.22em] hover:text-navy transition-colors mb-6 inline-block"
      >
        ← Back to people
      </Link>
      <p className="eyebrow text-gold-deep mb-3">FAMILY ARCHIVE · ADMIN</p>
      <h1 className="font-serif text-navy text-4xl mb-2">Add a person</h1>
      <p className="font-serif italic text-muted text-base mb-8">
        Create a new family member record. The ID is permanent - choose it carefully. Parent and child
        relationships will be set bidirectionally in the archive automatically.
      </p>

      <EditPersonForm
        mode="create"
        initial={EMPTY_INITIAL}
        allPeople={allPeople}
      />
    </div>
  )
}
