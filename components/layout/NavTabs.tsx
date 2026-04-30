'use client'
// components/layout/NavTabs.tsx
// Client island — uses usePathname() which is a client-only hook.
// Parent TopNav stays a Server Component; this is the thin interactive slice.
// Tab labels use sentence case per D-13.
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/', label: 'Home' },
  { href: '/tree', label: 'Family tree' },
  { href: '/photographs', label: 'Photographs' },
  { href: '/films', label: 'Films' },
] as const

export default function NavTabs() {
  const pathname = usePathname()

  return (
    <div className="overflow-x-auto scrollbar-none flex items-center gap-6 -mx-2 px-2">
      {TABS.map((tab) => {
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
              'text-sm pb-1 transition-colors',
              isActive
                ? 'text-navy border-b hairline-emphasis border-gold'
                : 'text-muted hover:text-navy'
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
