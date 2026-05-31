// app/(protected)/layout.tsx
// SERVER COMPONENT - auth() gate + layout shell with TopNav and Footer.
// Calls await auth() independently of middleware (defence in depth, CVE-2025-29927).
//
// v3.5: mounts the ambient light element + the theme controller. The controller
// applies per-page theme overrides for everyone, and exposes the Shift+E
// appearance editor to admins only (isAdmin computed server-side here).
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import TopNav from '@/components/layout/TopNav'
import Footer from '@/components/layout/Footer'
import AmbientLight from '@/components/theme/AmbientLight'
import ThemeController from '@/components/theme/ThemeController'
import DebugOverlay from '@/components/debug/DebugOverlay'
import RequestWidget from '@/components/help/RequestWidget'
import { getAdminUser } from '@/lib/admin'
import { getTheme, getSite } from '@/lib/content'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  const adminLogin = await getAdminUser()
  const theme = getTheme()
  const site = getSite()

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Ambient light glow - behind everything, driven by theme CSS vars. */}
      <AmbientLight />
      <TopNav />
      {/* relative z-10 keeps content above the fixed ambient light (z-0). */}
      <main className="flex-1 relative z-10">{children}</main>
      <Footer />
      {/* Theme applier + Shift+E editor (editor UI is admin-only). */}
      <ThemeController theme={theme} isAdmin={Boolean(adminLogin)} />
      {/* Read-only debug overlay (Shift+D) — admin-only, never writes. */}
      <DebugOverlay theme={theme} isAdmin={Boolean(adminLogin)} />
      {/* Public help + request widget (bottom-right). */}
      {site.contact.helpEnabled && <RequestWidget requestEmail={site.contact.requestEmail} />}
    </div>
  )
}
