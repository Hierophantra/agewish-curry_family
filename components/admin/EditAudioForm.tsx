'use client'
// components/admin/EditAudioForm.tsx
// Client Component - multi-field editor for creating or updating an audio recording entry.
// Used by both /admin/audio/new (mode='create') and /admin/audio/[id] (mode='update').
//
// Create: multipart/form-data POST to /api/admin/audio
//   - file: the audio binary
//   - metadata: JSON-encoded audio fields
// Update: JSON POST to /api/admin/audio/[id]
//   - metadata fields only; file is immutable after upload
// Delete: DELETE /api/admin/audio/[id]
//
// On create success: redirects to /admin/audio
// On update success: calls router.refresh() to re-read updated JSON

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { Person, Collection } from '@/lib/types'

const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024 // 4MB - serverless body limit

export interface AudioFormValues {
  id: string
  title: string
  description: string
  date: string
  dateLabel: string
  duration: string
  peopleIds: string[]
  collectionIds: string[]
}

interface Props {
  mode: 'create' | 'update'
  audioId?: string            // only required in update mode
  currentFilename?: string    // only in update mode - shown as read-only info
  initial: AudioFormValues
  allPeople: Person[]
  allCollections: Collection[]
}

// Slugify a filename into a kebab-case id suggestion.
// e.g. "William Voicemail 2003.mp3" → "william-voicemail-2003"
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

