'use client'
// components/admin/ImportHeroButton.tsx
// One-click "import hero images into Photographs" action for the admin photos
// page. Idempotent — safe to click again; it only adds hero images that aren't
// already Photo records.
import { useState } from 'react'

export default function ImportHeroButton() {
  const [status, setStatus] = useState<'idle' | 'working' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState<string | null>(null)

  async function run() {
    setStatus('working')
    setMsg(null)
    try {
      const res = await fetch('/api/admin/photos/import-hero', { method: 'POST' })
      if (!res.ok) throw new Error((await res.text()) || `${res.status}`)
      const j = await res.json()
      setStatus('done')
      setMsg(j.imported > 0
        ? `Imported ${j.imported} hero image${j.imported === 1 ? '' : 's'}. Live in ~90s — reload after the rebuild to crop/tag them.`
        : 'All hero images are already in Photographs.')
    } catch (err) {
      setStatus('error')
      setMsg(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button type="button" onClick={run} disabled={status === 'working'} className="btn-primary btn-sm self-start disabled:opacity-50">
        {status === 'working' ? 'Importing…' : 'Import hero images'}
      </button>
      {msg && (
        <span className={`font-serif italic text-xs ${status === 'error' ? 'text-red-600' : 'text-gold-deep'}`}>{msg}</span>
      )}
    </div>
  )
}
