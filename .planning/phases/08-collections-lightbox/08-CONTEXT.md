# Phase 8: Photo Collections + Lightbox - Context

**Gathered:** 2026-04-30
**Status:** Ready to execute
**Mode:** v2 milestone, second phase
**Source:** CURRY_FAMILY_HUB_BRIEF_v2.md Section 8 (Lightbox spec); Section 1 (focus views)

<domain>
## Phase Boundary

Phase 8 transforms `/photographs` from a flat photo grid into a curator-style collection browser, and introduces the shared `<Lightbox />` component. Three deliverables:

1. **`/photographs` becomes collection grid** — shows collection cover cards (not photos)
2. **`/photographs/[collectionId]` shows the photo grid for that collection**
3. **`<Lightbox />` shared component** — full-screen photo viewer with prev/next/Esc, used from collection detail and (future Phase 10) the person panel carousel

**In scope:**
- `components/gallery/CollectionCard.tsx` — single collection cover card (cover photo + title + subtitle + dateLabel + count)
- `components/gallery/CollectionGrid.tsx` — Server Component, calls `getCollections()`, renders responsive grid of CollectionCards. Empty state if no collections.
- `components/lightbox/Lightbox.tsx` — `'use client'` component, full-screen modal, AnimatePresence, prev/next/close, keyboard (←/→/Esc), backdrop click to close. Receives `photos: Photo[]`, `currentIndex: number`, `onClose: () => void`.
- `components/gallery/CollectionDetail.tsx` (or inline in route page) — shows collection title/subtitle/dateLabel + filtered photo grid; clicking a photo opens Lightbox.
- `components/gallery/CollectionPhotoGrid.tsx` — `'use client'` wrapper around the existing PhotoGrid that owns the lightbox open/close state. Reusing existing PhotoCard for the photo tiles.
- Update `app/(protected)/photographs/page.tsx` — replace flat photo grid with CollectionGrid
- Update `app/(protected)/photographs/[collectionId]/page.tsx` — replace placeholder with CollectionDetail (Phase 7 stubbed it)
- Update `components/gallery/PhotoCard.tsx` — add optional onClick prop so a Client parent (CollectionPhotoGrid) can intercept the click instead of navigating

**Out of scope:**
- Lightbox in person panel carousel (Phase 10 — tree refresh)
- Featured photos on home page (Phase 12)
- Real photos (Phase 13 — placeholder JPEGs are 1×1 currently)
- Search / filter UI inside collections

</domain>

<decisions>
## Implementation Decisions

### Collection Card Visual

