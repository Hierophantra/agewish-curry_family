// app/admin/page.tsx
// Admin index — shows the available content sections.
// Only "People" is live in Phase 1; all others are "coming soon" stubs.
//
// Auth check: requireAdminOrRedirect() at the top of this Server Component.
// (Auth is enforced per-page, not in the layout — see app/admin/layout.tsx for why.)
import Link from 'next/link'
import { requireAdminOrRedirect } from '@/lib/admin'

const sections = [
  { href: '/admin/people', label: 'People', desc: 'Edit family member bios, dates, and relationships', status: 'live' },
  { href: '#', label: 'Photographs', desc: 'Upload photos, edit captions, manage collections', status: 'soon' },
  { href: '#', label: 'Videos', desc: 'Add YouTube/Vimeo links, edit titles, manage playlists', status: 'soon' },
  { href: '#', label: 'Audio', desc: 'Upload voice recordings, edit metadata', status: 'soon' },
  { href: '#', label: 'Collections', desc: 'Create and manage photo collections', status: 'soon' },
  { href: '#', label: 'Playlists', desc: 'Create and manage video playlists', status: 'soon' },
] as const

export default async function AdminIndex() {
  await requireAdminOrRedirect()
  return (
    <div className="py-11 px-7 md:px-11 max-w-5xl mx-auto">
      <p className="eyebrow text-gold-deep mb-3">FAMILY ARCHIVE · ADMIN</p>
      <h1 className="font-serif text-navy text-5xl mb-2">Edit the archive</h1>
      <p className="font-serif italic text-muted text-lg mb-12 max-w-prose">
        Make changes here. Updates publish to the live site within a couple minutes via the next deploy.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {sections.map((s) => {
          const isLive = s.status === 'live'
          if (isLive) {
            return (
              <Link
                key={s.label}
                href={s.href}
                className="block p-7 border border-navy hover:bg-ivory hover:-translate-y-0.5 hover:shadow-sm transition-all rounded-lg"
              >
                <p className="eyebrow text-gold-deep mb-2 text-[10px]">EDIT</p>
                <h2 className="font-serif text-navy text-2xl mb-1">{s.label}</h2>
                <p className="text-muted text-sm">{s.desc}</p>
              </Link>
            )
          }
          return (
            <div
              key={s.label}
              className="block p-7 border border-stone bg-ivory/40 cursor-default opacity-60 rounded-lg"
            >
              <p className="eyebrow text-quiet mb-2 text-[10px]">COMING SOON</p>
              <h2 className="font-serif text-navy text-2xl mb-1">{s.label}</h2>
              <p className="text-muted text-sm">{s.desc}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
