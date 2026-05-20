// app/admin/videos/new/page.tsx
// Admin new-video page - renders EditVideoForm in create mode.
// Auth gate is enforced by requireAdminOrRedirect() (not the layout).
import Link from 'next/link'
import { getPeople, getPlaylists } from '@/lib/content'
import { requireAdminOrRedirect } from '@/lib/admin'
import EditVideoForm from '@/components/admin/EditVideoForm'
import type { VideoFormValues } from '@/components/admin/EditVideoForm'

export const metadata = {
  title: 'New video · Admin · The Curry Family',
}

const EMPTY_INITIAL: VideoFormValues = {
  id: '',
  title: '',
  description: '',
  source: 'youtube',
  sourceId: '',
  date: '',
  dateLabel: '',
  duration: '',
  featured: false,
  peopleIds: [],
  playlistIds: [],
}

export default async function AdminNewVideoPage() {
  await requireAdminOrRedirect()

  const allPeople = getPeople()
  const allPlaylists = getPlaylists()

  return (
    <div className="py-11 px-7 md:px-11 max-w-3xl mx-auto">
      <Link
        href="/admin/videos"
        className="text-quiet text-xs uppercase tracking-[0.22em] hover:text-navy transition-colors mb-6 inline-block"
      >
        ← Back to videos
      </Link>
      <p className="eyebrow text-gold-deep mb-3">FAMILY ARCHIVE · ADMIN</p>
      <h1 className="font-serif text-navy text-4xl mb-8">New video</h1>

      <EditVideoForm
        mode="create"
        initial={EMPTY_INITIAL}
        allPeople={allPeople}
        allPlaylists={allPlaylists}
      />
    </div>
  )
}
