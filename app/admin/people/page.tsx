// app/admin/people/page.tsx
// Admin people list - shows all family members with "Edit" links and a "+ New person" button.
// Auth gate is enforced by requireAdminOrRedirect() in the page (NOT the layout -
// see app/admin/layout.tsx for the rationale).
import Link from 'next/link'
import { getPeople } from '@/lib/content'
import { requireAdminOrRedirect } from '@/lib/admin'

export const metadata = {
  title: 'People · Admin · The Curry Family',
}

export default async function AdminPeopleListPage() {
  await requireAdminOrRedirect()
  const people = getPeople()

  return (
    <div className="py-11 px-7 md:px-11 max-w-5xl mx-auto">
      <Link
        href="/admin"
        className="text-quiet text-xs uppercase tracking-[0.22em] hover:text-navy transition-colors mb-6 inline-block"
      >
        ← Back to admin
      </Link>
      <p className="eyebrow text-gold-deep mb-3">FAMILY ARCHIVE · ADMIN</p>
      <div className="flex items-start justify-between gap-4 mb-2">
        <h1 className="font-serif text-navy text-4xl">People</h1>
        <Link
          href="/admin/people/new"
          className="shrink-0 mt-1 bg-navy text-white px-5 py-2 rounded font-sans text-sm hover:bg-navy-light transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        >
          + New person
        </Link>
      </div>
      <p className="font-serif italic text-muted text-base mb-9">
        {people.length} {people.length === 1 ? 'person' : 'people'} in the archive.
      </p>
      <ul className="flex flex-col divide-y divide-stone">
        {people.map((p) => (
          <li key={p.id} className="py-5 flex items-center justify-between gap-4">
            <div>
              {p.relationLabel && (
                <p className="eyebrow text-quiet text-[10px] mb-1">{p.relationLabel}</p>
              )}
              <p className="font-serif text-navy text-xl">{p.name}</p>
              {p.datesLabel && (
                <p className="font-serif italic text-muted text-sm">{p.datesLabel}</p>
              )}
            </div>
            <Link
              href={`/admin/people/${p.id}`}
              className="eyebrow text-gold-deep hover:text-gold transition-colors text-[10px] shrink-0"
            >
              Edit →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
