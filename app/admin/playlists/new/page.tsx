// app/admin/playlists/new/page.tsx
// Admin new-playlist page — renders EditPlaylistForm in create mode.
// Auth gate is enforced by requireAdminOrRedirect() (not the layout).
import Link from 'next/link'
import { getVideos } from '@/lib/content'
import { requireAdminOrRedirect } from '@/lib/admin'
import EditPlaylistForm from '@/components/admin/EditPlaylistForm'
import type { PlaylistFormValues } from '@/components/admin/EditPlaylistForm'

export const metadata = {
  title: 'New playlist · Admin · The Curry Family',
}

const EMPTY_INITIAL: PlaylistFormValues = {
  id: '',
  title: '',
  subtitle: '',
  description: '',
  coverVideoId: '',
}

export default async function AdminNewPlaylistPage() {
  await requireAdminOrRedirect()

  const allVideos = getVideos()

  return (
    <div className="py-11 px-7 md:px-11 max-w-3xl mx-auto">
      <Link
        href="/admin/playlists"
        className="text-quiet text-xs uppercase tracking-[0.22em] hover:text-navy transition-colors mb-6 inline-block"
      >
        ← Back to playlists
      </Link>
      <p className="eyebrow text-gold-deep mb-3">FAMILY ARCHIVE · ADMIN</p>
      <h1 className="font-serif text-navy text-4xl mb-8">New playlist</h1>

      <EditPlaylistForm
        mode="create"
        initial={EMPTY_INITIAL}
        allVideos={allVideos}
      />
    </div>
  )
}
