# Architecture Patterns

**Domain:** Private family archive site (Next.js 14 App Router)
**Researched:** 2026-04-29
**Confidence:** HIGH — patterns verified against official Next.js docs, Auth.js v5 docs, and relatives-tree source

---

## Recommended Architecture

### Directory Structure

```
app/
  (auth)/
    login/
      page.tsx               # Login form — only public page
    layout.tsx               # Minimal layout (no nav, no star motif)
  (protected)/
    layout.tsx               # Auth-checked layout: nav, star motif, footer
    page.tsx                 # Home — hero + section previews
    tree/
      page.tsx               # Family tree canvas page
      [id]/
        page.tsx             # Person detail page
    photos/
      page.tsx               # Photo gallery grid
      [id]/
        page.tsx             # Single photo lightbox / detail
    films/
      page.tsx               # Film/video gallery grid
      [id]/
        page.tsx             # Single film embed page
  api/
    auth/
      [...nextauth]/
        route.ts             # NextAuth v5 handler

auth.config.ts               # Edge-safe config: provider logic, authorized callback
auth.ts                      # Full auth: exports { auth, handlers, signIn, signOut }
middleware.ts                # Edge: imports auth from auth.config.ts only

content/
  people.json                # Family members — id, name, birth, death, bio, photos
  photos.json                # Photo metadata — id, src, caption, date, subjects[]
  films.json                 # Film metadata — id, title, src, source, description
  tree.json                  # Tree nodes — id, gender, spouses, parents, children

lib/
  content.ts                 # Typed loader functions (getPersonById, getAllPhotos, etc.)
  tree.ts                    # calcTree wrapper — calls relatives-tree, returns layout

components/
  ui/                        # Headless/shared primitives (no 'use client' unless forced)
  layout/
    Nav.tsx                  # Server component — star motif #1
    Footer.tsx               # Server component — star motif #3
  home/
    Hero.tsx                 # 'use client' for Framer Motion entrance animation
    SectionPreview.tsx       # Server or client depending on animation needs
  tree/
    FamilyTreeCanvas.tsx     # 'use client' — uses relatives-tree + DOM canvas
    PersonPanel.tsx          # 'use client' — slide-in side panel, Framer Motion
  gallery/
    PhotoGrid.tsx            # Server component — renders grid of <Image> tags
    PhotoCard.tsx            # 'use client' only if hover animation needed
    VideoPlayer.tsx          # 'use client' — switches on source field ("youtube"|"vimeo")
    FilmCard.tsx             # Minimal client wrapper if interaction needed
```

---

## Component Boundaries

| Component | Server/Client | Responsibility | Communicates With |
|-----------|--------------|----------------|-------------------|
| `middleware.ts` | Edge | Redirect unauthenticated requests to /login | auth.config.ts |
| `(auth)/login/page.tsx` | Server shell + Client form | Render credentials form, call signIn() | auth.ts (server action) |
| `(protected)/layout.tsx` | Server | Wrap all protected pages, verify session, render nav+footer | auth.ts (auth() call) |
| `Nav.tsx` | Server | Site navigation, star motif #1 | None |
| `Footer.tsx` | Server | Star motif #3, minimal content | None |
| `lib/content.ts` | Server only | Load and type JSON files from /content/ | JSON files on disk |
| `lib/tree.ts` | Server only | Prepare calcTree input from people.json | relatives-tree (calc only) |
| `(protected)/tree/page.tsx` | Server | Load tree data, pass to canvas | lib/tree.ts, lib/content.ts |
| `FamilyTreeCanvas.tsx` | Client ('use client') | Render tree nodes + connectors, handle node click | relatives-tree layout output |
| `PersonPanel.tsx` | Client ('use client') | Slide-in panel on node click, Framer Motion | FamilyTreeCanvas (state) |
| `(protected)/photos/page.tsx` | Server | Load all photo metadata, render PhotoGrid | lib/content.ts |
| `PhotoGrid.tsx` | Server | Render masonry/grid of Next.js Image components | PhotoCard |
| `VideoPlayer.tsx` | Client ('use client') | Switch on source field, embed YouTube/Vimeo iframe | films.json via props |
| `(protected)/films/page.tsx` | Server | Load film metadata, render FilmCard list | lib/content.ts |

---

## Data Flow

### Authentication Flow

```
Browser request to /photos
  → middleware.ts (edge) reads JWT cookie
      → no session: redirect to /login
      → session valid: request continues
          → (protected)/layout.tsx calls auth() server-side
              → double-checks session (defense in depth)
                  → renders page with session context available
```

### Content Loading Flow

```
Server Component page (e.g., /photos)
  → import { getAllPhotos } from '@/lib/content'
      → lib/content.ts reads /content/photos.json with fs.readFileSync
          → returns typed Photo[] array
              → passed as props to PhotoGrid (server) or FamilyTreeCanvas (client)
```

The key invariant: **no data fetching in client components**. All JSON reads happen in server components or lib functions called from server components. Client components receive typed data as props.

