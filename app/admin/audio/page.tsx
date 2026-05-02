// app/admin/audio/page.tsx
// Admin audio list — compact list with title, dateLabel, duration, and "Edit →" links.
// Auth gate enforced by requireAdminOrRedirect() (not the layout).
import Link from 'next/link'
import { getAudio } from '@/lib/content'
import { requireAdminOrRedirect } from '@/lib/admin'

export const metadata = {
  title: 'Audio · Admin · The Curry Family',
}

export default async function AdminAudioListPage() {
  await requireAdminOrRedirect()
  const audioItems = getAudio()

  // Sort by date descending — newest first; undated items go to the end
  const sorted = [...audioItems].sort((a, b) => {
    const da = a.date ?? ''
    const db = b.date ?? ''
    if (!da && !db) return 0
    if (!da) return 1
    if (!db) return -1
    return db.localeCompare(da)
  })

  return (
    <div className="py-11 px-7 md:px-11 max-w-4xl mx-auto">
      <Link
        href="/admin"
        className="text-quiet text-xs uppercase tracking-[0.22em] hover:text-navy transition-colors mb-6 inline-block"
      >
        ← Back to admin
      </Link>
      <p className="eyebrow text-gold-deep mb-3">FAMILY ARCHIVE · ADMIN</p>
      <div className="flex items-end justify-between mb-2 gap-4">
        <h1 className="font-serif text-navy text-4xl">Audio recordings</h1>
        <Link
          href="/admin/audio/new"
          className="bg-navy text-white px-5 py-2 rounded font-sans text-sm hover:bg-navy-light transition-colors shrink-0"
        >
          + Upload audio
        </Link>
      </div>
      <p className="font-serif italic text-muted text-base mb-9">
        {sorted.length} {sorted.length === 1 ? 'recording' : 'recordings'} in the archive.
      </p>

      {sorted.length === 0 ? (
        <p className="text-muted text-sm font-serif italic">No recordings yet. Upload the first one.</p>
      ) : (
        <div className="flex flex-col divide-y divide-stone">
          {sorted.map((audio) => (
            <div key={audio.id} className="flex items-center justify-between gap-4 py-4">
              <div className="min-w-0 flex-1">
                <p className="font-serif text-navy text-base leading-snug truncate">
                  {audio.title}
                </p>
                <p className="eyebrow text-quiet text-[10px] mt-0.5">
                  {[
                    audio.circa ? `Circa ${audio.dateLabel ?? ''}` : audio.dateLabel,
                    audio.duration,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              <Link
                href={`/admin/audio/${audio.id}`}
                className="eyebrow text-gold-deep hover:text-gold transition-colors text-[10px] shrink-0"
              >
                Edit →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
