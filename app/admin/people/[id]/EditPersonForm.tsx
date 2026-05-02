'use client'
// app/admin/people/[id]/EditPersonForm.tsx
// Client Component — multi-field editor for the person's displayed information.
// Submits to /api/admin/people/[id] via fetch (JSON body, only changed fields are sent).
// On success, calls router.refresh() so the Server Component re-reads the updated JSON.
//
// Fields covered (matches what /person/[id] page actually displays):
//   - name
//   - relationLabel (e.g. "GRANDFATHER")
//   - eyebrow (e.g. "Patriarch of the family")
//   - birthDate (ISO YYYY-MM-DD)
//   - deathDate (ISO YYYY-MM-DD, optional)
//   - datesLabel (display string like "1920 — 2008", overrides any auto-formatting)
//   - birthplace
//   - spouseLabel (display name of spouse, NOT a Person record reference)
//
// NOT covered here (deferred to v3 Phase 21+):
//   - parentIds, childrenIds (require referential-integrity-aware person picker UI)
//   - photoIds (require photo browser; depends on photo upload existing)
//   - provenance fields (advanced; another phase)
//   - gender (rare to change)

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface InitialValues {
  name: string
  relationLabel: string
  eyebrow: string
  birthDate: string
  deathDate: string
  datesLabel: string
  birthplace: string
  spouseLabel: string
}

interface Props {
  personId: string
  initial: InitialValues
}

export default function EditPersonForm({ personId, initial }: Props) {
  const router = useRouter()
  const [values, setValues] = useState<InitialValues>(initial)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  function handleChange(field: keyof InitialValues) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: e.target.value }))
      if (status === 'saved') setStatus('idle')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('saving')
    setErrorMessage(null)

    // Build the diff payload — only send fields that changed from initial.
    // The server merges into the existing record so omitted fields are preserved.
    const changed: Partial<InitialValues> = {}
    for (const k of Object.keys(values) as Array<keyof InitialValues>) {
      if (values[k] !== initial[k]) changed[k] = values[k]
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

  const inputClass =
    'w-full px-4 py-2.5 border border-stone rounded font-sans text-base text-navy bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:border-navy'
  const labelClass = 'flex flex-col gap-1.5'
  const labelTextClass = 'eyebrow text-quiet text-[10px]'
  const helpClass = 'text-quiet font-serif italic text-xs mt-1'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <label className={labelClass}>
        <span className={labelTextClass}>Name</span>
        <input
          type="text"
          value={values.name}
          onChange={handleChange('name')}
          className={inputClass}
          disabled={status === 'saving'}
          required
        />
      </label>

      <label className={labelClass}>
        <span className={labelTextClass}>Relation label</span>
        <input
          type="text"
          value={values.relationLabel}
          onChange={handleChange('relationLabel')}
          className={inputClass}
          placeholder="GRANDFATHER, SON, GRANDDAUGHTER, etc."
          disabled={status === 'saving'}
        />
        <span className={helpClass}>Used in the family tree node and as the eyebrow on this person&apos;s page if no descriptive eyebrow is set. Use the gendered form (Grandfather/Grandmother/Son/Daughter/Grandson/Granddaughter).</span>
      </label>

      <label className={labelClass}>
        <span className={labelTextClass}>Descriptive eyebrow</span>
        <input
          type="text"
          value={values.eyebrow}
          onChange={handleChange('eyebrow')}
          className={inputClass}
          placeholder="Patriarch of the family"
          disabled={status === 'saving'}
        />
        <span className={helpClass}>Optional. Shown on this person&apos;s page above the name. If empty, the relation label is used instead.</span>
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <label className={labelClass}>
          <span className={labelTextClass}>Birth date</span>
          <input
            type="text"
            value={values.birthDate}
            onChange={handleChange('birthDate')}
            className={inputClass}
            placeholder="YYYY-MM-DD"
            disabled={status === 'saving'}
          />
          <span className={helpClass}>ISO date (e.g. 1920-04-12). Approximate dates are fine — leave empty if unknown.</span>
        </label>

        <label className={labelClass}>
          <span className={labelTextClass}>Death date</span>
          <input
            type="text"
            value={values.deathDate}
            onChange={handleChange('deathDate')}
            className={inputClass}
            placeholder="YYYY-MM-DD"
            disabled={status === 'saving'}
          />
          <span className={helpClass}>Leave empty if living.</span>
        </label>
      </div>

      <label className={labelClass}>
        <span className={labelTextClass}>Dates label</span>
        <input
          type="text"
          value={values.datesLabel}
          onChange={handleChange('datesLabel')}
          className={inputClass}
          placeholder="1920 — 2008"
          disabled={status === 'saving'}
        />
        <span className={helpClass}>Display string shown under the name. Use em dash. Examples: &ldquo;1920 — 2008&rdquo;, &ldquo;1952 — present&rdquo;, &ldquo;b. 1980&rdquo;.</span>
      </label>

      <label className={labelClass}>
        <span className={labelTextClass}>Birthplace</span>
        <input
          type="text"
          value={values.birthplace}
          onChange={handleChange('birthplace')}
          className={inputClass}
          placeholder="Dayton, Ohio"
          disabled={status === 'saving'}
        />
      </label>

      <label className={labelClass}>
        <span className={labelTextClass}>Spouse</span>
        <input
          type="text"
          value={values.spouseLabel}
          onChange={handleChange('spouseLabel')}
          className={inputClass}
          placeholder="Eleanor Hayes"
          disabled={status === 'saving'}
        />
        <span className={helpClass}>Spouse&apos;s name as a display string. (Linking to a separate person record with referential integrity comes in a future admin phase.)</span>
      </label>

      <div className="flex items-center gap-4 pt-2 border-t border-stone">
        <button
          type="submit"
          disabled={status === 'saving'}
          className="bg-navy text-white px-6 py-2.5 rounded font-sans text-base hover:bg-navy-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        >
          {status === 'saving' ? 'Saving...' : 'Save changes'}
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
    </form>
  )
}