### Family Tree Data Flow

```
/content/people.json (raw family data)
  → lib/content.ts: getPeople() returns Person[]
  → lib/tree.ts: buildTreeNodes(persons) maps to relatives-tree input format
  → relatives-tree calcTree({ nodes, rootId: 'william-curry' })
      → returns { nodes: LayoutNode[], connectors: Connector[] }
          → passed as props to FamilyTreeCanvas ('use client')
              → FamilyTreeCanvas renders DOM canvas / SVG
              → user clicks node → setSelectedPersonId(id)
                  → PersonPanel slides in with person data (also passed as prop)
```

### Video Abstraction Flow

```
/content/films.json: [{ id, title, source: "youtube", videoId: "abc123" }]
  → lib/content.ts: getAllFilms() returns Film[]
  → (protected)/films/page.tsx passes Film[] to FilmCard components
  → FilmCard passes film to VideoPlayer ('use client')
  → VideoPlayer switches on film.source:
      "youtube" → <iframe src="https://youtube.com/embed/{videoId}" />
      "vimeo"   → <iframe src="https://player.vimeo.com/video/{videoId}" />
```

When migrating from YouTube to Vimeo: update `source` field in films.json only. No component changes.

---

## Auth Architecture — Two-File Split

This is the critical structural constraint imposed by NextAuth v5 + edge middleware.

**auth.config.ts** (edge-safe — no Node.js APIs, no database adapter):
```typescript
import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

export default {
  providers: [
    Credentials({
      credentials: { password: { label: 'Password', type: 'password' } },
      authorize(credentials) {
        if (credentials.password === process.env.FAMILY_PASSWORD) {
          return { id: 'family', name: 'Family Member' }
        }
        return null
      },
    }),
  ],
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user  // true = allow, false = redirect to /login
    },
  },
} satisfies NextAuthConfig
```

**auth.ts** (full config, Node.js runtime only):
```typescript
import NextAuth from 'next-auth'
import authConfig from './auth.config'

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
})
```

**middleware.ts** (imports from auth.config only — never auth.ts):
```typescript
import NextAuth from 'next-auth'
import authConfig from './auth.config'

const { auth } = NextAuth(authConfig)
export default auth

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

This split is mandatory: importing `auth.ts` in middleware would pull in bcrypt or other Node.js-incompatible modules into the edge runtime and cause a build failure.

---

## Patterns to Follow

### Pattern 1: Server Shell + Client Island

Wrap interactive Client Components as islands inside Server Component pages. The page fetches data on the server; the island receives it as props.

```typescript
// app/(protected)/tree/page.tsx — Server Component
import { getPeople } from '@/lib/content'
import { buildTreeNodes } from '@/lib/tree'
import FamilyTreeCanvas from '@/components/tree/FamilyTreeCanvas'

export default async function TreePage() {
  const people = await getPeople()
  const { nodes, connectors } = buildTreeNodes(people, 'william-curry')
  return <FamilyTreeCanvas nodes={nodes} connectors={connectors} people={people} />
}
```

```typescript
// components/tree/FamilyTreeCanvas.tsx — Client Component
'use client'
import { useState } from 'react'
// ... renders tree, manages selectedPersonId state
```

### Pattern 2: Content Loader as Typed Module

All JSON access goes through `lib/content.ts`. Never import JSON files directly in components.

```typescript
// lib/content.ts
import { readFileSync } from 'fs'
import { join } from 'path'
import type { Person, Photo, Film } from '@/types'

const read = <T>(file: string): T =>
  JSON.parse(readFileSync(join(process.cwd(), 'content', file), 'utf-8'))

export const getPeople = (): Person[] => read<Person[]>('people.json')
export const getPersonById = (id: string) =>
  getPeople().find(p => p.id === id) ?? null
export const getAllPhotos = (): Photo[] => read<Photo[]>('photos.json')
export const getAllFilms = (): Film[] => read<Film[]>('films.json')
```

This keeps the data contract typed and refactorable. When/if content moves to a database, only `lib/content.ts` changes.

### Pattern 3: Framer Motion Client Wrappers

Framer Motion requires `'use client'`. Wrap motion elements in thin Client Components rather than marking whole pages as client.

```typescript
// components/ui/MotionWrapper.tsx
'use client'
import { motion } from 'framer-motion'

export function FadeIn({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {children}
    </motion.div>
  )
}
```

Use `template.tsx` (not `layout.tsx`) for page transition animations — template re-mounts on every navigation, which is what Framer Motion needs to trigger enter animations.

### Pattern 4: Route Group Layout Isolation

```
app/
  (auth)/layout.tsx      # No nav, no footer, no star motif — just centered card
  (protected)/layout.tsx # Full chrome: Nav + children + Footer
