// app/(protected)/layout.tsx
// SERVER COMPONENT — calls await auth() independently of middleware.
// Middleware (edge) handles UX-speed redirects.
// This layout handles the security layer (defence in depth against CVE-2025-29927).
import { redirect } from 'next/navigation'
import { auth } from '@/auth'

// TopNav and Footer are imported here after Plan 05 creates them.
// For now, render a layout shell without nav so placeholder pages are accessible.
// TODO Plan 05: import TopNav from '@/components/layout/TopNav'
// TODO Plan 05: import Footer from '@/components/layout/Footer'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* TopNav added in Plan 05 */}
      <main className="flex-1">{children}</main>
      {/* Footer added in Plan 05 */}
    </div>
  )
}
