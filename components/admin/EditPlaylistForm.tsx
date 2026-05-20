'use client'
// components/admin/EditPlaylistForm.tsx
// Client Component - multi-field editor for creating or updating a playlist.
// Used by both /admin/playlists/new (mode='create') and /admin/playlists/[id] (mode='update').
//
// Create: POST /api/admin/playlists - body is the full new playlist object
// Update: POST /api/admin/playlists/[id] - body is the changed fields only
// Delete: DELETE /api/admin/playlists/[id] - removes the playlist (update mode only)
//
// On create success: redirects to /admin/playlists
// On update success: calls router.refresh() to re-read updated JSON

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Video } from '@/lib/types'

export interface PlaylistFormValues {
  id: string
  title: string
  subtitle: string
  description: string
  coverVideoId: string
}

interface Props {
  mode: 'create' | 'update'
  playlistId?: string    // only required in update mode
  initial: PlaylistFormValues
  allVideos: Video[]
}

// Slugify a title into a kebab-case id suggestion.
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function EditPlaylistForm({
  mode,
  playlistId,
  initial,
  allVideos,
}: Props) {
  const router = useRouter()
  const [values, setValues] = useState<PlaylistFormValues>(initial)
  const [idManuallyEdited, setIdManuallyEdited] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'deleting'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const inputClass =
    'w-full px-4 py-2.5 border border-stone rounded font-sans text-base text-navy bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:border-navy disabled:opacity-50'
  const labelClass = 'flex flex-col gap-1.5'
  const labelTextClass = 'eyebrow text-quiet text-[10px]'
  const helpClass = 'text-quiet font-serif italic text-xs mt-1'

  const isDisabled = status === 'saving' || status === 'deleting'

  function handleTextChange(field: keyof PlaylistFormValues) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const val = e.target.value
      setValues((prev) => {
        const next = { ...prev, [field]: val }
        // Auto-suggest id from title in create mode, unless user manually edited id
        if (field === 'title' && mode === 'create' && !idManuallyEdited) {
          next.id = slugify(val)
        }
        return next
      })
      if (status === 'saved') setStatus('idle')
    }
  }

  function handleIdChange(e: React.ChangeEvent<HTMLInputElement>) {
    setIdManuallyEdited(true)
    setValues((prev) => ({ ...prev, id: e.target.value }))
    if (status === 'saved') setStatus('idle')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('saving')
    setErrorMessage(null)

    if (mode === 'create') {
      // Send full object to POST /api/admin/playlists
      const body: Record<string, unknown> = {
        id: values.id,
        title: values.title,
        coverVideoId: values.coverVideoId,
      }
      if (values.subtitle.trim()) body.subtitle = values.subtitle
      if (values.description.trim()) body.description = values.description

      try {
        const res = await fetch('/api/admin/playlists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || `${res.status} ${res.statusText}`)
        }
        // Redirect to list after create
        router.push('/admin/playlists')
        router.refresh()
      } catch (err) {
        setStatus('error')
        setErrorMessage(err instanceof Error ? err.message : String(err))
      }
      return
    }

    // Update mode - build changed fields diff
    const changed: Partial<Record<keyof PlaylistFormValues, unknown>> = {}

    const scalarStringFields: Array<keyof PlaylistFormValues> = [
      'title', 'subtitle', 'description', 'coverVideoId',
    ]
    for (const key of scalarStringFields) {
      if (values[key] !== initial[key]) {
        changed[key] = values[key]
      }
    }

    if (Object.keys(changed).length === 0) {
      setStatus('saved')
      return
    }

    try {
      const res = await fetch(`/api/admin/playlists/${playlistId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changed),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `${res.status} ${res.statusText}`)
      }
      setStatus('saved')
      router.refresh()
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : String(err))
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this playlist? This cannot be undone.')) return
    setStatus('deleting')
    setErrorMessage(null)
    try {
      const res = await fetch(`/api/admin/playlists/${playlistId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `${res.status} ${res.statusText}`)
      }
      router.push('/admin/playlists')
      router.refresh()
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-7">

      {/* ID */}
      <label className={labelClass}>
        <span className={labelTextClass}>ID (URL slug)</span>
        <input
          type="text"
          value={values.id}
          onChange={handleIdChange}
          className={inputClass}
          placeholder="birthdays"
          disabled={mode === 'update' || isDisabled}
          required
          pattern="[a-z][a-z0-9\-]*[a-z0-9]|[a-z]"
          title="Kebab-case only: lowercase letters, digits, hyphens"
        />
        <span className={helpClass}>
          {mode === 'create'
            ? 'Kebab-case slug - auto-generated from title; you can override it. Cannot be changed after creation.'
            : 'Read-only. The ID is permanent once a playlist is published.'}
        </span>
      </label>

      {/* Title */}
      <label className={labelClass}>
        <span className={labelTextClass}>Title</span>
        <input
          type="text"
          value={values.title}
          onChange={handleTextChange('title')}
          className={inputClass}
          placeholder="Birthdays"
          disabled={isDisabled}
          required
        />
      </label>

      {/* Subtitle */}
      <label className={labelClass}>
        <span className={labelTextClass}>Subtitle</span>
        <input
          type="text"
          value={values.subtitle}
          onChange={handleTextChange('subtitle')}
          className={inputClass}
          placeholder="Candles, cake, and the songs we always sing"
          disabled={isDisabled}
        />
        <span className={helpClass}>Optional. A short phrase shown beneath the title.</span>
      </label>

      {/* Description */}
      <label className={labelClass}>
        <span className={labelTextClass}>Description</span>
        <textarea
          value={values.description}
          onChange={handleTextChange('description')}
          className={`${inputClass} min-h-[100px] resize-y`}
          placeholder="A longer description of the playlist&hellip;"
          disabled={isDisabled}
        />
        <span className={helpClass}>Optional. Displayed on the playlist detail page.</span>
      </label>

      {/* Cover video picker */}
      <label className={labelClass}>
        <span className={labelTextClass}>Cover video</span>
        <select
          value={values.coverVideoId}
          onChange={handleTextChange('coverVideoId')}
          className={inputClass}
          disabled={isDisabled}
          required
        >
          <option value="">- Select a video -</option>
          {allVideos.map((video) => (
            <option key={video.id} value={video.id}>
              {video.id} · {video.title} ({video.source})
            </option>
          ))}
        </select>
        <span className={helpClass}>
          Required. Select from videos already in the archive. To add a new cover video, add it via Videos first.
        </span>
      </label>

      {/* Submit + status */}
      <div className="flex items-center gap-4 pt-2 border-t border-stone">
        <button
          type="submit"
          disabled={isDisabled}
          className="bg-navy text-white px-6 py-2.5 rounded font-sans text-base hover:bg-navy-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        >
          {status === 'saving'
            ? 'Saving...'
            : mode === 'create'
            ? 'Create playlist'
            : 'Save changes'}
        </button>

        {status === 'saved' && (
          <p className="font-serif italic text-gold-deep text-sm">
            Saved. The live site will update in about 90 seconds.
          </p>
        )}
        {status === 'error' && (
          <p className="font-serif italic text-red-600 text-sm">
            Error: {errorMessage}
          </p>
        )}
      </div>

      {/* Delete (update mode only) */}
      {mode === 'update' && (
        <div className="pt-8 border-t border-stone mt-4">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDisabled}
            className="text-red-600 font-sans text-sm underline underline-offset-2 hover:text-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'deleting' ? 'Deleting...' : 'Delete this playlist'}
          </button>
          <p className={helpClass}>
            Deletes the playlist and removes its ID from all videos that referenced it.
            This cannot be undone. The live site will update on next deploy.
          </p>
        </div>
      )}
    </form>
  )
}
