// components/theme/ThemeStyle.tsx
// Server Component - injects the sitewide theme overrides as a <style> tag so
// the very first paint already reflects content/theme.json (no flash of the
// compiled defaults). Per-page overrides + live editing are layered on by the
// client ThemeController.
//
// Rendered in the root layout, after the imported globals.css, so its :root
// rule wins by source order over the @theme defaults.
import { getTheme } from '@/lib/content'
import { resolveVars, varsToCss } from '@/lib/theme-vars'

export default function ThemeStyle() {
  const theme = getTheme()
  const vars = resolveVars(theme) // sitewide only (no pathname)
  // Always emit the light vars (they include --light-opacity: 0 when disabled).
  const css = varsToCss(vars)
  return <style id="theme-overrides" dangerouslySetInnerHTML={{ __html: css }} />
}
