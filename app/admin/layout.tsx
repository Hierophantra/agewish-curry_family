// app/admin/layout.tsx
// Admin route group layout — enforces GitHub OAuth + allowlist auth gate.
// If the user is not signed in as an allowlisted admin, redirects to /admin/login.
// This is the security boundary for ALL /admin routes.
import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/admin'
import Link from 'next/link'
import StarMark from '@/components/ui/StarMark'

export const metadata = {
  title: 'Admin · The Curry Family',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const adminLogin = await getAdminUser()
  if (!adminLogin) {
    // Not signed in via GitHub OR not in the admin allowlist
    redirect('/admin/login')
  }

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
          <span className="text-xs text-quiet">@{adminLogin}</span>
        </div>
      </header>
      <main>{children}</main>
    </>
  )
}
