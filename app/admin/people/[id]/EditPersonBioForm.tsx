'use client'
// app/admin/people/[id]/EditPersonBioForm.tsx
// Client Component — owns the bio textarea, save button, and status display.
// Submits to /api/admin/people/[id]/bio via fetch (JSON body).
// On success, calls router.refresh() so the Server Component re-reads the updated JSON.

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  personId: string
  initialBio: string
  personName: string
}

export default function EditPersonBioForm({ personId, initialBio, personName }: Props) {
  const router = useRouter()
  const [bio, setBio] = useState(initialBio)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('saving')
    setErrorMessage(null)

    try {
      const res = await fetch(`/api/admin/people/${personId}/bio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `${res.status} ${res.statusText}`)
      }
      setStatus('saved')
      // Refresh server data so the next view shows the latest committed value
      router.refresh()
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="eyebrow text-quiet text-[10px]">Bio</span>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={10}
          className="w-full px-4 py-3 border border-stone rounded font-serif text-base text-navy bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:border-navy resize-y"
          placeholder={`Write a bio for ${personName}...`}
          disabled={status === 'saving'}
        />
      </label>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={status === 'saving'}
          className="bg-navy text-white px-6 py-2.5 rounded font-sans text-base hover:bg-navy-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        >
          {status === 'saving' ? 'Saving...' : 'Save bio'}
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
