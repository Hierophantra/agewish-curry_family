# The Curry Family Hub

A private family archive for the Curry family at [curry.agewish.com](https://curry.agewish.com).

## v2 status: complete

All 13 phases of the v2 milestone are shipped. The site is feature-complete.

**What is in place:**
- Password-gated archive with Auth.js v5 credentials provider
- Photographs organised into named collections with a full-screen lightbox viewer
- Videos organised into playlists with an embedded video lightbox (YouTube/Vimeo)
- Interactive family tree with a prototype-fidelity side panel (photo carousel, key-value metadata)
- Individual person pages with photographs, videos, and linked relatives
- Curated home page with tree preview, recent photographs, and featured films
- AgeWish brand mark (real PNG — navy ring + gold 8-pointed star)
- Content separated from code: all family data lives in `/content/*.json`
- Archive export: "Download the archive" footer link generates a `manifest.zip` containing all JSON + a self-contained offline `index.html` viewer that works without Vercel or Next.js

**What remains before launch:**
- Replace the 6 placeholder photos (1x1 JPEG stubs in `public/photos/`) with real family photographs
- Update `content/family.json` with real family data (or keep the Curry prototype data)
- Update `content/videos.json` with real YouTube/Vimeo video IDs (or remove the stub videos)
- Deploy to Vercel and configure the `curry.agewish.com` DNS record

**See [CONTENT_AUTHORING.md](CONTENT_AUTHORING.md)** for step-by-step instructions on adding real content without touching code.

## Local development

**Prerequisites:** Node.js 18+, npm

```bash
# Clone and install
git clone <repo-url>
cd curry-family
npm install

# Set up environment variables (see "Environment variables" below)
cp .env.local.example .env.local
# Edit .env.local with real values

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with the family password.

## Environment variables

Create `.env.local` in the project root (never commit this file — it is in `.gitignore`).

```
AUTH_SECRET=<generated value>
AUTH_PASSWORD_HASH=<generated value>
```

Do NOT set `NEXTAUTH_URL`, `AUTH_URL`, or `NEXTAUTH_SECRET`. These break Vercel preview deployments.

### Generate AUTH_SECRET

```bash
npx auth secret
# Copy the printed value to AUTH_SECRET in .env.local
```

### Generate AUTH_PASSWORD_HASH

```bash
node -e "require('bcryptjs').hash('<your-family-password>', 10).then(console.log)"
# Replace <your-family-password> with the actual family password
# Output looks like: $2b$10$F2x7R9sz4eKL3h99/G5mYu...
# NEVER store the plaintext password — only the hash
```

**Critical: escape each `$` with a backslash when writing to `.env.local`.**

`@next/env` runs `dotenv-expand`, which mangles bcrypt hashes by treating `$2b`, `$10`, etc. as variable references. Single quotes do NOT prevent this — only backslash escapes do. Example for a hash like `$2b$10$F2x7R9...`:

```
AUTH_PASSWORD_HASH=\$2b\$10\$F2x7R9...
```

On **Vercel**, paste the raw hash WITHOUT backslashes — Vercel's environment variable UI does not run dotenv-expand, so it stores the value literally.

## Content authoring

All family content lives in the `content/` folder. Edit the JSON files and push to publish. Vercel rebuilds automatically on every push to `main`.

### `content/family.json` — family members

Add each person as a JSON object:

```json
{
  "id": "william-curry",
  "name": "William Curry",
  "birthYear": 1920,
  "deathYear": 1995,
  "photoIds": ["photo-001"],
  "parentIds": [],
  "spouseIds": ["eleanor-curry"],
  "childrenIds": ["robert-curry"]
}
```

- `id` is a kebab-case slug — stable forever. Do not rename after publishing (used in URLs and cross-references).
- `parentIds`, `spouseIds`, and `childrenIds` must reference other `id` values in the same file.
- `photoIds` must reference `id` values in `photos.json`.

### `content/photos.json` — family photographs

```json
{
  "id": "photo-001",
  "filename": "william-1950.jpg",
  "caption": "William at the farm, circa 1950.",
  "year": 1950,
  "peopleIds": ["william-curry"]
}
```

- `filename` refers to a file in `/public/photos/`.
- `peopleIds` links the photo to people in `family.json`. Also add the `photoIds` entry on each person for bidirectional consistency.

### `content/videos.json` — family films

```json
{
  "id": "film-001",
  "title": "Christmas 1972",
  "source": "youtube",
  "sourceId": "dQw4w9WgXcQ",
  "year": 1972,
  "peopleIds": ["william-curry"]
}
```

- `source`: `"youtube"` or `"vimeo"`.
- `sourceId`: the YouTube/Vimeo video ID only — not the full URL.

### Password rotation

To change the family password:

```bash
node -e "require('bcryptjs').hash('<new-password>', 10).then(console.log)"
```

Update `AUTH_PASSWORD_HASH` in Vercel environment variables and redeploy. Existing sessions stay valid (they use a JWT signed by `AUTH_SECRET`, not the hash directly).

To invalidate ALL sessions (everyone must log in again):

```bash
npx auth secret
```

Update `AUTH_SECRET` in Vercel environment variables and redeploy.

## Vercel deployment

### First deploy

1. Push the repo to GitHub.
2. Import the project in the [Vercel dashboard](https://vercel.com).
3. Go to Settings → Environment Variables and add:
   - `AUTH_SECRET` — check **Production**, **Preview**, **Development**
   - `AUTH_PASSWORD_HASH` — check **Production**, **Preview**, **Development**
4. Do NOT set `NEXTAUTH_URL`, `AUTH_URL`, or `NEXTAUTH_SECRET` — these break preview deployments.
5. Trigger a deploy (Vercel auto-deploys on push; or click "Deploy" in the dashboard).
6. Visit the Vercel preview URL and verify the password gate works.

### DNS (curry.agewish.com)

1. In Vercel: Project Settings → Domains → Add `curry.agewish.com`.
2. Vercel shows a CNAME record value (project-specific, e.g. `cname.vercel-dns.com`).
3. In your DNS registrar: add a CNAME record `curry` → `<Vercel CNAME value>`.
4. SSL certificate auto-provisions once DNS propagates (5–30 minutes).

## Tech stack

- **Next.js 14.2.35** — App Router (do not upgrade to 15/16)
- **Auth.js v5 (next-auth@beta)** — Credentials provider, JWT sessions
- **Tailwind CSS v4** — CSS-first config in `app/globals.css`
- **Zod** — JSON content validation
- **bcryptjs** — Password hash comparison
- **Vercel** — Hosting, auto-deploy on push to `main`
