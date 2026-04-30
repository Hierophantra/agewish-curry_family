// lib/utils.ts
// cn() merges conditional Tailwind class names.
// clsx handles conditionals; tailwind-merge resolves conflicting Tailwind classes
// (e.g., cn('px-4', 'px-6') → 'px-6', not 'px-4 px-6').
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
