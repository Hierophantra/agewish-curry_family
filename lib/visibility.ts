// lib/visibility.ts
// Pure surface predicates for the media visibility model (v3.6). NO
// 'server-only' import, so the server loaders (lib/content.ts) and client
// components (FamilyTreeCanvas) share one source of truth. Legacy 'profile' is
// normalized to 'profile-tree' at parse time (see VisibilitySchema), so these
// only ever see the current enum values.
import type { Visibility } from '@/lib/types'

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
