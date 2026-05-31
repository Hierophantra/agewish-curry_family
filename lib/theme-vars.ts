// lib/theme-vars.ts
// Pure helpers shared by server (ThemeStyle) and client (ThemeEditor) to map a
// Theme object into CSS custom-property declarations. No 'server-only' - safe
// in client components too.
import type { Theme, ThemeColors, ThemeLight, ElementStyle } from '@/lib/types'

// Map ThemeColors keys -> the Tailwind @theme CSS variable names in globals.css.
export const COLOR_VAR: Record<keyof ThemeColors, string> = {
  navy: '--color-navy',
  gold: '--color-gold',
  goldDeep: '--color-gold-deep',
  ivory: '--color-ivory',
  ivoryDeep: '--color-ivory-deep',
  surface: '--color-surface',
  surfaceSubtle: '--color-surface-subtle',
  border: '--color-border',
  stone: '--color-stone',
  muted: '--color-muted',
  quiet: '--color-quiet',
}

// Human labels for the editor UI.
export const COLOR_LABEL: Record<keyof ThemeColors, string> = {
  navy: 'Primary (navy)',
  gold: 'Accent (gold)',
  goldDeep: 'Accent deep',
  ivory: 'Page background',
  ivoryDeep: 'Page background (deep)',
  surface: 'Card background',
  surfaceSubtle: 'Card background (subtle)',
  border: 'Borders',
  stone: 'Lines / hairlines',
  muted: 'Body text',
  quiet: 'Quiet text',
}

// Built-in defaults (mirror globals.css @theme) so the editor color pickers
// have a sensible starting value when a key is unset.
export const COLOR_DEFAULT: Record<keyof ThemeColors, string> = {
  navy: '#1F2D5C',
  gold: '#E8A91F',
  goldDeep: '#B8851A',
  ivory: '#FBF9F2',
  ivoryDeep: '#F5F0E0',
  surface: '#FFFDF7',
  surfaceSubtle: '#FAF6EA',
  border: '#E2DFD5',
  stone: '#C9C4B0',
  muted: '#6B6960',
  quiet: '#8B8778',
}

export const COLOR_KEYS = Object.keys(COLOR_VAR) as Array<keyof ThemeColors>

// Build a flat map of CSS var -> value from a colors object (only set keys).
export function colorVars(colors: ThemeColors | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  if (!colors) return out
  for (const key of COLOR_KEYS) {
    const v = colors[key]
    if (v) out[COLOR_VAR[key]] = v
  }
  return out
}

// Build the light-effect CSS vars from a ThemeLight (only when enabled).
export function lightVars(light: ThemeLight | undefined): Record<string, string> {
  if (!light || !light.enabled) return { '--light-opacity': '0' }
  return {
    '--light-color': light.color,
    '--light-x': `${light.x}%`,
    '--light-y': `${light.y}%`,
    '--light-size': `${light.size}%`,
    '--light-opacity': String(light.opacity),
  }
}

// Resolve the effective vars for a given pathname: sitewide colors+light, then
// page overrides layered on top. Used by both the server style tag (sitewide
// only, FOUC-free) and the client applier (full, route-aware).
export function resolveVars(theme: Theme, pathname?: string): Record<string, string> {
  const sitewide = { ...colorVars(theme.colors), ...lightVars(theme.light) }
  if (!pathname) return sitewide
  const page = theme.pages?.[pathname]
  if (!page) return sitewide
  return {
    ...sitewide,
    ...colorVars(page.colors),
    ...(page.light ? lightVars(page.light) : {}),
  }
}

// Serialize a vars map into a CSS rule body for a <style> tag.
export function varsToCss(vars: Record<string, string>): string {
  const body = Object.entries(vars)
    .map(([k, v]) => `${k}: ${v};`)
    .join(' ')
  return `:root { ${body} }`
}

// ── Per-element overrides ──
// Elements are tagged in the DOM with data-edit-id. The editor stores overrides
// keyed by that id, at sitewide (theme.elements) and per-page (theme.pages[p].
// elements) scope. Resolution layers page on top of sitewide, field by field.

// Merge sitewide + page element overrides for a given route into one map.
export function resolveElements(theme: Theme, pathname?: string): Record<string, ElementStyle> {
  const out: Record<string, ElementStyle> = {}
  for (const [id, style] of Object.entries(theme.elements ?? {})) {
    out[id] = { ...style }
  }
  const page = pathname ? theme.pages?.[pathname] : undefined
  if (page?.elements) {
    for (const [id, style] of Object.entries(page.elements)) {
      out[id] = { ...out[id], ...style } // page wins field-by-field
    }
  }
  return out
}

// CSS-applicable style props of one element override (everything except `text`,
// which CSS can't set on real content). Returns an inline-style-ready object so
// the same logic drives both the server <style> rules and the client applier.
export function elementInlineStyle(style: ElementStyle): Record<string, string> {
  const out: Record<string, string> = {}
  if (style.color) out['color'] = style.color
  if (style.background) out['background-color'] = style.background
  if (typeof style.fontSize === 'number') out['font-size'] = `${style.fontSize}px`
  const transform = transformValue(style)
  if (transform) out['transform'] = transform
  return out
}

// Compose a CSS transform from the free-drag offset + scale multiplier. Returns
// '' when neither is set so callers can skip emitting the property.
export function transformValue(style: ElementStyle): string {
  const dx = style.dx ?? 0
  const dy = style.dy ?? 0
  const parts: string[] = []
  if (dx !== 0 || dy !== 0) parts.push(`translate(${dx}px, ${dy}px)`)
  if (typeof style.scale === 'number' && style.scale !== 1) parts.push(`scale(${style.scale})`)
  return parts.join(' ')
}

// Build CSS rules ( [data-edit-id="X"] { ... } ) for a resolved element map.
// Used by the server <style> for FOUC-free sitewide element styling. Text
// overrides are applied client-side (CSS cannot replace element content).
export function elementsToCss(elements: Record<string, ElementStyle>): string {
  const rules: string[] = []
  for (const [id, style] of Object.entries(elements)) {
    const decls = elementInlineStyle(style)
    const body = Object.entries(decls).map(([k, v]) => `${k}: ${v};`).join(' ')
    if (body) rules.push(`[data-edit-id="${cssEscapeId(id)}"] { ${body} }`)
  }
  return rules.join('\n')
}

// data-edit-ids are author-controlled kebab-case strings, but escape quotes/
// backslashes defensively so a stray character can't break out of the selector.
function cssEscapeId(id: string): string {
  return id.replace(/["\\]/g, '\\$&')
}

// ── WCAG contrast (a11y guardrail for the color editors) ──
// Pure helpers so the same math can warn in the client editor now and gate the
// save route later. Accepts #rgb or #rrggbb.

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(hex.trim())
  if (!m) return null
  let h = m[1]
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

// WCAG contrast ratio (1..21). Returns null if either color can't be parsed.
export function contrastRatio(fg: string, bg: string): number | null {
  const a = hexToRgb(fg)
  const b = hexToRgb(bg)
  if (!a || !b) return null
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100
}

// AA verdict: 4.5:1 normal text, 3:1 large text. Returns a small advisory or null.
export function contrastVerdict(fg: string, bg: string, large = false): { ratio: number; pass: boolean; threshold: number } | null {
  const ratio = contrastRatio(fg, bg)
  if (ratio === null) return null
  const threshold = large ? 3 : 4.5
  return { ratio, pass: ratio >= threshold, threshold }
}