- **D-01:** CollectionCard layout (top to bottom):
  - Cover image (4:3 aspect or square — decision: square 1:1 to match the prototype's `.photo` cards)
  - Cover image rendered via `next/image` from `coverPhotoId`'s filename via getPhotos lookup
  - Card overlay: collection title (serif) + dateLabel (eyebrow uppercase) at bottom-left, white text + text-shadow on dark image (matches prototype `.photo` styling)
  - Card hover: subtle 2px lift + shadow-md (matches Phase 5 hover patterns)
- **D-02:** CollectionCard wraps a `<Link href="/photographs/{collectionId}">` (Server Component link, no client state needed)
- **D-03:** CollectionGrid responsive: 1 column mobile / 2 columns tablet / 3 columns desktop (cards are larger than photo cards because they're collection covers — fewer per row, more breathing room)

### Collection Detail Page

- **D-04:** `app/(protected)/photographs/[collectionId]/page.tsx` is a Server Component:
  ```tsx
  const collection = getCollectionById(params.collectionId)
  if (!collection) notFound()
  const photos = getPhotosInCollection(params.collectionId)
  return <CollectionDetail collection={collection} photos={photos} />
  ```
- **D-05:** Page header shows: "FAMILY ARCHIVE · COLLECTION" eyebrow + serif h1 title + italic serif subtitle (if present) + dateLabel + photo count + description.
- **D-06:** Below the header: photo grid (uses existing PhotoCard component). Each PhotoCard click triggers Lightbox open at that photo's index.
- **D-07:** Empty collection: render the header but with "No photographs in this collection yet" message.
- **D-08:** "← Back to all collections" link at top of page (above eyebrow), small text-quiet.

### Lightbox Behavior (per CURRY_FAMILY_HUB_BRIEF_v2.md Section 8)

- **D-09:** Triggered by clicking any photo card (via onClick prop) or future: any image in person panel carousel.
- **D-10:** Full-screen overlay, backdrop color: `rgba(15, 24, 64, 0.95)` (the spec's `#0F1840` at 95% opacity for richer dark)
- **D-11:** Image centered, `max-w-[90vw] max-h-[90vh]` with `object-contain`. Uses `next/image` if dimensions are known, else plain `<img>`.
- **D-12:** Caption + dateLabel below the image:
  - Caption: white sans, ~14px
  - DateLabel: white quiet, ~10px uppercase eyebrow style
- **D-13:** Prev/Next chevron buttons: positioned at left/right edges, gold (`text-gold`), large hit target (44px square). Hidden when at first/last index respectively (or wrap around — pick wrap-around for nicer UX). Decision: wrap around (∞ navigation).
- **D-14:** Close button: top-right, gold ×, 32px hit target.
- **D-15:** Keyboard handlers (registered on mount, removed on unmount):
  - `Escape` → onClose
  - `ArrowLeft` → prev
  - `ArrowRight` → next
- **D-16:** Backdrop click closes (but click on the image itself doesn't propagate — stop propagation on the image container).
- **D-17:** AnimatePresence opacity fade-in/out, ~250ms (per spec). Image itself crossfades when index changes (like a slideshow — `key={currentIndex}` on motion.div).
- **D-18:** Body scroll locked while open (`document.body.style.overflow = 'hidden'` in useEffect, restore on unmount).
- **D-19:** Photos prop: receives the FILTERED photo set (collection's photos, not all photos). Prev/next traverses only this set.

### PhotoCard Refactor (Backward Compatible)

- **D-20:** Add optional `onClick?: (e: React.MouseEvent) => void` prop to PhotoCard.
- **D-21:** When `onClick` is present, PhotoCard renders as a button-with-image (no `<Link>`); when absent, current Link behavior preserved.
- **D-22:** Person link (`/person/{peopleIds[0]}`) is currently auto-wired in PhotoCard. Phase 8 keeps this as default. CollectionPhotoGrid passes onClick prop, overriding the Link behavior — clicks open lightbox instead.

### CollectionPhotoGrid (Client Component)

- **D-23:** Owns lightbox state: `[lightboxOpen, setLightboxOpen] = useState(false)` + `[currentIndex, setCurrentIndex] = useState(0)`.
- **D-24:** Renders the photo grid (responsive columns matching Phase 2's PhotoGrid). Each PhotoCard has `onClick={() => { setCurrentIndex(i); setLightboxOpen(true) }}`.
- **D-25:** Renders `<Lightbox />` conditionally: `{lightboxOpen && <Lightbox photos={photos} currentIndex={currentIndex} onClose={...} />}`.

### PhotoGrid Page Update

- **D-26:** `app/(protected)/photographs/page.tsx` (the top-level photographs landing) — replace its current PhotoGrid call with CollectionGrid. The flat photo browse is gone from this URL.
- **D-27:** Page header on /photographs: "FAMILY ARCHIVE" eyebrow + serif "Photographs" h1 + muted subtitle "Collected memories, organized by theme."

### Verification

- **D-28:** `npm run build` exits 0
- **D-29:** Visit /photographs → see 3 collection cards (christmas-mornings, lake-house-summers, wedding-days)
- **D-30:** Click a collection card → /photographs/{id} renders, shows that collection's photos
- **D-31:** Click a photo → Lightbox opens with that photo, shows caption + date
- **D-32:** Press Right arrow → advances to next photo. Left arrow → previous. Wraps at boundaries.
- **D-33:** Press Esc → Lightbox closes
- **D-34:** Click backdrop → Lightbox closes; click image → does NOT close

### Claude's Discretion

- Exact card padding/border-radius
- Hover state easing
- Color of the close button background on hover
- Whether to show photo index ("3 / 6") in lightbox — minor; default yes (small eyebrow at bottom)

</decisions>

<canonical_refs>
## Canonical References

### v2 Source Documents
- `CURRY_FAMILY_HUB_BRIEF_v2.md` Section 8 (Lightbox spec) — REQUIRED
- `CURRY_FAMILY_HUB_BRIEF_v2.md` Section 1.3 (Photographs section) — describes the collection-grid behavior
- `curry-family-hub-prototype.html` `.photo` and `.photo-grid` styles — visual reference for cards

### Project Documents
- `.planning/phases/07-v2-foundation/07-SUMMARY.md` — what Phase 7 delivered (schemas, content)
- `.planning/phases/07-v2-foundation/07-CONTEXT.md` — D-04..D-11 brand decisions inherited

### Source-of-truth Code Files (will be modified or read)
- `lib/types.ts` — Collection, Photo types
- `lib/content.ts` — getCollections, getCollectionById, getPhotosInCollection
- `app/(protected)/photographs/page.tsx` — replace with CollectionGrid
- `app/(protected)/photographs/[collectionId]/page.tsx` — replace placeholder with CollectionDetail
- `components/gallery/PhotoCard.tsx` — add optional onClick prop
- `components/gallery/PhotoGrid.tsx` — keep as fallback (used by person pages); not removed
- `app/globals.css` — design tokens

### External Documentation
- motion AnimatePresence + keyboard handlers: https://motion.dev/docs/react-animate-presence
- Next.js dynamic routes: https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `getCollectionById`, `getPhotosInCollection` already exist (Phase 7)
- PhotoCard already renders a 4:3 card with date eyebrow and caption — reuse for the photo grid inside collection
- Lightbox-style modal patterns from Phase 4 PersonPanel (AnimatePresence, motion.div) — reapplicable
- motion package already installed
- Tailwind tokens (text-gold, bg-navy, etc.) in @theme

### Established Patterns
- Server Components by default; Client only when interactive (Lightbox is Client)
- AnimatePresence within-page only (no cross-page) — Lightbox stays within the route, doesn't affect navigation
- Two-weight rule preserved
- Sentence case copy + uppercase eyebrows

### Integration Points
- `/photographs` becomes the collection landing
- `/photographs/[collectionId]` is the new feature
- PhotoCard adds optional onClick — backward compatible (no callers break)
- Lightbox is reusable; Phase 10 (tree refresh) will integrate it into PersonPanel carousel

### Pitfalls
- Don't add `onClick` AND keep the `<Link>` simultaneously — Link wraps; if onClick is present, drop the Link
- AnimatePresence requires the parent to render conditionally (not the child); CollectionPhotoGrid needs to wrap Lightbox in AnimatePresence at the parent level so exit animations work
- Body scroll lock on Esc handler must restore on unmount AND on close-via-backdrop — useEffect cleanup
- Keyboard listener cleanup is critical (otherwise Esc closes lightbox even after it's closed, breaking other components)

</code_context>

<specifics>
## Specific Ideas

- The lightbox is the most-reused new component in v2 — gets used again in Phase 10 (panel carousel) and could be used for video lightbox in Phase 9
- "Collection" is a saved query, not a folder — emphasize this in code comments
- Photos with no collection (orphans like 1989-sunday-dinner-01) — they DON'T appear in any collection grid. They surface only via person pages. That's correct.

</specifics>

<deferred>
## Deferred Ideas

- **Lightbox integration with PersonPanel carousel** — Phase 10
- **VideoLightbox** — Phase 9 (parallel pattern)
- **Search inside a collection** — out of scope
- **"Add to collection" UI for content authors** — out of scope (admin = v3)
- **Photo zoom inside lightbox** — out of scope (basic full-screen view is enough for v2)

</deferred>

---

*Phase: 8-Photo-Collections-Lightbox*
*Context gathered: 2026-04-30*
