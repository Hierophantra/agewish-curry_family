'use client'
// components/admin/PhotoRegionTagger.tsx
// Draw a box around a person in a (group) photo, then tag who they are. Each
// region is stored normalized (0..1) and its person is added to the photo's
// peopleIds, so the photo surfaces on that person's profile per its visibility.
// Controlled: the parent (EditPhotoForm) owns regions + peopleIds and persists
// them on save.
import { useRef, useState } from 'react'
import type { Person, PhotoRegion } from '@/lib/types'

interface Props {
  src: string
  allPeople: Person[]
  regions: PhotoRegion[]
  peopleIds: string[]
  onChange: (next: { regions: PhotoRegion[]; peopleIds: string[] }) => void
  disabled?: boolean
}

const clamp = (n: number) => Math.max(0, Math.min(1, n))
const round = (n: number) => Math.round(n * 1000) / 1000

export default function PhotoRegionTagger({ src, allPeople, regions, peopleIds, onChange, disabled }: Props) {
  const frameRef = useRef<HTMLDivElement>(null)
  const start = useRef<{ x: number; y: number } | null>(null)
  const [pending, setPending] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [query, setQuery] = useState('')

  const byId = new Map(allPeople.map((p) => [p.id, p]))

  function toNorm(clientX: number, clientY: number) {
    const r = frameRef.current!.getBoundingClientRect()
    return { x: clamp((clientX - r.left) / r.width), y: clamp((clientY - r.top) / r.height) }
  }

  function onPointerDown(e: React.PointerEvent) {
    if (disabled) return
    e.preventDefault()
    const p = toNorm(e.clientX, e.clientY)
    start.current = p
    setPending({ x: p.x, y: p.y, w: 0, h: 0 })
    ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!start.current) return
    const p = toNorm(e.clientX, e.clientY)
    setPending({
      x: Math.min(start.current.x, p.x),
      y: Math.min(start.current.y, p.y),
      w: Math.abs(p.x - start.current.x),
      h: Math.abs(p.y - start.current.y),
    })
  }
  function onPointerUp() {
    start.current = null
    setPending((cur) => (cur && (cur.w < 0.02 || cur.h < 0.02) ? null : cur)) // ignore tiny boxes
  }

  function assign(personId: string) {
    if (!pending) return
    const region: PhotoRegion = { personId, x: round(pending.x), y: round(pending.y), w: round(pending.w), h: round(pending.h) }
    onChange({
      regions: [...regions, region],
      peopleIds: peopleIds.includes(personId) ? peopleIds : [...peopleIds, personId],
    })
    setPending(null)
    setQuery('')
  }

  function removeRegion(i: number) {
    onChange({ regions: regions.filter((_, idx) => idx !== i), peopleIds })
  }

  const matches = query.trim()
    ? allPeople.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.relationLabel ?? '').toLowerCase().includes(query.toLowerCase()))
      .slice(0, 8)
    : []

  const pct = (n: number) => `${n * 100}%`

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={frameRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className={`relative w-full select-none rounded-well overflow-hidden border border-[color:var(--color-border)] ${disabled ? '' : 'cursor-crosshair'}`}
      >
        {/* Plain img (admin tool) so the frame box == the image box for coord mapping. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="block w-full h-auto" draggable={false} />

        {/* Saved regions */}
        {regions.map((r, i) => (
          <div
            key={`${r.personId}-${i}`}
            className="absolute border-2 border-gold bg-gold/10"
            style={{ left: pct(r.x), top: pct(r.y), width: pct(r.w), height: pct(r.h) }}
          >
            <span className="absolute -top-5 left-0 whitespace-nowrap bg-navy text-white text-[10px] px-1.5 py-0.5 rounded-sm flex items-center gap-1">
              {byId.get(r.personId)?.name ?? r.personId}
              <button type="button" onClick={() => removeRegion(i)} aria-label="Remove region" className="hover:text-gold-soft">×</button>
            </span>
          </div>
        ))}

        {/* Pending (just-drawn) box */}
        {pending && (
          <div
            className="absolute border-2 border-dashed border-navy bg-navy/10"
            style={{ left: pct(pending.x), top: pct(pending.y), width: pct(pending.w), height: pct(pending.h) }}
          />
        )}
      </div>

      {/* Assignment search — appears after a box is drawn */}
      {pending ? (
        <div className="rounded border border-[color:var(--color-border)] p-3 bg-[color:var(--color-surface)]">
          <p className="text-quiet text-xs mb-2">Who did you box? Search to tag them, or discard.</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search family by name…"
              className="flex-1 px-3 py-2 border border-stone rounded font-sans text-sm text-navy bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            />
            <button type="button" onClick={() => { setPending(null); setQuery('') }} className="text-quiet hover:text-navy text-xs shrink-0">Discard</button>
          </div>
          {matches.length > 0 && (
            <div className="mt-2 flex flex-col border border-[color:var(--color-border)] rounded overflow-hidden">
              {matches.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => assign(p.id)}
                  className="text-left px-3 py-2 text-sm text-navy hover:bg-[color:var(--color-surface-subtle)] flex items-center justify-between gap-3"
                >
                  <span>{p.name}</span>
                  {p.relationLabel && <span className="text-quiet text-xs">{p.relationLabel}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="text-quiet text-xs">Drag a box over a person in the photo, then tag them. Useful for group photos.</p>
      )}
    </div>
  )
}
