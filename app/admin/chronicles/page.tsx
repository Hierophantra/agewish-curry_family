// app/admin/chronicles/page.tsx
// Admin chronicles list - shows all chronicles with title + dateLabel + duration, plus edit links.
// Auth gate is enforced by requireAdminOrRedirect() in the page (NOT the layout -
// see app/admin/layout.tsx for the rationale).
import Link from 'next/link'
import { getChronicles } from '@/lib/content'
import { requireAdminOrRedirect } from '@/lib/admin'

export const metadata = {
  title: 'Chronicles · Admin · The Curry Family',
}

export default async function AdminChroniclesListPage() {
  await requireAdminOrRedirect()
  const chronicles = getChronicles()

  // Sort by date descending - newest first (same order as public /chronicles page)
  const sorted = [...chronicles].sort((a, b) => {
    if (!a.date && !b.date) return 0
    if (!a.date) return 1
    if (!b.date) return -1
    return b.date.localeCompare(a.date)
  })

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
        <h1 className="font-serif text-navy text-4xl">Chronicles</h1>
        <Link
          href="/admin/chronicles/new"
          className="bg-navy text-white px-5 py-2 rounded font-sans text-sm hover:bg-navy-light transition-colors shrink-0"
        >
          + New chronicle
        </Link>
      </div>
      <p className="font-serif italic text-muted text-base mb-9">
        {sorted.length} {sorted.length === 1 ? 'chronicle' : 'chronicles'} in the archive.
      </p>
      <ul className="flex flex-col divide-y divide-stone">
        {sorted.map((c) => (
          <li key={c.id} className="py-5 flex items-center justify-between gap-4">
            <div>
              {c.dateLabel && (
                <p className="eyebrow text-quiet text-[10px] mb-1">{c.dateLabel}</p>
              )}
              <p className="font-serif text-navy text-xl">{c.title}</p>
              {c.subtitle && (
                <p className="font-serif italic text-muted text-sm">{c.subtitle}</p>
              )}
              {c.audioDuration && (
                <p className="text-quiet text-xs mt-0.5">{c.audioDuration} audio</p>
              )}
            </div>
            <Link
              href={`/admin/chronicles/${c.id}`}
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
