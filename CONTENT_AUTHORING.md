# Adding content to the Curry Family Hub

All content lives in JSON files under `/content/`. Edit these files, drop image assets in `/public/photos/`, push to GitHub, and Vercel rebuilds the site within a minute. No code changes needed for any routine content addition.

---

## Quick reference

| What you want to add       | Files to edit                                    | Where assets go            |
| -------------------------- | ------------------------------------------------ | -------------------------- |
| A new person               | `content/family.json`                            | `public/photos/` (for any photos of them) |
| A new photo                | `content/photos.json`                            | `public/photos/{filename}` |
| A new collection           | `content/collections.json`                       | (no new asset — uses cover photo) |
| A new video                | `content/videos.json`                            | (uses YouTube/Vimeo ID — no file upload) |
| A new playlist             | `content/playlists.json`                         | (no new asset — uses cover video) |
| Replace a photo file       | (no JSON change)                                 | Overwrite the file in `public/photos/` |

---

## Adding a person

Open `content/family.json` and append a new object to the array. Here is a complete example:

```json
{
  "id": "carol-curry",
  "name": "Carol Curry",
  "gender": "female",
  "relationLabel": "DAUGHTER-IN-LAW",
  "eyebrow": "Wife of Robert",
  "spouseLabel": "Robert Curry",
  "birthYear": 1950,
  "birthDate": "1950-09-23",
  "datesLabel": "1950 — present",
  "birthplace": "Columbus, Ohio",
  "bio": "Carol joined the family in 1972 and became its unofficial historian. She has kept every Christmas card since 1974.",
  "photoIds": ["1981-lake-house-01"],
  "parentIds": [],
  "childrenIds": ["sarah-curry", "daniel-curry"],
  "childIds": ["sarah-curry", "daniel-curry"],
  "spouseIds": []
}
```

### Field reference

| Field         | Required | Description |
| ------------- | -------- | ----------- |
| `id`          | Yes      | Kebab-case slug. **Never rename after publishing** — used in URLs and all cross-references. |
| `name`        | Yes      | Full display name. |
| `gender`      | No       | `"male"`, `"female"`, or `"other"`. Used by the family tree layout. |
| `relationLabel` | No     | Short uppercase label shown on tree nodes: `"SON"`, `"DAUGHTER"`, `"PATRIARCH"`, `"GRANDDAUGHTER"`. |
| `eyebrow`     | No       | Short phrase shown on the person detail page: `"Son of William"`, `"Patriarch of the family"`. |
| `spouseLabel` | No       | Display name of their primary spouse. This is a plain string — the spouse does not need a separate record. |
| `birthYear`   | No       | Integer year (1920). Kept for back-compat. Use `birthDate` for precision. |
| `birthDate`   | No       | ISO date: `"1950-09-23"`. Used for the formatted "Born" metadata row. |
| `datesLabel`  | No       | Display string: `"1920 — 2008"` or `"1952 — present"`. |
| `birthplace`  | No       | Plain string: `"Dayton, Ohio"`. |
| `bio`         | No       | 1–4 sentence biography. Rendered in italic serif on the person detail page. |
| `photoIds`    | No       | Array of photo IDs from `photos.json` that feature this person. |
| `parentIds`   | No       | Array of person IDs who are this person's parents. Must be bidirectional (parent's `childrenIds` must include this person's id). |
| `childrenIds` | No       | Array of person IDs who are this person's children. Must be bidirectional. |
| `childIds`    | No       | Legacy alias for `childrenIds`. Keep them in sync. |
| `spouseIds`   | No       | Array of person IDs for spouses. Must be bidirectional. |

### Deceased person

For someone who has passed away, add `deathYear` and/or `deathDate` and update `datesLabel`:

```json
{
  "id": "eleanor-curry",
  "name": "Eleanor Curry",
  "birthDate": "1922-11-03",
  "deathDate": "2010-06-14",
  "datesLabel": "1922 — 2010",
  ...
}
```

