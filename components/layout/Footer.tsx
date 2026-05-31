// components/layout/Footer.tsx
// Server Component - centered StarMark + family name + eyebrow metadata.
// The tagline was removed per the maintainer; the family name sits under the
// logo instead.
import StarMark from '@/components/ui/StarMark'
import { getSite } from '@/lib/content'

export default function Footer() {
  const site = getSite()
  return (
    <footer
      data-edit-id="footer"
      data-edit-label="Bottom bar"
      data-edit-kind="box"
      className="border-t hairline py-11 px-7"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <StarMark size={32} src={site.brand.markSrc} />
        <p
          data-edit-id="footer-name"
          data-edit-label="Footer name"
          data-edit-kind="text"
          className="font-serif text-navy text-lg"
        >
          The Curry Family
        </p>
        <p
          data-edit-id="footer-eyebrow"
          data-edit-label="Footer eyebrow"
          data-edit-kind="text"
          className="eyebrow text-quiet text-xs"
        >
          A private archive · AgeWish
        </p>
        {site.footer.downloadEnabled && (
          <a
            href={site.footer.downloadHref}
            className="eyebrow text-quiet hover:text-gold-deep transition-colors text-[10px] mt-1 inline-block"
            download
          >
            {site.footer.downloadLabel}
          </a>
        )}
      </div>
    </footer>
  )
}
