# Adding content to the Curry Family Hub

All content lives in JSON files under `/content/`. You can edit content in two ways:

1. **Admin UI at `/admin`** — sign in with GitHub and edit directly in the browser (v3, available now for bio editing)
2. **Manually edit the JSON files** — edit locally or on GitHub, push to `main`, Vercel rebuilds

---

## Editing via the admin UI

The admin UI at `https://curry.agewish.com/admin` lets you edit content without touching JSON files or code.

### Access

1. Go to `/admin` on the live site
2. Sign in with the GitHub account that has been allowlisted as an admin (`ADMIN_GITHUB_USERNAMES` env var)
3. You will see the content dashboard

Only GitHub accounts listed in `ADMIN_GITHUB_USERNAMES` on Vercel can access the admin. The family password does not grant admin access — admin login is separate.

### What you can edit in the admin UI

- **People** — full CRUD: names, bios, dates, birthplace, relations, and relation labels
- **Chronicles** — create and edit written family stories with optional audio narration
- **Photographs** — upload photos (JPEG/PNG/WebP, max 4MB), edit captions, dates, people tags, and collection tags. See the "Adding a photograph" section below for full details.
- **Videos** — add YouTube/Vimeo links, edit titles, dates, people tags, and playlist tags
- **Audio recordings** — upload voice recordings, voicemails, oral histories, and songs (MP3/M4A/AAC/WAV, max 4MB). Edit title, description, dates, duration, people tags, and collection tags. See the "Adding an audio recording via the admin UI" section below.

Each save commits the change directly to the GitHub repo. Vercel detects the push and rebuilds automatically. The live site reflects the change in approximately 90 seconds.

All six content types are fully editable via the admin UI:

- **People** — full CRUD: create, edit all fields, pick parent/child relationships from a person picker, delete with cascade cleanup
- **Photographs** — upload JPEG/PNG/WebP (max 4MB), edit metadata, delete (removes from Blob storage)
- **Videos** — add YouTube/Vimeo links, edit all metadata, delete
- **Audio recordings** — upload MP3/M4A/AAC/WAV (max 4MB), edit metadata, delete
- **Collections** — create and edit collection metadata, pick cover photo from dropdown, delete (cascade strips collectionId from photos)
- **Playlists** — create and edit playlist metadata, pick cover video from dropdown, delete (cascade strips playlistId from videos)
- **Chronicles** — create and edit written stories with markdown body, people tags, and cover photo

---

---

## Quick reference

| What you want to add       | Files to edit                                    | Where assets go            |
| -------------------------- | ------------------------------------------------ | -------------------------- |
| A new person               | `content/family.json`                            | `public/photos/` (for any photos of them) |
| A new photo                | `content/photos.json`                            | `public/photos/{filename}` |
| A new collection           | `content/collections.json`                       | (no new asset — uses cover photo) |
| A new video                | `content/videos.json`                            | (uses YouTube/Vimeo ID — no file upload) |
| A new playlist             | `content/playlists.json`                         | (no new asset — uses cover video) |
| A new audio recording      | `content/audio.json`                             | `public/audio/{filename}` |
| A new chronicle            | `content/chronicles.json`                        | `public/audio/{audioFilename}` (if narration) |
| Replace a photo file       | (no JSON change)                                 | Overwrite the file in `public/photos/` |

---

## Adding a person

There are two ways to add a person:

1. **Via the admin UI** — sign in with your allowlisted GitHub account, go to People, and click **"+ New person"**. Fill in the form, pick parents and children from the picker. The admin sets bidirectional relationships automatically.
2. **Manually edit the JSON** — open `content/family.json` and append a new object (described below).

### Admin UI notes

When you create a person via the admin UI:
- Parent and child relationships are set bidirectionally automatically. If you select William as a parent, the new person is also added to William's `childrenIds` without any extra steps.
- The person's ID is generated from their name (e.g. "Emily Walsh" → `emily-walsh`). You can override it before saving. **The ID cannot be changed after creation.**
- Deleting a person removes all references to them from photos, videos, audio, chronicles, and other family members' relationship arrays. The deletion cannot be undone.

### Manual JSON method

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

There are two ways to add a photograph:

