'use client'
// components/admin/HistoryPanel.tsx
// In-app "restore a previous version" for the config files. Lists recent commits
// per file (via /api/admin/history) and restores one by committing it forward
// (via /api/admin/restore). Gives non-technical admins the revert that
// otherwise required git, without leaving the JSON-in-repo model.
import { useState } from 'react'

const FILES: Array<{ path: string; label: string }> = [
  { path: 'content/theme.json', label: 'Appearance (colors, light, element overrides)' },
  { path: 'content/tree-layout.json', label: 'Family tree arrangement' },
  { path: 'content/site.json', label: 'Site chrome (nav / footer / brand)' },
  { path: 'content/hero.json', label: 'Hero rotator' },
]

interface Commit { sha: string; message: string; date: string; author: string }

function fmtDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function HistoryPanel() {
  const [openPath, setOpenPath] = useState<string | null>(null)
  const [history, setHistory] = useState<Record<string, Commit[]>>({})
  const [loading, setLoading] = useState<string | null>(null)
  const [restoringSha, setRestoringSha] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function load(path: string) {
    setOpenPath(path); setLoading(path); setMsg(null); setErr(null)
    try {
      const res = await fetch(`/api/admin/history?path=${encodeURIComponent(path)}`)
      if (!res.ok) throw new Error((await res.text()) || `${res.status}`)
      const j = await res.json()
      setHistory((h) => ({ ...h, [path]: j.history as Commit[] }))
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(null)
    }
  }

  async function restore(path: string, sha: string) {
    if (!window.confirm('Restore this version? It will be committed forward and published in about 90 seconds. Your current version stays in history.')) return
    setRestoringSha(sha); setMsg(null); setErr(null)
    try {
      const res = await fetch('/api/admin/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, sha }),
      })
      if (!res.ok) throw new Error((await res.text()) || `${res.status}`)
      setMsg('Restored · live in ~90s. Reload history to see the new entry.')
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setRestoringSha(null)
    }
  }

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      {FILES.map((f) => (
        <div key={f.path} className="border border-[color:var(--color-border)] rounded-well overflow-hidden">
          <button
            type="button"
            onClick={() => (openPath === f.path ? setOpenPath(null) : load(f.path))}
            className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-[color:var(--color-surface-subtle)] transition-colors"
          >
            <span className="text-navy text-sm">{f.label}</span>
            <span className="text-quiet text-xs font-mono">{openPath === f.path ? '▾' : '▸'} {f.path}</span>
          </button>

          {openPath === f.path && (
            <div className="px-4 pb-4 border-t border-[color:var(--color-border)]">
              {loading === f.path && <p className="text-quiet text-sm py-3">Loading history…</p>}
              {history[f.path]?.length === 0 && <p className="text-quiet text-sm py-3">No history found.</p>}
              <ul className="flex flex-col divide-y divide-[color:var(--color-border)]">
                {(history[f.path] ?? []).map((c, i) => (
                  <li key={c.sha} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-navy text-sm truncate">{c.message.split('\n')[0]}</p>
                      <p className="text-quiet text-xs">{fmtDate(c.date)} · {c.author} · <span className="font-mono">{c.sha.slice(0, 7)}</span></p>
                    </div>
                    {i === 0 ? (
                      <span className="text-quiet text-xs italic shrink-0">current</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => restore(f.path, c.sha)}
                        disabled={restoringSha !== null}
                        className="btn-primary btn-sm shrink-0 disabled:opacity-50"
                      >
                        {restoringSha === c.sha ? 'Restoring…' : 'Restore'}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
      {msg && <p className="font-serif italic text-gold-deep text-sm">{msg}</p>}
      {err && <p className="font-serif italic text-red-600 text-sm">{err}</p>}
    </div>
  )
}
