'use client'
// components/admin/EditCollectionForm.tsx
// Client Component — multi-field editor for creating or updating a collection.
// Used by both /admin/collections/new (mode='create') and /admin/collections/[id] (mode='update').
//
// Create: POST /api/admin/collections — body is the full new collection object
// Update: POST /api/admin/collections/[id] — body is the changed fields only
// Delete: DELETE /api/admin/collections/[id] — removes the collection (update mode only)
//
// On create success: redirects to /admin/collections
// On update success: calls router.refresh() to re-read updated JSON

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Photo } from '@/lib/types'

export interface CollectionFormValues {
  id: string
  title: string
  subtitle: string
  description: string
  dateLabel: string
  date: string
  coverPhotoId: string
}

interface Props {
  mode: 'create' | 'update'
  collectionId?: string   // only required in update mode
  initial: CollectionFormValues
  allPhotos: Photo[]
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

export default function EditCollectionForm({
  mode,
  collectionId,
  initial,
  allPhotos,
}: Props) {
  const router = useRouter()
  const [values, setValues] = useState<CollectionFormValues>(initial)
  const [idManuallyEdited, setIdManuallyEdited] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'deleting'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const inputClass =
    'w-full px-4 py-2.5 border border-stone rounded font-sans text-base text-navy bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:border-navy disabled:opacity-50'
  const labelClass = 'flex flex-col gap-1.5'
  const labelTextClass = 'eyebrow text-quiet text-[10px]'
  const helpClass = 'text-quiet font-serif italic text-xs mt-1'

  const isDisabled = status === 'saving' || status === 'deleting'

  function handleTextChange(field: keyof CollectionFormValues) {
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
      // Send full object to POST /api/admin/collections
      const body: Record<string, unknown> = {
        id: values.id,
        title: values.title,
        coverPhotoId: values.coverPhotoId,
      }
      if (values.subtitle.trim()) body.subtitle = values.subtitle
      if (values.description.trim()) body.description = values.description
      if (values.dateLabel.trim()) body.dateLabel = values.dateLabel
      if (values.date.trim()) body.date = values.date

      try {
        const res = await fetch('/api/admin/collections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || `${res.status} ${res.statusText}`)
        }
        // Redirect to list after create
        router.push('/admin/collections')
        router.refresh()
      } catch (err) {
        setStatus('error')
        setErrorMessage(err instanceof Error ? err.message : String(err))
      }
      return
    }

    // Update mode — build changed fields diff
    const changed: Partial<Record<keyof CollectionFormValues, unknown>> = {}

    const scalarStringFields: Array<keyof CollectionFormValues> = [
      'title', 'subtitle', 'description', 'dateLabel', 'date', 'coverPhotoId',
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
      const res = await fetch(`/api/admin/collections/${collectionId}`, {
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
    if (!window.confirm('Delete this collection? This cannot be undone.')) return
    setStatus('deleting')
    setErrorMessage(null)
    try {
      const res = await fetch(`/api/admin/collections/${collectionId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `${res.status} ${res.statusText}`)
      }
      router.push('/admin/collections')
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
          placeholder="christmas-mornings"
          disabled={mode === 'update' || isDisabled}
          required
          pattern="[a-z][a-z0-9\-]*[a-z0-9]|[a-z]"
          title="Kebab-case only: lowercase letters, digits, hyphens"
        />
        <span className={helpClass}>
          {mode === 'create'
            ? 'Kebab-case slug — auto-generated from title; you can override it. Cannot be changed after creation.'
            : 'Read-only. The ID is permanent once a collection is published.'}
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
          placeholder="Christmas mornings"
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
          placeholder="Decades of December gatherings"
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
          placeholder="A longer description of the collection&hellip;"
          disabled={isDisabled}
        />
        <span className={helpClass}>Optional. Displayed on the collection detail page.</span>
      </label>

      {/* Date + Date label */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <label className={labelClass}>
          <span className={labelTextClass}>Date label</span>
          <input
            type="text"
            value={values.dateLabel}
            onChange={handleTextChange('dateLabel')}
            className={inputClass}
            placeholder="1974 — 2005"
            disabled={isDisabled}
          />
          <span className={helpClass}>Display string, e.g. &ldquo;1974 &mdash; 2005&rdquo;. Shown on cards and list pages.</span>
        </label>

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
          <span className={helpClass}>ISO date, e.g. 1974-12-25. Used for sorting. Leave empty if unknown.</span>
        </label>
      </div>

      {/* Cover photo picker */}
      <label className={labelClass}>
        <span className={labelTextClass}>Cover photo</span>
        <select
          value={values.coverPhotoId}
          onChange={handleTextChange('coverPhotoId')}
          className={inputClass}
          disabled={isDisabled}
          required
        >
          <option value="">— Select a photo —</option>
          {allPhotos.map((photo) => (
            <option key={photo.id} value={photo.id}>
              {photo.id}{photo.caption ? ` · ${photo.caption}` : ''}{photo.filename ? ` (${photo.filename})` : ''}
            </option>
          ))}
        </select>
        <span className={helpClass}>
          Required. Select from photos already in the archive. To add a new cover photo, upload it via Photographs first.
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
            ? 'Create collection'
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
            {status === 'deleting' ? 'Deleting...' : 'Delete this collection'}
          </button>
          <p className={helpClass}>
            Deletes the collection and removes its ID from all photos that referenced it.
            This cannot be undone. The live site will update on next deploy.
          </p>
        </div>
      )}
    </form>
  )
}
