'use client'
// components/theme/ThemeController.tsx
// The Shift+E visual editor + live applier, in one client island.
//
// Two responsibilities:
//   1. Always-on applier (admins AND family viewers): for the current route it
//      applies the saved theme's color tokens, ambient light, and per-element
//      overrides (color / background / font-size / free-drag position / text)
//      on top of the server-injected sitewide CSS. This is what makes saved
//      page overrides and text edits show up on the published site.
//   2. Admin edit mode: Shift+E (or the floating pencil) opens a panel. Click
//      any tagged element on the page to select it, drag it to reposition
//      (free-drag, desktop), and edit its color / size / text. With nothing
//      selected the panel shows the global color tokens + ambient light. A
//      "Sitewide / This page" toggle decides whether changes apply everywhere
//      or only to the current route. Save commits content/theme.json.
//
// Elements opt in by carrying data-edit-id / data-edit-label / data-edit-kind
// in the markup, so the editor enumerates exactly the elements present on the
// current page - each page shows its own elements, not one shared menu.

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import type { Theme, ThemeColors, ThemeLight, ElementStyle } from '@/lib/types'
import {
  COLOR_KEYS, COLOR_LABEL, COLOR_DEFAULT, COLOR_VAR,
  resolveVars, resolveElements,
} from '@/lib/theme-vars'

interface Props {
  theme: Theme
  isAdmin: boolean
}

interface EditableEl {
  id: string
  label: string
  kind: string // 'text' | 'box'
}

interface DragState {
  id: string
  el: HTMLElement
  startX: number
  startY: number
  baseDx: number
  baseDy: number
  lastDx: number
  lastDy: number
  moved: boolean
}

// Every color/light CSS var the controller can touch - so applyVars can set or
// remove the full set, letting an unset value fall back to the server <style>
// then globals.css.
const ALL_VARS = [
  ...COLOR_KEYS.map((k) => COLOR_VAR[k]),
  '--light-color', '--light-x', '--light-y', '--light-size', '--light-opacity',
]

function applyVars(vars: Record<string, string>) {
  const root = document.documentElement
  for (const name of ALL_VARS) {
    if (name in vars) root.style.setProperty(name, vars[name])
    else root.style.removeProperty(name)
  }
}

function cloneTheme(t: Theme): Theme {
  return JSON.parse(JSON.stringify(t))
}

