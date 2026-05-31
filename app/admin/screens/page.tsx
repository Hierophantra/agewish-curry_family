// app/admin/screens/page.tsx
// Admin page - show/hide whole sections per screen. Auth gate via
// requireAdminOrRedirect().
import { getScreens } from '@/lib/content'
import { requireAdminOrRedirect } from '@/lib/admin'
import EditScreensForm from '@/components/admin/EditScreensForm'
import BackLink from '@/components/admin/BackLink'

export const metadata = {
  title: 'Screens · Admin · The Curry Family',
}

export default async function AdminScreensPage() {
  await requireAdminOrRedirect()
  const screens = getScreens()
  return (
    <div className="py-11 px-7 md:px-11 max-w-5xl mx-auto pb-32">
      <BackLink href="/admin" label="Back to admin" />
      <p className="eyebrow text-gold-deep mb-3">Family archive · Admin</p>
      <h1 className="font-serif text-navy text-4xl mb-2">Sections</h1>
      <p className="font-serif italic text-muted text-base mb-9 max-w-2xl">
        Show or hide whole sections. Page titles and wording are edited in place
        with the Shift+E appearance editor; this page controls which sections
        appear.
      </p>
      <EditScreensForm initial={screens} />
    </div>
  )
}
