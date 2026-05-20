// app/admin/playlists/page.tsx
// Admin playlists list - shows all playlists with title, subtitle, video count,
// and an edit link.
// Auth gate is enforced by requireAdminOrRedirect() (not the layout).
import Link from 'next/link'
import { getPlaylists, getVideosInPlaylist } from '@/lib/content'
import { requireAdminOrRedirect } from '@/lib/admin'

export const metadata = {
  title: 'Playlists · Admin · The Curry Family',
}

export default async function AdminPlaylistsListPage() {
  await requireAdminOrRedirect()
  const playlists = getPlaylists()

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
        <h1 className="font-serif text-navy text-4xl">Playlists</h1>
        <Link
          href="/admin/playlists/new"
          className="bg-navy text-white px-5 py-2 rounded font-sans text-sm hover:bg-navy-light transition-colors shrink-0"
        >
          + New playlist
        </Link>
      </div>
      <p className="font-serif italic text-muted text-base mb-9">
        {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'} in the archive.
      </p>
      <ul className="flex flex-col divide-y divide-stone">
        {playlists.map((p) => {
          const videoCount = getVideosInPlaylist(p.id).length
          return (
            <li key={p.id} className="py-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-serif text-navy text-xl">{p.title}</p>
                {p.subtitle && (
                  <p className="font-serif italic text-muted text-sm mt-0.5">{p.subtitle}</p>
                )}
                <p className="text-quiet text-xs mt-0.5">
                  {videoCount} {videoCount === 1 ? 'video' : 'videos'}
                </p>
              </div>
              <Link
                href={`/admin/playlists/${p.id}`}
                className="eyebrow text-gold-deep hover:text-gold transition-colors text-[10px] shrink-0"
              >
                Edit →
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
