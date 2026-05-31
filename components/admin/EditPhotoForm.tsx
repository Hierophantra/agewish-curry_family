'use client'
// components/admin/EditPhotoForm.tsx
// Client Component - multi-field editor for creating or updating a photograph entry.
// Used by both /admin/photos/new (mode='create') and /admin/photos/[id] (mode='update').
//
// Create: multipart/form-data POST to /api/admin/photos
//   - file: the image binary
//   - metadata: JSON-encoded photo fields
// Update: JSON POST to /api/admin/photos/[id]
//   - metadata fields only; file is immutable after upload
// Delete: DELETE /api/admin/photos/[id]
//
// On create success: redirects to /admin/photos
// On update success: calls router.refresh() to re-read updated JSON

import { useState, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { Person, Collection, Visibility, PhotoRegion, PhotoPersonVisibility } from '@/lib/types'
import { getPhotoUrl } from '@/lib/utils'
import VisibilityPicker from '@/components/admin/VisibilityPicker'
import PeopleTagPicker from '@/components/admin/PeopleTagPicker'
import PhotoRegionTagger from '@/components/admin/PhotoRegionTagger'

const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024 // 4MB

export interface PhotoFormValues {
  id: string
  caption: string
  date: string
  dateLabel: string
  location: string
  notes: string
  visibility: Visibility
  inHero: boolean
  peopleIds: string[]
  collectionIds: string[]
  regions: PhotoRegion[]
  peopleVisibility: Record<string, PhotoPersonVisibility>
}

interface Props {
  mode: 'create' | 'update'
  photoId?: string              // only required in update mode
  currentFilename?: string      // only in update mode - for showing the current image
  initial: PhotoFormValues
  allPeople: Person[]
  allCollections: Collection[]
}

// Slugify a filename into a kebab-case id suggestion.
// e.g. "William & Eleanor Wedding 1953.jpg" → "william-eleanor-wedding-1953"
function slugifyFilename(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\.[^.]+$/, '')        // strip extension
    .replace(/[^a-z0-9\s-]/g, '')   // remove non-alphanum (except spaces/hyphens)
    .replace(/\s+/g, '-')           // spaces → hyphens
    .replace(/-+/g, '-')            // collapse multiple hyphens
    .replace(/^-+|-+$/g, '')        // trim leading/trailing hyphens
}

