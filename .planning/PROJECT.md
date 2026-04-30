# Curry Family Hub

## What This Is

A private, password-gated family archive site for the Curry family, hosted under the AgeWish umbrella at curry.agewish.com. It contains four content types — a curated home page, an interactive family tree, a photo gallery, and a film/video gallery — all behind a single shared password. Built on the same Vercel/Next.js/GitHub pipeline as AgeWish client work so the developer maintains one stack.

## Core Value

Family members can securely access and explore their shared family history — photos, films, and an interactive family tree — through a private, beautifully designed archive.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Password-gated access with single shared password
- [ ] Curated home page with brand, hero, and section previews
- [ ] Interactive family tree with clickable nodes and side panel detail view
- [ ] Photo gallery with scanned historical family photos and metadata
- [ ] Film/video gallery with YouTube embeds (abstracting source for future Vimeo migration)
- [ ] Person detail pages linked from tree nodes
- [ ] Content separated from code — all data in JSON files under /content/
- [ ] AgeWish brand design system — navy/gold/ivory palette, serif/sans typography, star motif
- [ ] Responsive design for desktop and mobile

### Out of Scope

- Admin upload UI — future consideration, not v1
- Real-time collaboration — this is a read-only archive
- User accounts / multi-user auth — single shared password only
- Search and filters — deferred to Session 6
- Comments or social features — not appropriate for a family archive
- Mobile native app — web only

## Context

- This is a personal project for the developer's family, not a client deliverable
- Built under the AgeWish umbrella brand — shares visual identity (navy, gold, star motif)
- The developer maintains other AgeWish projects (e.g., John Miller piece) on the same stack
- Content will be populated incrementally — real family photos, scanned documents, and unlisted YouTube videos
- The family tree starts with the grandfather (William Curry) and descends through generations
- Videos are currently on unlisted YouTube but will migrate to Vimeo Pro later — the data schema must support this swap
- Design has been mocked up and approved — visual reference characteristics are defined in the brief

## Constraints

- **Tech stack**: Next.js 14 App Router, TypeScript strict, Tailwind CSS, NextAuth v5, relatives-tree, Framer Motion, Vercel — all non-negotiable
- **Content architecture**: All family data in JSON files under /content/, typed loaders in /lib/content.ts — no hardcoded data in JSX
- **Typography**: Two weights only (400, 500). Sentence case everywhere. Serif for headings, Inter for body
- **Star motif**: Exactly 3 appearances per page — nav, hero, footer
- **Video abstraction**: source field ("youtube" | "vimeo") in video data — VideoPlayer switches on this, enabling platform migration without touching components
- **Build order**: 6 sessions, each building on the previous. Session 1 is scaffold + auth gate only

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| NextAuth Credentials provider with single shared password | Simple auth for family-only access, no user management needed | — Pending |
| JSON files for content instead of CMS/database | Content is small, static, and managed by one person. Keeps deploy simple | — Pending |
| relatives-tree library for family tree layout | Handles complex tree layout math; avoid reinventing graph layout | — Pending |
| YouTube embeds with Vimeo-ready abstraction | Videos already on YouTube; Vimeo migration planned. Abstract source field | — Pending |
| System serif fallback initially, webfont later | Ship fast, refine typography in polish pass (Session 5) | — Pending |
| 6-session build order | Incremental delivery — scaffold first, features second, polish last | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-29 after initialization*
