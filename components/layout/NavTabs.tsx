'use client'
// components/layout/NavTabs.tsx
// Client island - uses usePathname() which is a client-only hook.
// Parent TopNav stays a Server Component; this is the thin interactive slice.
//
// v3.1: active state now uses a surface-subtle pill background (per the
// reduce-gold-by-40% pass). Hover uses the same surface-subtle treatment with
// a subtle text-color shift to navy. Gold is reserved for the focus ring and
// the brand star elsewhere, not for nav decoration.
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

// Canonical nav routes (route STRUCTURE stays in code). Exported so the
// /admin/site editor can present per-route label overrides without duplicating.
export const TABS = [
  { href: '/', label: 'Home' },
  { href: '/tree', label: 'Family tree' },
  { href: '/photographs', label: 'Photographs' },
  { href: '/videos', label: 'Videos' },
  { href: '/chronicles', label: 'Chronicles' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/upload', label: 'Add a photo' },
] as const

interface NavTabsProps {
  /** href -> override label, from content/site.json (nav.labels). */
  labelOverrides?: Record<string, string>
  /** hrefs to hide from the nav, from content/site.json (nav.hidden). */
  hidden?: string[]
}

export default function NavTabs({ labelOverrides = {}, hidden = [] }: NavTabsProps) {
  const pathname = usePathname()

  return (
    <div className="overflow-x-auto scrollbar-none flex items-center gap-1">
      {TABS.filter((tab) => !hidden.includes(tab.href)).map((tab) => {
        const label = labelOverrides[tab.href] ?? tab.label
        // Home tab active only on exact match; others match prefix
        const isActive =
          tab.href === '/'
            ? pathname === '/'
            : pathname.startsWith(tab.href)

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'text-sm rounded-full px-4 py-2 transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2',
              isActive
                ? 'bg-[color:var(--color-surface-subtle)] text-navy shadow-[inset_0_0_0_1px_var(--color-border)]'
                : 'text-muted hover:text-navy hover:bg-[color:var(--color-surface-subtle)]',
            )}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