1. **Via the admin UI** — upload directly from your browser (no developer involvement)
2. **Manually** — copy the file into the repo and edit `content/photos.json`

### Option A: admin upload (recommended for most cases)

1. Go to `/admin` on the live site and sign in with your allowlisted GitHub account
2. Click **"Photographs"**
3. Click **"+ Upload photo"**
4. Choose a JPEG, PNG, or WebP image (maximum **4MB**)
5. Fill in the caption, date, people, and collections
6. Click **"Upload photo"**

The file is uploaded to Vercel Blob storage and a JSON entry is committed to GitHub. The live site updates in approximately 90 seconds. No code changes or repo access required.

**4MB limit:** The admin uploader is capped at 4MB due to the serverless function body limit. Most family JPEGs after compression are well under this. If your image is larger, compress it first with [Squoosh](https://squoosh.app) (free, browser-based) or reduce the JPEG quality to ~80% in your photo editor. If you regularly need to upload larger files, contact the developer about switching to the client-upload pattern.

**Supported formats:** JPEG, PNG, WebP. HEIC (iPhone default) is not currently supported — convert to JPEG first using the built-in "Convert Image" option in macOS Finder or the Photos app on iPhone.

### Option B: manual (for batches, or when replacing placeholder files)

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

## Adding an audio recording via the admin UI

The admin UI supports direct audio upload — no developer involvement required.

### Option A: admin upload (recommended)

1. Go to `/admin` on the live site and sign in with your allowlisted GitHub account
2. Click **"Audio recordings"**
3. Click **"+ Upload audio"**
4. Choose an MP3, M4A, AAC, or WAV file (maximum **4MB**)
5. Fill in the title, description, date, duration, people, and collections
6. Click **"Upload recording"**

The file is uploaded to Vercel Blob storage and a JSON entry is committed to GitHub. The live site updates in approximately 90 seconds. No code changes or repo access required.

**Duration auto-fill:** After selecting a file, the form attempts to read the duration from the file's metadata and pre-fills the duration field. Check the auto-filled value and correct it if needed (some formats may not report duration until fully decoded).

**4MB limit:** The admin uploader is capped at 4MB due to the serverless function body limit. Voice recordings at 64–128 kbps mono are typically well under 1MB per minute of audio. If your file is larger, compress it first:
- On macOS, use **QuickTime Player** → File → Export As → Audio Only (exports as M4A at reduced bitrate)
- Online: [CloudConvert](https://cloudconvert.com) or [Online Audio Converter](https://online-audio-converter.com)
- For files that must remain above 4MB, contact the developer about switching to client-side direct upload.

**Supported formats:** MP3, M4A (AAC in MPEG-4), AAC, WAV. FLAC and OGG are not currently supported — convert to MP3 or M4A first.

**HEIC / iPhone voice memos:** iPhone voice memos export as M4A. Share the memo to your computer and upload the `.m4a` file directly — no conversion needed.

---

## Adding an audio recording (manually)

Audio recordings are stored as files in the repository, unlike videos which use YouTube or Vimeo. Voicemails, oral history interviews, songs, ambient recordings — anything audio can be added here.

Audio surfaces on each person's detail page under a "Recordings of [Name]" section. The section only appears when the person has at least one audio entry tagged with their ID.

### Step 1 — Prepare the audio file

Place the audio file in `/public/audio/`. Use a meaningful, lowercase, kebab-case filename:

```
public/audio/william-voicemail-2003.mp3
```

Guidelines:
- Start with a descriptive slug: `margaret-oral-history`, `lake-house-singalong`
- Add a year: `-2003`, `-1985`
- Lowercase only. Vercel (Linux) is case-sensitive.
- **Preferred format: MP3 or M4A** — broadest browser support across desktop and mobile.
- FLAC and WAV are supported by modern browsers but are much larger. Avoid unless archival fidelity is essential.
- **Voice recordings:** aim for 64–128 kbps mono MP3 — excellent quality at small file size.
- **Music / group singing:** 128–192 kbps stereo MP3 is sufficient.

### Step 2 — Add the JSON entry

Open `content/audio.json` and append a new object to the array:

```json
{
  "id": "william-voicemail-2003",
  "filename": "william-voicemail-2003.mp3",
  "title": "William's voicemail, March 2003",
  "description": "Asking after the family on a Sunday afternoon.",
  "date": "2003-03-16",
  "dateLabel": "March 2003",
  "duration": "0:47",
  "peopleIds": ["william-curry"],
  "collectionIds": [],
  "source": "Margaret's saved voicemails",
  "confidence": "high"
}
```

### Step 3 — Tag people

For each person in `peopleIds`, that recording will appear on their detail page. The person IDs must already exist in `content/family.json`. Unlike photos, audio does **not** require a back-reference in `family.json` — the validator checks only that the person IDs exist.

### Step 4 — Optionally tag a collection

To associate the recording with an existing collection (useful for mixed-media collections like "Lake house summers"), add the collection ID:

```json
"collectionIds": ["lake-house-summers"]
```

### Audio field reference

| Field          | Required | Description |
| -------------- | -------- | ----------- |
| `id`           | Yes      | Kebab-case slug. Unique across all audio entries. Never rename after publishing. |
| `filename`     | Yes      | Exact filename in `/public/audio/`. Case-sensitive. |
| `title`        | Yes      | Display title. Sentence case. Shown in the player. |
| `description`  | No       | 1–3 sentences of context. Shown in italic below the title. |
| `date`         | No       | ISO date: `"2003-03-16"`. Used for sorting (future). |
| `dateLabel`    | No       | Display string: `"March 2003"`. Shown in the player metadata line. |
| `duration`     | No       | Duration string: `"0:47"` or `"12:34"`. Shown alongside the date label. |
| `peopleIds`    | No       | Person IDs of everyone audible in the recording. Must exist in `family.json`. |
| `collectionIds` | No      | Collection IDs this recording belongs to. Empty array is valid. |
| `source`       | No       | Where the recording came from: `"Margaret's saved voicemails"`. |
| `identifiedBy` | No       | Who identified the content: `"Emily Walsh, August 2024"`. |
| `circa`        | No       | `true` when the date is approximate. Displays as "Circa Summer 1985". |
| `confidence`   | No       | `"high"`, `"medium"`, or `"low"`. Confidence in date and identification. |
| `lastVerified` | No       | ISO date when this entry was last reviewed: `"2024-08-04"`. |
| `recordedDate` | No       | ISO date when the recording was originally made (if different from `date`). |

### Worked example — a voicemail

A voicemail from William was discovered on Margaret's old phone. Margaret exported it as an MP3 in June 2024.

```json
{
  "id": "william-voicemail-2003",
  "filename": "william-voicemail-2003.mp3",
  "title": "William's voicemail, March 2003",
  "description": "Asking after the family on a Sunday afternoon. His voice is very clear.",
  "date": "2003-03-16",
  "dateLabel": "March 2003",
  "duration": "0:47",
  "peopleIds": ["william-curry"],
  "collectionIds": [],
  "source": "Margaret's saved voicemails, exported June 2024",
  "identifiedBy": "Margaret Curry, June 2024",
  "confidence": "high",
  "lastVerified": "2024-06-15"
}
```

Place the file at `public/audio/william-voicemail-2003.mp3` and push. The recording will immediately appear on William's person page under "Recordings of William Curry".

### Replacing placeholder files

The site ships with 1-byte placeholder MP3 files. These will not play. When you have the real audio files, replace them:

```bash
# Your exported voicemail is already named correctly
cp ~/Desktop/william-voicemail-2003.mp3 public/audio/william-voicemail-2003.mp3
```

Push the replacement file. No JSON changes needed — the `filename` field already points to the correct path.

### What works today / what's planned

- **Today:** Audio recordings appear on person detail pages as stacked player cards with play/pause, title, and metadata.
- **Future:** Collection pages will optionally list audio entries alongside photos. A lightbox-style audio overlay is planned for a later phase.

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

## Exporting the archive

Any authenticated family member can download a complete offline copy of the archive at any time.

### How to export

Click **"Download the archive →"** in the footer at the bottom of any page. The browser will immediately download a ZIP file named `curry-family-archive-{date}.zip`.

### What is in the archive

| File | Contents |
| ---- | -------- |
| `content/family.json` | All family members |
| `content/photos.json` | All photograph metadata |
| `content/videos.json` | All film and recording metadata |
| `content/audio.json` | All voice recordings and audio metadata |
| `content/collections.json` | All collection definitions |
| `content/playlists.json` | All playlist definitions |
| `index.html` | A self-contained browser viewer for the archive |
| `README.txt` | Explanation of the archive format |

### The offline viewer

Open `index.html` in any web browser — no internet connection, no Vercel, no Next.js required. It works offline, on any operating system, now and in the future. The viewer shows all six content types in a tabbed interface, with the AgeWish palette and serif typography.

The HTML is a single self-contained file: all JSON data is embedded inline. There are no external scripts, no CDN fonts, no remote resources. As long as the HTML file exists, the archive can be read.

### What is NOT included

The actual photo, audio, and video files are not bundled. The archive documents their filenames and metadata, but the binaries are large (potentially hundreds of MB) and would make the download impractical. To retrieve the binary files, clone the source repository from GitHub. Video recordings are linked to YouTube or Vimeo via their `sourceId` — those remain accessible as long as the platform hosts them.

### Periodic backups recommended

Export the archive whenever significant new content is added. Store the ZIP in a durable location (a hard drive, a cloud storage account, a family member's computer). The archive is the insurance policy for the site — if Vercel ever goes away, the JSON and the offline viewer ensure the family data is never lost.

---

## Writing a chronicle

A chronicle is a written family story — a founding moment, an ordinary summer, a life at its turning point. Unlike a photo caption or a bio, a chronicle has room to breathe: paragraphs, a chronological or reflective arc, direct quotes from relatives, the kind of detail that would otherwise be lost.

Chronicles live at `/chronicles` and on the detail pages of every person tagged in them.

---

### When to write a chronicle vs leave a memory in a photo caption

Write a chronicle when:
- The story is more than 2–3 sentences long
- The event deserves to be read as a narrative, not just glanced at as metadata
- You have a recording of someone telling the story (or you want to record one)
- The moment involved multiple people and a sequence of events

A photo caption is enough when:
- One sentence places the photo in context ("Christmas morning, 1974")
- The photo speaks for itself and context is minimal
- The memory belongs primarily to one photo, not a broader period or event

---

### Field reference

| Field          | Required | Description |
| -------------- | -------- | ----------- |
| `id`           | Yes      | Kebab-case slug. **Never rename after publishing** — used in the URL (`/chronicles/{id}`) and as the primary key. |
| `title`        | Yes      | Display title. Sentence case: `"Starting the Curry Martial Arts School"`. |
| `subtitle`     | No       | Short italic phrase under the title: `"How a basement studio became a 30-year institution"`. |
| `body`         | Yes      | The chronicle text as a markdown string. Plain prose is fine — markdown is optional. |
| `audioFilename` | No      | Filename of the narration recording in `/public/audio/`. Example: `"starting-the-school-narration.mp3"`. |
| `audioDuration` | No      | Duration string: `"8:42"`. Shown alongside the audio player. |
| `date`         | No       | ISO date `"YYYY-MM-DD"`. Used for sorting (newest first on /chronicles). |
| `dateLabel`    | No       | Display string: `"Summer 1979"`. Shown as an eyebrow on cards and detail pages. |
| `peopleIds`    | No       | Array of person IDs who appear in the story. Each person's detail page will show a "Chronicles featuring" section. |
| `coverPhotoId` | No       | Photo ID from `photos.json` displayed at the top of the chronicle detail page. |
| `collectionIds` | No      | Collection IDs for future cross-tagging. Empty array is fine. |
| `source`       | No       | Where this story came from: `"Robert Curry, interviewed by Thomas Walsh, 2022"`. |
| `identifiedBy` | No       | Who wrote or verified the chronicle: `"Thomas Walsh, November 2022"`. |
| `circa`        | No       | `true` when the date is approximate. Displays as "Circa Summer 1979". |
| `confidence`   | No       | `"high"`, `"medium"`, or `"low"`. Confidence in the account. |
| `lastVerified` | No       | ISO date when this entry was last reviewed: `"2022-11-14"`. |

---

### Markdown cheatsheet

The `body` field is a markdown string. Plain text renders as prose — you do not have to use any markdown syntax. When you want formatting:

| What you want       | How to write it         | Result |
| ------------------- | ----------------------- | ------ |
| *Italics*           | `*italicised text*`     | Italics |
| **Bold**            | `**bold text**`         | Bold |
| Blockquote          | `> quoted text`         | Indented gold-bordered quote |
| Section heading     | `## Heading text`       | Section heading |
| Paragraph break     | Blank line between paragraphs | New paragraph |
| Em dash             | `--` (two hyphens) or `—` (actual em dash character) | — |
| Bullet list         | `- item one`            | Bulleted list |

**Rules:**
- One blank line between paragraphs — a single line break is treated as a space.
- Do NOT use HTML tags inside the body — they are stripped for security.
- Chapter headings (`## Heading`) are useful for long chronicles with distinct sections.
- Blockquotes (`> ...`) work well for direct quotes from family members: *"That's a good floor," he said.*

---

### Recording the narration

An audio narration is the author reading the chronicle aloud. It is optional but adds significant warmth — hearing the story in someone's voice anchors it in a way text alone cannot.

**Recording tips:**
- Find a quiet room. Close doors, windows, HVAC vents if possible. Carpet absorbs echo; tile reverberates.
- Do a short test recording and listen back on headphones before the full take.
- Leave a few seconds of silence at the start and end — gives editing room for any cleanup.
- Speak at a natural pace. Slightly slower than conversation reads better as a recording.
- If you stumble, pause, back up to the start of the sentence, and continue — it is easy to edit out.

**File format:**
- Save as **MP3** for broadest browser support.
- **Recommended bitrate: 64–128 kbps mono.** Excellent voice quality at small file size.
- Stereo is only necessary for music — voice recordings sound identical in mono and use half the storage.

**Naming the file:**

Use a descriptive, lowercase, kebab-case filename matching the chronicle ID:

```
starting-the-school-narration.mp3
```

Place the file in:
```
public/audio/starting-the-school-narration.mp3
```

Then in `content/chronicles.json`, set:
```json
"audioFilename": "starting-the-school-narration.mp3",
"audioDuration": "8:42"
```

The audio player appears automatically at the top of the chronicle detail page when `audioFilename` is present.

---

### Worked example — a chronicle from start to finish

**Step 1 — Write the story.** You can write it directly in the JSON, but it is easier to write it as plain text first, then paste it in.

**Step 2 — Add to chronicles.json:**

```json
{
  "id": "starting-the-martial-arts-school",
  "title": "Starting the Curry Martial Arts School",
  "subtitle": "How a basement studio became a 30-year institution",
  "body": "In the summer of 1979, Robert Curry cleared out the basement...\n\nHis father William helped him lay the foam mats. It took them most of a Saturday.",
  "audioFilename": "starting-the-school-narration.mp3",
  "audioDuration": "4:12",
  "date": "1979-06-01",
  "dateLabel": "Summer 1979",
  "peopleIds": ["robert-curry", "william-curry"],
  "coverPhotoId": "1981-lake-house-01",
  "collectionIds": [],
  "source": "Robert Curry, interviewed by Thomas Walsh, 2022",
  "identifiedBy": "Thomas Walsh, November 2022",
  "confidence": "high",
  "lastVerified": "2022-11-14"
}
```

Note: `\n\n` in JSON creates a paragraph break in the rendered chronicle. If you are writing directly in a JSON editor, you can also use actual newlines inside a multi-line string (some editors support this). Both work.

**Step 3 — Place the narration file (if you have one):**

```bash
cp ~/Desktop/roberts-narration.mp3 public/audio/starting-the-school-narration.mp3
```

**Step 4 — Verify locally:**

```bash
npm run build
```

Visit `http://localhost:3000/chronicles` — the new card appears.
Visit `http://localhost:3000/chronicles/starting-the-martial-arts-school` — title, audio player, body, and people chips render.

**Step 5 — Push to GitHub.** Vercel rebuilds automatically in approximately 90 seconds.

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
