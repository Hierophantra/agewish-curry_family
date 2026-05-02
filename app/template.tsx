// app/template.tsx
// Per D-05: re-mounts on every navigation — the App Router idiom for entry animations.
// The exit-animation wrapper is NOT used here (see PITFALLS.md Pitfall 4 — cross-page
// exit animations are broken in App Router). Entry-only animation is reliable.
// prefers-reduced-motion: when OS setting is enabled, the animation is skipped entirely
// (duration: 0) — not merely shortened. Vestibular disorder users need this honoured.
'use client'
import { motion, useReducedMotion } from 'motion/react'

export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduce ? { duration: 0 } : { duration: 0.4, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
