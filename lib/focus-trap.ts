'use client'
// lib/focus-trap.ts
// Traps focus within a container element while `active` is true.
// On activate: saves the previously-focused element and moves focus to the first focusable child.
// On deactivate: restores focus to the element that was active before the trap was engaged.
// Tab cycles forward; Shift+Tab cycles backward, wrapping at boundaries.
import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]:not([disabled])',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"]):not([disabled])',
].join(', ')

/**
 * Traps focus within the returned ref's element while `active` is true.
 * On activate: moves focus to the first focusable child.
 * On deactivate: returns focus to the element that was focused before activation.
 * Tab cycles forward, Shift+Tab cycles backward.
 */
export function useFocusTrap<T extends HTMLElement>(active: boolean) {
  const containerRef = useRef<T>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!active) return
    const container = containerRef.current
    if (!container) return

    // Save element that had focus before the trap was activated.
    previousFocusRef.current = (document.activeElement as HTMLElement) ?? null

    // Move focus into the trap immediately.
    const focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    const first = focusables[0]
    if (first) first.focus()

    function handleKey(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      const currentFocusables = container!.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      if (currentFocusables.length === 0) return
      const firstEl = currentFocusables[0]
      const lastEl = currentFocusables[currentFocusables.length - 1]
      const active = document.activeElement as HTMLElement

      if (e.shiftKey) {
        // Shift+Tab: wrap from first → last
        if (active === firstEl || !container!.contains(active)) {
          e.preventDefault()
          lastEl.focus()
        }
      } else {
        // Tab: wrap from last → first
        if (active === lastEl || !container!.contains(active)) {
          e.preventDefault()
          firstEl.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('keydown', handleKey)
      // Restore focus to the previously-focused element on deactivate.
      previousFocusRef.current?.focus?.()
    }
  }, [active])

  return containerRef
}
