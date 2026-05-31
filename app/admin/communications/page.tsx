// app/admin/communications/page.tsx
// Admin Communications - select family members and compose an email/text
// announcement. Sending is not wired yet (no service connected); this is the
// recipient + compose + preview surface. Auth gate via requireAdminOrRedirect().
import { getPeople } from '@/lib/content'
import { requireAdminOrRedirect } from '@/lib/admin'
import BackLink from '@/components/admin/BackLink'
import CommunicationsComposer from '@/components/admin/CommunicationsComposer'

export const metadata = {
  title: 'Communications · Admin · The Curry Family',
}

export default async function AdminCommunicationsPage() {
  await requireAdminOrRedirect()
  const people = getPeople()
    .map((p) => ({ id: p.id, name: p.name, email: p.email, phone: p.phone }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="py-11 px-7 md:px-11 max-w-5xl mx-auto pb-32">
      <BackLink href="/admin" label="Back to admin" />
      <p className="eyebrow text-gold-deep mb-3">Family archive · Admin</p>
      <h1 className="font-serif text-navy text-4xl mb-2">Communications</h1>
      <p className="font-serif italic text-muted text-base mb-9 max-w-2xl">
        Send an announcement to family members by email or text. Add each person&rsquo;s
        email and phone on their page; here you choose who receives it and how.
      </p>
      <CommunicationsComposer people={people} />
    </div>
  )
}
