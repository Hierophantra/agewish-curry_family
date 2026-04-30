// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// Load Inter with exactly weights 400 and 500 — no more
// subsets: 'latin' covers English and Western European characters
// display: 'swap' renders with fallback font until Inter loads (prevents invisible text)
// variable: '--font-inter' injects a CSS custom property on <html>
// so @theme { --font-sans: var(--font-inter), ... } in globals.css can reference it
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'The Curry Family',
  description: 'A private family archive.',
  robots: 'noindex, nofollow', // Private site — never index
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // className={inter.variable} injects --font-inter as CSS variable on <html>
    // This makes it available for @theme { --font-sans: var(--font-inter), ... }
    // Use inter.variable (NOT inter.className) to expose the CSS variable
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