### Person with no photos or videos

It is fine for a person to have no `photoIds` at all. Their detail page shows a graceful empty state: "No photographs or videos of this person yet." Add photos later by updating `photoIds` in `family.json` AND `peopleIds` in `photos.json`.

### Bidirectional rule

The validator enforces bidirectional consistency. If you add person A as a child of person B, you MUST also list person A in person B's `childrenIds`. If you miss this, the build will fail with an error pointing at the broken reference. This is intentional — it catches typos before they reach production.

---

## Adding a photograph

### Step 1 — Copy the image file

Place the image in `/public/photos/`. Use a meaningful, lowercase, kebab-case filename:

```
public/photos/2003-grandfathers-funeral-01.jpg
```

Guidelines for the filename:
- Start with the year: `2003-`
- Use a descriptive slug: `grandfathers-funeral`
- Add a sequence number if multiple shots from the same event: `-01`, `-02`
- Lowercase only. Linux (Vercel) is case-sensitive — `Photo.jpg` and `photo.jpg` are different files.
- Prefer `.jpg` for photographs. `.png` for images with transparency.

Recommended image size: **1600px wide** at standard JPEG quality (~80%). Smaller is fine for bandwidth reasons. Larger is wasted bandwidth in the lightbox.

### Step 2 — Add the JSON entry

Open `content/photos.json` and append:

```json
{
  "id": "2003-grandfathers-funeral-01",
  "filename": "2003-grandfathers-funeral-01.jpg",
  "caption": "The family gathered at St. Luke's, July 2003.",
  "date": "2003-07-19",
  "dateLabel": "July 2003",
  "location": "Dayton, Ohio",
  "peopleIds": ["william-curry", "robert-curry", "margaret-curry"],
  "collectionIds": []
}
```

### Step 3 — Tag people (bidirectional)

For each person in `peopleIds`, open `content/family.json` and add the photo ID to that person's `photoIds` array. The validator enforces this — miss it and the build fails.

### Step 4 — Optionally add to a collection

To add the photo to an existing collection, add the collection's ID to `collectionIds`:

```json
"collectionIds": ["lake-house-summers"]
```

The photo will immediately appear in the collection detail page at `/photographs/lake-house-summers`.

### Step 5 — Generate the blur placeholder (optional but recommended)

After the photo file is in place, run:

```bash
npm run blur
```

This reads every photo in `content/photos.json`, generates a tiny base64 blur placeholder for each real image file, and writes the result back into `photos.json` as `blurDataUrl`. Commit the updated `photos.json` alongside the photo file.

The blur placeholder appears instantly as a soft colour wash while the full photo loads, eliminating the broken-image flash on slow connections. Each placeholder is roughly 150–200 characters of base64 — negligible JSON weight.

**If you forget to run `npm run blur`**, photos still load and display correctly — they just show the `bg-ivory` background instead of a blur during the loading transition.

**After replacing placeholder files with real photos**, run `npm run blur` again. The script is idempotent and will overwrite the old blur data with one that reflects the actual photo colours.

### Photo field reference

| Field          | Required | Description |
| -------------- | -------- | ----------- |
| `id`           | Yes      | Unique ID, typically matching the filename without extension. |
| `filename`     | Yes      | Exact filename in `/public/photos/`. Case-sensitive. |
| `caption`      | No       | Short description. Shown in the lightbox and on photo cards. |
| `date`         | No       | ISO date: `"2003-07-19"`. Used for sorting on the home page. |
| `dateLabel`    | No       | Display string: `"July 2003"`. Shown as a metadata label. |
| `location`     | No       | Plain string: `"Dayton, Ohio"`. Shown as metadata. |
| `peopleIds`    | No       | Person IDs who appear in this photo. Must be present in `family.json`. |
| `collectionIds` | No      | Collection IDs this photo belongs to. Empty array is valid. |

