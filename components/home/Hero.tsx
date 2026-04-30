// components/home/Hero.tsx
// Server Component. The hero section of the home page.
// D-32: Centered StarMark (36px), serif "The Curry Family" heading, serif subtitle in muted color.
// D-34: Hero has bg-white (not bg-ivory).
// No CTA buttons — the site IS the experience (D-32: "No CTA buttons").
// Star motif rule (D-17): TopNav = star 1, Hero = star 2, Footer = star 3.
import StarMark from '@/components/ui/StarMark'

export default function Hero() {
  return (
    <section className="bg-white pt-16 pb-12 px-7 flex flex-col items-center text-center">
      {/* Star motif — hero position, 36px per D-16/D-32 */}
      <StarMark size={36} className="mb-6" />

      {/* Primary heading — serif, sentence case, navy */}
      <h1 className="font-serif text-navy text-5xl md:text-6xl font-normal mb-4">
        The Curry Family
      </h1>

      {/* Subtitle — serif, muted, sentence case */}
      <p className="font-serif text-muted text-lg font-normal max-w-md">
        A private family archive
      </p>
    </section>
  )
}
