// app/admin/hero/page.tsx
// Admin page - edit the home page hero rotator config.
// Auth gate enforced by requireAdminOrRedirect() in the page (NOT the layout -
// see app/admin/layout.tsx for the rationale).
//
// Auto-discovery: reads public/images/hero/ and surfaces any image files that
// don't yet have an entry in content/hero.json. The form lets the maintainer
// add them with one click, with sensible defaults (22% opacity, centered).
import Link from 'next/link'
import { readdirSync } from 'fs'
import { join } from 'path'
import { getHero } from '@/lib/content'
import { requireAdminOrRedirect } from '@/lib/admin'
import EditHeroForm from '@/components/admin/EditHeroForm'

export const metadata = {
  title: 'Hero · Admin · The Curry Family',
}

// Discover image files in public/images/hero/ at request time. Returns paths
// like "/images/hero/foo.jpg" (the same shape used in HeroImage.src).
function discoverHeroImages(): string[] {
  try {
    const dir = join(process.cwd(), 'public', 'images', 'hero')
    return readdirSync(dir)
      .filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f))
      .sort()
      .map((f) => `/images/hero/${f}`)
  } catch {
    return []
  }
}

export default async function AdminHeroPage() {
  await requireAdminOrRedirect()
  const heroConfig = getHero()
  const discovered = discoverHeroImages()

  return (
    <div className="py-11 px-7 md:px-11 max-w-5xl mx-auto pb-32">
      <Link
        href="/admin"
        className="text-quiet text-xs uppercase tracking-[0.22em] hover:text-navy transition-colors mb-6 inline-block"
      >
        {'←'} Back to admin
      </Link>
      <p className="eyebrow text-gold-deep mb-3">Family archive · Admin</p>
      <h1 className="font-serif text-navy text-4xl mb-2">Hero rotator</h1>
      <p className="font-serif italic text-muted text-base mb-9 max-w-2xl">
        Control the slow-rotating photo backdrop on the home page hero. Tune
        opacity, position, and timing for each image. Drop new files in
        <code className="font-sans text-sm not-italic text-navy mx-1.5">public/images/hero/</code>
        and they will appear at the bottom of this page for you to add.
      </p>

      <EditHeroForm initial={heroConfig} newlyDiscovered={discovered} />
    </div>
  )
}