---

## Creating a collection

A collection is a named tag — it groups photos that share a theme or time period. Photos declare which collections they belong to via their `collectionIds[]` array. The same photo can belong to multiple collections.

### Step 1 — Add the collection to collections.json

```json
{
  "id": "funerals-and-farewells",
  "title": "Funerals and farewells",
  "subtitle": "The last times we were all together",
  "coverPhotoId": "2003-grandfathers-funeral-01",
  "dateLabel": "1995 — 2010",
  "description": "Photographs from memorial services and final family gatherings."
}
```

The `coverPhotoId` must already exist in `photos.json` — it appears as the collection thumbnail on the `/photographs` grid.

### Step 2 — Tag photos

For any photo that should appear in this collection, add the collection ID to that photo's `collectionIds` array in `photos.json`:

```json
"collectionIds": ["funerals-and-farewells"]
```

A photo can be in multiple collections at once:

```json
"collectionIds": ["funerals-and-farewells", "lake-house-summers"]
```

### Collection field reference

| Field         | Required | Description |
| ------------- | -------- | ----------- |
| `id`          | Yes      | Kebab-case slug. Used in the URL: `/photographs/{id}`. Never rename. |
| `title`       | Yes      | Display title. Sentence case. |
| `subtitle`    | No       | Italic serif subtitle shown on the collection page. |
| `coverPhotoId` | Yes     | Photo ID used as the collection thumbnail. Must exist in `photos.json`. |
| `dateLabel`   | No       | Display string: `"1974 — 2005"`. |
| `description` | No       | 1–2 sentence description shown on the collection page. |

---

## Adding a video

Videos use YouTube or Vimeo as the hosting platform. The site embeds the player using the video's ID — you do not upload video files to the site.

### Step 1 — Upload the video

Upload the video to YouTube (as unlisted) or Vimeo. Get the video ID:

- **YouTube**: The URL is `https://www.youtube.com/watch?v=dQw4w9WgXcQ` — the ID is `dQw4w9WgXcQ`
- **Vimeo**: The URL is `https://vimeo.com/123456789` — the ID is `123456789`

### Step 2 — Add the JSON entry

Open `content/videos.json` and append:

```json
{
  "id": "roberts-70th-birthday",
  "title": "Robert's 70th birthday",
  "description": "The family threw a surprise party for Robert's 70th. He had absolutely no idea.",
  "source": "youtube",
  "sourceId": "dQw4w9WgXcQ",
  "date": "2018-08-22",
  "dateLabel": "August 2018",
  "duration": "8:34",
  "peopleIds": ["robert-curry"],
  "playlistIds": ["birthdays"],
  "featured": false
}
```

### Step 3 — Optionally feature the video

Set `"featured": true` to surface the video in the "Featured films" section on the home page. Up to 2 featured videos are shown. If no videos are featured, the section hides entirely.

### Video field reference

| Field         | Required | Description |
| ------------- | -------- | ----------- |
| `id`          | Yes      | Kebab-case slug. Unique across all videos. |
| `title`       | Yes      | Display title. Sentence case. |
| `description` | No       | 1–3 sentence description. Shown in the video card and lightbox. |
| `source`      | Yes      | `"youtube"` or `"vimeo"`. |
| `sourceId`    | Yes      | The video ID on the platform. Not the full URL — just the ID part. |
| `date`        | No       | ISO date: `"2018-08-22"`. |
| `dateLabel`   | No       | Display string: `"August 2018"`. |
| `duration`    | No       | Duration string: `"8:34"`. Shown as a metadata label. |
| `peopleIds`   | No       | Person IDs who appear in the video. |
| `playlistIds` | No       | Playlist IDs this video belongs to. |
| `featured`    | No       | `true` to show on the home page "Featured films" section. Default: `false`. |

---

## Creating a playlist

