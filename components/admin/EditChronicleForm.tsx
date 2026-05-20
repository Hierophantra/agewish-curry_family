'use client'
// components/admin/EditChronicleForm.tsx
// Client Component - multi-field editor for creating or updating a chronicle.
// Used by both /admin/chronicles/new (mode='create') and /admin/chronicles/[id] (mode='update').
//
// Create: POST /api/admin/chronicles - body is the full new chronicle object
// Update: POST /api/admin/chronicles/[id] - body is the changed fields only
// Delete: DELETE /api/admin/chronicles/[id] - removes the chronicle (update mode only)
//
// On create success: redirects to /admin/chronicles
// On update success: calls router.refresh() to re-read updated JSON

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Person, Photo, Collection } from '@/lib/types'

export interface ChronicleFormValues {
  id: string
  title: string
  subtitle: string
  date: string
  dateLabel: string
  body: string
  peopleIds: string[]
  collectionIds: string[]
  coverPhotoId: string
  audioFilename: string
  audioDuration: string
}

interface Props {
  mode: 'create' | 'update'
  chronicleId?: string        // only required in update mode
  initial: ChronicleFormValues
  allPeople: Person[]
  allCollections: Collection[]
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

export default function EditChronicleForm({
  mode,
  chronicleId,
  initial,
  allPeople,
  allCollections,
  allPhotos,
}: Props) {
  const router = useRouter()
  const [values, setValues] = useState<ChronicleFormValues>(initial)
  const [idManuallyEdited, setIdManuallyEdited] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'deleting'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const inputClass =
    'w-full px-4 py-2.5 border border-stone rounded font-sans text-base text-navy bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:border-navy disabled:opacity-50'
  const labelClass = 'flex flex-col gap-1.5'
  const labelTextClass = 'eyebrow text-quiet text-[10px]'
  const helpClass = 'text-quiet font-serif italic text-xs mt-1'

  const isDisabled = status === 'saving' || status === 'deleting'

  function handleTextChange(field: keyof ChronicleFormValues) {
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

  function handleCheckboxToggle(field: 'peopleIds' | 'collectionIds', value: string) {
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
      // Send full object to POST /api/admin/chronicles
      const body: Record<string, unknown> = {
        id: values.id,
        title: values.title,
        body: values.body,
      }
      if (values.subtitle.trim()) body.subtitle = values.subtitle
      if (values.date.trim()) body.date = values.date
      if (values.dateLabel.trim()) body.dateLabel = values.dateLabel
      if (values.peopleIds.length) body.peopleIds = values.peopleIds
      if (values.collectionIds.length) body.collectionIds = values.collectionIds
      if (values.coverPhotoId.trim()) body.coverPhotoId = values.coverPhotoId
      if (values.audioFilename.trim()) body.audioFilename = values.audioFilename
      if (values.audioDuration.trim()) body.audioDuration = values.audioDuration

      try {
        const res = await fetch('/api/admin/chronicles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || `${res.status} ${res.statusText}`)
        }
        // Redirect to list after create
        router.push('/admin/chronicles')
        router.refresh()
      } catch (err) {
        setStatus('error')
        setErrorMessage(err instanceof Error ? err.message : String(err))
      }
      return
    }

    // Update mode - build changed fields diff
    const changed: Partial<Record<keyof ChronicleFormValues, unknown>> = {}

    // For scalar string fields
    const scalarFields: Array<keyof ChronicleFormValues> = [
      'title', 'subtitle', 'date', 'dateLabel', 'body',
      'coverPhotoId', 'audioFilename', 'audioDuration',
    ]
    for (const key of scalarFields) {
      if (values[key] !== initial[key]) {
        changed[key] = values[key] as string
      }
    }

    // For array fields - compare by serialised value
    if (JSON.stringify(values.peopleIds) !== JSON.stringify(initial.peopleIds)) {
      changed.peopleIds = values.peopleIds
    }
    if (JSON.stringify(values.collectionIds) !== JSON.stringify(initial.collectionIds)) {
      changed.collectionIds = values.collectionIds
    }

    if (Object.keys(changed).length === 0) {
      setStatus('saved')
      return
    }

    try {
      const res = await fetch(`/api/admin/chronicles/${chronicleId}`, {
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
    if (!window.confirm('Delete this chronicle? This cannot be undone.')) return
    setStatus('deleting')
    setErrorMessage(null)
    try {
      const res = await fetch(`/api/admin/chronicles/${chronicleId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `${res.status} ${res.statusText}`)
      }
      router.push('/admin/chronicles')
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
          placeholder="starting-the-martial-arts-school"
          disabled={mode === 'update' || isDisabled}
          required
          pattern="[a-z][a-z0-9\-]*[a-z0-9]|[a-z]"
          title="Kebab-case only: lowercase letters, digits, hyphens"
        />
        <span className={helpClass}>
          {mode === 'create'
            ? 'Kebab-case slug - auto-generated from title; you can override it. Cannot be changed after creation.'
            : 'Read-only. The ID is permanent once a chronicle is published.'}
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
          placeholder="Starting the Curry Martial Arts School"
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
          placeholder="How a basement studio became a 30-year institution"
          disabled={isDisabled}
        />
      </label>

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
          <span className={helpClass}>ISO date, e.g. 1979-06-01. Approximate is fine - leave empty if unknown.</span>
        </label>

        <label className={labelClass}>
          <span className={labelTextClass}>Date label</span>
          <input
            type="text"
            value={values.dateLabel}
            onChange={handleTextChange('dateLabel')}
            className={inputClass}
            placeholder="Summer 1979"
            disabled={isDisabled}
          />
          <span className={helpClass}>Display string, e.g. &ldquo;Summer 1979&rdquo;. Shown in cards and detail pages.</span>
        </label>
      </div>

      {/* Body */}
      <label className={labelClass}>
        <span className={labelTextClass}>Body</span>
        <textarea
          value={values.body}
          onChange={handleTextChange('body')}
          className={`${inputClass} font-mono text-sm min-h-[320px] resize-y leading-relaxed`}
          disabled={isDisabled}
          required
        />
        <span className={helpClass}>
          Markdown supported: *italic*, **bold**, &gt; blockquote, [links](url), # heading. Each paragraph on its own line with a blank line between.
        </span>
      </label>

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

      {/* Collections picker */}
      <fieldset>
        <legend className={`${labelTextClass} mb-3`}>Collections</legend>
        <div className="flex flex-col gap-2">
          {allCollections.map((col) => (
            <label key={col.id} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={values.collectionIds.includes(col.id)}
                onChange={() => handleCheckboxToggle('collectionIds', col.id)}
                disabled={isDisabled}
                className="w-4 h-4 accent-navy"
              />
              <span className="font-sans text-sm text-navy">{col.title}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Cover photo */}
      <label className={labelClass}>
        <span className={labelTextClass}>Cover photo</span>
        <select
          value={values.coverPhotoId}
          onChange={handleTextChange('coverPhotoId')}
          className={inputClass}
          disabled={isDisabled}
        >
          <option value="">- None -</option>
          {allPhotos.map((photo) => (
            <option key={photo.id} value={photo.id}>
              {photo.id}{photo.caption ? ` - ${photo.caption}` : ''}{photo.dateLabel ? ` (${photo.dateLabel})` : ''}
            </option>
          ))}
        </select>
        <span className={helpClass}>Displayed at the top of the chronicle detail page.</span>
      </label>

      {/* Audio */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <label className={labelClass}>
          <span className={labelTextClass}>Audio filename</span>
          <input
            type="text"
            value={values.audioFilename}
            onChange={handleTextChange('audioFilename')}
            className={inputClass}
            placeholder="starting-the-school-narration.mp3"
            disabled={isDisabled}
          />
          <span className={helpClass}>
            Filename of an audio file in /public/audio/. The file must be added to the repo separately - admin audio upload arrives in a later phase.
          </span>
        </label>

        <label className={labelClass}>
          <span className={labelTextClass}>Audio duration</span>
          <input
            type="text"
            value={values.audioDuration}
            onChange={handleTextChange('audioDuration')}
            className={inputClass}
            placeholder="4:12"
            disabled={isDisabled}
          />
          <span className={helpClass}>Display string, e.g. &ldquo;4:12&rdquo; or &ldquo;12:05&rdquo;.</span>
        </label>
      </div>

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
            ? 'Create chronicle'
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
            {status === 'deleting' ? 'Deleting...' : 'Delete this chronicle'}
          </button>
          <p className={helpClass}>This permanently removes the chronicle. The live site will update on next deploy.</p>
        </div>
      )}
    </form>
  )
}
