'use client'
// components/home/Hero.tsx
// Client Component — upgraded from Server to support motion staggerChildren.
// D-09: New v2 hero copy: h1 "A gathering of generations", italic serif subtitle.
// D-10: Subtitle rendered in italic serif (font-serif italic), max-w-prose centered.
// D-34: Hero has bg-white (not bg-ivory).
// No CTA buttons — the site IS the experience.
// Star motif rule: TopNav = star 1, Hero = star 2, Footer = star 3.
// prefers-reduced-motion: when OS setting is enabled, stagger animation is skipped
// entirely — initial is set to false (already-visible state) and transition duration is 0.
import { motion, useReducedMotion } from 'motion/react'
import StarMark from '@/components/ui/StarMark'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } },
}

const itemVariantsReduced = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0, transition: { duration: 0 } },
}

export default function Hero() {
  const reduce = useReducedMotion()

  return (
    <motion.section
      className="bg-white pt-16 pb-12 px-7 flex flex-col items-center text-center"
      variants={containerVariants}
      initial={reduce ? false : 'hidden'}
      animate="visible"
    >
      {/* Star motif — hero position, 64px (PNG includes navy circle border + star) */}
      <motion.div variants={reduce ? itemVariantsReduced : itemVariants} className="mb-6">
        <StarMark size={64} />
      </motion.div>

      {/* Primary heading — serif, sentence case, navy */}
      <motion.h1
        variants={reduce ? itemVariantsReduced : itemVariants}
        className="font-serif text-navy text-6xl md:text-7xl font-normal mb-4"
      >
        A gathering of generations
      </motion.h1>

      {/* Subtitle — italic serif, muted, max-w-prose centered */}
      <motion.p
        variants={reduce ? itemVariantsReduced : itemVariants}
        className="font-serif italic text-muted text-xl font-normal max-w-prose"
      >
        The stories, faces, and moments that make us who we are — kept in one place, for those here now and those to come.
      </motion.p>
    </motion.section>
  )
}
