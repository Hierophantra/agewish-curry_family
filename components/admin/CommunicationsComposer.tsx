'use client'
// components/admin/CommunicationsComposer.tsx
// Admin Communications — select family members (individually or all), choose a
// channel (email / text / both), and compose a message. Sending is NOT wired
// yet (no email/SMS service connected); "Preview send" resolves exactly who
// would be contacted and how, so the workflow is ready the moment a service is
// connected.
import { useMemo, useState } from 'react'

export interface ContactPerson {
  id: string
  name: string
  email?: string
  phone?: string
}

type Channel = 'email' | 'text' | 'both'

export default function CommunicationsComposer({ people }: { people: ContactPerson[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [channel, setChannel] = useState<Channel>('both')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [preview, setPreview] = useState<{ email: ContactPerson[]; text: ContactPerson[] } | null>(null)

  const toggle = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
    setPreview(null)
  }
  const allSelected = people.length > 0 && people.every((p) => selected.has(p.id))
  const selectAll = () => { setSelected(allSelected ? new Set() : new Set(people.map((p) => p.id))); setPreview(null) }

  const chosen = useMemo(() => people.filter((p) => selected.has(p.id)), [people, selected])

  function doPreview() {
    const wantEmail = channel === 'email' || channel === 'both'
    const wantText = channel === 'text' || channel === 'both'
    setPreview({
      email: wantEmail ? chosen.filter((p) => p.email) : [],
      text: wantText ? chosen.filter((p) => p.phone) : [],
    })
  }

  const inputClass = 'w-full px-4 py-2.5 border border-stone rounded font-sans text-base text-navy bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold'

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      {/* Not-wired banner */}
      <div className="rounded-well border border-[color:var(--color-border)] bg-[color:var(--color-surface-subtle)] px-4 py-3">
        <p className="text-navy text-sm">Sending isn&rsquo;t connected yet.</p>
        <p className="text-quiet text-xs mt-0.5">Compose and choose recipients now; this previews exactly who would receive the message by email and by text. Connect an email/SMS service later to enable real sending.</p>
      </div>

      {/* Recipients */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-navy text-xl">Recipients</h2>
          <button type="button" onClick={selectAll} className="text-xs text-navy hover:text-gold-deep underline underline-offset-2">
            {allSelected ? 'Clear all' : 'Select all'}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {people.map((p) => (
            <label key={p.id} className="flex items-start gap-2.5 p-2.5 rounded border border-[color:var(--color-border)] cursor-pointer hover:bg-[color:var(--color-surface-subtle)]">
              <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} className="mt-1 w-4 h-4 accent-navy" />
              <span className="min-w-0">
                <span className="block text-navy text-sm truncate">{p.name}</span>
                <span className="block text-quiet text-[11px]">
                  {p.email ? '✉ ' + p.email : <span className="italic">no email</span>}
                  {' · '}
                  {p.phone ? '☎ ' + p.phone : <span className="italic">no phone</span>}
                </span>
              </span>
            </label>
          ))}
        </div>
        <p className="text-quiet text-xs">{chosen.length} selected</p>
      </section>

      {/* Channel */}
      <section className="flex flex-col gap-2">
        <h2 className="font-serif text-navy text-xl">Channel</h2>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Channel">
          {([['both', 'Email + text'], ['email', 'Email only'], ['text', 'Text only']] as const).map(([v, label]) => (
            <button key={v} type="button" onClick={() => { setChannel(v); setPreview(null) }} aria-pressed={channel === v}
              className={['px-3 py-1.5 rounded text-sm border transition-colors', channel === v ? 'border-navy bg-navy text-white' : 'border-[color:var(--color-border)] text-muted hover:text-navy'].join(' ')}>
              {label}
            </button>
          ))}
        </div>
        <p className="text-quiet text-xs">Recipients without the chosen contact method are skipped automatically.</p>
      </section>

      {/* Message */}
      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-navy text-xl">Message</h2>
        {channel !== 'text' && (
          <label className="flex flex-col gap-1">
            <span className="eyebrow text-quiet text-[10px]">Subject (email)</span>
            <input className={inputClass} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Family reunion — save the date" />
          </label>
        )}
        <label className="flex flex-col gap-1">
          <span className="eyebrow text-quiet text-[10px]">Message</span>
          <textarea className={`${inputClass} min-h-[140px] resize-y`} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your announcement…" />
          {channel !== 'email' && <span className="text-quiet text-xs">Texts are best kept short.</span>}
        </label>
      </section>

      {/* Action */}
      <div className="flex items-center gap-4 border-t hairline pt-6">
        <button type="button" onClick={doPreview} disabled={chosen.length === 0} className="btn-primary disabled:opacity-50">
          Preview send
        </button>
        <span className="text-quiet text-xs">No message is sent — preview only.</span>
      </div>

      {preview && (
        <div className="rounded-well border border-[color:var(--color-border)] p-5 flex flex-col gap-3">
          <h3 className="font-serif text-navy text-lg">Would contact</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="eyebrow text-quiet mb-1.5">By email ({preview.email.length})</p>
              {preview.email.length === 0 ? <p className="text-quiet italic text-sm">none</p> : (
                <ul className="text-sm text-navy flex flex-col gap-0.5">{preview.email.map((p) => <li key={p.id}>{p.name} <span className="text-quiet text-xs">{p.email}</span></li>)}</ul>
              )}
            </div>
            <div>
              <p className="eyebrow text-quiet mb-1.5">By text ({preview.text.length})</p>
              {preview.text.length === 0 ? <p className="text-quiet italic text-sm">none</p> : (
                <ul className="text-sm text-navy flex flex-col gap-0.5">{preview.text.map((p) => <li key={p.id}>{p.name} <span className="text-quiet text-xs">{p.phone}</span></li>)}</ul>
              )}
            </div>
          </div>
          {chosen.some((p) => (channel !== 'text' && !p.email) || (channel !== 'email' && !p.phone)) && (
            <p className="text-quiet text-xs">Some selected people are missing a contact method for the chosen channel and were skipped. Add email/phone on their person page.</p>
          )}
        </div>
      )}
    </div>
  )
}
