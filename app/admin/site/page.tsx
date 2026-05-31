// app/admin/site/page.tsx
// Admin page - edit site chrome (brand mark, nav labels/visibility, footer CTA).
// Auth gate enforced by requireAdminOrRedirect() in the page (NOT the layout).
import { getSite } from '@/lib/content'
import { requireAdminOrRedirect } from '@/lib/admin'
import EditSiteForm from '@/components/admin/EditSiteForm'
import BackLink from '@/components/admin/BackLink'

export const metadata = {
  title: 'Site · Admin · The Curry Family',
}

export default async function AdminSitePage() {
  await requireAdminOrRedirect()
  const site = getSite()

  return (
    <div className="py-11 px-7 md:px-11 max-w-5xl mx-auto pb-32">
      <BackLink href="/admin" label="Back to admin" />
      <p className="eyebrow text-gold-deep mb-3">Family archive · Admin</p>
      <h1 className="font-serif text-navy text-4xl mb-2">Site chrome</h1>
      <p className="font-serif italic text-muted text-base mb-9 max-w-2xl">
        Edit the brand mark, navigation tab labels, and the footer download link.
        Page titles and subtitles are edited in place with the Shift+E appearance
        editor; this page covers the shared chrome.
      </p>

      <EditSiteForm initial={site} />
    </div>
  )
}
