'use client'
// app/admin/people/[id]/EditPersonForm.tsx
// Client Component — multi-field editor for creating or updating a person record.
// Used by both /admin/people/new (mode='create') and /admin/people/[id] (mode='update').
//
// Create: JSON POST to /api/admin/people with full person object
// Update: JSON POST to /api/admin/people/[id] with changed fields only
// Delete: DELETE /api/admin/people/[id] with cascade cleanup
//
// On create success: redirects to /admin/people
// On update success: calls router.refresh() to re-read updated JSON
//
// Relationship pickers:
//   parentIds — multi-select checkboxes from allPeople (filtered to exclude current person)
//   childrenIds — same pattern
//   Bidirectional sync is handled server-side: picking a parent here adds this person to that
//   parent's childrenIds automatically (and vice versa).

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Person } from '@/lib/types'

// Slugify a name into a kebab-case id suggestion.
// e.g. "Emily Walsh" → "emily-walsh"
function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export interface PersonFormValues {
  id: string
  name: string
  relationLabel: string
  eyebrow: string
  birthDate: string
  deathDate: string
  datesLabel: string
  birthplace: string
  spouseLabel: string
  parentIds: string[]
  childrenIds: string[]
}

interface Props {
  mode: 'create' | 'update'
  personId?: string            // only required in update mode
  initial: PersonFormValues
  allPeople: Person[]          // all people for the relationship pickers
}

