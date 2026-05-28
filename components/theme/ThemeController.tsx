'use client'
// components/theme/ThemeController.tsx
// The Shift+E visual theme editor + live applier, in one client island.
//
// Responsibilities:
//   1. Always-on applier: applies the saved theme's per-page overrides for the
//      current route on top of the server-injected sitewide vars (so page
//      overrides work on the published site, route-aware).
//   2. Admin edit mode: Shift+E (or the floating pencil) opens a panel to edit
//      colors + the ambient light effect, at "Sitewide" or "This page" scope.
//      Changes preview live (CSS vars updated in place). Save commits
//      content/theme.json via /api/admin/theme; the live site updates in ~90s.
//
// Persistence model: commit + publish. The editor shows changes instantly;
// Save writes theme.json to GitHub and Vercel rebuilds. Cancel reverts the
// live preview to the last saved state.

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import type { Theme, ThemeColors, ThemeLight } from '@/lib/types'
import {
  COLOR_KEYS, COLOR_LABEL, COLOR_DEFAULT, COLOR_VAR,
  resolveVars,
} from '@/lib/theme-vars'

interface Props {
  theme: Theme
  isAdmin: boolean
}

// Every CSS var this controller can touch - so we can set-or-remove the full
// set when applying, letting "reset to default" fall back to globals.css.
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

// Deep-ish clone of a Theme (plain JSON, so structuredClone is fine).
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
  const savedTheme = useRef<Theme>(theme)

  // Keep savedTheme in sync if the server sends a new theme (after a deploy).
  useEffect(() => { savedTheme.current = theme }, [theme])

  // Apply the active theme (draft while editing, saved otherwise) for the
  // current route. Sitewide is already in the server <style>, but applying the
  // full resolved set here makes route changes + page overrides + live edits
  // all work through one path.
  useEffect(() => {
    const active = editing ? draft : savedTheme.current
    applyVars(resolveVars(active, pathname))
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

  // ── Draft mutators ──
  // Read the effective editable color at the current scope.
  const colorValue = useCallback((key: keyof ThemeColors): string => {
    if (scope === 'page') {
      const pageVal = draft.pages?.[pathname]?.colors?.[key]
      if (pageVal) return pageVal
    }
    return draft.colors?.[key] ?? COLOR_DEFAULT[key]
  }, [draft, scope, pathname])

  // Is this color explicitly set at the current scope (vs inheriting default)?
  const colorIsSet = useCallback((key: keyof ThemeColors): boolean => {
    if (scope === 'page') return Boolean(draft.pages?.[pathname]?.colors?.[key])
    return Boolean(draft.colors?.[key])
  }, [draft, scope, pathname])

  function setColor(key: keyof ThemeColors, value: string | undefined) {
    setDraft((prev) => {
      const next = cloneTheme(prev)
      if (scope === 'page') {
        next.pages = next.pages ?? {}
        next.pages[pathname] = next.pages[pathname] ?? { colors: {} }
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
        next.pages[pathname] = next.pages[pathname] ?? { colors: {} }
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
    setDraft(cloneTheme(savedTheme.current))
    setEditing(false)
    setStatus('idle')
    // Revert live preview to saved.
    applyVars(resolveVars(savedTheme.current, pathname))
  }

  // Non-admins: render nothing (the applier still works via the server style +
  // a lightweight effect would be nice, but page overrides for non-admins are
  // handled by mounting this component too - see below).
  if (!isAdmin) {
    // Still apply saved page overrides for non-admins via the effect above.
    return null
  }

  return (
    <>
      {/* Floating opener (admin only) - discoverable alternative to Shift+E. */}
      {!editing && (
        <button
          type="button"
          onClick={() => { setDraft(cloneTheme(savedTheme.current)); setEditing(true) }}
          className="fixed bottom-5 right-5 z-[90] rounded-full bg-navy text-white shadow-lg w-12 h-12 grid place-items-center hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          title="Edit appearance (Shift+E)"
          aria-label="Edit appearance"
        >
          {/* pencil glyph */}
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
            {/* Colors */}
            <section>
              <p className="eyebrow text-quiet mb-3">Colors</p>
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
                  { k: 'x' as const, label: 'Horizontal', min: -20, max: 120, suffix: '%' },
                  { k: 'y' as const, label: 'Vertical', min: -20, max: 120, suffix: '%' },
                  { k: 'size' as const, label: 'Size', min: 10, max: 160, suffix: '%' },
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
