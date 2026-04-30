// components/layout/TopNav.tsx
// Server Component — renders brand mark, NavTabs client island, and Sign out form.
// Sign out is a form with an inline server action — no client JS required.
// D-06: Brand mark = PNG ring+star at 36px + 2-line text stack (eyebrow + serif name).
// PNG already contains navy circle border + gold star — no wrapper ring div needed.
import Link from 'next/link'
import StarMark from '@/components/ui/StarMark'
import NavTabs from '@/components/layout/NavTabs'
import { signOut } from '@/auth'

// Inline server action — only valid inside Server Components.
// signOut() redirects to /login; Next.js throws NEXT_REDIRECT internally.
async function handleSignOut() {
  'use server'
  await signOut({ redirectTo: '/login' })
}

export default function TopNav() {
  return (
    <header className="border-b hairline">
      <nav className="px-7 md:px-11 py-5 flex items-center justify-between">
        {/* Brand mark — left side: PNG mark + 2-line text stack */}
        <Link href="/" className="flex items-center gap-3.5">
          <StarMark size={36} />
          <div className="flex flex-col leading-tight">
            <span className="eyebrow text-quiet text-[9px]">AgeWish · Private archive</span>
            <span className="font-serif text-navy text-lg tracking-[0.01em]">The Curry Family</span>
          </div>
        </Link>

        {/* Nav tabs — center/right (Client island for active state) */}
        <NavTabs />

        {/* Sign out — far right, server action form, no client JS */}
        <form action={handleSignOut}>
          <button
            type="submit"
            className="text-sm text-muted hover:text-navy transition-colors"
          >
            Sign out
          </button>
        </form>
      </nav>
    </header>
  )
}
