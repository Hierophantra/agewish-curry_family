'use client'
// components/admin/EditScreensForm.tsx
// Admin editor for content/screens.json — show/hide whole sections. Simple
// boolean toggles; saves to /api/admin/screens (GitHub commit → ~90s rebuild).
import { useState } from 'react'
import type { Screens } from '@/lib/types'

interface Props { initial: Screens }

export default function EditScreensForm({ initial }: Props) {
  const [draft, setDraft] = useState<Screens>(() => JSON.parse(JSON.stringify(initial)))
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  function touch() { if (status === 'saved') setStatus('idle') }

  const toggles: Array<{ label: string; desc: string; value: boolean; set: (v: boolean) => void }> = [
    {
      label: 'Featured film on the home page',
      desc: 'Show a band on the home page featuring a video marked “featured”. Off by default.',
      value: draft.home.showFeaturedVideo,
      set: (v) => { setDraft((d) => ({ ...d, home: { ...d.home, showFeaturedVideo: v } })); touch() },
    },
    {
      label: 'Slideshow link on the Photographs page',
      desc: 'Show the “Play ambient slideshow →” link in the Photographs header.',
      value: draft.photographs.showSlideshowLink,
      set: (v) => { setDraft((d) => ({ ...d, photographs: { ...d.photographs, showSlideshowLink: v } })); touch() },
    },
  ]

  async function save() {
    setStatus('saving'); setErrorMsg(null)
    try {
      const res = await fetch('/api/admin/screens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      if (!res.ok) throw new Error((await res.text()) || `${res.status}`)
      setStatus('saved')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <div className="flex flex-col gap-3">
        {toggles.map((t) => (
          <label key={t.label} className="flex items-start gap-3 p-4 border border-[color:var(--color-border)] rounded-well cursor-pointer hover:bg-[color:var(--color-surface-subtle)] transition-colors">
            <input type="checkbox" className="w-4 h-4 mt-1 accent-navy" checked={t.value} onChange={(e) => t.set(e.target.checked)} />
            <span className="min-w-0">
              <span className="block text-navy text-sm">{t.label}</span>
              <span className="block text-quiet text-xs mt-0.5">{t.desc}</span>
            </span>
          </label>
        ))}
      </div>
      <div className="flex items-center gap-4 border-t hairline pt-6">
        <button type="button" onClick={save} disabled={status === 'saving'} className="btn-primary">
          {status === 'saving' ? 'Publishing…' : 'Save & publish'}
        </button>
        {status === 'saved' && <span className="font-serif italic text-gold-deep text-sm">Saved · live in ~90s</span>}
        {status === 'error' && <span className="font-serif italic text-red-600 text-sm">{errorMsg}</span>}
      </div>
    </div>
  )
}
