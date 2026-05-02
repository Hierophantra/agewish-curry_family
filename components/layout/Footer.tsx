// components/layout/Footer.tsx
// Server Component — renders centered StarMark, italic serif tagline, eyebrow metadata.
// D-11: Tagline "Held in trust for those who come after." (italic serif).
// D-11: Meta "A private archive · AgeWish" (eyebrow uppercase, 0.22em letter-spacing).
import StarMark from '@/components/ui/StarMark'

export default function Footer() {
  return (
    <footer className="border-t hairline py-11 px-7">
      <div className="flex flex-col items-center gap-3 text-center">
        <StarMark size={32} />
        <p className="font-serif italic text-navy text-sm">Held in trust for those who come after.</p>
        <p className="eyebrow text-quiet text-xs">A private archive · AgeWish</p>
      </div>
    </footer>
  )
}
