// app/(protected)/chronicles/[id]/page.tsx
// Chronicle detail page - Server Component, async.
// D-07: getChronicleById; notFound() if missing; generateStaticParams for all IDs.
// D-08: Back link → eyebrow → title → subtitle → dateLabel → cover photo → AudioPlayer → body → people chips.
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getChronicles, getChronicleById, getPersonById, getPhotos } from '@/lib/content'
import { getPhotoUrl } from '@/lib/utils'
import ChronicleBody from '@/components/chronicles/ChronicleBody'
import AudioPlayer from '@/components/audio/AudioPlayer'
import type { Audio as AudioRecord } from '@/lib/types'

// Pre-render all chronicle detail pages at build time.
export function generateStaticParams() {
  return getChronicles().map((c) => ({ id: c.id }))
}

interface Props {
  params: { id: string }
}

export default async function ChronicleDetailPage({ params }: Props) {
  const chronicle = getChronicleById(params.id)
  if (!chronicle) notFound()

  // Resolve cover photo metadata (for BlurHash placeholder)
  const coverPhoto = chronicle.coverPhotoId
    ? getPhotos().find((p) => p.id === chronicle.coverPhotoId)
    : null

  // Build an AudioRecord-shaped adapter so AudioPlayer can render the narration.
  // D-11: AudioPlayer is reused for chronicles; the audio is embedded on the chronicle, not in audio.json.
  const narrationAudio: AudioRecord | null = chronicle.audioFilename
    ? {
        id: chronicle.id,
        filename: chronicle.audioFilename,
        title: `Narration - ${chronicle.title}`,
        duration: chronicle.audioDuration,
        dateLabel: chronicle.dateLabel,
        circa: chronicle.circa,
        description: 'Listen to the chronicle read aloud.',
        peopleIds: chronicle.peopleIds,
        collectionIds: chronicle.collectionIds,
      }
    : null

  // Resolve people chips from peopleIds
  const people = chronicle.peopleIds
    .map((pid) => getPersonById(pid))
    .filter((p): p is NonNullable<typeof p> => p !== null)

  return (
    <main className="py-11 px-7 md:px-11 lg:px-15 max-w-4xl mx-auto">
      {/* D-08 step 1: Back link */}
      <Link
        href="/chronicles"
        className="text-quiet text-xs uppercase tracking-[0.22em] hover:text-navy transition-colors mb-6 inline-block"
      >
        ← Back to chronicles
      </Link>

      {/* D-08 step 2: Eyebrow */}
      <p className="eyebrow text-gold-deep mb-3">FAMILY ARCHIVE · CHRONICLE</p>

      {/* D-08 step 3: Title */}
      <h1 className="font-serif text-navy text-5xl leading-tight mb-2">
        {chronicle.title}
      </h1>

      {/* D-08 step 4: Subtitle */}
      {chronicle.subtitle && (
        <p className="font-serif italic text-muted text-lg mb-4 max-w-prose">
          {chronicle.subtitle}
        </p>
      )}

      {/* D-08 step 5: Date label */}
      {chronicle.dateLabel && (
        <p className="eyebrow text-quiet mb-6">
          {chronicle.circa ? `Circa ${chronicle.dateLabel}` : chronicle.dateLabel}
        </p>
      )}

      {/* Gold accent divider */}
      <div className="h-px bg-gold w-12 mb-8" aria-hidden="true" />

      {/* D-08 step 6: Cover photo - full-width, ~16:9 max, BlurHash placeholder */}
      {coverPhoto && (
        <div className="relative aspect-video max-h-[500px] overflow-hidden rounded-lg mb-8">
          <Image
            src={getPhotoUrl(coverPhoto)}
            alt={coverPhoto.caption ?? ''}
            fill
            sizes="(min-width: 1024px) 800px, 100vw"
            className="object-cover"
            priority
            {...(coverPhoto.blurDataUrl
              ? { placeholder: 'blur' as const, blurDataURL: coverPhoto.blurDataUrl }
              : {})}
          />
        </div>
      )}

      {/* D-08 step 7: AudioPlayer - placed early so narration is findable */}
      {narrationAudio && (
        <div className="mb-8 max-w-prose">
          <AudioPlayer audio={narrationAudio} />
        </div>
      )}

      {/* D-08 step 8: Markdown body */}
      <div className="mb-12">
        <ChronicleBody body={chronicle.body} />
      </div>

      {/* D-08 step 9: People chips - "About the people in this story" */}
      {people.length > 0 && (
        <section className="border-t hairline pt-8">
          <h2 className="eyebrow text-quiet text-xs mb-5">
            ABOUT THE PEOPLE IN THIS STORY
          </h2>
          <div className="flex flex-wrap gap-3">
            {people.map((person) => (
              <Link
                key={person.id}
                href={`/person/${person.id}`}
                className="inline-flex items-center px-4 py-2 border hairline rounded-full bg-ivory hover:bg-white hover:shadow-sm transition-all duration-200 font-serif text-navy text-sm"
              >
                {person.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
