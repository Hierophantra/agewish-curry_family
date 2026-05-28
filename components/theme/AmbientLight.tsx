// components/theme/AmbientLight.tsx
// The configurable "light effect" - a soft radial glow positioned anywhere on
// the page. Driven entirely by CSS custom properties (--light-*) so it updates
// live when the theme controller changes them, and reflects the saved theme on
// first paint via ThemeStyle. Fixed + pointer-events-none + behind content.
//
// When disabled, --light-opacity resolves to 0 and the element is invisible.
export default function AmbientLight() {
  // z-30 sits above page content (z-10) so the glow is actually visible over
  // opaque section backgrounds, but below the sticky nav (z-40) and the theme
  // editor (z-90+). pointer-events-none so it never blocks interaction.
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-30"
      style={{
        opacity: 'var(--light-opacity, 0)',
        background:
          'radial-gradient(circle at var(--light-x, 50%) var(--light-y, 12%), var(--light-color, transparent) 0%, transparent var(--light-size, 0%))',
        transition: 'opacity 300ms ease-out',
      }}
    />
  )
}