export default function EditPersonForm({ mode, personId, initial, allPeople }: Props) {
  const router = useRouter()
  const [values, setValues] = useState<PersonFormValues>(initial)
  const [idManuallyEdited, setIdManuallyEdited] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'deleting'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const inputClass =
    'w-full px-4 py-2.5 border border-stone rounded font-sans text-base text-navy bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:border-navy disabled:opacity-50'
  const labelClass = 'flex flex-col gap-1.5'
  const labelTextClass = 'eyebrow text-quiet text-[10px]'
  const helpClass = 'text-quiet font-serif italic text-xs mt-1'

  const isDisabled = status === 'saving' || status === 'deleting'

  // Filter the people list for relationship pickers:
  // In update mode, exclude the current person to prevent self-reference.
  const eligiblePeople = mode === 'update'
    ? allPeople.filter((p) => p.id !== personId)
    : allPeople

  function handleTextChange(field: keyof PersonFormValues) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: e.target.value }))
      if (status === 'saved') setStatus('idle')
    }
  }

  function handleIdChange(e: React.ChangeEvent<HTMLInputElement>) {
    setIdManuallyEdited(true)
    setValues((prev) => ({ ...prev, id: e.target.value }))
    if (status === 'saved') setStatus('idle')
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value
    setValues((prev) => {
      const updated = { ...prev, name }
      // Auto-suggest id from name if user hasn't manually edited it (create mode only)
      if (mode === 'create' && !idManuallyEdited) {
        updated.id = slugifyName(name)
      }
      return updated
    })
    if (status === 'saved') setStatus('idle')
  }

  function handleCheckboxToggle(field: 'parentIds' | 'childrenIds', value: string) {
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
      // Build full person object for POST /api/admin/people
      const body: Record<string, unknown> = {
        id: values.id.trim(),
        name: values.name.trim(),
      }
      if (values.relationLabel.trim()) body.relationLabel = values.relationLabel.trim()
      if (values.eyebrow.trim()) body.eyebrow = values.eyebrow.trim()
      if (values.birthDate.trim()) body.birthDate = values.birthDate.trim()
      if (values.deathDate.trim()) body.deathDate = values.deathDate.trim()
      if (values.datesLabel.trim()) body.datesLabel = values.datesLabel.trim()
      if (values.birthplace.trim()) body.birthplace = values.birthplace.trim()
      if (values.spouseLabel.trim()) body.spouseLabel = values.spouseLabel.trim()
      body.parentIds = values.parentIds
      body.childrenIds = values.childrenIds

      try {
        const res = await fetch('/api/admin/people', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || `${res.status} ${res.statusText}`)
        }
        router.push('/admin/people')
        router.refresh()
      } catch (err) {
        setStatus('error')
        setErrorMessage(err instanceof Error ? err.message : String(err))
      }
      return
    }

    // Update mode — send only changed fields
    const changed: Record<string, unknown> = {}

    // Scalar fields
    const scalarFields: Array<keyof PersonFormValues> = [
      'name', 'relationLabel', 'eyebrow', 'birthDate', 'deathDate', 'datesLabel', 'birthplace', 'spouseLabel',
    ]
    for (const key of scalarFields) {
      if (values[key] !== initial[key]) {
        changed[key] = values[key] as string
      }
    }

    // Array fields
    if (JSON.stringify(values.parentIds) !== JSON.stringify(initial.parentIds)) {
      changed.parentIds = values.parentIds
    }
    if (JSON.stringify(values.childrenIds) !== JSON.stringify(initial.childrenIds)) {
      changed.childrenIds = values.childrenIds
    }

    if (Object.keys(changed).length === 0) {
      setStatus('saved')
      return
    }

    try {
      const res = await fetch(`/api/admin/people/${personId}`, {
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
    const personName = values.name || personId || 'this person'
    const confirmed = window.confirm(
      `Delete ${personName}? This will also remove their references from photos, videos, audio, chronicles, and other family members. This cannot be undone.`
    )
    if (!confirmed) return

    setStatus('deleting')
    setErrorMessage(null)
    try {
      const res = await fetch(`/api/admin/people/${personId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `${res.status} ${res.statusText}`)
      }
      router.push('/admin/people')
      router.refresh()
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

      {/* ID (editable in create mode, read-only in update mode) */}
      <label className={labelClass}>
        <span className={labelTextClass}>ID (URL slug)</span>
        <input
          type="text"
          value={values.id}
          onChange={handleIdChange}
          className={inputClass}
          placeholder="emily-walsh"
          disabled={mode === 'update' || isDisabled}
          required
          pattern="[a-z][a-z0-9\-]*[a-z0-9]|[a-z]"
          title="Kebab-case only: lowercase letters, digits, hyphens"
        />
        <span className={helpClass}>
          {mode === 'create'
            ? 'Kebab-case slug — auto-suggested from name; you can override it. Cannot be changed after creation (used in URLs and all cross-references).'
            : 'Read-only. The ID is permanent once a person is published — renaming it would break URLs and all photo, video, and chronicle references.'}
        </span>
      </label>

      {/* Name */}
      <label className={labelClass}>
        <span className={labelTextClass}>Name</span>
        <input
          type="text"
          value={values.name}
          onChange={mode === 'create' ? handleNameChange : handleTextChange('name')}
          className={inputClass}
          disabled={isDisabled}
          required
        />
      </label>

      {/* Relation label */}
      <label className={labelClass}>
        <span className={labelTextClass}>Relation label</span>
        <input
          type="text"
          value={values.relationLabel}
          onChange={handleTextChange('relationLabel')}
          className={inputClass}
          placeholder="GRANDFATHER, SON, GRANDDAUGHTER, etc."
          disabled={isDisabled}
        />
        <span className={helpClass}>Used in the family tree node and as the eyebrow on this person&apos;s page if no descriptive eyebrow is set. Use the gendered form (Grandfather/Grandmother/Son/Daughter/Grandson/Granddaughter).</span>
      </label>

      {/* Descriptive eyebrow */}
      <label className={labelClass}>
        <span className={labelTextClass}>Descriptive eyebrow</span>
        <input
          type="text"
          value={values.eyebrow}
          onChange={handleTextChange('eyebrow')}
          className={inputClass}
          placeholder="Patriarch of the family"
          disabled={isDisabled}
        />
        <span className={helpClass}>Optional. Shown on this person&apos;s page above the name. If empty, the relation label is used instead.</span>
      </label>

      {/* Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <label className={labelClass}>
          <span className={labelTextClass}>Birth date</span>
          <input
            type="text"
            value={values.birthDate}
            onChange={handleTextChange('birthDate')}
            className={inputClass}
            placeholder="YYYY-MM-DD"
            disabled={isDisabled}
          />
          <span className={helpClass}>ISO date (e.g. 1920-04-12). Approximate dates are fine — leave empty if unknown.</span>
        </label>

        <label className={labelClass}>
          <span className={labelTextClass}>Death date</span>
          <input
            type="text"
            value={values.deathDate}
            onChange={handleTextChange('deathDate')}
            className={inputClass}
            placeholder="YYYY-MM-DD"
            disabled={isDisabled}
          />
          <span className={helpClass}>Leave empty if living.</span>
        </label>
      </div>

      {/* Dates label */}
      <label className={labelClass}>
        <span className={labelTextClass}>Dates label</span>
        <input
          type="text"
          value={values.datesLabel}
          onChange={handleTextChange('datesLabel')}
          className={inputClass}
          placeholder="1920 — 2008"
          disabled={isDisabled}
        />
        <span className={helpClass}>Display string shown under the name. Use em dash. Examples: &ldquo;1920 — 2008&rdquo;, &ldquo;1952 — present&rdquo;, &ldquo;b. 1980&rdquo;.</span>
      </label>

      {/* Birthplace */}
      <label className={labelClass}>
        <span className={labelTextClass}>Birthplace</span>
        <input
          type="text"
          value={values.birthplace}
          onChange={handleTextChange('birthplace')}
          className={inputClass}
          placeholder="Dayton, Ohio"
          disabled={isDisabled}
        />
      </label>

      {/* Spouse label */}
      <label className={labelClass}>
        <span className={labelTextClass}>Spouse</span>
        <input
          type="text"
          value={values.spouseLabel}
          onChange={handleTextChange('spouseLabel')}
          className={inputClass}
          placeholder="Eleanor Hayes"
          disabled={isDisabled}
        />
        <span className={helpClass}>Spouse&apos;s name as a display string. (Linking to a separate person record with referential integrity comes via spouseIds[] in the JSON.)</span>
      </label>

      {/* Parent picker */}
      {allPeople.length > 0 && (
        <fieldset>
          <legend className={`${labelTextClass} mb-2`}>Parents</legend>
          <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-2 border border-stone rounded px-3 py-3">
            {eligiblePeople.map((person) => (
              <label key={person.id} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={values.parentIds.includes(person.id)}
                  onChange={() => handleCheckboxToggle('parentIds', person.id)}
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
            {eligiblePeople.length === 0 && (
              <p className="font-serif italic text-muted text-sm">No other people in the archive yet.</p>
            )}
          </div>
          <p className={helpClass}>
            Pick parents from existing people. The bidirectional relationship is set automatically — selecting a parent here will also add this person to that parent&apos;s children list.
          </p>
        </fieldset>
      )}

      {/* Children picker */}
      {allPeople.length > 0 && (
        <fieldset>
          <legend className={`${labelTextClass} mb-2`}>Children</legend>
          <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-2 border border-stone rounded px-3 py-3">
            {eligiblePeople.map((person) => (
              <label key={person.id} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={values.childrenIds.includes(person.id)}
                  onChange={() => handleCheckboxToggle('childrenIds', person.id)}
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
            {eligiblePeople.length === 0 && (
              <p className="font-serif italic text-muted text-sm">No other people in the archive yet.</p>
            )}
          </div>
          <p className={helpClass}>
            Pick children from existing people. Add or edit other relationships (spouse, etc.) by editing the related person&apos;s record directly.
          </p>
        </fieldset>
      )}

      {/* Submit + status */}
      <div className="flex items-center gap-4 pt-2 border-t border-stone">
        <button
          type="submit"
          disabled={isDisabled}
          className="bg-navy text-white px-6 py-2.5 rounded font-sans text-base hover:bg-navy-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        >
          {status === 'saving'
            ? (mode === 'create' ? 'Creating...' : 'Saving...')
            : mode === 'create'
            ? 'Create person'
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
            {status === 'deleting' ? 'Deleting...' : 'Delete this person'}
          </button>
          <p className={helpClass}>
            This permanently removes the person and cleans up all references — in photos, videos, audio, chronicles, and other family members&apos; parent/child lists. This cannot be undone.
          </p>
        </div>
      )}
    </form>
  )
}
