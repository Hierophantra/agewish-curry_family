// app/template.tsx
// Per D-05: re-mounts on every navigation — the App Router idiom for entry animations.
// The exit-animation wrapper is NOT used here (see PITFALLS.md Pitfall 4 — cross-page
// exit animations are broken in App Router). Entry-only animation is reliable.
'use client'
import { motion } from 'motion/react'

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
