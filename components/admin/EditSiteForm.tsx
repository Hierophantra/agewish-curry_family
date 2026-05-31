'use client'
// components/admin/EditSiteForm.tsx
// Admin editor for content/site.json — site chrome: brand mark, per-route nav
// label overrides + hide toggles, and the footer download CTA. Route STRUCTURE
// is fixed (TABS, imported from NavTabs); this only overrides labels/visibility.
// Saves to /api/admin/site (GitHub commit → ~90s rebuild), same UX as the other
// admin editors.
import { useState } from 'react'
import type { Site } from '@/lib/types'
import { TABS } from '@/components/layout/NavTabs'

interface Props {
  initial: Site
}

const inputClass = 'w-full px-3 py-2 border border-stone rounded font-sans text-sm text-navy bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold'
const labelText = 'text-quiet text-xs uppercase tracking-[0.22em]'

export default function EditSiteForm({ initial }: Props) {
  const [draft, setDraft] = useState<Site>(() => JSON.parse(JSON.stringify(initial)))
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  function touch() { if (status === 'saved') setStatus('idle') }

  function setMark(src: string) { setDraft((d) => ({ ...d, brand: { ...d.brand, markSrc: src } })); touch() }

  function setLabel(href: string, label: string) {
    setDraft((d) => {
      const labels = { ...d.nav.labels }
      if (label.trim()) labels[href] = label
      else delete labels[href]
      return { ...d, nav: { ...d.nav, labels } }
    })
    touch()
  }

  function toggleHidden(href: string, hide: boolean) {
    setDraft((d) => {
      const hidden = hide ? Array.from(new Set([...d.nav.hidden, href])) : d.nav.hidden.filter((h) => h !== href)
      return { ...d, nav: { ...d.nav, hidden } }
    })
    touch()
  }

  function setFooter<K extends keyof Site['footer']>(key: K, value: Site['footer'][K]) {
    setDraft((d) => ({ ...d, footer: { ...d.footer, [key]: value } }))
    touch()
  }

  async function save() {
    setStatus('saving')
    setErrorMsg(null)
    try {
      const res = await fetch('/api/admin/site', {
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
    <div className="flex flex-col gap-9 max-w-2xl">
      {/* Brand mark */}
      <section className="flex flex-col gap-2">
        <h2 className="font-serif text-navy text-2xl">Brand mark</h2>
        <label className="flex flex-col gap-1">
          <span className={labelText}>Mark image path</span>
          <input className={inputClass} value={draft.brand.markSrc} onChange={(e) => setMark(e.target.value)} placeholder="/images/aw-symbol-2x.png" />
        </label>
        <p className="text-quiet text-xs">Path under <code className="not-italic text-navy">public/</code> or a full https URL. Shown in the top nav and footer.</p>
      </section>

      {/* Navigation */}
      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-navy text-2xl">Navigation</h2>
        <p className="text-quiet text-xs">Rename or hide a tab. Routes themselves are fixed in code; blank label = use the default.</p>
        <div className="flex flex-col gap-2.5">
          {TABS.map((tab) => (
            <div key={tab.href} className="flex items-center gap-3">
              <input
                className={inputClass + ' flex-1'}
                value={draft.nav.labels[tab.href] ?? ''}
                placeholder={tab.label}
                onChange={(e) => setLabel(tab.href, e.target.value)}
                aria-label={`Label for ${tab.label}`}
              />
              <label className="flex items-center gap-1.5 text-xs text-muted shrink-0 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-navy"
                  checked={draft.nav.hidden.includes(tab.href)}
                  onChange={(e) => toggleHidden(tab.href, e.target.checked)}
                  disabled={tab.href === '/'}
                />
                Hide
              </label>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-navy text-2xl">Footer download link</h2>
        <label className="flex items-center gap-2 text-sm text-navy cursor-pointer">
          <input type="checkbox" className="w-4 h-4 accent-navy" checked={draft.footer.downloadEnabled} onChange={(e) => setFooter('downloadEnabled', e.target.checked)} />
          Show the download link
        </label>
        <div className={draft.footer.downloadEnabled ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'grid grid-cols-1 sm:grid-cols-2 gap-3 opacity-40 pointer-events-none'}>
          <label className="flex flex-col gap-1">
            <span className={labelText}>Label</span>
            <input className={inputClass} value={draft.footer.downloadLabel} onChange={(e) => setFooter('downloadLabel', e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelText}>Link</span>
            <input className={inputClass} value={draft.footer.downloadHref} onChange={(e) => setFooter('downloadHref', e.target.value)} />
          </label>
        </div>
      </section>

      {/* Save bar */}
      <div className="flex items-center gap-4 border-t hairline pt-6">
        <button
          type="button"
          onClick={save}
          disabled={status === 'saving'}
          className="bg-navy text-white px-6 py-2.5 rounded text-sm hover:bg-navy-light transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          {status === 'saving' ? 'Publishing…' : 'Save & publish'}
        </button>
        {status === 'saved' && <span className="font-serif italic text-gold-deep text-sm">Saved · live in ~90s</span>}
        {status === 'error' && <span className="font-serif italic text-red-600 text-sm">{errorMsg}</span>}
      </div>
    </div>
  )
}
