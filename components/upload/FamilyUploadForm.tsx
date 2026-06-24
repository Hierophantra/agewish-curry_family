'use client'
// components/upload/FamilyUploadForm.tsx
// Family image-upload form. Available to ANY logged-in family member at /upload.
//
// Adapted from components/admin/EditPhotoForm.tsx (create mode): file picker +
// client-side type/size validation + preview. The title defaults from the chosen
// filename via prettifyFilename() (spaces + Title Case) and stays user-editable.
// People are FREE TEXT (PeopleNameTagPicker), not person IDs. The date carries a
// precision marker (year / month / date / unknown).
//
// On submit: multipart/form-data POST to /api/upload (file + JSON metadata).
// On success: redirect to /gallery.
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { DatePrecision } from '@/lib/types'
import { prettifyFilename } from '@/lib/utils'
import PeopleNameTagPicker from '@/components/upload/PeopleNameTagPicker'

const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024 // 4MB (serverless body limit)
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

interface Props {
  /** Autocomplete pool for the people picker: prior upload names ∪ tree names. */
  peopleSuggestions: string[]
}

export default function FamilyUploadForm({ peopleSuggestions }: Props) {
  const router = useRouter()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [titleManuallyEdited, setTitleManuallyEdited] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [people, setPeople] = useState<string[]>([])
  const [date, setDate] = useState('')
  const [datePrecision, setDatePrecision] = useState<DatePrecision>('unknown')

  const [status, setStatus] = useState<'idle' | 'uploading' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const inputClass =
    'w-full px-4 py-2.5 border border-stone rounded font-sans text-base text-navy bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:border-navy disabled:opacity-50'
  const labelClass = 'flex flex-col gap-1.5'
  const labelTextClass = 'eyebrow text-quiet text-[10px]'
  const helpClass = 'text-quiet font-serif italic text-xs mt-1'

  const isDisabled = status === 'uploading'

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (!file) {
      setSelectedFile(null)
      setPreviewUrl(null)
      return
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMessage('Unsupported file type. Please choose a JPEG, PNG, or WebP image.')
      setStatus('error')
      e.target.value = ''
      return
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage('Image is too large. Please choose an image under 4MB.')
      setStatus('error')
      e.target.value = ''
      return
    }
    setErrorMessage(null)
    if (status === 'error') setStatus('idle')

    setSelectedFile(file)
    // Default the title from the filename until the user types their own.
    if (!titleManuallyEdited) {
      setTitle(prettifyFilename(file.name))
    }
    setPreviewUrl(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage(null)

    if (!selectedFile) {
      setStatus('error')
      setErrorMessage('Please choose an image to upload.')
      return
    }
    if (!title.trim()) {
      setStatus('error')
      setErrorMessage('Please give the photo a title.')
      return
    }

    setStatus('uploading')

    const metadata: Record<string, unknown> = {
      title: title.trim(),
      datePrecision,
    }
    if (description.trim()) metadata.description = description.trim()
    if (people.length) metadata.people = people
    if (datePrecision !== 'unknown' && date.trim()) metadata.date = date.trim()

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('metadata', JSON.stringify(metadata))

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `${res.status} ${res.statusText}`)
      }
      router.push('/gallery')
      router.refresh()
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : String(err))
    }
  }

  const precisionOptions: Array<{ v: DatePrecision; label: string }> = [
    { v: 'unknown', label: 'Unknown' },
    { v: 'year', label: 'Year only' },
    { v: 'month', label: 'Month & year' },
    { v: 'date', label: 'Exact date' },
  ]

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-7">
      {/* File picker */}
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
          <span className={helpClass}>JPEG, PNG, or WebP. Maximum 4MB.</span>
        </label>

        {previewUrl && (
          <div className="relative aspect-[4/3] max-w-sm overflow-hidden rounded border hairline bg-ivory">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
          </div>
        )}
      </div>

      {/* Title */}
      <label className={labelClass}>
        <span className={labelTextClass}>Title</span>
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitleManuallyEdited(true)
            setTitle(e.target.value)
          }}
          className={inputClass}
          placeholder="A summer at the lake house"
          disabled={isDisabled}
          required
        />
        <span className={helpClass}>Starts from the filename — change it to anything you like.</span>
      </label>

      {/* People (free text) */}
      <fieldset>
        <legend className={`${labelTextClass} mb-3`}>Who is in it</legend>
        <PeopleNameTagPicker
          suggestions={peopleSuggestions}
          value={people}
          onChange={setPeople}
          disabled={isDisabled}
        />
      </fieldset>

      {/* Description */}
      <label className={labelClass}>
        <span className={labelTextClass}>Description (optional)</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`${inputClass} min-h-[100px] resize-y`}
          placeholder="Anything worth remembering about this photo."
          disabled={isDisabled}
        />
      </label>

      {/* Date + precision */}
      <fieldset className="flex flex-col gap-3">
        <legend className={`${labelTextClass} mb-1`}>When was it taken? (optional)</legend>
        <div className="flex flex-wrap gap-1" role="group" aria-label="How much of the date is known">
          {precisionOptions.map((o) => {
            const active = datePrecision === o.v
            return (
              <button
                key={o.v}
                type="button"
                disabled={isDisabled}
                aria-pressed={active}
                onClick={() => setDatePrecision(o.v)}
                className={[
                  'px-2.5 py-1 rounded text-xs border transition-colors',
                  active
                    ? 'border-navy bg-navy text-white'
                    : 'border-[color:var(--color-border)] text-muted hover:text-navy',
                ].join(' ')}
              >
                {o.label}
              </button>
            )
          })}
        </div>
        {datePrecision !== 'unknown' && (
          <label className={labelClass}>
            <span className={labelTextClass}>
              {datePrecision === 'year' ? 'Year' : datePrecision === 'month' ? 'Month & year' : 'Date'}
            </span>
            <input
              type={datePrecision === 'date' ? 'date' : 'text'}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
              placeholder={
                datePrecision === 'year' ? '1979' : datePrecision === 'month' ? '1979-06' : 'YYYY-MM-DD'
              }
              disabled={isDisabled}
            />
            <span className={helpClass}>
              {datePrecision === 'year'
                ? 'Just the year is fine.'
                : datePrecision === 'month'
                  ? 'Month and year, e.g. 1979-06.'
                  : 'The exact day, if you know it.'}
            </span>
          </label>
        )}
      </fieldset>

      {/* Submit + status */}
      <div className="flex items-center gap-4 pt-2 border-t border-stone">
        <button
          type="submit"
          disabled={isDisabled}
          className="bg-navy text-white px-6 py-2.5 rounded font-sans text-base hover:bg-navy-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        >
          {status === 'uploading' ? 'Uploading…' : 'Upload photo'}
        </button>
        {status === 'error' && (
          <p className="font-serif italic text-red-600 text-sm">Error: {errorMessage}</p>
        )}
      </div>
    </form>
  )
}