```

These are independent layout trees. Navigating between them triggers a full page reload (Next.js behavior for separate root layouts), which is acceptable here since login → app is a single transition.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Fetching Data in Client Components
**What:** Calling `fetch('/api/photos')` or reading files inside `'use client'` components.
**Why bad:** Creates unnecessary API routes, adds a network roundtrip, and loses TypeScript type safety from the loader.
**Instead:** Load in the nearest Server Component parent, pass as typed props.

### Anti-Pattern 2: Importing auth.ts in Middleware
**What:** `import { auth } from '@/auth'` in `middleware.ts`.
**Why bad:** Pulls Node.js-only dependencies (bcrypt, database adapters) into the edge runtime. Build will fail or silently break.
**Instead:** Import only from `auth.config.ts` in middleware.

### Anti-Pattern 3: Hardcoding Content in JSX
**What:** Writing person names, photo paths, or video IDs directly in component files.
**Why bad:** Content and code become coupled. Adding a family photo requires a code deploy.
**Instead:** All data lives in `/content/*.json`, loaded exclusively via `lib/content.ts`.

### Anti-Pattern 4: Making layout.tsx a Client Component for Animations
**What:** Adding `'use client'` to `(protected)/layout.tsx` for entrance animations.
**Why bad:** Converts the entire protected section to client rendering, defeating the Server Component architecture.
**Instead:** Use `template.tsx` for per-navigation animations; keep layouts as Server Components.

### Anti-Pattern 5: Flat Component Directory
**What:** All components in `/components/*.tsx` with no subdirectory structure.
**Why bad:** At 4 distinct feature areas (home, tree, gallery, films), naming collisions and unclear ownership become a maintenance problem by Session 3.
**Instead:** Use feature subdirectories: `components/tree/`, `components/gallery/`, `components/layout/`.

---

## Build Order (Component Dependencies)

Each session unlocks the next. Earlier components must be complete before later ones can build on them.

```
Session 1: Foundation
  ├── auth.config.ts + auth.ts + middleware.ts
  ├── (auth)/login/page.tsx + login form
  ├── (protected)/layout.tsx with session check
  ├── lib/content.ts (stub — returns empty arrays until JSON files exist)
  └── content/*.json (schema defined, placeholder data)

Session 2: Home Page
  ├── Depends on: Session 1 (auth gate, layout)
  ├── Nav.tsx + Footer.tsx (star motif placement)
  ├── (protected)/page.tsx
  └── Hero.tsx (first Framer Motion island)

Session 3: Family Tree
  ├── Depends on: Session 1 (content loader), real people.json data
  ├── lib/tree.ts (calcTree wrapper)
  ├── FamilyTreeCanvas.tsx ('use client')
  ├── PersonPanel.tsx ('use client', Framer Motion slide-in)
  └── (protected)/tree/[id]/page.tsx

Session 4: Photo Gallery
  ├── Depends on: Session 1 (content loader), real photos.json + image files
  ├── PhotoGrid.tsx (server, next/image)
  ├── PhotoCard.tsx
  └── (protected)/photos/[id]/page.tsx

Session 5: Film Gallery
  ├── Depends on: Session 1 (content loader), real films.json
  ├── VideoPlayer.tsx ('use client', source switch)
  ├── FilmCard.tsx
  └── (protected)/films/[id]/page.tsx

Session 6: Polish
  ├── Depends on: All above complete
  ├── Webfont loading (typography upgrade)
  ├── Search/filter (if re-scoped in)
  └── Responsive QA, performance audit
```

Critical dependency: `lib/content.ts` and the JSON schemas must be finalized in Session 1 because every subsequent session reads from them. A schema change in Session 4 requires updating all previous JSON files.

---

## Scalability Considerations

| Concern | Current (v1) | Future |
|---------|-------------|--------|
| Content management | JSON files edited by hand | Could migrate to Contentlayer or a headless CMS; only `lib/content.ts` changes |
| Photo hosting | Images in `/public/` or Vercel blob | Vercel Image Optimization handles resizing; migrate to Cloudinary without touching components |
| Video hosting | YouTube unlisted | Change `source: "youtube"` to `"vimeo"` in films.json + update VideoId; VideoPlayer handles both |
| Auth | Single shared password in env var | Upgrade to per-user NextAuth without touching protected route structure |
| Family tree data | Flat JSON, one generation | relatives-tree handles large trees; performance concern only if >500 nodes |

---

## Sources

- Next.js Route Groups docs: https://nextjs.org/docs/app/api-reference/file-conventions/route-groups (official, verified April 2026)
- Auth.js v5 Migration Guide: https://authjs.dev/getting-started/migrating-to-v5 (official, current)
- Auth.js Protecting Routes: https://authjs.dev/getting-started/session-management/protecting (official, current)
- Next.js Common App Router Mistakes: https://vercel.com/blog/common-mistakes-with-the-next-js-app-router-and-how-to-fix-them (Vercel official)
- relatives-tree GitHub: https://github.com/SanichKotikov/relatives-tree (source verified)
- Framer Motion + App Router: https://www.hemantasundaray.com/blog/use-framer-motion-with-nextjs-server-components (MEDIUM confidence — community source, patterns consistent with official docs)
