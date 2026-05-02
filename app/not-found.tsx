// app/not-found.tsx
// Custom 404 page — applies to any unmatched route and when notFound() is called.
// Root-level (not inside a route group) so it applies globally.
import Link from 'next/link'
import StarMark from '@/components/ui/StarMark'

export default function NotFound() {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center text-center px-7 py-16">
      <StarMark size={48} className="mb-6 opacity-60" />
      <p className="eyebrow text-gold-deep mb-3">FAMILY ARCHIVE</p>
      <h1 className="font-serif text-navy text-4xl mb-4">This page is not in the archive</h1>
      <p className="font-serif italic text-muted text-lg max-w-md mb-8 leading-relaxed">
        The page you&apos;re looking for doesn&apos;t exist — or was moved before being remembered.
      </p>
      <Link href="/" className="eyebrow text-gold-deep hover:text-gold transition-colors">
        Return home →
      </Link>
    </main>
  )
}
