// app/admin/history/page.tsx
// Admin page - restore a previous saved version of a config file (theme, tree
// arrangement, site chrome, hero). Read-history + restore-forward; full git
// history is preserved. Auth gate via requireAdminOrRedirect().
import { requireAdminOrRedirect } from '@/lib/admin'
import BackLink from '@/components/admin/BackLink'
import HistoryPanel from '@/components/admin/HistoryPanel'

export const metadata = {
  title: 'History · Admin · The Curry Family',
}

export default async function AdminHistoryPage() {
  await requireAdminOrRedirect()
  return (
    <div className="py-11 px-7 md:px-11 max-w-5xl mx-auto pb-32">
      <BackLink href="/admin" label="Back to admin" />
      <p className="eyebrow text-gold-deep mb-3">Family archive · Admin</p>
      <h1 className="font-serif text-navy text-4xl mb-2">History &amp; restore</h1>
      <p className="font-serif italic text-muted text-base mb-9 max-w-2xl">
        Roll back the appearance, the family-tree arrangement, the site chrome, or
        the hero rotator to any earlier saved version. Restoring commits the older
        version forward — nothing is lost, and it publishes in about 90 seconds.
      </p>
      <HistoryPanel />
    </div>
  )
}
