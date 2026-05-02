// components/layout/TopNav.tsx
// Server Component — renders brand mark and NavTabs client island.
// Sign out removed in v2.1 — session JWT expires on its own; TV deployment has no sign-out.
// D-06: Brand mark = PNG ring+star at 36px + 2-line text stack (eyebrow + serif name).
// PNG already contains navy circle border + gold star — no wrapper ring div needed.
import Link from 'next/link'
import StarMark from '@/components/ui/StarMark'
import NavTabs from '@/components/layout/NavTabs'

export default function TopNav() {
  return (
    <header className="border-b hairline">
      <nav className="px-7 md:px-11 py-6 flex items-center justify-between">
        {/* Brand mark — left side: PNG mark + 2-line text stack */}
        <Link href="/" className="flex items-center gap-3.5">
          <StarMark size={36} />
          <div className="flex flex-col leading-tight">
            <span className="eyebrow text-quiet text-[9px]">AgeWish · Private archive</span>
            <span className="font-serif text-navy text-xl tracking-[0.01em]">The Curry Family</span>
          </div>
        </Link>

        {/* Nav tabs — center/right (Client island for active state) */}
        <NavTabs />
      </nav>
    </header>
  )
}
