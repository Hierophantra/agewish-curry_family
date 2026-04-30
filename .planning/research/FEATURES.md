# Feature Landscape

**Domain:** Private single-family archive site (read-only, password-gated)
**Researched:** 2026-04-29
**Context:** Not a public genealogy platform. Single shared password. Four content pillars: home page, family tree, photo gallery, video gallery. Content in JSON files, no CMS.

---

## Table Stakes

Features users expect in any family archive. Missing = product feels broken or frustrating.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Password gate (site-wide) | Content is private; family expects locked access before seeing anything | Low | NextAuth v5 Credentials provider + middleware matcher. Single password checked in `authorize()`. JWT sessions — no DB needed. |
| Curated home / landing page | First impression; orients visitors to what the site is and what's inside | Low | Hero, brief intro, section previews. AgeWish brand (navy/gold/ivory, star motif x3). |
| Interactive family tree | Core reason to visit; users expect to see relationships visualised, not just a list | High | `relatives-tree` handles layout math. Clickable nodes open a side panel. Must handle at minimum 3 generations gracefully. |
| Person detail / side panel | Clicking a tree node with no result is a dead end — users expect profile info | Medium | Name, dates, photo, short bio. Loaded from JSON. Reusable across tree and potentially gallery. |
| Photo gallery | Families expect to browse historical photos by browsing, not searching | Medium | Grid layout. Lightbox on click. Caption + year displayed. Scanned images served as Next.js `<Image>`. |
| Photo metadata (caption, year, people) | Without context, old photos are meaningless | Low | Fields: `title`, `year`, `caption`, `people[]`. Stored in JSON alongside image path. |
| Video gallery | Home videos are a primary family memory artifact | Medium | Cards with thumbnail, title, year. YouTube embed initially. VideoPlayer component switches on `source` field. |
| Responsive design (desktop + mobile) | Family members browse on phones — a desktop-only layout fails half the audience | Medium | Tailwind responsive utilities. Tree layout needs special care on narrow screens (may need scroll/zoom). |
| Consistent visual identity | Looks like a purposeful product, not a side project | Low | AgeWish brand system already defined. Two font weights, sentence case, star motif x3/page. |

---

## Differentiators

Features that go beyond the minimum and make this archive feel special and durable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Video platform abstraction (YouTube → Vimeo) | Prevents a platform migration from touching component code; future-proof | Low | `source: "youtube" \| "vimeo"` field in video JSON. `VideoPlayer` switches on it. Zero-cost now, high payoff later. |
| Person pages linked from tree AND gallery | Bidirectional navigation — see a face in a photo, navigate to their story | Medium | Person slug used as shared ID. Photo `people[]` array references same slugs. Requires slug-based routing. |
| Content fully separated from code | Non-developer family members can eventually edit JSON files; no accidental layout breakage | Low | All data in `/content/*.json`. Typed loaders in `/lib/content.ts`. This is the architecture, not just a feature. |
| Grandfather as tree root / clear entry point | Grounding the tree in a known anchor (William Curry) makes navigation intuitive for the family | Low | Set root node in tree config. Descendant view from root is the default rendering mode. |
| Curated section previews on home | Surfaces the richness of the archive immediately; draws people deeper | Low | Home page shows 3–4 featured photos, 1–2 featured videos, a tree teaser. All sourced from content JSON. |
| Graceful empty states | Content is added incrementally — gaps should look intentional, not broken | Low | "More coming soon" placeholder cards. Especially important for Session 1–2 where most content is absent. |

---

## Anti-Features

