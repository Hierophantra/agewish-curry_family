'use client'
// components/debug/DebugOverlay.tsx
// Admin-only, READ-ONLY debugging overlay. Toggled with Shift+D (mirrors the
// Shift+E theme editor) or a small floating button. It never writes anything —
// every panel is an indicator or a cosmetic overlay, so it cannot affect the
// published site or family viewers (non-admins render null).
//
// Panels: current breakpoint + viewport, resolved theme/config-source summary
// for the active route, the list of editable component IDs on the page, and a
// Content-health check (runs /api/admin/validate). Toggles: outline editable
// boundaries, layout grid, forced focus rings.
//
// Sits at the reserved top z-tier (--z-debug: 120) so it floats above the
// theme editor (95) and lightbox (100).
import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import type { Theme } from '@/lib/types'

interface Props {
  theme: Theme
  isAdmin: boolean
}

interface EditableId {
  id: string
  label: string
  kind: string
}

interface HealthReport {
  ok: boolean
  issues: string[]
  warnings: string[]
  counts: Record<string, number>
}

const BREAKPOINTS: Array<{ name: string; min: number }> = [
  { name: '2xl', min: 1536 },
  { name: 'xl', min: 1280 },
  { name: 'lg', min: 1024 },
  { name: 'md', min: 768 },
  { name: 'sm', min: 640 },
  { name: 'base', min: 0 },
]

function breakpointFor(w: number): string {
  return BREAKPOINTS.find((b) => w >= b.min)?.name ?? 'base'
}

