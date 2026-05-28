// components/home/Hero.tsx
// Server Component - images-only hero band.
//
// v3.3: the hero is now purely the rotating family photos. No title, no
// subtitle, no star, no attribution - "the family knows who they are."
// The images carry the section. Height is explicit (text no longer drives
// it). HeroBackdrop owns the cross-fade rotation; per-image opacity / fit /
// position are configured at /admin/hero.
//
// No 'use client' needed anymore - with the motion text gone, this is a
// plain server component wrapping the HeroBackdrop client island.
import HeroBackdrop from '@/components/home/HeroBackdrop'
import type { Hero as HeroConfig } from '@/lib/types'

interface HeroProps {
  heroConfig: HeroConfig
}

export default function Hero({ heroConfig }: HeroProps) {
  return (
    <section
      className="
        relative bg-ivory overflow-hidden
        h-[58vh] min-h-[420px] max-h-[720px]
      "
      aria-label="Family photographs"
    >
      <HeroBackdrop config={heroConfig} />
    </section>
  )
}
