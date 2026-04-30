// components/layout/Footer.tsx
// Server Component — renders centered StarMark (20px), serif tagline, date metadata.
// D-20: Centered layout. StarMark (small), tagline beneath, The Curry Family in muted color.
import StarMark from '@/components/ui/StarMark'

export default function Footer() {
  return (
    <footer className="border-t hairline py-11 px-7">
      <div className="flex flex-col items-center gap-3 text-center">
        <StarMark size={20} />
        <p className="font-serif text-navy text-sm">A private family archive</p>
        <p className="text-quiet text-xs">The Curry Family</p>
      </div>
    </footer>
  )
}
