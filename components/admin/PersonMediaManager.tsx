'use client'
// components/admin/PersonMediaManager.tsx
// Per-person media manager for the admin person page.
//
// Lists every photo and video LINKED to this person (peopleIds includes them),
// including hidden ones, and lets the archivist:
//   - set each item's visibility (Hidden / Profile + tree / Photos|Videos only
//     / Everywhere)
//   - REMOVE the item from this person entirely (un-links; the item itself
//     stays in the archive if it has other people / collections)
//   - upload a new photo that is auto-linked to this person
//
// Visibility semantics (mirrors lib/content.ts filtering):
//   hidden     -> linked for the record, shown nowhere
//   profile    -> person page + family-tree snippet only
//   gallery    -> the main section only (Photographs gallery / Video playlists),
//                 NOT profile or tree   (label: "Photos only" / "Videos only")
//   everywhere -> profile + tree AND the main section
//
// IMPORTANT - optimistic UI: admin writes commit to GitHub, not the local
// filesystem, so the server-rendered props lag by one deploy (~90s). We keep
// local optimistic state so the selection updates the instant you click,
// rather than appearing to do nothing until the next deploy.

import { useState } from 'react'
import { getPhotoUrl } from '@/lib/utils'
import type { Photo, Video, Visibility } from '@/lib/types'

interface Props {
  personId: string
  personName: string
  photos: Photo[]   // ALL photos linked to this person (incl. hidden)
  videos: Video[]   // ALL videos linked to this person (incl. hidden)
}

function videoThumb(v: Video): string | null {
  if (v.thumbnailUrl) return v.thumbnailUrl
  if (v.source === 'youtube') return `https://i.ytimg.com/vi/${v.sourceId}/hqdefault.jpg`
  return null
}

