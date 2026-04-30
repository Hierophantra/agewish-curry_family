'use client'
// components/home/Hero.tsx
// Client Component — upgraded from Server to support motion staggerChildren (D-06).
// D-32: Centered StarMark (36px), serif "The Curry Family" heading, serif subtitle in muted color.
// D-34: Hero has bg-white (not bg-ivory).
// No CTA buttons — the site IS the experience (D-32: "No CTA buttons").
// Star motif rule (D-17): TopNav = star 1, Hero = star 2, Footer = star 3.
import { motion } from 'motion/react'
import StarMark from '@/components/ui/StarMark'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } },
}

export default function Hero() {
  return (
    <motion.section
      className="bg-white pt-16 pb-12 px-7 flex flex-col items-center text-center"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Star motif — hero position, 36px per D-16/D-32 */}
      <motion.div variants={itemVariants} className="mb-6">
        <StarMark size={36} />
      </motion.div>

      {/* Primary heading — serif, sentence case, navy */}
      <motion.h1
        variants={itemVariants}
        className="font-serif text-navy text-5xl md:text-6xl font-normal mb-4"
      >
        The Curry Family
      </motion.h1>

      {/* Subtitle — serif, muted, sentence case */}
      <motion.p
        variants={itemVariants}
        className="font-serif text-muted text-lg font-normal max-w-md"
      >
        A private family archive
      </motion.p>
    </motion.section>
  )
}