export default function DebugOverlay({ theme, isAdmin }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [vw, setVw] = useState(0)
  const [vh, setVh] = useState(0)
  const [showBoundaries, setShowBoundaries] = useState(false)
  const [showGrid, setShowGrid] = useState(false)
  const [showFocus, setShowFocus] = useState(false)
  const [ids, setIds] = useState<EditableId[]>([])
  const [health, setHealth] = useState<HealthReport | null>(null)
  const [healthStatus, setHealthStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [zLayers, setZLayers] = useState<Array<{ z: number; pos: string; label: string }> | null>(null)

  // Track viewport for the breakpoint readout.
  useEffect(() => {
    if (!isAdmin) return
    function onResize() {
      setVw(window.innerWidth)
      setVh(window.innerHeight)
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [isAdmin])

  // Shift+D toggles the overlay (ignore while typing in a field).
  useEffect(() => {
    if (!isAdmin) return
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement
      const typing = t?.tagName === 'INPUT' || t?.tagName === 'TEXTAREA' || t?.isContentEditable
      if (typing) return
      if (e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isAdmin])

  // Enumerate editable component IDs present on the page (refresh when opened
  // or the route changes).
  useEffect(() => {
    if (!open) return
    const nodes = document.querySelectorAll<HTMLElement>('[data-edit-id]')
    const seen = new Set<string>()
    const list: EditableId[] = []
    nodes.forEach((n) => {
      const id = n.dataset.editId
      if (!id || seen.has(id)) return
      seen.add(id)
      list.push({ id, label: n.dataset.editLabel ?? id, kind: n.dataset.editKind ?? 'box' })
    })
    setIds(list)
  }, [open, pathname])

  // Resolved theme / config-source summary for the current route.
  const source = useMemo(() => {
    const sitewideColors = Object.keys(theme.colors ?? {}).length
    const sitewideElements = Object.keys(theme.elements ?? {}).length
    const page = theme.pages?.[pathname]
    const pageColors = page ? Object.keys(page.colors ?? {}).length : 0
    const pageElements = page ? Object.keys(page.elements ?? {}).length : 0
    const lightOn = (page?.light?.enabled ?? theme.light?.enabled) ? 'on' : 'off'
    return { sitewideColors, sitewideElements, pageColors, pageElements, lightOn, hasPage: Boolean(page) }
  }, [theme, pathname])

  // Scan positioned elements' computed z-index to surface the stacking ladder
  // and flag duplicate z values among overlay layers (read-only; on demand).
  const scanStacking = useCallback(() => {
    const out: Array<{ z: number; pos: string; label: string }> = []
    document.querySelectorAll<HTMLElement>('body *').forEach((el) => {
      const cs = getComputedStyle(el)
      if (cs.position === 'static') return
      const z = parseInt(cs.zIndex, 10)
      if (Number.isNaN(z)) return
      const label = el.dataset.editId || el.getAttribute('aria-label') || el.getAttribute('role') || (el.className && typeof el.className === 'string' ? el.className.split(' ')[0] : '') || el.tagName.toLowerCase()
      out.push({ z, pos: cs.position, label: String(label).slice(0, 28) })
    })
    out.sort((a, b) => b.z - a.z)
    setZLayers(out.slice(0, 12))
  }, [])

  const runHealth = useCallback(async () => {
    setHealthStatus('loading')
    try {
      const res = await fetch('/api/admin/validate')
      if (!res.ok) throw new Error(`${res.status}`)
      setHealth(await res.json())
      setHealthStatus('idle')
    } catch {
      setHealthStatus('error')
    }
  }, [])

  if (!isAdmin) return null

  return (
    <>
      {/* Cosmetic overlays driven by the toggles (admin-only, no layout impact for viewers). */}
      {showBoundaries && (
        <style dangerouslySetInnerHTML={{ __html: `
          [data-edit-id] { outline: 1px dashed color-mix(in oklab, var(--color-gold) 80%, transparent); outline-offset: 1px; }
        ` }} />
      )}
      {showFocus && (
        <style dangerouslySetInnerHTML={{ __html: `
          :focus { outline: 2px solid var(--color-gold) !important; outline-offset: 2px !important; }
        ` }} />
      )}
      {showGrid && (
        <div className="pointer-events-none fixed inset-0" style={{ zIndex: 'var(--z-debug, 120)' }} aria-hidden="true">
          <div className="mx-auto h-full max-w-7xl px-7 md:px-11">
            <div className="grid h-full grid-cols-4 sm:grid-cols-8 lg:grid-cols-12 gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-full" style={{ background: 'color-mix(in oklab, var(--color-gold) 8%, transparent)', borderLeft: '1px solid color-mix(in oklab, var(--color-gold) 22%, transparent)', borderRight: '1px solid color-mix(in oklab, var(--color-gold) 22%, transparent)' }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating opener */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 left-5 rounded-full bg-navy-ink text-white shadow-lg w-11 h-11 grid place-items-center hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          style={{ zIndex: 'var(--z-debug, 120)' }}
          title="Debug overlay (Shift+D)"
          aria-label="Open debug overlay"
        >
          <span className="font-mono text-sm" aria-hidden="true">{'</>'}</span>
        </button>
      )}

      {open && (
        <aside
          className="fixed bottom-5 left-5 w-[320px] max-w-[90vw] max-h-[80vh] overflow-y-auto rounded-xl bg-navy-ink text-white shadow-2xl border border-white/10"
          style={{ zIndex: 'var(--z-debug, 120)' }}
          role="dialog"
          aria-label="Debug overlay"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 sticky top-0 bg-navy-ink">
            <span className="font-mono text-xs tracking-wide text-gold-soft">DEBUG · Shift+D</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close debug overlay" className="text-white/60 hover:text-white text-lg leading-none w-6 h-6 grid place-items-center">×</button>
          </div>

          <div className="px-4 py-4 flex flex-col gap-4 text-[13px]">
            {/* Breakpoint + viewport */}
            <section className="flex items-center justify-between">
              <span className="text-white/60">Breakpoint</span>
              <span className="font-mono">
                <span className="text-gold-soft">{breakpointFor(vw)}</span>
                <span className="text-white/40"> · {vw}×{vh}</span>
              </span>
            </section>

            {/* Route + theme config source */}
            <section className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-white/60">Route</span>
                <span className="font-mono text-white/90 truncate max-w-[180px]">{pathname}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Theme source</span>
                <span className="font-mono text-white/90">{source.hasPage ? 'sitewide + page' : 'sitewide'}</span>
              </div>
              <div className="text-white/40 font-mono text-[11px]">
                colors {source.sitewideColors}+{source.pageColors} · elements {source.sitewideElements}+{source.pageElements} · light {source.lightOn}
              </div>
            </section>

            {/* Toggles */}
            <section className="flex flex-col gap-2 border-t border-white/10 pt-3">
              <span className="text-white/60 uppercase tracking-wider text-[11px]">Visualize</span>
              {([
                ['Editable boundaries', showBoundaries, setShowBoundaries],
                ['Layout grid', showGrid, setShowGrid],
                ['Force focus rings', showFocus, setShowFocus],
              ] as const).map(([label, value, set]) => (
                <label key={label} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={value} onChange={(e) => set(e.target.checked)} className="w-4 h-4 accent-gold" />
                  <span className="text-white/90">{label}</span>
                </label>
              ))}
            </section>

            {/* Editable IDs on this page */}
            <section className="flex flex-col gap-1.5 border-t border-white/10 pt-3">
              <span className="text-white/60 uppercase tracking-wider text-[11px]">Editable IDs ({ids.length})</span>
              <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                {ids.length === 0 ? (
                  <span className="text-white/40 italic">none tagged on this route</span>
                ) : ids.map((e) => (
                  <div key={e.id} className="font-mono text-[11px] flex items-center justify-between gap-2">
                    <span className="text-gold-soft truncate">{e.id}</span>
                    <span className="text-white/35 shrink-0">{e.kind}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Content health */}
            <section className="flex flex-col gap-2 border-t border-white/10 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-white/60 uppercase tracking-wider text-[11px]">Content health</span>
                <button
                  type="button"
                  onClick={runHealth}
                  disabled={healthStatus === 'loading'}
                  className="text-[11px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-50 transition-colors"
                >
                  {healthStatus === 'loading' ? 'Checking…' : 'Run check'}
                </button>
              </div>
              {healthStatus === 'error' && <span className="text-rose-300 text-[11px]">Check failed.</span>}
              {health && (
                <div className="flex flex-col gap-1.5">
                  <span className={health.ok ? 'text-emerald-300 text-[11px]' : 'text-rose-300 text-[11px]'}>
                    {health.ok ? '✓ References valid' : `✗ ${health.issues.length} issue(s)`}
                  </span>
                  {health.issues.map((m, i) => (
                    <p key={`i${i}`} className="text-rose-200 text-[11px] font-mono leading-snug">{m}</p>
                  ))}
                  {health.warnings.map((m, i) => (
                    <p key={`w${i}`} className="text-amber-200/80 text-[11px] font-mono leading-snug">⚠ {m}</p>
                  ))}
                  <p className="text-white/35 text-[11px] font-mono">
                    {Object.entries(health.counts).map(([k, v]) => `${k} ${v}`).join(' · ')}
                  </p>
                </div>
              )}
            </section>

            {/* Stacking (z-index) ladder + duplicate detection */}
            <section className="flex flex-col gap-2 border-t border-white/10 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-white/60 uppercase tracking-wider text-[11px]">Stacking (z-index)</span>
                <button type="button" onClick={scanStacking} className="text-[11px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors">Scan</button>
              </div>
              {zLayers && (
                <div className="flex flex-col gap-1">
                  {zLayers.map((l, i) => {
                    const dup = zLayers.filter((x) => x.z === l.z).length > 1
                    return (
                      <div key={i} className="font-mono text-[11px] flex items-center justify-between gap-2">
                        <span className={dup ? 'text-amber-300' : 'text-white/35'}>z{l.z}{dup ? ' ⚠' : ''}</span>
                        <span className="text-white/70 truncate">{l.label}</span>
                      </div>
                    )
                  })}
                  <p className="text-white/30 text-[11px]">⚠ = shares a z-index with another positioned layer.</p>
                </div>
              )}
            </section>
          </div>
        </aside>
      )}
    </>
  )
}