export default function EditPhotoForm({
  mode,
  photoId,
  currentFilename,
  initial,
  allPeople,
  allCollections,
}: Props) {
  const router = useRouter()
  const [values, setValues] = useState<PhotoFormValues>(initial)
  const [idManuallyEdited, setIdManuallyEdited] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'deleting'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // File-related state (create mode only)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const inputClass =
    'w-full px-4 py-2.5 border border-stone rounded font-sans text-base text-navy bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:border-navy disabled:opacity-50'
  const labelClass = 'flex flex-col gap-1.5'
  const labelTextClass = 'eyebrow text-quiet text-[10px]'
  const helpClass = 'text-quiet font-serif italic text-xs mt-1'

  const isDisabled = status === 'saving' || status === 'deleting'

  // Handle file selection - validate type/size client-side; generate preview
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (!file) {
      setSelectedFile(null)
      setPreviewUrl(null)
      return
    }

    // Validate MIME type
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setErrorMessage('Unsupported file type. Please upload a JPEG, PNG, or WebP image.')
      setStatus('error')
      e.target.value = ''
      return
    }

    // Validate file size (4MB limit - serverless body limit)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(
        'Image is too large. Compress to under 4MB or contact the developer.'
      )
      setStatus('error')
      e.target.value = ''
      return
    }

    setErrorMessage(null)
    if (status === 'error') setStatus('idle')

    setSelectedFile(file)

    // Auto-suggest id from filename if user hasn't manually edited it
    if (!idManuallyEdited) {
      setValues((prev) => ({ ...prev, id: slugifyFilename(file.name) }))
    }

    // Generate local preview URL
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
  }

  function handleTextChange(field: keyof PhotoFormValues) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((prev) => ({ ...prev, [field]: e.target.value }))
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
      if (!selectedFile) {
        setStatus('error')
        setErrorMessage('Please select an image file to upload.')
        return
      }

      // Build multipart/form-data: file + JSON metadata
      const metadata: Record<string, unknown> = {
        id: values.id,
      }
      if (values.caption.trim()) metadata.caption = values.caption.trim()
      if (values.date.trim()) metadata.date = values.date.trim()
      if (values.dateLabel.trim()) metadata.dateLabel = values.dateLabel.trim()
      if (values.location.trim()) metadata.location = values.location.trim()
      if (values.notes.trim()) metadata.notes = values.notes.trim()
      metadata.visibility = values.visibility
      if (values.inHero) metadata.inHero = true
      if (values.peopleIds.length) metadata.peopleIds = values.peopleIds
      if (values.collectionIds.length) metadata.collectionIds = values.collectionIds
      if (values.regions.length) metadata.regions = values.regions
      const createPV: Record<string, PhotoPersonVisibility> = {}
      for (const pid of values.peopleIds) {
        const v = values.peopleVisibility[pid]
        if (v) createPV[pid] = v
      }
      if (Object.keys(createPV).length) metadata.peopleVisibility = createPV

      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('metadata', JSON.stringify(metadata))

      try {
        const res = await fetch('/api/admin/photos', {
          method: 'POST',
          body: formData,
        })
        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || `${res.status} ${res.statusText}`)
        }
        router.push('/admin/photos')
        router.refresh()
      } catch (err) {
        setStatus('error')
        setErrorMessage(err instanceof Error ? err.message : String(err))
      }
      return
    }

    // Update mode - send changed metadata fields as JSON
    const body: Record<string, unknown> = {}
    const scalarFields: Array<keyof PhotoFormValues> = [
      'caption', 'date', 'dateLabel', 'location', 'notes',
    ]
    for (const key of scalarFields) {
      if (values[key] !== initial[key]) {
        body[key] = values[key] as string
      }
    }
    if (values.visibility !== initial.visibility) {
      body.visibility = values.visibility
    }
    if (values.inHero !== initial.inHero) {
      body.inHero = values.inHero
    }
    if (JSON.stringify(values.peopleIds) !== JSON.stringify(initial.peopleIds)) {
      body.peopleIds = values.peopleIds
    }
    if (JSON.stringify(values.collectionIds) !== JSON.stringify(initial.collectionIds)) {
      body.collectionIds = values.collectionIds
    }
    if (JSON.stringify(values.regions) !== JSON.stringify(initial.regions)) {
      body.regions = values.regions
    }
    // Per-person visibility, pruned to currently-tagged people.
    const prunedPV: Record<string, PhotoPersonVisibility> = {}
    for (const pid of values.peopleIds) {
      const v = values.peopleVisibility[pid]
      if (v) prunedPV[pid] = v
    }
    if (JSON.stringify(prunedPV) !== JSON.stringify(initial.peopleVisibility)) {
      body.peopleVisibility = prunedPV
    }

    if (Object.keys(body).length === 0) {
      setStatus('saved')
      return
    }

    try {
      const res = await fetch(`/api/admin/photos/${photoId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `${res.status} ${res.statusText}`)
      }
      setStatus('saved')
      // Intentionally NOT router.refresh() here: the change is committed to
      // GitHub and goes live after the ~90s rebuild. Refreshing re-reads the
      // pre-rebuild content, which makes the just-saved value look like it
      // reverted. Keep the saved values on screen instead.
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : String(err))
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this photograph? This cannot be undone.')) return
    setStatus('deleting')
    setErrorMessage(null)
    try {
      const res = await fetch(`/api/admin/photos/${photoId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `${res.status} ${res.statusText}`)
      }
      router.push('/admin/photos')
      router.refresh()
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-7">

      {/* File upload (create mode) */}
      {mode === 'create' && (
        <div className="flex flex-col gap-3">
          <label className={labelClass}>
            <span className={labelTextClass}>Image file</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              required
              disabled={isDisabled}
              onChange={handleFileChange}
              className="w-full font-sans text-sm text-navy file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-navy file:text-white file:font-sans file:text-sm hover:file:bg-navy-light file:cursor-pointer disabled:opacity-50"
            />
            <span className={helpClass}>
              JPEG, PNG, or WebP. Maximum 4MB. Larger files can be compressed with tools like{' '}
              <a href="https://squoosh.app" target="_blank" rel="noreferrer" className="underline">
                Squoosh
              </a>{' '}
              before uploading.
            </span>
          </label>

          {/* Image preview after file selection */}
          {previewUrl && (
            <div className="relative aspect-[4/3] max-w-sm overflow-hidden rounded border hairline bg-ivory">
              {/* Using next/image with object URL requires unoptimized */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </div>
      )}

      {/* Current image (update mode) */}
      {mode === 'update' && currentFilename && (
        <div className="flex flex-col gap-2">
          <span className={labelTextClass}>Current image</span>
          <div className="relative aspect-[4/3] max-w-sm overflow-hidden rounded border hairline bg-ivory">
            <Image
              src={getPhotoUrl({ filename: currentFilename })}
              alt={values.caption || 'Current photograph'}
              fill
              className="object-contain"
              sizes="400px"
            />
          </div>
          <p className={helpClass}>The image cannot be changed after upload. Delete and re-upload to replace.</p>
        </div>
      )}

      {/* Tag people in the photo (group photos) - draw a box, assign a person */}
      {mode === 'update' && currentFilename && (
        <fieldset>
          <legend className={`${labelTextClass} mb-3`}>Tag people in the photo</legend>
          <PhotoRegionTagger
            src={getPhotoUrl({ filename: currentFilename })}
            allPeople={allPeople}
            regions={values.regions}
            peopleIds={values.peopleIds}
            onChange={({ regions, peopleIds }) => {
              setValues((prev) => ({ ...prev, regions, peopleIds }))
              if (status === 'saved') setStatus('idle')
            }}
            disabled={isDisabled}
          />
        </fieldset>
      )}

      {/* ID */}
      <label className={labelClass}>
        <span className={labelTextClass}>ID (URL slug)</span>
        <input
          type="text"
          value={values.id}
          onChange={handleIdChange}
          className={inputClass}
          placeholder="1953-wedding-01"
          disabled={mode === 'update' || isDisabled}
          required
          pattern="[a-z][a-z0-9\-]*[a-z0-9]|[a-z]"
          title="Kebab-case only: lowercase letters, digits, hyphens"
        />
        <span className={helpClass}>
          {mode === 'create'
            ? 'Kebab-case slug - auto-generated from filename; you can override it. Cannot be changed after upload.'
            : 'Read-only. The ID is permanent once a photo is published.'}
        </span>
      </label>

      {/* Caption */}
      <label className={labelClass}>
        <span className={labelTextClass}>Caption</span>
        <input
          type="text"
          value={values.caption}
          onChange={handleTextChange('caption')}
          className={inputClass}
          placeholder="William and Eleanor, wedding day"
          disabled={isDisabled}
        />
      </label>

      {/* Date + Date label */}
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
          <span className={helpClass}>ISO date, e.g. 1953-06-15. Approximate is fine - leave empty if unknown.</span>
        </label>

        <label className={labelClass}>
          <span className={labelTextClass}>Date label</span>
          <input
            type="text"
            value={values.dateLabel}
            onChange={handleTextChange('dateLabel')}
            className={inputClass}
            placeholder="June 1953"
            disabled={isDisabled}
          />
          <span className={helpClass}>Display string shown in cards and lightbox.</span>
        </label>
      </div>

      {/* Location */}
      <label className={labelClass}>
        <span className={labelTextClass}>Location</span>
        <input
          type="text"
          value={values.location}
          onChange={handleTextChange('location')}
          className={inputClass}
          placeholder="Dayton, Ohio"
          disabled={isDisabled}
        />
      </label>

      {/* Notes (private archivist notes) */}
      <label className={labelClass}>
        <span className={labelTextClass}>Notes</span>
        <textarea
          value={values.notes}
          onChange={handleTextChange('notes')}
          className={`${inputClass} min-h-[100px] resize-y`}
          placeholder="Private archivist notes - not shown on the public site."
          disabled={isDisabled}
        />
        <span className={helpClass}>Internal notes only. Not displayed to family members.</span>
      </label>

      {/* Visibility */}
      <fieldset>
        <legend className={`${labelTextClass} mb-3`}>Visibility</legend>
        <VisibilityPicker
          kind="photo"
          value={values.visibility}
          onChange={(next) => {
            setValues((prev) => ({ ...prev, visibility: next }))
            if (status === 'saved') setStatus('idle')
          }}
          showHero
          inHero={values.inHero}
          onHeroChange={(next) => {
            setValues((prev) => ({ ...prev, inHero: next }))
            if (status === 'saved') setStatus('idle')
          }}
          disabled={isDisabled}
        />
      </fieldset>

      {/* People tagger - searchable */}
      <fieldset>
        <legend className={`${labelTextClass} mb-3`}>People in this photo</legend>
        <PeopleTagPicker
          allPeople={allPeople}
          selectedIds={values.peopleIds}
          onChange={(next) => {
            setValues((prev) => ({ ...prev, peopleIds: next }))
            if (status === 'saved') setStatus('idle')
          }}
          disabled={isDisabled}
          mediaNoun="photo"
        />
      </fieldset>

      {/* Per-person visibility (group photos) - override profile/tree per tagged person */}
      {values.peopleIds.length > 0 && (
        <fieldset>
          <legend className={`${labelTextClass} mb-3`}>Per-person visibility</legend>
          <p className={`${helpClass} mb-3`}>
            Where this photo appears for each tagged person. “Default” follows the photo visibility above. The Photographs gallery is always controlled by the photo visibility, not per person.
          </p>
          <div className="flex flex-col gap-2.5">
            {values.peopleIds.map((pid) => {
              const name = allPeople.find((p) => p.id === pid)?.name ?? pid
              const cur = values.peopleVisibility[pid]
              const opts: Array<{ v: PhotoPersonVisibility | undefined; label: string }> = [
                { v: undefined, label: 'Default' },
                { v: 'hidden', label: 'Hidden' },
                { v: 'profile', label: 'Profile only' },
                { v: 'profile-tree', label: 'Profile + tree' },
              ]
              return (
                <div key={pid} className="flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-navy text-sm">{name}</span>
                  <div className="flex flex-wrap gap-1" role="group" aria-label={`Visibility for ${name}`}>
                    {opts.map((o) => {
                      const active = (cur ?? undefined) === o.v
                      return (
                        <button
                          key={o.label}
                          type="button"
                          disabled={isDisabled}
                          aria-pressed={active}
                          onClick={() => {
                            setValues((prev) => {
                              const map = { ...prev.peopleVisibility }
                              if (o.v) map[pid] = o.v
                              else delete map[pid]
                              return { ...prev, peopleVisibility: map }
                            })
                            if (status === 'saved') setStatus('idle')
                          }}
                          className={[
                            'px-2.5 py-1 rounded text-xs border transition-colors',
                            active ? 'border-navy bg-navy text-white' : 'border-[color:var(--color-border)] text-muted hover:text-navy',
                          ].join(' ')}
                        >
                          {o.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </fieldset>
      )}

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

      {/* Submit + status */}
      <div className="flex items-center gap-4 pt-2 border-t border-stone">
        <button
          type="submit"
          disabled={isDisabled}
          className="bg-navy text-white px-6 py-2.5 rounded font-sans text-base hover:bg-navy-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        >
          {status === 'saving'
            ? (mode === 'create' ? 'Uploading...' : 'Saving...')
            : mode === 'create'
            ? 'Upload photo'
            : 'Save changes'}
        </button>

        {status === 'saved' && (
          <p className="font-serif italic text-gold-deep text-sm">
            Saved. The live site updates in about 90 seconds — this admin view may keep showing the old value until the rebuild finishes.
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
            {status === 'deleting' ? 'Deleting...' : 'Delete this photograph'}
          </button>
          <p className={helpClass}>
            This permanently removes the photo entry. If it was uploaded via the admin uploader,
            the Blob file is also deleted. The live site updates on next deploy.
          </p>
        </div>
      )}
    </form>
  )
}
