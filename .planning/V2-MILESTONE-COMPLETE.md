# v2 Milestone Complete

**Date:** 2026-04-29
**Milestone:** v2 — Collections, Playlists, Lightbox, Brand
**Phases completed:** 7 through 13 (7 phases)
**Total phases in project:** 13 (Phases 1-6: v1, Phases 7-13: v2)
**Repository:** github.com/Hierophantra/agewish-curry_family
**Build:** `npm run build` exits 0 — 22 static pages

---

## What v2 shipped

### Architectural changes

| Change | Description |
| ------ | ----------- |
| Collections as tags | Photos declare `collectionIds[]`. A photo can belong to many collections simultaneously. `/photographs/[collectionId]` shows all matching photos. |
| Playlists as tags | Videos declare `playlistIds[]`. A video can belong to many playlists. `/videos/[playlistId]` shows all matching videos. |
| `films` → `videos` rename | All routes, labels, and hrefs updated. |
| Real brand mark | `<StarMark>` replaced inline SVG with `next/image` pointing to `/images/aw-symbol-2x.png` (navy circle ring + gold 8-pointed star). |
| Prototype-fidelity panel | TopNav: PNG at 36px + "AgeWish · Private archive" eyebrow + "The Curry Family" serif. Hero: "A gathering of generations" h1 + italic subtitle. Footer: "Held in trust for those who come after." tagline. |
| Shared Lightbox | `<Lightbox>` for photos: full-screen overlay, prev/next wrap-around (modulo), Esc to close, photo index counter. |
| Video Lightbox | `<VideoLightbox>` for videos: same shell, embeds `<VideoPlayer>` (YouTube/Vimeo). |
| Richer Person schema | `eyebrow`, `datesLabel`, `spouseLabel`, `birthDate`, `deathDate`, `birthplace`, `childrenIds`, `relationLabel` — all rendered on person pages and tree panels. |
| Home curated previews | Home page shows: tree preview (one generation), recent 6 photos, up to 2 featured videos. Each section links to its focus view. |
| Person pages v2 | Consume all new schema fields; photo grid via `<CollectionPhotoGrid>` (with Lightbox); video section via `<PlaylistVideoGrid>` (with VideoLightbox); linked parents and children. |
| Tree panel refresh | Prototype-exact panel: 4:5 aspect photo carousel with 1.2s CSS crossfade, key-value metadata rows, gold-deep eyebrow, italic datesLabel. |

### Phase-by-phase summary

| Phase | Title | Key deliverable |
| ----- | ----- | --------------- |
| 07 | v2 Foundation Migration | Schema migration; brand PNG; hero/footer copy; films→videos rename; 8-person Curry prototype data |
| 08 | Photo Collections + Lightbox | `/photographs` becomes collection grid; `<Lightbox>` component; `CollectionPhotoGrid` client wrapper |
| 09 | Video Playlists + Featured | `/videos` playlist grid; `<VideoLightbox>`; `PlaylistVideoGrid`; `getFeaturedVideos()` |
| 10 | Tree Refresh | Prototype-fidelity PersonPanel; 4:5 carousel; gold-deep eyebrow; v2 relation labels |
| 11 | Person Pages Refresh | v2 schema fields rendered; photo + video sections with lightboxes; linked relatives |
| 12 | Home Polish + Curated Previews | Tree/photos/videos preview sections; ivory alternation; server component preserved |
| 13 | Final v2 Polish + Real Content Prep | Edge case audit; star motif audit; CONTENT_AUTHORING.md; README v2 status |

### Content types and their routes

| Content type | Data source | Browse route | Detail route |
| ------------ | ----------- | ------------ | ------------ |
| People | `content/family.json` | `/tree` | `/person/[id]` |
| Photos | `content/photos.json` | `/photographs` | (lightbox inline) |
| Collections | `content/collections.json` | `/photographs` | `/photographs/[collectionId]` |
| Videos | `content/videos.json` | `/videos` | (lightbox inline) |
| Playlists | `content/playlists.json` | `/videos` | `/videos/[playlistId]` |

### File counts (approximate)

- TypeScript/TSX source files: ~35
- JSON content files: 5 (`family.json`, `photos.json`, `videos.json`, `collections.json`, `playlists.json`)
- Static assets: 7 (6 photo placeholders + 1 brand PNG)
- Planning documents: ~30 (PLAN.md + SUMMARY.md per phase, plus STATE.md, ROADMAP.md, REQUIREMENTS.md, etc.)
- Total git commits: 116

### v1 foundation (Phases 1-6) carried forward

All v1 work remains intact and was extended in v2:
- Auth gate (Auth.js v5, edge-safe two-file split, bcryptjs)
- Design system (Tailwind v4, navy/gold/ivory palette, Inter + Cormorant Garamond, star motif rule)
- Content loader (`lib/content.ts` with Zod validation + bidirectional reference validator)
- Family tree (relatives-tree, multi-spouse mitigation via `flattenMultiSpouses`)

---

## Next steps for the user

The codebase is ready for real content. See **[CONTENT_AUTHORING.md](../CONTENT_AUTHORING.md)** for complete instructions.

### Priority order

1. **Replace placeholder photos** — 6 files in `public/photos/`. Rename your real photos to match the filenames in `content/photos.json`, or update `photos.json` to use your filenames.
2. **Update family data** — Edit `content/family.json` with real people, dates, birthplaces, and bios.
3. **Add real videos** — Upload family videos to YouTube (unlisted) or Vimeo, then add the video IDs to `content/videos.json`.
4. **Adjust collections and playlists** — Edit `content/collections.json` and `content/playlists.json` to match your actual content themes.
5. **Deploy** — Push to GitHub → Vercel auto-deploys → verify at preview URL → configure `curry.agewish.com` DNS.

---

## Deferred for post-v2

These items were logged as deferred during execution and are intentionally out of scope for v2:

| Item | Notes |
| ---- | ----- |
| Cormorant Garamond/EB Garamond webfont via `next/font` | Georgia fallback is acceptable; font swap is a 1-file change |
| Search across photos, videos, people | Not needed for MVP |
| Admin upload UI | Not needed — JSON editing + git push is the workflow |

---

*v2 milestone closed 2026-04-29 by GSD executor.*
