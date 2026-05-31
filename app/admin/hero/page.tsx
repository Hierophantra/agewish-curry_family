// app/admin/hero/page.tsx
// Admin page - edit the home page hero rotator config.
// Auth gate enforced by requireAdminOrRedirect() in the page (NOT the layout -
// see app/admin/layout.tsx for the rationale).
//
// Auto-discovery: reads public/images/hero/ and surfaces any image files that
// don't yet have an entry in content/hero.json. The form lets the maintainer
// add them with one click, with sensible defaults (22% opacity, centered).
import Link from 'next/link'
import Image from 'next/image'
import { readdirSync } from 'fs'
import { join } from 'path'
import { getHero, getPhotos } from '@/lib/content'
import { getPhotoUrl } from '@/lib/utils'
import { requireAdminOrRedirect } from '@/lib/admin'
import EditHeroForm from '@/components/admin/EditHeroForm'
import ImportHeroButton from '@/components/admin/ImportHeroButton'

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
  // Hero images imported into Photographs (admin-only, hidden from the public
  // gallery) — open one to crop a person out of it and tag them.
  const heroPhotos = getPhotos().filter((p) => p.inHero)

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

      {/* Crop & tag people in the hero images. These are admin-only Photo
          records (hidden from the public gallery); open one to draw a box around
          a person and tag them, then set that person's visibility to show the
          cropped image on their profile or tree. */}
      <section className="mt-14 pt-10 border-t border-[color:var(--color-border)]">
        <div className="flex items-end justify-between gap-4 mb-1">
          <h2 className="font-serif text-navy text-2xl">Crop &amp; tag people</h2>
          <ImportHeroButton />
        </div>
        <p className="text-quiet text-xs mb-6 max-w-2xl">
          Tag the people in your hero images. Click &ldquo;Import hero images&rdquo; once to bring the rotation above into the photo editor (admin-only — they never show in the public Photographs gallery). Then open one to crop a person out of it and tag them.
        </p>
        {heroPhotos.length === 0 ? (
          <p className="text-muted text-sm font-serif italic">No hero images imported yet. Click &ldquo;Import hero images&rdquo; to bring your rotation in for cropping.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {heroPhotos.map((photo) => (
              <Link
                key={photo.id}
                href={`/admin/photos/${photo.id}`}
                className="group flex flex-col gap-2"
              >
                <div className="relative aspect-[4/3] bg-ivory overflow-hidden rounded border hairline group-hover:border-navy transition-colors">
                  <Image
                    src={getPhotoUrl(photo)}
                    alt={photo.caption ?? 'Hero image'}
                    fill
                    sizes="(min-width: 768px) 25vw, 50vw"
                    className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-serif text-navy text-xs truncate">{photo.caption ?? photo.id}</span>
                  <span className="eyebrow text-gold-deep text-[10px] shrink-0">Crop →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
