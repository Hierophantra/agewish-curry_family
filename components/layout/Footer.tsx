// components/layout/Footer.tsx
// Server Component - centered StarMark + family name + eyebrow metadata.
// The tagline was removed per the maintainer; the family name sits under the
// logo instead.
import StarMark from '@/components/ui/StarMark'

export default function Footer() {
  return (
    <footer className="border-t hairline py-11 px-7">
      <div className="flex flex-col items-center gap-3 text-center">
        <StarMark size={32} />
        <p className="font-serif text-navy text-lg">The Curry Family</p>
        <p className="eyebrow text-quiet text-xs">A private archive · AgeWish</p>
        <a
          href="/api/archive"
          className="eyebrow text-quiet hover:text-gold-deep transition-colors text-[10px] mt-1 inline-block"
          download
        >
          Download the archive →
        </a>
      </div>
    </footer>
  )
}