A playlist is the video equivalent of a collection — a named tag grouping videos by theme or occasion. Videos declare which playlists they belong to via their `playlistIds[]` array.

### Step 1 — Add the playlist to playlists.json

```json
{
  "id": "lake-house-films",
  "title": "Lake house films",
  "subtitle": "Summers by the water",
  "coverVideoId": "summer-reunion-2019",
  "description": "Videos from summers spent at the lake house William built in 1958."
}
```

The `coverVideoId` determines the thumbnail (YouTube auto-generates a thumbnail image). It must exist in `videos.json`.

### Step 2 — Tag videos

For any video that belongs to this playlist, add the playlist ID to that video's `playlistIds` array:

```json
"playlistIds": ["lake-house-films", "reunions"]
```

A video can belong to multiple playlists at once.

### Playlist field reference

| Field         | Required | Description |
| ------------- | -------- | ----------- |
| `id`          | Yes      | Kebab-case slug. Used in the URL: `/videos/{id}`. Never rename. |
| `title`       | Yes      | Display title. Sentence case. |
| `subtitle`    | No       | Italic serif subtitle shown on the playlist page. |
| `coverVideoId` | Yes     | Video ID used for the playlist thumbnail. Must exist in `videos.json`. |
| `description` | No       | 1–2 sentence description shown on the playlist page. |

---

## Migrating from YouTube to Vimeo

To move a video from YouTube to Vimeo, make two edits in `content/videos.json`:

```json
// Before
"source": "youtube",
"sourceId": "dQw4w9WgXcQ",

// After
"source": "vimeo",
"sourceId": "123456789",
```

The `VideoPlayer` component handles the platform switch. No code changes needed.

---

## Tagging principles

This is the most important concept to understand before editing content.

**Collections and playlists are tags, not folders.** There is no concept of moving a photo from one collection to another — you add tags. The same photo can appear in multiple collections simultaneously by listing multiple collection IDs:

```json
"collectionIds": ["lake-house-summers", "family-reunions", "1995"]
```

The same applies to videos and playlists:

```json
"playlistIds": ["birthdays", "featured-films", "2000s"]
```

Do not duplicate files to put them in multiple places. Just add another tag.

### How the home page works

The home page "Recent photographs" section shows the 6 most recent photos sorted by `date`. No configuration needed — just ensure your photos have a `date` field and the newest ones will surface automatically.

The "Featured films" section shows videos where `"featured": true`. There is no limit on how many you can mark as featured, but the home page shows at most 2. Choose the 1–2 videos that best represent the archive.

---

## Validation: your safety net

`lib/content.ts` validates all cross-references on every page render. If any reference is broken — a photo tagged with a person who doesn't exist, a collection pointing to a photo ID that's been deleted — the build will fail with an error message pointing at the specific broken reference.

Example build error:

```
Content error: Photo "2003-grandfathers-funeral-01" references unknown person ID "eleanor-curry".
Check content/photos.json — "eleanor-curry" must be an id in content/family.json.
```

This means you can trust that if the build succeeds, all references are valid. The safety net fires before anything reaches production.

---

## Local preview

Before pushing to GitHub, you can preview changes locally:

