// components/admin/BackLink.tsx
// Shared admin "← Back to X" link. Consolidates the identical eyebrow/tracking/
// spacing string that was copy-pasted across ~24 admin pages. Server component
// (no client state). New/converted admin pages use <BackLink href label />.
import Link from 'next/link'

interface Props {
  href: string
  label: string
}

export default function BackLink({ href, label }: Props) {
  return (
    <Link
      href={href}
      className="text-quiet text-xs uppercase tracking-[0.22em] hover:text-navy transition-colors mb-6 inline-block"
    >
      {'←'} {label}
    </Link>
  )
}
