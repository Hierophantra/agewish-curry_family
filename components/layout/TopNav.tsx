// components/layout/TopNav.tsx
// Server Component — renders brand mark, NavTabs client island, and Sign out form.
// Sign out is a form with an inline server action — no client JS required.
// D-04: "Sign out" text link, right-aligned, sentence case, muted color.
// D-18: Brand mark left, tabs center/right, sign out far right.
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
      <nav className="px-7 py-4 flex items-center justify-between">
        {/* Brand mark — left side */}
        <div className="flex items-center gap-2">
          <StarMark size={14} />
          <span className="font-serif text-navy text-sm">The Curry Family</span>
        </div>

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
