// app/admin/layout.tsx
// Admin route group layout - chrome only, NO auth check.
//
// IMPORTANT: This layout wraps app/admin/login/page.tsx as well as the gated pages.
// Putting an auth gate here would create an infinite redirect loop:
//   /admin/login → layout sees no admin → redirect /admin/login → ...
//
// Auth gating instead lives in each protected page via `await requireAdminOrRedirect()`.
// The login page intentionally has no such call.
//
// The @username badge in the chrome is rendered conditionally - present when the user is
// signed in as an admin, absent on /admin/login (since they haven't signed in yet).
import { getAdminUser } from '@/lib/admin'
import Link from 'next/link'
import StarMark from '@/components/ui/StarMark'

export const metadata = {
  title: 'Admin · The Curry Family',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const adminLogin = await getAdminUser()

  return (
    <>
      <header className="bg-white border-b border-stone py-5 px-7 md:px-11 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-3">
          <StarMark size={32} />
          <div className="flex flex-col leading-tight">
            <span className="eyebrow text-quiet text-[9px]">AGEWISH · ADMIN</span>
            <span className="font-serif text-navy text-lg">The Curry Family</span>
          </div>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm text-quiet hover:text-navy transition-colors">
            View site →
          </Link>
          {adminLogin && (
            <span className="text-xs text-quiet">@{adminLogin}</span>
          )}
        </div>
      </header>
      <main>{children}</main>
    </>
  )
}
