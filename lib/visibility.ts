// lib/visibility.ts
// Pure surface predicates for the media visibility model (v3.6). NO
// 'server-only' import, so the server loaders (lib/content.ts) and client
// components (FamilyTreeCanvas) share one source of truth. Legacy 'profile' is
// normalized to 'profile-tree' at parse time (see VisibilitySchema), so these
// only ever see the current enum values.
import type { Visibility, PhotoPersonVisibility } from '@/lib/types'

// Appears in the main gallery section (Photographs / Videos).
export function showsInGallery(v: Visibility | undefined): boolean {
  return v === 'gallery' || v === 'gallery-profile' || v === 'everywhere'
}

// Appears on the person's full profile page (/person/[id]).
export function showsOnProfilePage(v: Visibility | undefined): boolean {
  return v === 'profile-tree' || v === 'gallery-profile' || v === 'everywhere'
}

// Appears in the family-tree summary panel (PersonPanel carousel).
export function showsInTreePanel(v: Visibility | undefined): boolean {
  return v === 'profile-tree' || v === 'everywhere'
}

// ── Per-person effective visibility (group photos) ──
// `override` is the photo's peopleVisibility[personId] (undefined = inherit the
// photo's base visibility). Controls THIS person's profile page + tree panel.

// Does the photo show on this person's full profile page?
export function showsOnPersonProfile(base: Visibility | undefined, override: PhotoPersonVisibility | undefined): boolean {
  if (override === 'hidden') return false
  if (override === 'profile' || override === 'profile-tree') return true
  return showsOnProfilePage(base) // inherit
}

// Does the photo show in this person's family-tree summary panel?
export function showsInPersonTree(base: Visibility | undefined, override: PhotoPersonVisibility | undefined): boolean {
  if (override === 'hidden' || override === 'profile') return false
  if (override === 'profile-tree') return true
  return showsInTreePanel(base) // inherit
}
