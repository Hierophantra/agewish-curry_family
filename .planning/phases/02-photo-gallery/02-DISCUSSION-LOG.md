# Phase 2 Discussion Log

**Date:** 2026-04-29
**Mode:** --auto (recommended defaults selected without interactive prompts)

## Auto-Selected Decisions

Phase 2 has minimal gray area — most architectural choices are inherited from Phase 1. The remaining decisions (grid layout, card anatomy, empty state) were resolved with idiomatic Next.js + Tailwind patterns matching the AgeWish design system.

| Decision Area | Auto-Selected | Rationale |
|---------------|--------------|-----------|
| PhotoGrid component type | Server Component | No interactivity needed; matches Phase 1 pattern |
| PhotoCard component type | Server Component | Static content; Phase 5 can add hover client-island if desired |
| Image rendering | next/image | App Router idiomatic, automatic optimization |
| Aspect ratio | 4:3 landscape | Most family photos are landscape; consistent ratio = visual rhythm |
| Grid columns | 1/2/3/4 responsive | Matches typical photo gallery breakpoints |
| Sort order | Chronological (oldest first) | Family archives feel natural historically |
| Empty state | Inline copy, no illustration | Archival aesthetic; copy-only is restrained |
| Person link | Wrap card if peopleIds[0] exists | Graceful even before Phase 6 person pages |
| Stub images | Small placeholder JPGs | Exercises real image-loading path |

## Deferred Ideas

- Lightbox → Phase 5
- Hover effects → Phase 5
- Filters/search → Phase 6
- Pagination → defer until volume warrants

## Notes

The biggest "gotcha" surfaced in Phase 1 (dotenv-expand mangling bcrypt) doesn't apply here — Phase 2 has no env-var work. The other gotcha (dead `app/page.tsx` shadowing) is generalized as a context_context pitfall: never create routes outside the `(protected)` group.
