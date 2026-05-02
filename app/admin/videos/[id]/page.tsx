// app/admin/videos/[id]/page.tsx
// Admin edit page for a single video. Auth gate is enforced by requireAdminOrRedirect().
// Renders EditVideoForm in update mode with the video's current values.
// Returns notFound() if the video id doesn't exist in content/videos.json.
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getVideoById, getPeople, getPlaylists } from '@/lib/content'
import { requireAdminOrRedirect } from '@/lib/admin'
import EditVideoForm from '@/components/admin/EditVideoForm'

export function generateMetadata({ params }: { params: { id: string } }) {
  const video = getVideoById(params.id)
  if (!video) return { title: 'Video not found · Admin · The Curry Family' }
  return { title: `Edit ${video.title} · Admin · The Curry Family` }
}

export default async function AdminEditVideoPage({ params }: { params: { id: string } }) {
  await requireAdminOrRedirect()

  const video = getVideoById(params.id)
  if (!video) notFound()

  const allPeople = getPeople()
  const allPlaylists = getPlaylists()

  // Pre-populate form with current video values; empty string for absent optional fields.
  const initial = {
    id: video.id,
    title: video.title,
    description: video.description ?? '',
    source: video.source,
    sourceId: video.sourceId,
    date: video.date ?? '',
    dateLabel: video.dateLabel ?? '',
    duration: video.duration ?? '',
    featured: video.featured,
    peopleIds: video.peopleIds,
    playlistIds: video.playlistIds,
  }

  return (
    <div className="py-11 px-7 md:px-11 max-w-3xl mx-auto">
      <Link
        href="/admin/videos"
        className="text-quiet text-xs uppercase tracking-[0.22em] hover:text-navy transition-colors mb-6 inline-block"
      >
        ← Back to videos
      </Link>
      <p className="eyebrow text-gold-deep mb-3">EDITING · {video.title.toUpperCase()}</p>
      <h1 className="font-serif text-navy text-4xl mb-1">{video.title}</h1>
      {video.dateLabel && (
        <p className="font-serif italic text-muted text-base mb-9">{video.dateLabel}</p>
      )}

      <EditVideoForm
        mode="update"
        videoId={video.id}
        initial={initial}
        allPeople={allPeople}
        allPlaylists={allPlaylists}
      />
    </div>
  )
}
