// app/admin/people/page.tsx
// Admin people list — shows all family members with "Edit bio" links.
// Auth gate is handled by the parent app/admin/layout.tsx.
import Link from 'next/link'
import { getPeople } from '@/lib/content'

export const metadata = {
  title: 'People · Admin · The Curry Family',
}

export default function AdminPeopleListPage() {
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
      <h1 className="font-serif text-navy text-4xl mb-2">People</h1>
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
              Edit bio →
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-quiet text-xs mt-8 italic font-serif">
        Phase 1 ships bio editing only. Editing dates, relationships, and other fields comes in v3 Phase 21.
      </p>
    </div>
  )
}
