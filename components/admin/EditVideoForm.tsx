'use client'
// components/admin/EditVideoForm.tsx
// Client Component — multi-field editor for creating or updating a video.
// Used by both /admin/videos/new (mode='create') and /admin/videos/[id] (mode='update').
//
// Create: POST /api/admin/videos — body is the full new video object
// Update: POST /api/admin/videos/[id] — body is the changed fields only
// Delete: DELETE /api/admin/videos/[id] — removes the video (update mode only)
//
// On create success: redirects to /admin/videos
// On update success: calls router.refresh() to re-read updated JSON

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Person, Playlist } from '@/lib/types'

export interface VideoFormValues {
  id: string
  title: string
  description: string
  source: 'youtube' | 'vimeo'
  sourceId: string
  date: string
  dateLabel: string
  duration: string
  featured: boolean
  peopleIds: string[]
  playlistIds: string[]
}

interface Props {
  mode: 'create' | 'update'
  videoId?: string        // only required in update mode
  initial: VideoFormValues
  allPeople: Person[]
  allPlaylists: Playlist[]
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

export default function EditVideoForm({
  mode,
  videoId,
  initial,
  allPeople,
  allPlaylists,
}: Props) {
  const router = useRouter()
  const [values, setValues] = useState<VideoFormValues>(initial)
  const [idManuallyEdited, setIdManuallyEdited] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'deleting'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const inputClass =
    'w-full px-4 py-2.5 border border-stone rounded font-sans text-base text-navy bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:border-navy disabled:opacity-50'
  const labelClass = 'flex flex-col gap-1.5'
  const labelTextClass = 'eyebrow text-quiet text-[10px]'
  const helpClass = 'text-quiet font-serif italic text-xs mt-1'

  const isDisabled = status === 'saving' || status === 'deleting'

  function handleTextChange(field: keyof VideoFormValues) {
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

  function handleFeaturedChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValues((prev) => ({ ...prev, featured: e.target.checked }))
    if (status === 'saved') setStatus('idle')
  }

  function handleCheckboxToggle(field: 'peopleIds' | 'playlistIds', value: string) {
    setValues((prev) => {
      const current = prev[field]
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
      return { ...prev, [field]: next }
    })
    if (status === 'saved') setStatus('idle')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('saving')
    setErrorMessage(null)

    if (mode === 'create') {
      // Send full object to POST /api/admin/videos
      const body: Record<string, unknown> = {
        id: values.id,
        title: values.title,
        source: values.source,
        sourceId: values.sourceId,
        featured: values.featured,
      }
      if (values.description.trim()) body.description = values.description
      if (values.date.trim()) body.date = values.date
      if (values.dateLabel.trim()) body.dateLabel = values.dateLabel
      if (values.duration.trim()) body.duration = values.duration
      if (values.peopleIds.length) body.peopleIds = values.peopleIds
      if (values.playlistIds.length) body.playlistIds = values.playlistIds

      try {
        const res = await fetch('/api/admin/videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || `${res.status} ${res.statusText}`)
        }
        // Redirect to list after create
        router.push('/admin/videos')
        router.refresh()
      } catch (err) {
        setStatus('error')
        setErrorMessage(err instanceof Error ? err.message : String(err))
      }
      return
    }

    // Update mode — build changed fields diff
    const changed: Partial<Record<keyof VideoFormValues, unknown>> = {}

    // Scalar string fields
    const scalarStringFields: Array<keyof VideoFormValues> = [
      'title', 'description', 'source', 'sourceId', 'date', 'dateLabel', 'duration',
    ]
    for (const key of scalarStringFields) {
      if (values[key] !== initial[key]) {
        changed[key] = values[key]
      }
    }

    // Boolean field
    if (values.featured !== initial.featured) {
      changed.featured = values.featured
    }

    // Array fields — compare by serialised value
    if (JSON.stringify(values.peopleIds) !== JSON.stringify(initial.peopleIds)) {
      changed.peopleIds = values.peopleIds
    }
    if (JSON.stringify(values.playlistIds) !== JSON.stringify(initial.playlistIds)) {
      changed.playlistIds = values.playlistIds
    }

    if (Object.keys(changed).length === 0) {
      setStatus('saved')
      return
    }

    try {
      const res = await fetch(`/api/admin/videos/${videoId}`, {
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
    if (!window.confirm('Delete this video? This cannot be undone.')) return
    setStatus('deleting')
    setErrorMessage(null)
    try {
      const res = await fetch(`/api/admin/videos/${videoId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `${res.status} ${res.statusText}`)
      }
      router.push('/admin/videos')
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
          placeholder="grandfathers-80th-birthday"
          disabled={mode === 'update' || isDisabled}
          required
          pattern="[a-z][a-z0-9\-]*[a-z0-9]|[a-z]"
          title="Kebab-case only: lowercase letters, digits, hyphens"
        />
        <span className={helpClass}>
          {mode === 'create'
            ? 'Kebab-case slug — auto-generated from title; you can override it. Cannot be changed after creation.'
            : 'Read-only. The ID is permanent once a video is published.'}
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
          placeholder="Grandfather's 80th birthday"
          disabled={isDisabled}
          required
        />
      </label>

      {/* Description */}
      <label className={labelClass}>
        <span className={labelTextClass}>Description</span>
        <textarea
          value={values.description}
          onChange={handleTextChange('description')}
          className={`${inputClass} min-h-[100px] resize-y`}
          placeholder="A brief description of what the video captures…"
          disabled={isDisabled}
        />
      </label>

      {/* Source + sourceId */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <label className={labelClass}>
          <span className={labelTextClass}>Source</span>
          <select
            value={values.source}
            onChange={handleTextChange('source')}
            className={inputClass}
            disabled={isDisabled}
            required
          >
            <option value="youtube">YouTube</option>
            <option value="vimeo">Vimeo</option>
          </select>
        </label>

        <label className={labelClass}>
          <span className={labelTextClass}>Video ID</span>
          <input
            type="text"
            value={values.sourceId}
            onChange={handleTextChange('sourceId')}
            className={inputClass}
            placeholder="dQw4w9WgXcQ"
            disabled={isDisabled}
            required
          />
          <span className={helpClass}>
            YouTube: the video ID (e.g. dQw4w9WgXcQ from https://youtube.com/watch?v=dQw4w9WgXcQ). Vimeo: the numeric video ID.
          </span>
        </label>
      </div>

      {/* Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <label className={labelClass}>
          <span className={labelTextClass}>Date</span>
          <input
            type="text"
            value={values.date}
            onChange={handleTextChange('date')}
            className={inputClass}
            placeholder="YYYY-MM-DD"
            disabled={isDisabled}
          />
          <span className={helpClass}>ISO date, e.g. 2000-04-12. Approximate is fine — leave empty if unknown.</span>
        </label>

        <label className={labelClass}>
          <span className={labelTextClass}>Date label</span>
          <input
            type="text"
            value={values.dateLabel}
            onChange={handleTextChange('dateLabel')}
            className={inputClass}
            placeholder="April 2000"
            disabled={isDisabled}
          />
          <span className={helpClass}>Display string, e.g. &ldquo;April 2000&rdquo;. Shown in cards and detail pages.</span>
        </label>
      </div>

      {/* Duration */}
      <label className={labelClass}>
        <span className={labelTextClass}>Duration</span>
        <input
          type="text"
          value={values.duration}
          onChange={handleTextChange('duration')}
          className={inputClass}
          placeholder="12:34"
          disabled={isDisabled}
        />
        <span className={helpClass}>Display string, e.g. &ldquo;12:34&rdquo; or &ldquo;1:05:00&rdquo;.</span>
      </label>

      {/* Featured */}
      <div>
        <p className={`${labelTextClass} mb-3`}>Featured</p>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={values.featured}
            onChange={handleFeaturedChange}
            disabled={isDisabled}
            className="w-4 h-4 accent-navy"
          />
          <span className="font-sans text-sm text-navy">
            Featured video
          </span>
        </label>
        <p className={helpClass}>Featured videos appear on the home page and at the top of the /videos section.</p>
      </div>

      {/* People picker */}
      <fieldset>
        <legend className={`${labelTextClass} mb-3`}>People featured</legend>
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-2">
          {allPeople.map((person) => (
            <label key={person.id} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={values.peopleIds.includes(person.id)}
                onChange={() => handleCheckboxToggle('peopleIds', person.id)}
                disabled={isDisabled}
                className="w-4 h-4 accent-navy"
              />
              <span className="font-sans text-sm text-navy">
                {person.name}
                {person.relationLabel && (
                  <span className="text-quiet text-xs ml-2">{person.relationLabel}</span>
                )}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Playlists picker */}
      <fieldset>
        <legend className={`${labelTextClass} mb-3`}>Playlists</legend>
        <div className="flex flex-col gap-2">
          {allPlaylists.map((playlist) => (
            <label key={playlist.id} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={values.playlistIds.includes(playlist.id)}
                onChange={() => handleCheckboxToggle('playlistIds', playlist.id)}
                disabled={isDisabled}
                className="w-4 h-4 accent-navy"
              />
              <span className="font-sans text-sm text-navy">{playlist.title}</span>
            </label>
          ))}
        </div>
      </fieldset>

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
            ? 'Create video'
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
            {status === 'deleting' ? 'Deleting...' : 'Delete this video'}
          </button>
          <p className={helpClass}>This permanently removes the video. The live site will update on next deploy.</p>
        </div>
      )}
    </form>
  )
}
