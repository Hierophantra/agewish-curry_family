// components/tree/PersonPanel.tsx
// 'use client' - uses motion/react for slide-in animation.
//
// v3.6: admin quick-edit. When isAdmin, the panel shows an "Edit details"
// affordance that turns the meta rows into editable fields (dates, birthplace,
// labels) plus parent/child relationship pickers, saved to
// /api/admin/people/[id]. A "Open full editor" link covers bio/notes/gender.
'use client'
import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Person, Photo } from '@/lib/types'
import PhotoCarousel from './PhotoCarousel'
import PeopleTagPicker from '@/components/admin/PeopleTagPicker'
import { useFocusTrap } from '@/lib/focus-trap'

interface PersonPanelProps {
  person: Person
  photos: Photo[]      // pre-filtered to this person's photos (passed from FamilyTreeCanvas)
  people: Person[]     // full list - resolves child names + powers relationship pickers
  isAdmin?: boolean
  onClose: () => void
}

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const sb = new Set(b)
  return a.every((x) => sb.has(x))
}

export default function PersonPanel({ person, photos, people, isAdmin = false, onClose }: PersonPanelProps) {
  const peopleById = new Map(people.map((p) => [p.id, p]))
  const router = useRouter()
  const reduce = useReducedMotion()
  const trapRef = useFocusTrap<HTMLElement>(true)

  const resolvedChildrenIds = person.childrenIds.length > 0 ? person.childrenIds : person.childIds
  const childNames = resolvedChildrenIds.map((cid) => peopleById.get(cid)?.name ?? cid)

  function formatDateISO(iso: string): string {
    const [year, month, day] = iso.split('-').map(Number)
    if (!year || !month || !day) return iso
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    return `${months[month - 1]!} ${day}, ${year}`
  }

  const bornLabel = person.birthDate ? formatDateISO(person.birthDate) : person.birthYear ? String(person.birthYear) : null
  const diedLabel = person.deathDate ? formatDateISO(person.deathDate) : person.deathYear ? String(person.deathYear) : null
  const birthplaceLabel = person.birthplace ?? person.birthPlace ?? null
  const spouseLabel = person.spouseLabel ?? null
  const motherLabel = person.motherName ?? null
  const fatherLabel = person.fatherName ?? null
  const childrenLabel = childNames.length > 0 ? childNames.join(', ') : null

  type MetaRow = [string, string]
  const metaRows: MetaRow[] = []
  if (bornLabel) metaRows.push(['Born', bornLabel])
  if (diedLabel) metaRows.push(['Died', diedLabel])
  if (birthplaceLabel) metaRows.push(['Birthplace', birthplaceLabel])
  if (motherLabel) metaRows.push(['Mother', motherLabel])
  if (fatherLabel) metaRows.push(['Father', fatherLabel])
  if (spouseLabel) metaRows.push(['Spouse', spouseLabel])
  if (childrenLabel) metaRows.push(['Children', childrenLabel])

  // ── Admin quick-edit state ──
  const [editing, setEditing] = useState(false)
  const initBirthplace = person.birthplace ?? person.birthPlace ?? ''
  const initChildren = person.childrenIds.length > 0 ? person.childrenIds : (person.childIds ?? [])
  const [f, setF] = useState({
    birthDate: person.birthDate ?? '',
    deathDate: person.deathDate ?? '',
    datesLabel: person.datesLabel ?? '',
    birthplace: initBirthplace,
    relationLabel: person.relationLabel ?? '',
    eyebrow: person.eyebrow ?? '',
    spouseLabel: person.spouseLabel ?? '',
    motherName: person.motherName ?? '',
    fatherName: person.fatherName ?? '',
  })
  const [parentIds, setParentIds] = useState<string[]>(person.parentIds ?? [])
  const [childrenIds, setChildrenIds] = useState<string[]>(initChildren)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const candidatePeople = people.filter((p) => p.id !== person.id)

  function set<K extends keyof typeof f>(key: K, value: string) {
    setF((prev) => ({ ...prev, [key]: value }))
    if (status === 'saved') setStatus('idle')
  }

  async function save() {
    setStatus('saving')
    setErrorMsg(null)
    // Send only changed fields.
    const body: Record<string, unknown> = {}
    if (f.birthDate !== (person.birthDate ?? '')) body.birthDate = f.birthDate
    if (f.deathDate !== (person.deathDate ?? '')) body.deathDate = f.deathDate
    if (f.datesLabel !== (person.datesLabel ?? '')) body.datesLabel = f.datesLabel
    if (f.birthplace !== initBirthplace) body.birthplace = f.birthplace
    if (f.relationLabel !== (person.relationLabel ?? '')) body.relationLabel = f.relationLabel
    if (f.eyebrow !== (person.eyebrow ?? '')) body.eyebrow = f.eyebrow
    if (f.spouseLabel !== (person.spouseLabel ?? '')) body.spouseLabel = f.spouseLabel
    if (f.motherName !== (person.motherName ?? '')) body.motherName = f.motherName
    if (f.fatherName !== (person.fatherName ?? '')) body.fatherName = f.fatherName
    if (!sameSet(parentIds, person.parentIds ?? [])) body.parentIds = parentIds
    if (!sameSet(childrenIds, initChildren)) body.childrenIds = childrenIds

    if (Object.keys(body).length === 0) {
      setStatus('saved')
      return
    }
    try {
      const res = await fetch(`/api/admin/people/${person.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error((await res.text()) || `${res.status}`)
      setStatus('saved')
      router.refresh()
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : String(err))
    }
  }

  const inputClass = 'w-full px-3 py-2 border border-stone rounded font-sans text-sm text-navy bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold'
  const labelClass = 'flex flex-col gap-1'
  const labelText = 'text-quiet text-xs'

  return (
    <motion.aside
      ref={trapRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`person-panel-name-${person.id}`}
      className="fixed bottom-0 inset-x-0 max-h-[80vh] rounded-t-xl md:top-0 md:right-0 md:bottom-auto md:inset-x-auto md:h-screen md:w-[400px] md:rounded-none bg-ivory border-t hairline md:border-t-0 md:border-l z-40 flex flex-col overflow-y-auto"
      style={{ boxShadow: '-8px 0 24px -12px rgba(0,0,0,0.15)' }}
      initial={reduce ? false : { x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={reduce ? { opacity: 0 } : { x: '100%', opacity: 0 }}
      transition={reduce ? { duration: 0 } : { duration: 0.25, ease: 'easeInOut' }}
    >
      <div className="flex items-center justify-between px-[22px] pt-[22px] pb-0 mb-0">
        <span className="text-gold-deep uppercase tracking-[0.22em] leading-none" style={{ fontSize: '10px' }}>
          {person.eyebrow ?? person.relationLabel ?? ''}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-quiet hover:text-navy transition-colors flex items-center justify-center w-7 h-7 text-2xl leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1"
          aria-label="Close panel"
        >
          ×
        </button>
      </div>

      <h2
        id={`person-panel-name-${person.id}`}
        className="font-serif text-navy px-[22px] mt-[22px]"
        style={{ fontSize: '30px', fontWeight: 400, lineHeight: 1.1 }}
      >
        {person.name}
      </h2>

      {person.datesLabel && !editing && (
        <p className="font-serif italic text-muted px-[22px] mt-1 mb-[26px]" style={{ fontSize: '14px' }}>
          {person.datesLabel}
        </p>
      )}

      <div className="px-[22px] mt-3">
        <PhotoCarousel photos={photos} />
      </div>

      {!editing ? (
        <>
          {metaRows.length > 0 && (
            <div className="flex flex-col border-t hairline mt-0 px-[22px]" style={{ paddingTop: '22px', gap: '14px' }}>
              {metaRows.map(([k, v]) => (
                <div key={k} className="flex justify-between" style={{ fontSize: '13px', gap: '16px' }}>
                  <span className="text-quiet flex-shrink-0">{k}</span>
                  <span className="text-navy text-right">{v}</span>
                </div>
              ))}
            </div>
          )}

          <div className="px-[22px] pb-[22px] mt-auto pt-4 flex items-center justify-between gap-3">
            <Link href={`/person/${person.id}`} className="eyebrow text-quiet hover:text-gold transition-colors">
              View full page →
            </Link>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-xs px-3 py-1.5 rounded-md border border-[color:var(--color-border)] text-navy hover:border-gold-deep bg-[color:var(--color-surface)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                Edit details
              </button>
            )}
          </div>
        </>
      ) : (
        // ── Admin quick-edit form ──
        <div className="flex flex-col gap-4 border-t hairline mt-0 px-[22px]" style={{ paddingTop: '22px' }}>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelClass}>
              <span className={labelText}>Born (YYYY-MM-DD)</span>
              <input className={inputClass} value={f.birthDate} onChange={(e) => set('birthDate', e.target.value)} placeholder="1930-05-12" />
            </label>
            <label className={labelClass}>
              <span className={labelText}>Died (YYYY-MM-DD)</span>
              <input className={inputClass} value={f.deathDate} onChange={(e) => set('deathDate', e.target.value)} placeholder="" />
            </label>
          </div>

          <label className={labelClass}>
            <span className={labelText}>Dates label (shown under the name)</span>
            <input className={inputClass} value={f.datesLabel} onChange={(e) => set('datesLabel', e.target.value)} placeholder="1930 – 2008" />
          </label>

          <label className={labelClass}>
            <span className={labelText}>Birthplace</span>
            <input className={inputClass} value={f.birthplace} onChange={(e) => set('birthplace', e.target.value)} placeholder="Dayton, Ohio" />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className={labelClass}>
              <span className={labelText}>Relation label</span>
              <input className={inputClass} value={f.relationLabel} onChange={(e) => set('relationLabel', e.target.value)} placeholder="PATRIARCH" />
            </label>
            <label className={labelClass}>
              <span className={labelText}>Eyebrow</span>
              <input className={inputClass} value={f.eyebrow} onChange={(e) => set('eyebrow', e.target.value)} />
            </label>
          </div>

          <label className={labelClass}>
            <span className={labelText}>Spouse label (display text)</span>
            <input className={inputClass} value={f.spouseLabel} onChange={(e) => set('spouseLabel', e.target.value)} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className={labelClass}>
              <span className={labelText}>Mother (display)</span>
              <input className={inputClass} value={f.motherName} onChange={(e) => set('motherName', e.target.value)} />
            </label>
            <label className={labelClass}>
              <span className={labelText}>Father (display)</span>
              <input className={inputClass} value={f.fatherName} onChange={(e) => set('fatherName', e.target.value)} />
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <span className={labelText}>Parents</span>
            <PeopleTagPicker
              allPeople={candidatePeople}
              selectedIds={parentIds}
              onChange={(next) => { setParentIds(next); if (status === 'saved') setStatus('idle') }}
              mediaNoun="record"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className={labelText}>Children</span>
            <PeopleTagPicker
              allPeople={candidatePeople}
              selectedIds={childrenIds}
              onChange={(next) => { setChildrenIds(next); if (status === 'saved') setStatus('idle') }}
              mediaNoun="record"
            />
          </div>

          <Link href={`/person/${person.id}`} className="eyebrow text-quiet hover:text-gold transition-colors">
            Open full editor (bio, notes, gender) →
          </Link>

          {/* Save bar */}
          <div className="flex items-center gap-3 pt-2 pb-[22px] sticky bottom-0 bg-ivory">
            <button
              type="button"
              onClick={save}
              disabled={status === 'saving'}
              className="bg-navy text-white px-4 py-2 rounded text-sm hover:opacity-90 transition-opacity disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              {status === 'saving' ? 'Publishing…' : 'Save & publish'}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="text-muted hover:text-navy text-sm">
              Done
            </button>
            {status === 'saved' && <span className="font-serif italic text-gold-deep text-xs">Live in ~90s</span>}
            {status === 'error' && <span className="font-serif italic text-red-600 text-xs">{errorMsg}</span>}
          </div>
        </div>
      )}
    </motion.aside>
  )
}
