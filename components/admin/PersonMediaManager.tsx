'use client'
// components/admin/PersonMediaManager.tsx
// Per-person media manager for the admin person page.
//
// Lists every photo and video LINKED to this person (peopleIds includes them),
// including hidden ones, and lets the archivist:
//   - set each item's visibility: Hidden / Profile + tree / Everywhere
//   - upload a new photo that is auto-linked to this person (defaults to
//     "Profile + tree" visibility)
//
// Visibility semantics (mirrors lib/content.ts filtering):
//   hidden     -> linked for the record, shown nowhere
//   profile    -> person page + family-tree snippet only
//   everywhere -> profile + tree AND the general gallery / collections
//
// Each visibility change is an immediate PATCH; uploads append a record.
// All writes commit to GitHub and the live site updates on the next deploy.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getPhotoUrl } from '@/lib/utils'
import type { Photo, Video, Visibility } from '@/lib/types'

interface Props {
  personId: string
  personName: string
  photos: Photo[]   // ALL photos linked to this person (incl. hidden)
  videos: Video[]   // ALL videos linked to this person (incl. hidden)
}

const VIS_OPTIONS: Array<{ value: Visibility; label: string; help: string }> = [
  { value: 'hidden', label: 'Hidden', help: 'Linked for the record, shown nowhere' },
  { value: 'profile', label: 'Profile + tree', help: 'On this person’s page and the family-tree snippet only' },
  { value: 'everywhere', label: 'Everywhere', help: 'Profile, tree, and the general gallery' },
]

function videoThumb(v: Video): string | null {
  if (v.thumbnailUrl) return v.thumbnailUrl
  if (v.source === 'youtube') return `https://i.ytimg.com/vi/${v.sourceId}/hqdefault.jpg`
  return null
}

export default function PersonMediaManager({ personId, personName, photos, videos }: Props) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [caption, setCaption] = useState('')

  async function setVisibility(kind: 'photos' | 'videos', id: string, visibility: Visibility) {
    setBusyId(id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/${kind}/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility }),
      })
      if (!res.ok) throw new Error((await res.text()) || `${res.status}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusyId(null)
    }
  }

  async function uploadPhoto(file: File) {
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      if (caption.trim()) fd.append('caption', caption.trim())
      const res = await fetch(`/api/admin/people/${personId}/photos`, { method: 'POST', body: fd })
      if (!res.ok) throw new Error((await res.text()) || `${res.status}`)
      setCaption('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setUploading(false)
    }
  }

  // A single visibility selector (segmented control) shared by photos + videos.
  function VisibilityControl({ kind, item }: { kind: 'photos' | 'videos'; item: { id: string; visibility?: Visibility } }) {
    const current = item.visibility ?? 'everywhere'
    return (
      <div role="group" aria-label="Visibility" className="flex flex-wrap gap-1.5">
        {VIS_OPTIONS.map((opt) => {
          const active = current === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => !active && setVisibility(kind, item.id, opt.value)}
              disabled={busyId === item.id}
              title={opt.help}
              className={[
                'px-2.5 py-1 rounded text-xs border transition-colors',
                active
                  ? opt.value === 'hidden'
                    ? 'border-stone bg-[color:var(--color-surface-subtle)] text-quiet'
                    : 'border-navy bg-[color:var(--color-surface-subtle)] text-navy'
                  : 'border-[color:var(--color-border)] text-muted hover:text-navy',
                busyId === item.id ? 'opacity-50 cursor-wait' : '',
              ].join(' ')}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    )
  }

  const hasMedia = photos.length > 0 || videos.length > 0

  return (
    <section className="mt-12 pt-10 border-t border-[color:var(--color-border)]">
      <h2 className="font-serif text-navy text-2xl mb-1">Photos &amp; videos</h2>
      <p className="text-muted text-sm mb-6 max-w-2xl">
        Media linked to {personName}. Set where each item appears. New uploads
        start as &ldquo;Profile + tree&rdquo; so nothing goes to the public
        gallery until you choose it.
      </p>

      {error && (
        <p className="font-serif italic text-red-600 text-sm mb-4">Error: {error}</p>
      )}

      {/* Upload zone */}
      <div className="surface-card-static p-6 mb-8 flex flex-col sm:flex-row sm:items-end gap-4">
        <label className="flex-1 flex flex-col gap-1.5">
          <span className="eyebrow text-quiet text-[10px]">Caption (optional)</span>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={`e.g. ${personName} at the lake, 1985`}
            disabled={uploading}
            className="w-full px-4 py-2.5 border border-stone rounded font-sans text-base text-navy bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-50"
          />
        </label>
        <label className="shrink-0 inline-flex items-center justify-center bg-navy text-white px-5 py-2.5 rounded font-sans text-sm hover:opacity-90 transition-opacity cursor-pointer focus-within:ring-2 focus-within:ring-gold focus-within:ring-offset-2">
          {uploading ? 'Uploading...' : 'Upload new image'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) uploadPhoto(f)
              e.target.value = ''
            }}
          />
        </label>
      </div>

      {!hasMedia && (
        <p className="font-serif italic text-muted text-base">
          No photos or videos linked to {personName} yet. Upload one above, or tag
          this person on a photo/video from the Photographs / Videos editors.
        </p>
      )}

      {/* Photos */}
      {photos.length > 0 && (
        <div className="mb-8">
          <p className="eyebrow text-quiet mb-3">{photos.length} photo{photos.length === 1 ? '' : 's'}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {photos.map((p) => (
              <article key={p.id} className="surface-card-static p-4 flex gap-4">
                <div className="surface-inset w-28 h-28 shrink-0 overflow-hidden border border-[color:var(--color-border)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getPhotoUrl(p)} alt={p.caption ?? ''} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex flex-col gap-2">
                  <p className="font-serif text-navy text-sm leading-snug line-clamp-2">
                    {p.caption || <span className="text-quiet italic">No caption</span>}
                  </p>
                  {p.dateLabel && <p className="text-quiet text-xs">{p.dateLabel}</p>}
                  <VisibilityControl kind="photos" item={p} />
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* Videos */}
      {videos.length > 0 && (
        <div>
          <p className="eyebrow text-quiet mb-3">{videos.length} video{videos.length === 1 ? '' : 's'}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {videos.map((v) => {
              const thumb = videoThumb(v)
              return (
                <article key={v.id} className="surface-card-static p-4 flex gap-4">
                  <div className="surface-inset w-28 h-20 shrink-0 overflow-hidden border border-[color:var(--color-border)]">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-navy" />
                    )}
                  </div>
                  <div className="min-w-0 flex flex-col gap-2">
                    <p className="font-serif text-navy text-sm leading-snug line-clamp-2">{v.title}</p>
                    {v.dateLabel && <p className="text-quiet text-xs">{v.dateLabel}</p>}
                    <VisibilityControl kind="videos" item={v} />
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