export default function ThemeController({ theme, isAdmin }: Props) {
  const pathname = usePathname()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Theme>(() => cloneTheme(theme))
  const [scope, setScope] = useState<'site' | 'page'>('site')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [elementsOnPage, setElementsOnPage] = useState<EditableEl[]>([])
  const savedTheme = useRef<Theme>(theme)

  // Natural (un-overridden) text content of each text element, captured the
  // first time the applier sees it, so text overrides can be reverted cleanly.
  const originalText = useRef<Map<string, string>>(new Map())
  const drag = useRef<DragState | null>(null)

  // Keep savedTheme in sync if the server sends a new theme (after a deploy).
  useEffect(() => { savedTheme.current = theme }, [theme])

  // ── Applier: color tokens + light + per-element overrides for this route ──
  // Runs for everyone (the hooks run before the admin early-return below), so
  // the published site reflects saved page + text overrides too.
  useEffect(() => {
    const active = editing ? draft : savedTheme.current
    applyVars(resolveVars(active, pathname))

    const resolved = resolveElements(active, pathname)
    const nodes = document.querySelectorAll<HTMLElement>('[data-edit-id]')
    nodes.forEach((node) => {
      const id = node.dataset.editId
      if (!id) return
      const isText = node.dataset.editKind === 'text'
      if (isText && !originalText.current.has(id)) {
        originalText.current.set(id, node.textContent ?? '')
      }
      const s = resolved[id]
      if (s?.color) node.style.color = s.color
      else node.style.removeProperty('color')
      if (s?.background) node.style.backgroundColor = s.background
      else node.style.removeProperty('background-color')
      if (typeof s?.fontSize === 'number') node.style.fontSize = `${s.fontSize}px`
      else node.style.removeProperty('font-size')
      const dx = s?.dx ?? 0
      const dy = s?.dy ?? 0
      if (dx !== 0 || dy !== 0) node.style.transform = `translate(${dx}px, ${dy}px)`
      else node.style.removeProperty('transform')
      if (isText) {
        if (typeof s?.text === 'string' && s.text.length > 0) {
          if (node.textContent !== s.text) node.textContent = s.text
        } else {
          const orig = originalText.current.get(id)
          if (orig !== undefined && node.textContent !== orig) node.textContent = orig
        }
      }
    })
  }, [editing, draft, pathname])

  // Shift+E toggles edit mode (admin only). Ignore when typing in a field.
  useEffect(() => {
    if (!isAdmin) return
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable
      if (typing) return
      if (e.shiftKey && (e.key === 'E' || e.key === 'e')) {
        e.preventDefault()
        setEditing((v) => {
          if (!v) setDraft(cloneTheme(savedTheme.current)) // fresh draft on open
          return !v
        })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isAdmin])

  // ── Element override read/write at the current scope ──
  const elementEffective = useCallback((id: string): ElementStyle => {
    const site = draft.elements?.[id] ?? {}
    if (scope === 'page') {
      const page = draft.pages?.[pathname]?.elements?.[id] ?? {}
      return { ...site, ...page }
    }
    return { ...site }
  }, [draft, scope, pathname])

  const setElementProp = useCallback((id: string, patch: Partial<ElementStyle>) => {
    setDraft((prev) => {
      const next = cloneTheme(prev)
      let bucket: Record<string, ElementStyle>
      if (scope === 'page') {
        next.pages = next.pages ?? {}
        next.pages[pathname] = next.pages[pathname] ?? { colors: {}, elements: {} }
        next.pages[pathname].elements = next.pages[pathname].elements ?? {}
        bucket = next.pages[pathname].elements
      } else {
        next.elements = next.elements ?? {}
        bucket = next.elements
      }
      const merged: ElementStyle = { ...bucket[id], ...patch }
      ;(Object.keys(merged) as Array<keyof ElementStyle>).forEach((k) => {
        const v = merged[k]
        if (v === undefined || v === '') delete merged[k]
      })
      if (Object.keys(merged).length === 0) delete bucket[id]
      else bucket[id] = merged
      return next
    })
    if (status === 'saved') setStatus('idle')
  }, [scope, pathname, status])

  const resetElement = useCallback((id: string) => {
    setDraft((prev) => {
      const next = cloneTheme(prev)
      if (scope === 'page') {
        const b = next.pages?.[pathname]?.elements
        if (b) delete b[id]
      } else if (next.elements) {
        delete next.elements[id]
      }
      return next
    })
    if (status === 'saved') setStatus('idle')
  }, [scope, pathname, status])

  const naturalText = useCallback((id: string): string => {
    if (originalText.current.has(id)) return originalText.current.get(id) ?? ''
    const el = document.querySelector(`[data-edit-id="${id}"]`)
    return el?.textContent ?? ''
  }, [])

  // Refs so the (rarely re-bound) interaction listeners always reach the latest
  // scope-aware read/write closures without re-subscribing on every draft tick.
  const effectiveRef = useRef(elementEffective)
  const setPropRef = useRef(setElementProp)
  effectiveRef.current = elementEffective
  setPropRef.current = setElementProp

  // ── Enumerate the editable elements present on the current page ──
  useEffect(() => {
    if (!isAdmin || !editing) { setElementsOnPage([]); return }
    const nodes = document.querySelectorAll<HTMLElement>('[data-edit-id]')
    const seen = new Set<string>()
    const list: EditableEl[] = []
    nodes.forEach((n) => {
      const id = n.dataset.editId
      if (!id || seen.has(id)) return
      seen.add(id)
      list.push({ id, label: n.dataset.editLabel ?? id, kind: n.dataset.editKind ?? 'box' })
    })
    setElementsOnPage(list)
  }, [isAdmin, editing, pathname])

  // ── Sync selected / hover outline attributes onto the DOM nodes ──
  useEffect(() => {
    const nodes = document.querySelectorAll<HTMLElement>('[data-edit-id]')
    nodes.forEach((n) => {
      const id = n.dataset.editId
      if (editing && id === selectedId) n.setAttribute('data-tve-selected', '')
      else n.removeAttribute('data-tve-selected')
      if (editing && id === hoverId && id !== selectedId) n.setAttribute('data-tve-hover', '')
      else n.removeAttribute('data-tve-hover')
    })
  }, [editing, selectedId, hoverId, pathname, elementsOnPage])

  // ── Body edit-mode class (drives cursor + outline CSS below) ──
  useEffect(() => {
    if (editing) document.body.classList.add('tve-editing')
    else document.body.classList.remove('tve-editing')
    return () => document.body.classList.remove('tve-editing')
  }, [editing])

  // ── Click-intercept + hover + free-drag, only while admin-editing ──
  useEffect(() => {
    if (!isAdmin || !editing) return

    function closestEditable(t: EventTarget | null): HTMLElement | null {
      const el = t as HTMLElement | null
      return el && el.closest ? el.closest<HTMLElement>('[data-edit-id]') : null
    }
    function onClick(e: MouseEvent) {
      const el = closestEditable(e.target)
      if (!el) return // panel + untagged content keep normal behavior
      e.preventDefault()
      e.stopPropagation()
      const id = el.dataset.editId
      if (id) setSelectedId(id)
    }
    function onOver(e: PointerEvent) {
      const el = closestEditable(e.target)
      const id = el?.dataset.editId ?? null
      setHoverId((prev) => (prev === id ? prev : id))
    }
    function onPointerMove(e: PointerEvent) {
      const d = drag.current
      if (!d) return
      const dx = d.baseDx + (e.clientX - d.startX)
      const dy = d.baseDy + (e.clientY - d.startY)
      if (Math.abs(e.clientX - d.startX) > 3 || Math.abs(e.clientY - d.startY) > 3) d.moved = true
      d.lastDx = dx
      d.lastDy = dy
      d.el.style.transform = `translate(${dx}px, ${dy}px)`
    }
    function onPointerUp() {
      const d = drag.current
      window.removeEventListener('pointermove', onPointerMove)
      if (d && d.moved) {
        setPropRef.current(d.id, { dx: Math.round(d.lastDx), dy: Math.round(d.lastDy) })
      }
      drag.current = null
    }
    function onPointerDown(e: PointerEvent) {
      const el = closestEditable(e.target)
      if (!el) return
      const id = el.dataset.editId
      if (!id) return
      e.preventDefault()
      setSelectedId(id)
      const cur = effectiveRef.current(id)
      drag.current = {
        id, el,
        startX: e.clientX, startY: e.clientY,
        baseDx: cur.dx ?? 0, baseDy: cur.dy ?? 0,
        lastDx: cur.dx ?? 0, lastDy: cur.dy ?? 0,
        moved: false,
      }
      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', onPointerUp, { once: true })
    }

    document.addEventListener('click', onClick, true)
    document.addEventListener('pointerover', onOver, true)
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('pointerover', onOver, true)
      document.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('pointermove', onPointerMove)
    }
  }, [isAdmin, editing])

  // ── Global color tokens (no element selected) ──
  const colorValue = useCallback((key: keyof ThemeColors): string => {
    if (scope === 'page') {
      const pageVal = draft.pages?.[pathname]?.colors?.[key]
      if (pageVal) return pageVal
    }
    return draft.colors?.[key] ?? COLOR_DEFAULT[key]
  }, [draft, scope, pathname])

  const colorIsSet = useCallback((key: keyof ThemeColors): boolean => {
    if (scope === 'page') return Boolean(draft.pages?.[pathname]?.colors?.[key])
    return Boolean(draft.colors?.[key])
  }, [draft, scope, pathname])

  function setColor(key: keyof ThemeColors, value: string | undefined) {
    setDraft((prev) => {
      const next = cloneTheme(prev)
      if (scope === 'page') {
        next.pages = next.pages ?? {}
        next.pages[pathname] = next.pages[pathname] ?? { colors: {}, elements: {} }
        next.pages[pathname].colors = next.pages[pathname].colors ?? {}
        if (value) next.pages[pathname].colors[key] = value
        else delete next.pages[pathname].colors[key]
      } else {
        next.colors = next.colors ?? {}
        if (value) next.colors[key] = value
        else delete next.colors[key]
      }
      return next
    })
    if (status === 'saved') setStatus('idle')
  }

  // Light effect lives sitewide OR per-page depending on scope.
  const activeLight: ThemeLight = (scope === 'page' && draft.pages?.[pathname]?.light)
    ? draft.pages[pathname]!.light!
    : draft.light

  function setLight(patch: Partial<ThemeLight>) {
    setDraft((prev) => {
      const next = cloneTheme(prev)
      if (scope === 'page') {
        next.pages = next.pages ?? {}
        next.pages[pathname] = next.pages[pathname] ?? { colors: {}, elements: {} }
        const base = next.pages[pathname].light ?? { ...next.light }
        next.pages[pathname].light = { ...base, ...patch }
      } else {
        next.light = { ...next.light, ...patch }
      }
      return next
    })
    if (status === 'saved') setStatus('idle')
  }

  async function save() {
    setStatus('saving')
    setErrorMsg(null)
    try {
      const res = await fetch('/api/admin/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      if (!res.ok) throw new Error((await res.text()) || `${res.status}`)
      savedTheme.current = cloneTheme(draft)
      setStatus('saved')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : String(err))
    }
  }

  function cancel() {
    const reverted = cloneTheme(savedTheme.current)
    setDraft(reverted)
    setSelectedId(null)
    setEditing(false)
    setStatus('idle')
  }

  // Non-admins render no UI, but the applier effect above still runs for them.
  if (!isAdmin) return null

  const selected = selectedId
    ? elementsOnPage.find((e) => e.id === selectedId) ?? { id: selectedId, label: selectedId, kind: 'box' }
    : null
  const sel: ElementStyle = selectedId ? elementEffective(selectedId) : {}

  return (
    <>
      {/* Edit-mode affordances: cursor + hover/selected outlines. */}
      <style dangerouslySetInnerHTML={{ __html: `
        body.tve-editing [data-edit-id] { cursor: grab; user-select: none; }
        body.tve-editing [data-edit-id]:active { cursor: grabbing; }
        body.tve-editing [data-tve-hover] { outline: 1px dashed var(--color-gold, #E8A91F); outline-offset: 2px; }
        body.tve-editing [data-tve-selected] { outline: 2px solid var(--color-gold, #E8A91F); outline-offset: 2px; }
      ` }} />

      {/* Floating opener (admin only) - discoverable alternative to Shift+E. */}
      {!editing && (
        <button
          type="button"
          onClick={() => { setDraft(cloneTheme(savedTheme.current)); setEditing(true) }}
          className="fixed bottom-5 right-5 z-[90] rounded-full bg-navy text-white shadow-lg w-12 h-12 grid place-items-center hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          title="Edit appearance (Shift+E)"
          aria-label="Edit appearance"
        >
          <span className="text-lg" aria-hidden="true">✎</span>
        </button>
      )}

      {editing && (
        <aside
          className="fixed top-0 right-0 z-[95] h-screen w-[340px] max-w-[90vw] bg-[color:var(--color-surface)] border-l border-[color:var(--color-border)] shadow-2xl flex flex-col"
          role="dialog"
          aria-label="Appearance editor"
        >
          {/* Header */}
          <div className="px-5 pt-5 pb-4 border-b border-[color:var(--color-border)]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-serif text-navy text-xl">Appearance</h2>
              <button
                type="button"
                onClick={cancel}
                className="text-quiet hover:text-navy text-2xl leading-none w-7 h-7 grid place-items-center"
                aria-label="Close editor"
              >
                {'×'}
              </button>
            </div>
            {/* Scope toggle */}
            <div className="flex gap-1.5" role="group" aria-label="Edit scope">
              {([
                { v: 'site', label: 'Sitewide' },
                { v: 'page', label: 'This page' },
              ] as const).map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setScope(opt.v)}
                  className={[
                    'px-3 py-1.5 rounded text-sm border transition-colors',
                    scope === opt.v
                      ? 'border-navy bg-navy text-white'
                      : 'border-[color:var(--color-border)] text-muted hover:text-navy',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-quiet text-xs mt-2">
              {scope === 'site'
                ? 'Changes apply to every page.'
                : `Changes apply only to ${pathname}.`}
            </p>
          </div>

          {/* Scrollable controls */}
          <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-6">
            {/* Elements on this page */}
            <section>
              <p className="eyebrow text-quiet mb-3">Elements on this page</p>
              <div className="flex flex-wrap gap-1.5">
                {elementsOnPage.map((el) => (
                  <button
                    key={el.id}
                    type="button"
                    onClick={() => setSelectedId(el.id)}
                    onMouseEnter={() => setHoverId(el.id)}
                    onMouseLeave={() => setHoverId(null)}
                    className={[
                      'px-2.5 py-1 rounded text-xs border transition-colors',
                      selectedId === el.id
                        ? 'border-gold bg-gold/15 text-navy'
                        : 'border-[color:var(--color-border)] text-muted hover:text-navy hover:border-stone',
                    ].join(' ')}
                  >
                    {el.label}
                  </button>
                ))}
                {elementsOnPage.length === 0 && (
                  <p className="text-quiet text-xs">No editable elements detected here.</p>
                )}
              </div>
              <p className="text-quiet text-xs mt-2">
                Tip: click an element on the page to select it, then drag it to move.
              </p>
            </section>

            {selected ? (
              /* ── Selected-element controls ── */
              <section className="border-t border-[color:var(--color-border)] pt-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <p className="font-serif text-navy text-lg leading-none">{selected.label}</p>
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="text-quiet hover:text-navy text-xs"
                  >
                    Done
                  </button>
                </div>

                {selected.kind === 'text' && (
                  <>
                    {/* Text content */}
                    <label className="flex flex-col gap-1">
                      <span className="text-quiet text-xs">Text</span>
                      <textarea
                        rows={2}
                        value={sel.text ?? naturalText(selected.id)}
                        onChange={(e) => setElementProp(selected.id, { text: e.target.value })}
                        className="w-full rounded border border-[color:var(--color-border)] bg-transparent px-2 py-1.5 text-sm text-navy focus:outline-none focus:border-stone resize-y"
                      />
                    </label>
                    {/* Text color */}
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={sel.color ?? '#1F2D5C'}
                        onChange={(e) => setElementProp(selected.id, { color: e.target.value })}
                        className="w-9 h-9 rounded border border-[color:var(--color-border)] cursor-pointer shrink-0"
                        aria-label="Text color"
                      />
                      <span className="text-navy text-sm flex-1">Text color</span>
                      {sel.color && (
                        <button type="button" onClick={() => setElementProp(selected.id, { color: undefined })} className="text-quiet hover:text-navy text-xs">Reset</button>
                      )}
                    </div>
                    {/* Font size */}
                    <label className="flex flex-col gap-1">
                      <span className="text-quiet text-xs">
                        Font size {typeof sel.fontSize === 'number' ? `(${sel.fontSize}px)` : '(default)'}
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="range" min={10} max={120} step={1}
                          value={sel.fontSize ?? 16}
                          onChange={(e) => setElementProp(selected.id, { fontSize: parseFloat(e.target.value) })}
                          className="w-full accent-navy"
                        />
                        {typeof sel.fontSize === 'number' && (
                          <button type="button" onClick={() => setElementProp(selected.id, { fontSize: undefined })} className="text-quiet hover:text-navy text-xs shrink-0">Reset</button>
                        )}
                      </div>
                    </label>
                  </>
                )}

                {selected.kind === 'box' && (
                  /* Background color */
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={sel.background ?? '#FBF9F2'}
                      onChange={(e) => setElementProp(selected.id, { background: e.target.value })}
                      className="w-9 h-9 rounded border border-[color:var(--color-border)] cursor-pointer shrink-0"
                      aria-label="Background color"
                    />
                    <span className="text-navy text-sm flex-1">Background</span>
                    {sel.background && (
                      <button type="button" onClick={() => setElementProp(selected.id, { background: undefined })} className="text-quiet hover:text-navy text-xs">Reset</button>
                    )}
                  </div>
                )}

                {/* Position (free-drag) */}
                <div className="flex flex-col gap-2">
                  <span className="text-quiet text-xs">Position offset (drag on the page, or nudge)</span>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-muted">
                      X
                      <input
                        type="number"
                        value={sel.dx ?? 0}
                        onChange={(e) => setElementProp(selected.id, { dx: parseFloat(e.target.value) || 0 })}
                        className="w-16 rounded border border-[color:var(--color-border)] bg-transparent px-1.5 py-1 text-sm text-navy focus:outline-none focus:border-stone"
                      />
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-muted">
                      Y
                      <input
                        type="number"
                        value={sel.dy ?? 0}
                        onChange={(e) => setElementProp(selected.id, { dy: parseFloat(e.target.value) || 0 })}
                        className="w-16 rounded border border-[color:var(--color-border)] bg-transparent px-1.5 py-1 text-sm text-navy focus:outline-none focus:border-stone"
                      />
                    </label>
                    {Boolean(sel.dx || sel.dy) && (
                      <button type="button" onClick={() => setElementProp(selected.id, { dx: undefined, dy: undefined })} className="text-quiet hover:text-navy text-xs">Reset</button>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => resetElement(selected.id)}
                  className="self-start text-quiet hover:text-navy text-xs underline underline-offset-2"
                >
                  Reset this element ({scope === 'site' ? 'sitewide' : 'this page'})
                </button>
              </section>
            ) : (
              /* ── Global controls (no element selected) ── */
              <>
                {/* Colors (design tokens) */}
                <section className="border-t border-[color:var(--color-border)] pt-5">
                  <p className="eyebrow text-quiet mb-3">Theme colors</p>
                  <div className="flex flex-col gap-3">
                    {COLOR_KEYS.map((key) => {
                      const val = colorValue(key)
                      const isSet = colorIsSet(key)
                      return (
                        <div key={key} className="flex items-center gap-3">
                          <input
                            type="color"
                            value={val}
                            onChange={(e) => setColor(key, e.target.value)}
                            className="w-9 h-9 rounded border border-[color:var(--color-border)] bg-transparent cursor-pointer shrink-0"
                            aria-label={`${COLOR_LABEL[key]} color`}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-navy text-sm leading-tight truncate">{COLOR_LABEL[key]}</p>
                            <input
                              type="text"
                              value={val}
                              onChange={(e) => {
                                const v = e.target.value
                                if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)) setColor(key, v)
                              }}
                              className="font-mono text-xs text-quiet bg-transparent border-b border-transparent focus:border-stone focus:outline-none w-24"
                              aria-label={`${COLOR_LABEL[key]} hex`}
                            />
                          </div>
                          {isSet && (
                            <button
                              type="button"
                              onClick={() => setColor(key, undefined)}
                              className="text-quiet hover:text-navy text-xs shrink-0"
                              title="Reset to default"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </section>

                {/* Light effect */}
                <section className="border-t border-[color:var(--color-border)] pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="eyebrow text-quiet">Light effect</p>
                    <label className="flex items-center gap-2 text-sm text-navy cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activeLight.enabled}
                        onChange={(e) => setLight({ enabled: e.target.checked })}
                        className="w-4 h-4 accent-navy"
                      />
                      On
                    </label>
                  </div>
                  <div className={activeLight.enabled ? 'flex flex-col gap-4' : 'flex flex-col gap-4 opacity-40 pointer-events-none'}>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={activeLight.color}
                        onChange={(e) => setLight({ color: e.target.value })}
                        className="w-9 h-9 rounded border border-[color:var(--color-border)] cursor-pointer"
                        aria-label="Light color"
                      />
                      <span className="text-navy text-sm">Glow color</span>
                    </div>
                    {([
                      { k: 'x' as const, label: 'Horizontal', min: -20, max: 120 },
                      { k: 'y' as const, label: 'Vertical', min: -20, max: 120 },
                      { k: 'size' as const, label: 'Size', min: 10, max: 160 },
                    ]).map(({ k, label, min, max }) => (
                      <label key={k} className="flex flex-col gap-1">
                        <span className="text-quiet text-xs">{label} ({Math.round(activeLight[k])}%)</span>
                        <input
                          type="range" min={min} max={max} step={1}
                          value={activeLight[k]}
                          onChange={(e) => setLight({ [k]: parseFloat(e.target.value) } as Partial<ThemeLight>)}
                          className="w-full accent-navy"
                        />
                      </label>
                    ))}
                    <label className="flex flex-col gap-1">
                      <span className="text-quiet text-xs">Intensity ({Math.round(activeLight.opacity * 100)}%)</span>
                      <input
                        type="range" min={0} max={1} step={0.01}
                        value={activeLight.opacity}
                        onChange={(e) => setLight({ opacity: parseFloat(e.target.value) })}
                        className="w-full accent-navy"
                      />
                    </label>
                  </div>
                </section>
              </>
            )}
          </div>

          {/* Save bar */}
          <div className="px-5 py-4 border-t border-[color:var(--color-border)] flex items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={status === 'saving'}
              className="bg-navy text-white px-5 py-2.5 rounded text-sm hover:opacity-90 transition-opacity disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              {status === 'saving' ? 'Publishing...' : 'Save & publish'}
            </button>
            <button
              type="button"
              onClick={cancel}
              className="text-muted hover:text-navy text-sm"
            >
              Cancel
            </button>
            {status === 'saved' && <span className="font-serif italic text-gold-deep text-xs">Live in ~90s</span>}
            {status === 'error' && <span className="font-serif italic text-red-600 text-xs">{errorMsg}</span>}
          </div>
        </aside>
      )}
    </>
  )
}
