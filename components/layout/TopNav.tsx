// components/layout/TopNav.tsx
// Server Component - renders brand mark and NavTabs client island.
//
// v3.1 upgrade: sticky positioning with translucent backdrop-blur so the nav
// stays present without competing with content. This is the kind of small
// product polish that separates a hand-built site from real software.
// Border-bottom uses border-stone at low opacity to keep the seam quiet.
//
// Sign out removed in v2.1 - session JWT expires on its own; TV deployment
// has no sign-out.
import Link from 'next/link'
import StarMark from '@/components/ui/StarMark'
import NavTabs from '@/components/layout/NavTabs'

export default function TopNav() {
  return (
    <header
      data-edit-id="topbar"
      data-edit-label="Top bar"
      data-edit-kind="box"
      className="
        sticky top-0 z-40
        bg-ivory/85 backdrop-blur-xl
        border-b border-stone/60
      "
    >
      <nav className="px-7 md:px-11 py-5 flex items-center justify-between max-w-7xl mx-auto">
        {/* Brand mark - left side: PNG mark + 2-line text stack */}
        <Link
          href="/"
          className="flex items-center gap-3.5 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        >
          <StarMark size={36} />
          <div className="flex flex-col leading-tight">
            <span
              data-edit-id="brand-eyebrow"
              data-edit-label="Brand eyebrow"
              data-edit-kind="text"
              className="eyebrow text-quiet text-[9px]"
            >
              AgeWish · Private archive
            </span>
            <span
              data-edit-id="brand-name"
              data-edit-label="Brand name"
              data-edit-kind="text"
              className="font-serif text-navy text-xl tracking-[0.01em]"
            >
              The Curry Family
            </span>
          </div>
        </Link>

        {/* Nav tabs - center/right (Client island for active state) */}
        <NavTabs />
      </nav>
    </header>
  )
}
