# Phase 3: Video Gallery - Context

**Gathered:** 2026-04-29
**Status:** Ready for planning
**Mode:** --auto

<domain>
## Phase Boundary

Phase 3 delivers `/films` — a server-rendered grid of family videos. The VideoPlayer component switches on the `source` field (`"youtube" | "vimeo"`) so adding Vimeo support in the future is a one-field JSON edit. YouTube videos use the `@next/third-parties` facade pattern: the iframe is deferred until the user clicks play, avoiding the YouTube network/cookie cost on every page load.

**In scope:**
- `components/video/VideoGrid.tsx` (Server Component)
- `components/video/VideoCard.tsx` (Server Component)
- `components/video/VideoPlayer.tsx` — source switch (`youtube` vs `vimeo`)
- `components/video/YouTubePlayer.tsx` — uses `@next/third-parties/google` `YouTubeEmbed`
- `components/video/VimeoPlayer.tsx` — Vimeo iframe (basic, no facade — Vimeo Pro doesn't have the same cost as public YouTube embeds)
- `app/(protected)/films/page.tsx` — replace placeholder with VideoGrid
- Empty state inline in VideoGrid
- Stub `videos.json` already has 1 entry; add 1 more for grid testing

**Out of scope:**
- Real Curry family video content — populated by developer, not a phase deliverable
- Vimeo OAuth, private video access tokens — current scope is unlisted/public videos
- Custom video player chrome — use platform default
- Lightbox / fullscreen modal — Phase 5
- Filters, search — Phase 6
- Person link wrapping (videos can also have peopleIds, but defer the link to keep VideoCard simpler — add in Phase 6 alongside person pages)

</domain>

<decisions>
## Implementation Decisions

### Source Abstraction (the load-bearing decision for this phase)

- **D-01:** `<VideoPlayer />` is the abstraction boundary. It receives `video: Video` and switches on `video.source`:
  ```tsx
  if (video.source === 'youtube') return <YouTubePlayer videoId={video.sourceId} title={video.title} />
  if (video.source === 'vimeo') return <VimeoPlayer videoId={video.sourceId} title={video.title} />
  ```
  Adding Vimeo Pro migration later = swap the `source` field in JSON, no component changes.
- **D-02:** YouTubePlayer wraps `@next/third-parties/google`'s `YouTubeEmbed` — it's the official Next.js facade pattern. iframe loads on click; the page only ships a thumbnail + play button initially.
- **D-03:** VimeoPlayer renders a plain iframe with `src="https://player.vimeo.com/video/{id}"` and proper `loading="lazy"`. Vimeo doesn't have the same third-party-cookie performance cost as YouTube, so no facade needed.
- **D-04:** `@next/third-parties` package is added to dependencies (compatible with Next.js 14.2.x).

### Components

- **D-05:** VideoGrid is a Server Component. Reads videos via `getVideos()` from `lib/content.ts`. Sorts chronologically (oldest first; missing dates last) — same pattern as PhotoGrid.
- **D-06:** VideoCard is a Server Component. Shows: VideoPlayer (16:9 aspect), date eyebrow, title (serif), optional description (muted, smaller). The player itself is the visual focal point — no separate thumbnail needed (the YouTubeEmbed facade handles thumbnail rendering).
- **D-07:** VideoPlayer, YouTubePlayer, VimeoPlayer are all Server Components — none need `'use client'`. The interactivity (click-to-play) lives inside the YouTubeEmbed facade itself, not in our wrapper.

### Grid Layout

- **D-08:** Responsive grid columns:
  - mobile: 1 column
  - sm (≥640px): 2 columns
  - lg (≥1024px): 2 columns (videos are wider than photos — fewer per row keeps them readable)
  - xl (≥1280px): 3 columns
  Implemented as `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3`
- **D-09:** Grid gap: `gap-7` matching photo gallery
- **D-10:** Section padding matches photo gallery: `py-11 px-7 md:px-11 lg:px-15`

### VideoCard Anatomy

- **D-11:** Card structure (top to bottom):
  1. VideoPlayer (16:9 aspect ratio container)
  2. Date eyebrow (e.g., "APRIL 2000") — uppercase, text-quiet, .eyebrow utility
  3. Title (serif, text-navy, larger than caption)
  4. Optional description (text-muted, text-sm) — only render if `video.description` is non-empty
- **D-12:** Aspect ratio: 16:9 (`aspect-video` Tailwind utility) — standard video ratio.
- **D-13:** Card background: white. No border, no shadow. Spacing only.

### Sorting

- **D-14:** Videos render chronologically (oldest first) by `video.dateTaken`. Empty/undefined sort to the end. Matches PhotoGrid pattern.

### Empty State

- **D-15:** Empty state inline in VideoGrid when `videos.length === 0`:
  - Eyebrow: "FAMILY ARCHIVE"
  - Heading (serif, text-navy): "No films yet"
  - Muted body: "Family films will appear here as they are added to the archive."

### Page Header

- **D-16:** `app/(protected)/films/page.tsx` renders eyebrow "FAMILY ARCHIVE" + serif "Films" h1 + muted subtitle, then `<VideoGrid />`. Same structure as `/photographs`.
- **D-17:** Subtitle (placeholder): "Home movies and recordings, preserved across the decades." — refine in implementation if better wording emerges.

### Stub Data

- **D-18:** `videos.json` currently has 1 video (Rick Roll YouTube placeholder). Phase 3 adds 1 more — a different YouTube placeholder so grid empty/single/multiple states are all testable just by editing the JSON. Use `dQw4w9WgXcQ` and another well-known unlisted-friendly placeholder (e.g., `jNQXAC9IVRw` — "Me at the zoo", first YouTube video, public domain in spirit).

### Verification

- **D-19:** Acceptance: `npm run build` passes; visiting `/films` shows the grid; clicking a video plays it without page-load YouTube requests; emptying `videos.json` shows the empty state cleanly.
- **D-20:** YouTube facade verification: in Network tab, on `/films` page load there should be NO requests to `youtube.com` or `youtu.be` until the user clicks play. (Manual check during local verify.)

### Claude's Discretion

- Exact subtitle copy for the page header
- Whether to add a small "Watch on YouTube ↗" affordance below the player (probably no — keep clean for v1)
- Vimeo iframe `allow` attributes — minimum needed: `autoplay; fullscreen; picture-in-picture`

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Documents
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md` — VIDEO-01..05 are scope
- `.planning/ROADMAP.md` — Phase 3 goal and 4 success criteria

### Phase 1 Outputs
- `.planning/phases/01-scaffold-auth-design/01-CONTEXT.md` — design system tokens, folder structure
- `.planning/research/PITFALLS.md` — Pitfall 10: YouTube embed performance (read before YouTubePlayer)

### Phase 2 Outputs (the immediate predecessor — same patterns apply)
- `.planning/phases/02-photo-gallery/02-CONTEXT.md` — grid layout pattern, empty state pattern
- `.planning/phases/02-photo-gallery/02-01-SUMMARY.md` — actual implementation reference for grid + card

### Source-of-truth Code Files
- `lib/content.ts` — `getVideos()` is the sole content access point
- `lib/types.ts` — `Video` type (fields: id, title, description, source, sourceId, dateTaken, peopleIds)
- `content/videos.json` — current stub data (1 entry; add 1 more in Phase 3)
- `app/(protected)/films/page.tsx` — placeholder to replace
- `app/(protected)/photographs/page.tsx` — reference for the page composition pattern
- `components/gallery/PhotoGrid.tsx` — reference for grid + sort + empty-state pattern
- `components/gallery/PhotoCard.tsx` — reference for card composition with `.eyebrow` utility
- `app/globals.css` — design tokens

### External Documentation
- `@next/third-parties` YouTubeEmbed: https://nextjs.org/docs/app/guides/third-party-libraries#youtube-embed
- Vimeo player iframe: https://developer.vimeo.com/player/sdk/embed
- next/third-parties package: https://www.npmjs.com/package/@next/third-parties

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `getVideos()` in `lib/content.ts` — already returns validated `Video[]`
- `Video` type — fields: id, title, description, source ("youtube" | "vimeo"), sourceId, dateTaken, peopleIds
- `.eyebrow` utility — apply for date eyebrows
- `PhotoGrid.tsx` and `PhotoCard.tsx` — established pattern to mirror

### Established Patterns (from Phase 1 and 2)
- Server Components by default
- All content via `lib/content.ts`
- Tailwind tokens; no string interpolation
- Sentence case; eyebrows uppercase only
- Chronological sort with empty dates last
- Inline empty state in the grid component

### Integration Points
- `app/(protected)/films/page.tsx` — replace placeholder with `<VideoGrid />`
- `(protected)/layout.tsx` — already wraps every page; no changes needed

### Pitfalls (from Phase 1 and 2 lessons)
- Do NOT create `app/films/page.tsx` outside `(protected)` — only edit the existing one inside the route group
- Verify field names against `lib/types.ts` (Phase 2 caught dateLabel→dateTaken; Video type uses dateTaken too)
- `@next/third-parties` requires Next.js 13.4.7+ — Next.js 14.2.35 is fine; verify the install pulls a compatible version

</code_context>

<specifics>
## Specific Ideas

- The video abstraction is a deliberate hedge against YouTube migration — keep `<VideoPlayer>` minimal and correct
- Vimeo Pro migration is a real future plan from the brief; the data already supports it
- YouTube facade matters because the brief notes the family will browse on phones — third-party cookies/scripts on every page load would be unacceptable

</specifics>

<deferred>
## Deferred Ideas

- **Person link wrapping on VideoCard** — Phase 6 (alongside /person/[id] page)
- **Lightbox / fullscreen modal** — Phase 5
- **Filters by year/person** — Phase 6 if scoped in
- **Vimeo OAuth for private videos** — only relevant if migration to Vimeo Pro happens
- **Custom video player chrome** — likely never; platform defaults are fine

</deferred>

---

*Phase: 3-Video Gallery*
*Context gathered: 2026-04-29*
