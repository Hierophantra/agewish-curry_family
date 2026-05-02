// app/admin/videos/page.tsx
// Admin videos list — shows all videos with title, dateLabel, source/sourceId, plus edit links.
// Auth gate is enforced by requireAdminOrRedirect() in the page (NOT the layout —
// see app/admin/layout.tsx for the rationale).
import Link from 'next/link'
import { getVideos } from '@/lib/content'
import { requireAdminOrRedirect } from '@/lib/admin'

export const metadata = {
  title: 'Videos · Admin · The Curry Family',
}

export default async function AdminVideosListPage() {
  await requireAdminOrRedirect()
  const videos = getVideos()

  // Sort by date descending — newest first
  const sorted = [...videos].sort((a, b) => {
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
        <h1 className="font-serif text-navy text-4xl">Videos</h1>
        <Link
          href="/admin/videos/new"
          className="bg-navy text-white px-5 py-2 rounded font-sans text-sm hover:bg-navy-light transition-colors shrink-0"
        >
          + New video
        </Link>
      </div>
      <p className="font-serif italic text-muted text-base mb-9">
        {sorted.length} {sorted.length === 1 ? 'video' : 'videos'} in the archive.
      </p>
      <ul className="flex flex-col divide-y divide-stone">
        {sorted.map((v) => (
          <li key={v.id} className="py-5 flex items-center justify-between gap-4">
            <div>
              {v.dateLabel && (
                <p className="eyebrow text-quiet text-[10px] mb-1">{v.dateLabel}</p>
              )}
              <div className="flex items-center gap-2">
                <p className="font-serif text-navy text-xl">{v.title}</p>
                {v.featured && (
                  <span className="eyebrow text-gold-deep text-[10px] border border-gold-deep px-1.5 py-0.5 rounded">
                    FEATURED
                  </span>
                )}
              </div>
              <p className="text-quiet text-xs mt-0.5">
                {v.source} · {v.sourceId}
                {v.duration && ` · ${v.duration}`}
              </p>
            </div>
            <Link
              href={`/admin/videos/${v.id}`}
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