// Format bytes as a human-readable size string.
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function EditAudioForm({
  mode,
  audioId,
  currentFilename,
  initial,
  allPeople,
  allCollections,
}: Props) {
  const router = useRouter()
  const [values, setValues] = useState<AudioFormValues>(initial)
  const [idManuallyEdited, setIdManuallyEdited] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'deleting'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // File-related state (create mode only)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileSizeLabel, setFileSizeLabel] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const inputClass =
    'w-full px-4 py-2.5 border border-stone rounded font-sans text-base text-navy bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:border-navy disabled:opacity-50'
  const labelClass = 'flex flex-col gap-1.5'
  const labelTextClass = 'eyebrow text-quiet text-[10px]'
  const helpClass = 'text-quiet font-serif italic text-xs mt-1'

  const isDisabled = status === 'saving' || status === 'deleting'

  // Handle file selection - validate type/size client-side
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (!file) {
      setSelectedFile(null)
      setFileSizeLabel(null)
      return
    }

    // Validate MIME type
    const allowed = new Set([
      'audio/mpeg',
      'audio/mp3',
      'audio/m4a',
      'audio/x-m4a',
      'audio/mp4',
      'audio/aac',
      'audio/wav',
      'audio/x-wav',
      'audio/vnd.wav',
    ])
    // Also check extension as a fallback (browsers vary in MIME reporting for audio)
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    const allowedExts = new Set(['mp3', 'm4a', 'aac', 'wav'])
    if (!allowed.has(file.type) && !allowedExts.has(ext)) {
      setErrorMessage('Unsupported file type. Please upload an MP3, M4A, AAC, or WAV file.')
      setStatus('error')
      e.target.value = ''
      return
    }

    // Validate file size (4MB limit - serverless body limit)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(
        'File is too large (maximum 4MB). Compress the audio or contact the developer for larger files.'
      )
      setStatus('error')
      e.target.value = ''
      return
    }

    setErrorMessage(null)
    if (status === 'error') setStatus('idle')

    setSelectedFile(file)
    setFileSizeLabel(formatBytes(file.size))

    // Auto-suggest id from filename if user hasn't manually edited it
    if (!idManuallyEdited) {
      setValues((prev) => ({ ...prev, id: slugifyFilename(file.name) }))
    }

    // Attempt to read duration from audio metadata via the Web Audio API
    // This is a best-effort - it works for most MP3/WAV files in modern browsers.
    // For M4A/AAC the browser may not surface duration until the file is fully parsed.
    const objectUrl = URL.createObjectURL(file)
    const tempAudio = new Audio(objectUrl)
    tempAudio.addEventListener('loadedmetadata', () => {
      const secs = tempAudio.duration
      if (isFinite(secs) && secs > 0) {
        const m = Math.floor(secs / 60)
        const s = Math.floor(secs % 60)
        const durationStr = `${m}:${s.toString().padStart(2, '0')}`
        setValues((prev) => {
          // Only auto-fill if user hasn't already typed a duration
          if (!prev.duration) return { ...prev, duration: durationStr }
          return prev
        })
      }
      URL.revokeObjectURL(objectUrl)
    })
    tempAudio.addEventListener('error', () => {
      URL.revokeObjectURL(objectUrl)
    })
  }

  function handleTextChange(field: keyof AudioFormValues) {
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
        setErrorMessage('Please select an audio file to upload.')
        return
      }

      // Build multipart/form-data: file + JSON metadata
      const metadata: Record<string, unknown> = {
        id: values.id,
        title: values.title.trim(),
      }
      if (values.description.trim()) metadata.description = values.description.trim()
      if (values.date.trim()) metadata.date = values.date.trim()
      if (values.dateLabel.trim()) metadata.dateLabel = values.dateLabel.trim()
      if (values.duration.trim()) metadata.duration = values.duration.trim()
      if (values.peopleIds.length) metadata.peopleIds = values.peopleIds
      if (values.collectionIds.length) metadata.collectionIds = values.collectionIds

      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('metadata', JSON.stringify(metadata))

      try {
        const res = await fetch('/api/admin/audio', {
          method: 'POST',
          body: formData,
        })
        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || `${res.status} ${res.statusText}`)
        }
        router.push('/admin/audio')
        router.refresh()
      } catch (err) {
        setStatus('error')
        setErrorMessage(err instanceof Error ? err.message : String(err))
      }
      return
    }

    // Update mode - send changed metadata fields as JSON
    const body: Record<string, unknown> = {}
    const scalarFields: Array<keyof AudioFormValues> = [
      'title', 'description', 'date', 'dateLabel', 'duration',
    ]
    for (const key of scalarFields) {
      if (values[key] !== initial[key]) {
        body[key] = values[key] as string
      }
    }
    if (JSON.stringify(values.peopleIds) !== JSON.stringify(initial.peopleIds)) {
      body.peopleIds = values.peopleIds
    }
    if (JSON.stringify(values.collectionIds) !== JSON.stringify(initial.collectionIds)) {
      body.collectionIds = values.collectionIds
    }

    if (Object.keys(body).length === 0) {
      setStatus('saved')
      return
    }

    try {
      const res = await fetch(`/api/admin/audio/${audioId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
    if (!window.confirm('Delete this audio recording? This cannot be undone.')) return
    setStatus('deleting')
    setErrorMessage(null)
    try {
      const res = await fetch(`/api/admin/audio/${audioId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `${res.status} ${res.statusText}`)
      }
      router.push('/admin/audio')
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
            <span className={labelTextClass}>Audio file</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/mpeg,audio/mp3,audio/m4a,audio/x-m4a,audio/aac,audio/wav,.mp3,.m4a,.aac,.wav"
              required
              disabled={isDisabled}
              onChange={handleFileChange}
              className="w-full font-sans text-sm text-navy file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-navy file:text-white file:font-sans file:text-sm hover:file:bg-navy-light file:cursor-pointer disabled:opacity-50"
            />
            <span className={helpClass}>
              MP3, M4A, AAC, or WAV. Maximum 4MB.{' '}
              For voice recordings, 64–128 kbps mono MP3 gives excellent quality at small size.
              Files larger than 4MB cannot be uploaded via the form - contact the developer.
            </span>
          </label>

          {/* File info after selection */}
          {selectedFile && fileSizeLabel && (
            <p className="text-quiet font-serif italic text-xs">
              {selectedFile.name} · {fileSizeLabel}
            </p>
          )}
        </div>
      )}

      {/* Current file info (update mode) */}
      {mode === 'update' && currentFilename && (
        <div className="flex flex-col gap-1.5">
          <span className={labelTextClass}>Audio file</span>
          <p className="font-sans text-sm text-navy bg-ivory border border-stone rounded px-4 py-2.5 truncate">
            {currentFilename.startsWith('https://')
              ? currentFilename.split('/').pop() ?? currentFilename
              : currentFilename}
          </p>
          <p className={helpClass}>The audio file cannot be changed after upload. Delete and re-upload to replace.</p>
        </div>
      )}

      {/* ID */}
      <label className={labelClass}>
        <span className={labelTextClass}>ID (URL slug)</span>
        <input
          type="text"
          value={values.id}
          onChange={handleIdChange}
          className={inputClass}
          placeholder="william-voicemail-2003"
          disabled={mode === 'update' || isDisabled}
          required
          pattern="[a-z][a-z0-9\-]*[a-z0-9]|[a-z]"
          title="Kebab-case only: lowercase letters, digits, hyphens"
        />
        <span className={helpClass}>
          {mode === 'create'
            ? 'Kebab-case slug - auto-generated from filename; you can override it. Cannot be changed after upload.'
            : 'Read-only. The ID is permanent once a recording is published.'}
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
          placeholder="William's voicemail, March 2003"
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
          placeholder="Asking after the family on a Sunday afternoon."
          disabled={isDisabled}
        />
        <span className={helpClass}>1–3 sentences of context. Shown in italic below the title in the player.</span>
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
          <span className={helpClass}>ISO date, e.g. 2003-03-16. Leave empty if unknown.</span>
        </label>

        <label className={labelClass}>
          <span className={labelTextClass}>Date label</span>
          <input
            type="text"
            value={values.dateLabel}
            onChange={handleTextChange('dateLabel')}
            className={inputClass}
            placeholder="March 2003"
            disabled={isDisabled}
          />
          <span className={helpClass}>Display string shown in the audio player.</span>
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
          placeholder="0:47"
          disabled={isDisabled}
        />
        <span className={helpClass}>
          Format: M:SS or MM:SS, e.g. &ldquo;0:47&rdquo; or &ldquo;12:34&rdquo;.
          {mode === 'create' && ' Auto-filled from file metadata when possible.'}
        </span>
      </label>

      {/* People picker */}
      <fieldset>
        <legend className={`${labelTextClass} mb-3`}>People in this recording</legend>
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
        <p className={helpClass}>Audio can be tagged to mixed-media collections alongside photographs.</p>
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
            ? 'Upload recording'
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
            {status === 'deleting' ? 'Deleting...' : 'Delete this recording'}
          </button>
          <p className={helpClass}>
            This permanently removes the audio entry. If it was uploaded via the admin uploader,
            the Blob file is also deleted. The live site updates on next deploy.
          </p>
        </div>
      )}
    </form>
  )
}
