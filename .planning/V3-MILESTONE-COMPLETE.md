# v3 Milestone Complete

**Completed:** 2026-04-29
**Phases:** 20–26 (7 phases)
**Build:** `npm run build` exits 0 — 51 static pages

---

## What v3 delivered

v3 added a GitHub-authenticated admin interface at `/admin` that lets allowlisted family members edit all archive content directly in the browser, without touching JSON files or code. Every save commits to the GitHub repo; Vercel detects the push and rebuilds automatically. The live site reflects changes in approximately 90 seconds.

### Admin infrastructure (Phase 20)

- GitHub OAuth alongside the existing family Credentials provider (Auth.js v5)
- Two-level auth: family password for the archive, GitHub OAuth for the admin
- `ADMIN_GITHUB_USERNAMES` environment variable — comma-separated allowlist checked server-side only
- `lib/admin.ts` — `getAdminUser()`, `requireAdmin()`, `requireAdminOrRedirect()` helpers
- `lib/github.ts` — octokit wrapper for reading (`getFileContent`) and writing (`commitFile`) via the GitHub Contents API
- SHA-first write pattern: always fetch current SHA before committing (GitHub API requires it to prevent concurrent edit conflicts)
- Commits attributed to the admin's GitHub identity (user-token commits, not a bot PAT)
- `/admin` route group with its own layout (unauthenticated shell — page-level auth gates prevent the layout auth from creating infinite redirects on the login page)
- `/admin/login` page with GitHub OAuth sign-in button

### Content type admins

| Content type | Phase | Create | Update | Delete | Special |
|---|---|---|---|---|---|
| Chronicles | 21 | Yes | Yes | Yes | markdown body, people/collection/photo cross-refs |
| Photographs | 22 | Yes (Blob upload) | Yes | Yes (Blob delete) | multipart/form-data, BlurHash generation, hybrid URL storage |
| Videos | 23 | Yes | Yes | Yes | YouTube/Vimeo source select, featured flag, playlist picker |
| Audio | 24 | Yes (Blob upload) | Yes | Yes (Blob delete) | Web Audio API duration auto-fill, hybrid URL storage |
| Collections | 25 | Yes | Yes | Yes | cascade: strips collectionId from all photos |
| Playlists | 25 | Yes | Yes | Yes | cascade: strips playlistId from all videos |
| People | 26 | Yes | Yes | Yes | bidirectional relationship sync, full cascade delete |

### Cross-cutting infrastructure decisions

**Hybrid storage pattern (Phases 22, 24):**
Binary assets (photos, audio) are uploaded to Vercel Blob storage. The JSON files store the full Blob URL as the `filename` field. `getPhotoUrl()` and `getAudioUrl()` helpers in `lib/utils.ts` handle both legacy `/public/` paths and new Blob URLs transparently. Components updated to use helpers instead of direct string interpolation.

**Bidirectional relationship sync (Phase 26):**
When a new person is created with `parentIds = [B]`, the server also adds that person's id to B's `childrenIds`. Same logic on update (diff old vs new). On delete, cascade cleans up all relationship arrays across all people. The v1 `childIds` alias is kept in sync everywhere.

**Cascade delete pattern (Phases 21, 22, 24, 25, 26):**
Deletes commit the primary JSON file first, then iterate through affected files sequentially, committing only if references were actually found. This produces clean, descriptive git history:
- `admin: delete person {name}` (removes from family.json + intra-family refs)
- `admin: clean up peopleIds references for deleted person {name}` (photos/videos/audio/chronicles — one commit each if they had refs)

**Allowlist + array field validation (Phase 26):**
The API route for people distinguishes scalar editable fields (strings, empty string = clear) from array editable fields (string arrays, validated separately). All other approaches (like a flat allowlist) would conflate the type distinction.

**ID immutability:**
Person IDs are locked after creation (UI makes the field read-only in update mode). This prevents silent URL breakage and cross-reference corruption. The constraint is documented in the form help text and in CONTENT_AUTHORING.md.

### Pages delivered across v3

- `/admin` — dashboard linking to all content type admins
- `/admin/login` — GitHub OAuth sign-in
- `/admin/people` — list + create (7 pages of people in stub data)
- `/admin/people/[id]` — edit with relationship pickers
- `/admin/people/new` — create form
- `/admin/photos`, `/admin/photos/[id]`, `/admin/photos/new`
- `/admin/videos`, `/admin/videos/[id]`, `/admin/videos/new`
- `/admin/audio`, `/admin/audio/[id]`, `/admin/audio/new`
- `/admin/chronicles`, `/admin/chronicles/[id]`, `/admin/chronicles/new`
- `/admin/collections`, `/admin/collections/[id]`, `/admin/collections/new`
- `/admin/playlists`, `/admin/playlists/[id]`, `/admin/playlists/new`

### API endpoints delivered across v3

| Endpoint | Methods |
|---|---|
| `/api/admin/people` | POST (create) |
| `/api/admin/people/[id]` | POST (update, incl. parentIds/childrenIds) + DELETE (cascade) |
| `/api/admin/photos` | POST (multipart: Blob upload + JSON commit) |
| `/api/admin/photos/[id]` | POST (metadata update) + DELETE (Blob delete + JSON commit) |
| `/api/admin/videos` | POST (create) |
| `/api/admin/videos/[id]` | POST (update) + DELETE |
| `/api/admin/audio` | POST (multipart: Blob upload + JSON commit) |
| `/api/admin/audio/[id]` | POST (metadata update) + DELETE (Blob delete + JSON commit) |
| `/api/admin/chronicles` | POST (create) |
| `/api/admin/chronicles/[id]` | POST (update) + DELETE (cascade strips chronicle from people pages) |
| `/api/admin/collections` | POST (create) |
| `/api/admin/collections/[id]` | POST (update) + DELETE (cascade strips collectionId from photos) |
| `/api/admin/playlists` | POST (create) |
| `/api/admin/playlists/[id]` | POST (update) + DELETE (cascade strips playlistId from videos) |

---

## v3 milestone close

The v3 milestone is complete. The admin UI covers all six content types (people, photos, videos, audio, collections, playlists) plus chronicles. No content type requires manual JSON editing for CRUD operations — all can be managed entirely through the browser admin interface.

All CLAUDE.md constraints maintained throughout:
- Next.js 14.2.35 — no upgrade
- TypeScript strict mode — no `any`
- Tailwind CSS v4 CSS-first config — no config file
- Two-weight rule (400/500 only) — never 600/700
- Sentence case throughout — uppercase only for metadata eyebrows
- Two-file auth split preserved — middleware imports edge-safe auth.config.ts only
- Defence in depth: every admin route calls `getAdminUser()` independently

---

## What comes next (v4+)

The site is feature-complete. Suggested future directions if needed:
- Replace placeholder photos + stub family data with real family content
- Vercel deployment + DNS (`curry.agewish.com`)
- Client-side direct Blob upload for files larger than 4MB (current serverless body limit)
- Chronicle narration upload via the admin (currently manual JSON only)
- Search across people, photos, chronicles
- Photo/person face tagging improvements
