// app/(protected)/layout.tsx
// SERVER COMPONENT — auth() gate + layout shell with TopNav and Footer.
// Calls await auth() independently of middleware (defence in depth, CVE-2025-29927).
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import TopNav from '@/components/layout/TopNav'
import Footer from '@/components/layout/Footer'

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
      <TopNav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
