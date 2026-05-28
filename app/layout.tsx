// app/layout.tsx
import type { Metadata } from 'next'
import { Inter, Cormorant_Garamond } from 'next/font/google'
import './globals.css'
import ThemeStyle from '@/components/theme/ThemeStyle'

// Load Inter with exactly weights 400 and 500 - no more
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

// Load Cormorant Garamond with exactly weights 400 and 500 - two-weight rule (D-01)
// style: ['normal', 'italic'] ensures italic variants are available for blockquotes
// display: 'swap' prevents invisible text during font load (matches Inter pattern)
// variable: '--font-cormorant' injects a CSS custom property on <html>
// so @theme { --font-serif: var(--font-cormorant), ... } in globals.css can reference it
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-cormorant',
})

export const metadata: Metadata = {
  title: 'The Curry Family',
  description: 'A private family archive.',
  robots: 'noindex, nofollow', // Private site - never index
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // className injects --font-inter and --font-cormorant as CSS variables on <html>
    // This makes them available for @theme in globals.css
    // Use .variable (NOT .className) to expose the CSS variable
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
      <body>
        {/* Sitewide theme overrides (FOUC-free). Must render before children
            so its :root rule applies on first paint. */}
        <ThemeStyle />
        {children}
      </body>
    </html>
  )
}