Features to deliberately NOT build in this project.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Admin upload UI | Adds auth complexity, file storage decisions, and validation logic. Premature for a personal project. | Developer adds content by editing JSON files and committing. Ship admin UI only if family demand warrants it. |
| User accounts / per-user auth | Family is small; individual accounts add friction (forgot-password flows, account management). Single shared password is the right fit here. | Share the password via family group chat. Rotate if needed by changing one env var. |
| Comments or social reactions | Not appropriate for a family archive. Adds moderation burden. Introduces potential for conflict or inappropriate content. | Read-only is a feature, not a limitation. The archive is a museum, not a forum. |
| Search and filters (v1) | Adds indexing logic, UI complexity, and a non-trivial UX surface. Premature until content volume justifies it. | Defer to Session 6 per project plan. Gallery grid and tree are the navigation primitives. |
| Real-time collaboration / editing | This is an archive, not a wiki. Collaborative editing requires conflict resolution, versioning, user identity. | One maintainer, one truth. JSON files in git are the versioning layer. |
| Mobile native app | Web-responsive is sufficient for family browsing. Native app doubles maintenance. | Invest in a polished responsive web experience instead. |
| DNA / genealogy database integration | This is a curated family archive, not a research platform. Ancestry/MyHeritage integrations are public-facing genealogy tools. | Stay focused on the Curry family's own content. No third-party genealogy data. |
| Notifications / email digests | Adds email infrastructure (SMTP, templates, unsubscribe flows) far beyond scope. | Share updates in the family group chat when new content is added. |
| Public-facing pages / SEO | Content is private. SEO would make private family content discoverable. | `robots.txt` disallow all. No open-graph meta on gated pages. |
| GEDCOM import/export | Standard genealogy exchange format — useful for public platforms, unnecessary here. The JSON schema IS the format. | Keep data in project-native JSON. No need for genealogy software interop. |

---

## Feature Dependencies

```
Password gate
  └── All content routes (tree, gallery, photos, person pages)
      └── Person profiles (JSON slug-based routing)
          ├── Family tree nodes (node click → person panel / page)
          └── Photo metadata (people[] array → person links)

Family tree (relatives-tree layout)
  └── Person side panel / detail view
      └── Person JSON data (name, dates, photo, bio)

Photo gallery (grid + lightbox)
  └── Photo JSON metadata (title, year, caption, people[])
      └── Person link resolution (people[] slugs → person pages)

Video gallery (card grid + embed)
  └── Video JSON metadata (title, year, source, videoId)
      └── VideoPlayer component (source field → YouTube or Vimeo embed)

Home page (curated previews)
  └── Featured photo refs → Photo gallery entries
  └── Featured video refs → Video gallery entries
  └── Tree teaser → Family tree
```

---

## MVP Recommendation

Build in this order, matching the 6-session plan:

**Session 1 — Scaffold + Auth**
- Password gate (NextAuth Credentials, middleware, single env-var password)
- Route structure, layout shell, brand system tokens

**Session 2 — Home Page**
- Curated hero + section preview cards
- Graceful empty states (content not yet populated)

**Session 3 — Family Tree**
- Interactive tree with relatives-tree
- Clickable nodes → person side panel
- Person JSON data loader

**Session 4 — Photo + Video Galleries**
- Photo grid + lightbox + metadata display
- Video card grid + VideoPlayer with source abstraction

**Session 5 — Polish**
- Person pages (slug-routed, linked from tree + gallery)
- Bidirectional navigation (photo people[] → person page)
- Typography webfont pass, animation, responsive fine-tuning

**Session 6 — Search + Filters (if warranted)**
- Defer until sessions 1–5 are shipped and content volume is known

**Defer indefinitely:**
- Admin upload UI — only if family asks and content volume grows large
- Search — only after content volume makes browsing painful

---

## Sources

- [MyFamilyArchive feature set](https://myfamilyarchive.com/)
- [Top Platforms for Family History Preservation — Confinity](https://www.confinity.com/culture/best-online-platforms-for-family-history-preservation)
- [relatives-tree npm package](https://www.npmjs.com/package/relatives-tree)
- [relatives-tree GitHub — SanichKotikov](https://github.com/SanichKotikov/relatives-tree)
- [IPTC Metadata for Family Photo Archives — OrganizingPhotos](https://organizingphotos.net/metadata-for-genealogy-iptc-metadata-fields/)
- [Photo Metadata for Preservation — Permanent.org](https://www.permanent.org/blog/enhancing-family-photos-with-metadata/)
- [NextAuth Credentials provider — Auth.js](https://authjs.dev/getting-started/providers/credentials)
- [Embed YouTube Videos on Genealogy Sites — Family History Fanatics](https://familyhistoryfanatics.com/post/embed-youtube-videos)
