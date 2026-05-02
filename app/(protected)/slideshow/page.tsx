// app/(protected)/slideshow/page.tsx
// Slideshow / ambient mode — Server Component.
// Fetches photos (optionally filtered by ?collection=) and passes to SlideshowPlayer (Client).
// The player is fixed inset-0 z-50 so it covers the protected layout's TopNav/Footer.
// D-14 (v2.1 Feedback): auto-advances through random photos every 8s, full-screen.
import { getPhotos, getPhotosInCollection, getCollectionById } from '@/lib/content'
import SlideshowPlayer from '@/components/slideshow/SlideshowPlayer'

interface Props {
  searchParams: { collection?: string }
}

export default function SlideshowPage({ searchParams }: Props) {
  const collectionId = searchParams.collection
  const photos = collectionId ? getPhotosInCollection(collectionId) : getPhotos()
  const collection = collectionId ? getCollectionById(collectionId) : null

  return (
    <SlideshowPlayer photos={photos} collectionTitle={collection?.title ?? null} />
  )
}