export default function PersonMediaManager({ personId, personName, photos, videos }: Props) {
  // Optimistic overrides keyed by item id. Take precedence over the prop value.
  const [visOverrides, setVisOverrides] = useState<Record<string, Visibility>>({})
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savedHint, setSavedHint] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [caption, setCaption] = useState('')

  function effectiveVisibility(item: { id: string; visibility?: Visibility }): Visibility {
    return visOverrides[item.id] ?? item.visibility ?? 'everywhere'
  }

  async function setVisibility(kind: 'photos' | 'videos', id: string, visibility: Visibility) {
    // Optimistic - reflect immediately.
    setVisOverrides((prev) => ({ ...prev, [id]: visibility }))
    setBusyId(id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/${kind}/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility }),
      })
      if (!res.ok) throw new Error((await res.text()) || `${res.status}`)
      setSavedHint(true)
    } catch (err) {
      // Roll back the optimistic change on failure.
      setVisOverrides((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusyId(null)
    }
  }

  async function removeFromPerson(kind: 'photos' | 'videos', item: Photo | Video) {
    if (!confirm(`Remove this ${kind === 'photos' ? 'photo' : 'video'} from ${personName}? It stays in the archive if it's linked to other people or collections - this only un-links ${personName}.`)) {
      return
    }
    const nextPeople = (item.peopleIds ?? []).filter((pid) => pid !== personId)
    setRemovedIds((prev) => new Set(prev).add(item.id))  // optimistic hide
    setBusyId(item.id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/${kind}/${item.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ peopleIds: nextPeople }),
      })
      if (!res.ok) throw new Error((await res.text()) || `${res.status}`)
      setSavedHint(true)
    } catch (err) {
      // Roll back: re-show the item.
      setRemovedIds((prev) => {
        const next = new Set(prev)
        next.delete(item.id)
        return next
      })
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
      setSavedHint(true)
      // New uploads only appear after the next deploy (server props are stale).
      // Surface that via the saved hint rather than a stale refresh.
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setUploading(false)
    }
  }

  // Visibility segmented control. The "Photos only" / "Videos only" label is
  // kind-dependent so it reads correctly for both media types.
  function VisibilityControl({ kind, item }: { kind: 'photos' | 'videos'; item: Photo | Video }) {
    const current = effectiveVisibility(item)
    const galleryLabel = kind === 'photos' ? 'Photos only' : 'Videos only'
    const sectionName = kind === 'photos' ? 'Photographs gallery' : 'Videos section'
    const galleryProfileLabel = kind === 'photos' ? 'Photos + profile' : 'Videos + profile'
    const options: Array<{ value: Visibility; label: string; help: string }> = [
      { value: 'hidden', label: 'Hidden', help: 'Shown nowhere on the site' },
      { value: 'profile-tree', label: 'Profile + tree', help: 'The full profile page and the family-tree summary — not the gallery' },
      { value: 'gallery', label: galleryLabel, help: `Only in the ${sectionName}, not profiles or the tree` },
      { value: 'gallery-profile', label: galleryProfileLabel, help: `The ${sectionName} and the full profile page, but not the family-tree summary` },
      { value: 'everywhere', label: 'Everywhere', help: 'Gallery, full profile, and the family-tree summary' },
    ]
    return (
      <div role="group" aria-label="Visibility" className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = current === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => !active && setVisibility(kind, item.id, opt.value)}
              disabled={busyId === item.id}
              title={opt.help}
              aria-pressed={active}
              className={[
                'px-2.5 py-1 rounded text-xs border transition-colors',
                active
                  ? 'border-navy bg-navy text-white'      // clearly-active for ALL values, hidden included
                  : 'border-[color:var(--color-border)] text-muted hover:text-navy hover:border-stone',
                busyId === item.id ? 'opacity-60 cursor-wait' : '',
              ].join(' ')}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    )
  }

  const visiblePhotos = photos.filter((p) => !removedIds.has(p.id))
  const visibleVideos = videos.filter((v) => !removedIds.has(v.id))
  const hasMedia = visiblePhotos.length > 0 || visibleVideos.length > 0

  return (
    <section className="mt-12 pt-10 border-t border-[color:var(--color-border)]">
      <h2 className="font-serif text-navy text-2xl mb-1">Photos &amp; videos</h2>
      <p className="text-muted text-sm mb-2 max-w-2xl">
        Media linked to {personName}. Set where each item appears, or remove
        items that aren&apos;t actually them. New uploads start as
        &ldquo;Profile + tree&rdquo; so nothing reaches the public gallery
        until you choose it.
      </p>
      <p className="text-quiet text-xs mb-6 max-w-2xl">
        Changes save to the archive and appear on the live site within about 90
        seconds (next deploy). The buttons here update immediately so you can
        see your choices.
      </p>

      {error && (
        <p className="font-serif italic text-red-600 text-sm mb-4">Error: {error}</p>
      )}
      {savedHint && !error && (
        <p className="font-serif italic text-gold-deep text-sm mb-4">
          Saved. The live site updates within about 90 seconds.
        </p>
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
      {visiblePhotos.length > 0 && (
        <div className="mb-8">
          <p className="eyebrow text-quiet mb-3">{visiblePhotos.length} photo{visiblePhotos.length === 1 ? '' : 's'}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {visiblePhotos.map((p) => (
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
                  <button
                    type="button"
                    onClick={() => removeFromPerson('photos', p)}
                    disabled={busyId === p.id}
                    className="self-start text-xs text-red-600 hover:text-red-800 mt-1 disabled:opacity-50"
                  >
                    Remove from {personName}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* Videos */}
      {visibleVideos.length > 0 && (
        <div>
          <p className="eyebrow text-quiet mb-3">{visibleVideos.length} video{visibleVideos.length === 1 ? '' : 's'}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {visibleVideos.map((v) => {
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
                    <button
                      type="button"
                      onClick={() => removeFromPerson('videos', v)}
                      disabled={busyId === v.id}
                      className="self-start text-xs text-red-600 hover:text-red-800 mt-1 disabled:opacity-50"
                    >
                      Remove from {personName}
                    </button>
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
