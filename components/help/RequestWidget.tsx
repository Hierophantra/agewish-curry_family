'use client'
// components/help/RequestWidget.tsx
// Public "?" help + request widget (bottom-right). Lets any visitor send the
// family admin a request — update info, submit content, or submit a correction
// — and shows a few navigation tips. For now it composes a prefilled email via
// mailto (no service needed); the structure makes swapping to a server email
// route later a small change. Recipient is configurable per family (site.json).
import { useState } from 'react'

interface Props {
  requestEmail: string
}

const REQUEST_TYPES = [
  { value: 'Update information', help: 'Fix or refresh details about a person or event' },
  { value: 'Submit content', help: 'Offer a photo, video, story, or recording to add' },
  { value: 'Submit a correction', help: 'Wrong date, name, place, or relationship' },
] as const

const TIPS = [
  'Use the search box on the home page to jump to a family member.',
  'Open the Family tree to explore how everyone connects; click a person for their summary.',
  'Photographs and Videos are grouped into collections — open one to browse.',
  'On a person’s page you’ll find their photos, videos, and stories together.',
]

export default function RequestWidget({ requestEmail }: Props) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'request' | 'tips'>('request')
  const [type, setType] = useState<string>(REQUEST_TYPES[0].value)
  const [message, setMessage] = useState('')
  const [from, setFrom] = useState('')

  function send() {
    const subject = `[Family archive] ${type}`
    const bodyLines = [
      `Request type: ${type}`,
      '',
      message.trim() || '(no details provided)',
      '',
      from.trim() ? `From: ${from.trim()}` : '',
      `Sent from: ${typeof window !== 'undefined' ? window.location.href : ''}`,
    ].filter(Boolean)
    const href = `mailto:${requestEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`
    window.location.href = href
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-[85] w-12 h-12 rounded-full bg-navy text-white shadow-lg grid place-items-center hover:bg-navy-light transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          title="Help & requests"
          aria-label="Help and requests"
        >
          <span className="text-xl font-serif" aria-hidden="true">?</span>
        </button>
      )}

      {open && (
        <aside
          className="fixed bottom-5 right-5 z-[85] w-[340px] max-w-[92vw] max-h-[80vh] overflow-y-auto rounded-xl bg-[color:var(--color-surface)] border border-[color:var(--color-border)] shadow-2xl flex flex-col"
          role="dialog"
          aria-label="Help and requests"
        >
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[color:var(--color-border)] sticky top-0 bg-[color:var(--color-surface)]">
            <h2 className="font-serif text-navy text-lg">Help &amp; requests</h2>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="text-quiet hover:text-navy text-2xl leading-none w-7 h-7 grid place-items-center">×</button>
          </div>

          <div className="flex gap-1.5 px-5 pt-3" role="tablist">
            {([['request', 'Send a request'], ['tips', 'Navigation tips']] as const).map(([v, label]) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={tab === v}
                onClick={() => setTab(v)}
                className={[
                  'px-3 py-1.5 rounded text-sm border transition-colors',
                  tab === v ? 'border-navy bg-navy text-white' : 'border-[color:var(--color-border)] text-muted hover:text-navy',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'request' ? (
            <div className="px-5 py-4 flex flex-col gap-3">
              <p className="text-quiet text-xs">Tell the family archivist what you need. This opens your email app addressed to them.</p>
              <fieldset className="flex flex-col gap-1.5">
                <legend className="eyebrow text-quiet text-[10px] mb-1">Request type</legend>
                {REQUEST_TYPES.map((t) => (
                  <label key={t.value} className="flex items-start gap-2 cursor-pointer">
                    <input type="radio" name="reqtype" checked={type === t.value} onChange={() => setType(t.value)} className="mt-1 accent-navy" />
                    <span className="min-w-0">
                      <span className="block text-navy text-sm">{t.value}</span>
                      <span className="block text-quiet text-xs">{t.help}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
              <label className="flex flex-col gap-1">
                <span className="eyebrow text-quiet text-[10px]">Details</span>
                <textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What should we update, add, or correct?" className="w-full rounded border border-stone bg-white px-3 py-2 text-sm text-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-gold resize-y" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="eyebrow text-quiet text-[10px]">Your name / email (optional)</span>
                <input type="text" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="So we can follow up" className="w-full rounded border border-stone bg-white px-3 py-2 text-sm text-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-gold" />
              </label>
              <button type="button" onClick={send} className="btn-primary self-start">Send request</button>
            </div>
          ) : (
            <div className="px-5 py-4 flex flex-col gap-2">
              <ul className="flex flex-col gap-2.5">
                {TIPS.map((tip, i) => (
                  <li key={i} className="flex gap-2 text-sm text-muted">
                    <span className="text-gold-deep" aria-hidden="true">·</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      )}
    </>
  )
}
