// components/home/FeaturedVideoSection.tsx
// Server Component - an optional home band featuring one video. Rendered only
// when screens.home.showFeaturedVideo is true AND a featured video exists
// (Video.featured), so it is OFF by default and never changes today's home page
// until an admin enables it from /admin/screens.
import VideoPlayer from '@/components/video/VideoPlayer'
import type { Video } from '@/lib/types'

export default function FeaturedVideoSection({ video }: { video: Video }) {
  return (
    <section
      data-edit-id="home-featured"
      data-edit-label="Home featured film"
      data-edit-kind="box"
      className="bg-ivory border-t border-stone/60 py-16 md:py-24 px-7 md:px-11"
      aria-label="Featured film"
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col items-center mb-8 text-center">
          <p data-edit-id="home-featured-eyebrow" data-edit-label="Featured · eyebrow" data-edit-kind="text" className="eyebrow text-gold-deep text-sm tracking-[0.28em] mb-3">
            Featured film
          </p>
          <h2 className="font-serif text-navy text-3xl md:text-4xl leading-tight">{video.title}</h2>
          {video.dateLabel && <p className="font-sans text-quiet text-sm mt-2">{video.dateLabel}</p>}
        </div>
        <div className="surface-inset overflow-hidden rounded-well">
          <VideoPlayer video={video} />
        </div>
      </div>
    </section>
  )
}