```bash
# Clone the repository
git clone <repo-url>
cd curry-family

# Install dependencies
npm install

# Create your local environment file
cp .env.local.example .env.local
# Edit .env.local — see README for how to generate AUTH_SECRET and AUTH_PASSWORD_HASH

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with the family password.

Content changes are reflected immediately on save in development mode — no restart needed.

To verify the production build locally before pushing:

```bash
npm run build
# Must exit 0 with "22 static pages" (or more, if you've added people/collections/playlists)
```

---

## Replacing the placeholder photos

The site currently has 6 placeholder photos — these are 1×1 pixel JPEG files that were created during development as stand-ins. They will display as tiny grey squares. When you have the real family photos:

1. Name each real photo file to match exactly what is in `content/photos.json` under `filename`.
2. Copy the file to `public/photos/` (overwriting the placeholder).
3. Push to GitHub. Vercel rebuilds automatically.

For example, to replace the wedding placeholder:

```bash
# Your real photo file is named "1953-wedding-01.jpg" (matches filename in photos.json)
cp ~/Desktop/williams-wedding.jpg public/photos/1953-wedding-01.jpg
```

Alternatively, you can add entirely new photos with new filenames and update `photos.json` to point to the new filenames. The old placeholder files can then be deleted.

---

## Provenance and uncertainty

Memory conflicts over time. A photograph surfaced from a box in the attic may have a date written on the back that disagrees with what the family remembers, or no date at all. The person who identified the people in a photo may not be the same person who scanned it. The archive is more trustworthy when it tracks who said what, and when.

Provenance fields let you record this context alongside the content itself. They are all optional — an entry without any provenance fields is still perfectly valid. The goal is gradual accumulation: add what you know, leave blank what you don't, and update over time as more is established.

The principle: **the archive doesn't have to be certain about everything — it just has to be honest about what it doesn't know.**

### Provenance fields for photographs

Add these fields to any entry in `content/photos.json`:

| Field            | Type    | Example value                                      | Purpose |
| ---------------- | ------- | -------------------------------------------------- | ------- |
| `source`         | string  | `"Margaret Curry's family album"`                  | Where the original photograph came from — an album, a box in an attic, a relative's collection. |
| `identifiedBy`   | string  | `"Margaret Curry, June 2024"`                      | Who identified the people in the photograph (and when). Format: `"Name, Month YYYY"`. |
| `circa`          | boolean | `true`                                             | Set to `true` when the date is approximate. The lightbox will prefix the date with "Circa". |
| `confidence`     | string  | `"high"`, `"medium"`, or `"low"`                  | Your confidence in the date and identification. Use `"low"` when the date is a guess or the people are uncertain. |
| `lastVerified`   | string  | `"2024-06-15"`                                     | ISO date (YYYY-MM-DD) when this entry was last reviewed and confirmed accurate. |
| `scannedDate`    | string  | `"2024-06-15"`                                     | ISO date when the physical photograph was digitized. Useful for tracking the scanning project. |
| `originalFilename` | string | `"IMG_2034.JPG"`                                 | The filename the scanner assigned before you renamed it. Preserves a traceability link to the raw scan. |

### Provenance fields for videos

Add these fields to any entry in `content/videos.json`:

| Field              | Type    | Example value                              | Purpose |
| ------------------ | ------- | ------------------------------------------ | ------- |
| `source_provenance` | string | `"James Curry's home video archive"`       | Who provided the recording. Note: this field is named `source_provenance` (not `source`) because `source` is already taken by the platform field (`"youtube"` or `"vimeo"`). |
| `identifiedBy`     | string  | `"James Curry, March 2024"`                | Who identified the content or confirmed the date. |
| `circa`            | boolean | `true`                                     | Set to `true` when the recording date is approximate. |
| `confidence`       | string  | `"high"`, `"medium"`, or `"low"`          | Confidence in date and identification. |
| `lastVerified`     | string  | `"2024-06-15"`                             | ISO date when this entry was last reviewed. |
| `recordedDate`     | string  | `"2000-04-12"`                             | ISO date when the video was originally recorded — useful when the upload date to YouTube/Vimeo differs from the actual recording date. |

### Provenance fields for people

Add these fields to any entry in `content/family.json`:

| Field          | Type    | Example value                      | Purpose |
| -------------- | ------- | ---------------------------------- | ------- |
| `identifiedBy` | string  | `"Margaret Curry, June 2024"`      | Who provided or confirmed the biographical details. |
| `circa`        | boolean | `true`                             | Set to `true` when birth or death dates are approximate (e.g., year known but not month/day). |
| `confidence`   | string  | `"high"`, `"medium"`, or `"low"` | Confidence in the biographical information overall. |
| `lastVerified` | string  | `"2024-06-15"`                     | ISO date when this person's record was last reviewed. |
| `notes`        | string  | `"Birth year from family Bible"`   | Private archivist notes — not surfaced in the UI. Use for source citations, conflicting accounts, or anything you want to track but not display. |

### Worked example

A photograph turned up in a box at Margaret's house. It shows two people at what appears to be a summer gathering, and there is a pencilled year on the back: "1958 or 59?". Margaret identified one of the people as her father William, but was not certain about the other. You scan it in June 2024.

```json
{
  "id": "1958-summer-gathering-01",
  "filename": "1958-summer-gathering-01.jpg",
  "caption": "William at what may be the lake house, first summer",
  "date": "1958-01-01",
  "dateLabel": "1958",
  "location": "Lake house, Ohio",
  "peopleIds": ["william-curry"],
  "collectionIds": ["lake-house-summers"],
  "source": "Margaret Curry's attic, found June 2024",
  "identifiedBy": "Margaret Curry, June 2024",
  "circa": true,
  "confidence": "low",
  "scannedDate": "2024-06-15",
  "originalFilename": "IMG_4871.JPG",
  "notes": "Second person unidentified. Pencil inscription on back reads '1958 or 59?'. Margaret believes it may be a neighbour."
}
```

Because `circa` is `true`, the lightbox displays the date as "Circa 1958" rather than "1958". Because `source` is set, the lightbox shows a small "From Margaret Curry's attic, found June 2024" line below the date.

### All fields are optional

An entry without any provenance fields is completely valid:

```json
{
  "id": "1965-unknown-01",
  "filename": "1965-unknown-01.jpg",
  "caption": "Unknown location, mid-1960s",
  "peopleIds": [],
  "collectionIds": []
}
```

Add provenance fields only as you discover or verify information. The archive accumulates knowledge gradually — empty fields are not a failure, they are an invitation.

---

## Common pitfalls

### Bcrypt hash escaping in .env.local

Bcrypt hashes contain `$` characters (e.g., `$2b$10$...`). The `.env.local` file runs through `dotenv-expand`, which treats `$` as a variable prefix. You must escape every `$` with a backslash when writing to `.env.local`:

```
AUTH_PASSWORD_HASH=\$2b\$10\$F2x7R9...
```

On Vercel, paste the raw hash WITHOUT backslashes — Vercel's UI stores values literally.

See the README for the full generation instructions.

### File extensions are case-sensitive on Vercel

Vercel runs on Linux where `Photo.jpg` and `photo.jpg` are different files. Windows and macOS are case-insensitive, so a mismatch won't cause errors locally but will break in production. Always use lowercase filenames.

### Never rename an ID after publishing

The `id` fields in all JSON files are the primary keys used across every content type and in URLs. Renaming `"id": "william-curry"` to `"id": "william-j-curry"` after publish will:

- Break all URLs (`/person/william-curry` becomes a 404)
- Break all photo `peopleIds` references
- Break all tree links

If you must rename, update EVERY reference across ALL content files at the same time, then redeploy.

### Image filenames must match exactly

The `filename` field in `photos.json` must match the actual file in `public/photos/` exactly — including case and extension. The build validator checks that the reference exists but does not check the file system. A typo in `filename` will result in a broken image in production (no build error, just a missing image).

### The build validator catches JSON errors

If you make a syntax error in a JSON file (missing comma, unmatched bracket), the build will fail immediately with a JSON parse error. Use a JSON validator (jsonlint.com or your editor's built-in JSON linting) before pushing.

### Videos need an existing YouTube/Vimeo ID

The site does not host video files. You must upload videos to YouTube or Vimeo first, then add the video ID to `videos.json`. YouTube videos should be set to "unlisted" (not public, not private — private videos cannot be embedded).
