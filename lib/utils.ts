// lib/utils.ts
// cn() merges conditional Tailwind class names.
// clsx handles conditionals; tailwind-merge resolves conflicting Tailwind classes
// (e.g., cn('px-4', 'px-6') → 'px-6', not 'px-4 px-6').
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Photo URL helper ──
// Returns the URL to load a photo's image file.
// - If filename is a full URL (https://...), returns as-is (Vercel Blob upload)
// - Otherwise treats filename as a relative name in /public/photos/ (legacy stubs)
//
// Components MUST use this helper instead of constructing /photos/${filename} directly,
// so newly-uploaded Blob photos render correctly alongside legacy stub photos.
// Safe to import in both Server Components and 'use client' components.
export function getPhotoUrl(photo: { filename: string }): string {
  // Full URL (Blob) or already-rooted public path (e.g. imported hero images at
  // /images/hero/...) → use as-is. Bare names → /public/photos/.
  if (photo.filename.startsWith('http') || photo.filename.startsWith('/')) return photo.filename
  return `/photos/${photo.filename}`
}

// ── Audio URL helper ──
// Returns the URL to load an audio recording's file.
// - If filename is a full URL (https://...), returns as-is (Vercel Blob upload)
// - Otherwise treats filename as a relative name in /public/audio/ (legacy stubs)
//
// Components MUST use this helper instead of constructing /audio/${filename} directly,
// so newly-uploaded Blob audio files render correctly alongside legacy stub files.
// Safe to import in both Server Components and 'use client' components.
export function getAudioUrl(audio: { filename: string }): string {
  return audio.filename.startsWith('http') ? audio.filename : `/audio/${audio.filename}`
}
