// app/(protected)/page.tsx
// Home page — Server Component.
// Composed of Hero (bg-white) and SectionPreview (bg-ivory) for ivory alternation (D-34).
// No client JS needed here — layout, nav, and interactions are handled by child components.
import Hero from '@/components/home/Hero'
import SectionPreview from '@/components/home/SectionPreview'

export default function HomePage() {
  return (
    <>
      <Hero />
      <SectionPreview />
    </>
  )
}
