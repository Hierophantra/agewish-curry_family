// lib/theme-vars.ts
// Pure helpers shared by server (ThemeStyle) and client (ThemeEditor) to map a
// Theme object into CSS custom-property declarations. No 'server-only' - safe
// in client components too.
import type { Theme, ThemeColors, ThemeLight } from '@/lib/types'

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
