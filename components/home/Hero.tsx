'use client'
// components/home/Hero.tsx
// Client Component - motion staggerChildren for the entrance.
//
// v3 visual upgrade: scaled up typography, gold accent rule above the star,
// gentle ivory-to-white gradient on the section background, attribution line
// beneath the subtitle.
//
// Star motif rule: TopNav = star 1, Hero = star 2, Footer = star 3.
// Two-weight rule: only 400 / 500. No 600 / 700.
import { motion, useReducedMotion } from 'motion/react'
import StarMark from '@/components/ui/StarMark'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' as const } },
}

const itemVariantsReduced = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0, transition: { duration: 0 } },
}

export default function Hero() {
  const reduce = useReducedMotion()

  return (
    <motion.section
      className="
        relative bg-gradient-to-b from-white via-white to-ivory
        pt-24 pb-20 md:pt-32 md:pb-24 px-7
        flex flex-col items-center text-center
        overflow-hidden
      "
      variants={containerVariants}
      initial={reduce ? false : 'hidden'}
      animate="visible"
    >
      {/* Gold rule above the star - a small editorial flourish */}
      <motion.div
        variants={reduce ? itemVariantsReduced : itemVariants}
        className="flex items-center gap-3 mb-8"
        aria-hidden="true"
      >
        <span className="block w-12 h-px bg-gold-deep" />
        <span className="block w-1.5 h-1.5 rounded-full bg-gold" />
        <span className="block w-12 h-px bg-gold-deep" />
      </motion.div>

      {/* Star motif - hero position, scaled up to 88px */}
      <motion.div variants={reduce ? itemVariantsReduced : itemVariants} className="mb-8">
        <StarMark size={88} />
      </motion.div>

      {/* Primary heading - serif, sentence case, navy. Scaled larger for hero presence. */}
      <motion.h1
        variants={reduce ? itemVariantsReduced : itemVariants}
        className="font-serif text-navy text-6xl md:text-7xl lg:text-8xl font-normal mb-6 leading-[1.05] max-w-5xl"
      >
        A gathering of generations
      </motion.h1>

      {/* Subtitle - italic serif, muted, scaled up. */}
      <motion.p
        variants={reduce ? itemVariantsReduced : itemVariants}
        className="font-serif italic text-muted text-xl md:text-2xl font-normal max-w-2xl leading-relaxed"
      >
        The stories, faces, and moments that make us who we are, kept in one place,
        for those here now and those to come.
      </motion.p>

      {/* Small attribution line - editorial endnote feel */}
      <motion.p
        variants={reduce ? itemVariantsReduced : itemVariants}
        className="eyebrow text-gold-deep mt-10"
      >
        The Curry family archive
      </motion.p>
    </motion.section>
  )
}
