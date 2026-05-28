// lib/types.ts
// Zod schemas are the single source of truth.
// TypeScript types are derived from schemas via z.infer<> - never manually written.
// This ensures runtime validation (Zod) and type checking (TypeScript) always agree.
import { z } from 'zod'

// ── Person schema ──
// Person.id is a kebab-case slug (e.g., "william-curry").
// This format is STABLE and used by: family tree nodes, photo peopleIds[], /person/[id] routes.
// NEVER rename an id after content is published - it is the primary key across all content types.
export const PersonSchema = z.object({
  id: z.string().regex(
    /^[a-z][a-z0-9-]*[a-z0-9]$|^[a-z]$/,
    'Person ID must be kebab-case (e.g., william-curry)'
  ),
  name: z.string().min(1, 'Person name cannot be empty'),

  // v2: rich display fields
  relationLabel: z.string().optional(),  // e.g. "PATRIARCH", "SON", "GRANDDAUGHTER" - tree-node eyebrow
  eyebrow: z.string().optional(),        // e.g. "Patriarch of the family", "Son of William"
  spouseLabel: z.string().optional(),    // display name of primary spouse (no separate Person record)

  // Dates - v1 integer year fields (back-compat) + v2 ISO + display label
  birthYear: z.number().int().optional(),
  deathYear: z.number().int().optional(),
  birthDate: z.string().optional(),      // ISO YYYY-MM-DD
  deathDate: z.string().optional(),      // ISO YYYY-MM-DD
  datesLabel: z.string().optional(),     // e.g. "1920 - 2008", "1952 - present"

  // Birthplace - v2 canonical name + v1 back-compat alias
  birthplace: z.string().optional(),
  birthPlace: z.string().optional(),     // v1 alias; loader/components normalise to birthplace

  bio: z.string().optional(),

  // Relations
  photoIds: z.array(z.string()).default([]),
  parentIds: z.array(z.string()).default([]),
  childrenIds: z.array(z.string()).default([]),  // v2 canonical name
  childIds: z.array(z.string()).default([]),      // v1 back-compat alias
  spouseId: z.string().optional(),               // v2 primary spouse (singular)
  spouseIds: z.array(z.string()).default([]),    // v1 multi-spouse array (kept for flattenMultiSpouses)

  // Existing
  gender: z.enum(['male', 'female', 'other']).optional(),

  // Display-only labels for parents who do not have their own Person record.
  // Used on the panel card to surface biological mother/father when the tree
  // visualization shows the child under a different (primary-spouse) pairing.
  motherName: z.string().optional(),
  fatherName: z.string().optional(),

  // Provenance for biographical information
  identifiedBy: z.string().optional(),    // who provided/confirmed the bio details
  circa: z.boolean().optional(),          // true if dates are approximate
  confidence: z.enum(['high', 'medium', 'low']).optional(),
  lastVerified: z.string().optional(),    // ISO YYYY-MM-DD
  notes: z.string().optional(),           // private archivist notes (not necessarily surfaced in UI)
})

// ── Visibility scope (v3.4) ──
// Controls where a person-linked media item is allowed to appear. Lets the
// archivist decide per item, rather than the system auto-assuming a photo of
// a person should show everywhere.
//   "hidden"     - linked to the person for the record, shown nowhere
//   "profile"    - person's profile page + family-tree snippet only
//   "gallery"    - the main section only (Photographs gallery for photos,
//                  Video playlists for videos); NOT the profile or tree
//   "everywhere" - profile + tree AND the main section
// "Remove" (un-linking from a person) is a separate action, not a visibility
// state - it edits the item's peopleIds.
// Defaults to "everywhere" so existing content (which predates this field)
// keeps showing exactly as before.
export const VisibilitySchema = z.enum(['hidden', 'profile', 'gallery', 'everywhere']).default('everywhere')

// ── Photo schema ──
// Photo.filename refers to a file in /public/photos/{filename}, OR a full
// https URL (Vercel Blob upload).
// dateTaken is the v1 ISO 8601 date string (back-compat alias for `date`).
export const PhotoSchema = z.object({
  id: z.string().min(1),
  filename: z.string().min(1),
  caption: z.string().optional(),

  // Dates - v2 ISO + display label; v1 dateTaken back-compat
  date: z.string().optional(),           // ISO YYYY-MM-DD (v2 canonical)
  dateTaken: z.string().optional(),      // v1 alias - components fall back to this
  dateLabel: z.string().optional(),      // e.g. "December 2005"

  // Tags
  peopleIds: z.array(z.string()).default([]),
  collectionIds: z.array(z.string()).default([]),  // v2 - which collections this photo belongs to

  // Where this photo is allowed to appear (see VisibilitySchema above)
  visibility: VisibilitySchema,

  // Optional metadata
  location: z.string().optional(),
  notes: z.string().optional(),

  // Provenance (archivist metadata - optional, surfaced where appropriate)
  source: z.string().optional(),         // e.g., "Robert Curry's photo album", "Margaret's attic, scanned 2024"
  identifiedBy: z.string().optional(),   // e.g., "Margaret Curry, March 2024"
  circa: z.boolean().optional(),         // true if date is approximate
  confidence: z.enum(['high', 'medium', 'low']).optional(),  // confidence in date/identification
  lastVerified: z.string().optional(),   // ISO YYYY-MM-DD
  scannedDate: z.string().optional(),    // ISO YYYY-MM-DD when the photo was digitized
  originalFilename: z.string().optional(),  // original filename if different from filename (for traceability)

  // BlurHash placeholder - base64 data URL generated by scripts/generate-blur-data.mjs.
  // Optional: photos without it still validate; lightbox/cards fall back gracefully.
  // Run `npm run blur` after adding real photos to populate this field.
  blurDataUrl: z.string().optional(),
})

// ── Video schema ──
// source: "youtube" | "vimeo" - switching source is a one-field JSON edit.
// sourceId: the video ID on the platform (YouTube video ID or Vimeo video ID).
export const VideoSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  source: z.enum(['youtube', 'vimeo']),
  sourceId: z.string().min(1),

  // Dates - v2 ISO + display label; v1 dateTaken back-compat
  date: z.string().optional(),           // ISO YYYY-MM-DD (v2 canonical)
  dateTaken: z.string().optional(),      // v1 alias
  dateLabel: z.string().optional(),      // e.g. "April 2000"

  duration: z.string().optional(),       // e.g. "12:34"

  // Cached thumbnail URL. YouTube videos derive their thumbnail from
  // i.ytimg.com/vi/<id>/maxresdefault.jpg at render time so they don't
  // populate this field. Vimeo requires an API call to discover the real
  // frame thumbnail, so we bake the URL in at ingest time.
  thumbnailUrl: z.string().optional(),

  // Provenance (archivist metadata - optional)
  // Note: `source_provenance` avoids a name clash with `source` (which means the video platform).
  source_provenance: z.string().optional(),  // who provided the recording (e.g., "James Curry's home video archive")
  identifiedBy: z.string().optional(),
  circa: z.boolean().optional(),
  confidence: z.enum(['high', 'medium', 'low']).optional(),
  lastVerified: z.string().optional(),
  recordedDate: z.string().optional(),  // ISO date when the video was originally recorded (vs uploaded)

  // Tags + featured flag
  peopleIds: z.array(z.string()).default([]),
  playlistIds: z.array(z.string()).default([]),  // v2 - which playlists this video belongs to
  featured: z.boolean().default(false),

  // Where this video is allowed to appear when linked to a person (see
  // VisibilitySchema). Defaults to "everywhere" so existing videos are
  // unaffected. "profile" = person page + tree only; "hidden" = nowhere.
  visibility: VisibilitySchema,
})

// ── Collection schema ──
// A Collection is a named tag grouping photos by theme or time period.
// Photos declare which collections they belong to via collectionIds[].
export const CollectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  coverPhotoId: z.string().min(1),
  date: z.string().optional(),
  dateLabel: z.string().optional(),
  description: z.string().optional(),
})

// ── Playlist schema ──
// A Playlist is a named tag grouping videos by theme or occasion.
// Videos declare which playlists they belong to via playlistIds[].
export const PlaylistSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  coverVideoId: z.string().min(1),
  description: z.string().optional(),
})

// ── Audio schema ──
// Audio.filename refers to a file in /public/audio/{filename}.
// Supports voicemails, oral histories, songs, and any other audio recordings.
export const AudioSchema = z.object({
  id: z.string().min(1),
  filename: z.string().min(1),               // file in /public/audio/{filename}
  title: z.string().min(1),                  // e.g., "Grandfather's voicemail, March 2003"
  description: z.string().optional(),        // longer context if needed
  date: z.string().optional(),               // ISO YYYY-MM-DD
  dateLabel: z.string().optional(),          // e.g., "March 2003"
  duration: z.string().optional(),           // e.g., "0:47"
  peopleIds: z.array(z.string()).default([]),
  collectionIds: z.array(z.string()).default([]),  // audio CAN be in collections (mixed-media collections)

  // Provenance (Phase 15 pattern)
  source: z.string().optional(),
  identifiedBy: z.string().optional(),
  circa: z.boolean().optional(),
  confidence: z.enum(['high', 'medium', 'low']).optional(),
  lastVerified: z.string().optional(),
  recordedDate: z.string().optional(),
})

// ── Chronicle schema ──
// A Chronicle is a written family story (markdown body) with optional audio narration.
// Audio is embedded directly on the chronicle (audioFilename field), NOT referenced from audio.json.
// A chronicle's narration is 1:1 with the chronicle; standalone audio lives in audio.json.
export const ChronicleSchema = z.object({
  id: z.string().regex(
    /^[a-z][a-z0-9-]*[a-z0-9]$|^[a-z]$/,
    'Chronicle ID must be kebab-case (e.g., starting-the-martial-arts-school)'
  ),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  body: z.string().min(1),                    // markdown source - rendered by ChronicleBody

  // Embedded audio narration (optional) - the author reading the story aloud.
  // NOT referenced from audio.json. 1:1 with the chronicle.
  audioFilename: z.string().optional(),        // file in /public/audio/{audioFilename}
  audioDuration: z.string().optional(),        // e.g. "8:42"

  // Date metadata
  date: z.string().optional(),                 // ISO YYYY-MM-DD
  dateLabel: z.string().optional(),            // e.g. "Summer 1979"

  // Cross-references
  peopleIds: z.array(z.string()).default([]),   // people featured in this story
  coverPhotoId: z.string().optional(),          // displayed at top of detail page
  collectionIds: z.array(z.string()).default([]), // future cross-tagging

  // Provenance (Phase 15 pattern)
  source: z.string().optional(),
  identifiedBy: z.string().optional(),
  circa: z.boolean().optional(),
  confidence: z.enum(['high', 'medium', 'low']).optional(),
  lastVerified: z.string().optional(),
})

// ── Hero schema ──
// Configuration for the home page hero photo rotator. Editable from /admin/hero.
// Each image has its own opacity (0-1) and objectPosition (CSS keyword or
// "X% Y%" syntax) so the maintainer can dial how much of the photo shows and
// which part is centered in the frame.
export const HeroImageSchema = z.object({
  src: z.string().min(1),                          // path under /public/ OR a full https URL (Blob)
  opacity: z.number().min(0).max(1).default(0.22), // 0 = invisible, 1 = full color
  objectPosition: z.string().default('center'),    // "center", "top", "50% 30%", etc.
  // fit: how the image fills the 16:9 hero frame.
  //   "cover"   = fill the frame, cropping as needed (focal point matters)
  //   "contain" = show the whole image, letterboxed by the ivory background
  fit: z.enum(['cover', 'contain']).default('cover'),
  enabled: z.boolean().default(true),              // toggle off without deleting the file
})

export const HeroSchema = z.object({
  rotationMs: z.number().int().min(2000).max(60000).default(8000),    // ms between transitions
  transitionMs: z.number().int().min(200).max(5000).default(2200),    // cross-fade duration
  images: z.array(HeroImageSchema).default([]),
})

// ── Theme schema (v3.5) ──
// Runtime theme overrides edited from the Shift+E visual editor and committed
// to content/theme.json. Keys map to the Tailwind v4 @theme CSS variables in
// globals.css - overriding them at runtime cascades to every utility that
// references them (bg-navy, text-gold, border-stone, ...). A key left out
// means "use the built-in default from globals.css".
//
// Hex strings only (#rrggbb or #rgb). All optional - an empty theme renders
// the site exactly as the compiled defaults.
const HexColor = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Must be a hex color like #1F2D5C').optional()

export const ThemeColorsSchema = z.object({
  navy: HexColor,
  gold: HexColor,
  goldDeep: HexColor,
  ivory: HexColor,
  ivoryDeep: HexColor,
  surface: HexColor,
  surfaceSubtle: HexColor,
  border: HexColor,
  stone: HexColor,
  muted: HexColor,
  quiet: HexColor,
}).default({})

// Ambient "light effect" - a soft radial glow placed on the page. Positionable
// (x/y as % of viewport), sizeable (% of viewport), tunable color + opacity.
export const ThemeLightSchema = z.object({
  enabled: z.boolean().default(false),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).default('#E8A91F'),
  x: z.number().min(-20).max(120).default(50),       // % across the viewport
  y: z.number().min(-20).max(120).default(12),       // % down the viewport
  size: z.number().min(10).max(160).default(70),     // diameter as % of viewport width
  opacity: z.number().min(0).max(1).default(0.10),
}).default({})

// Per-page overrides are keyed by pathname (e.g. "/tree"). Sitewide values
// live at the top level; page values layer on top for that route only.
export const ThemePageSchema = z.object({
  colors: ThemeColorsSchema,
  light: ThemeLightSchema.optional(),
}).default({})

export const ThemeSchema = z.object({
  colors: ThemeColorsSchema,
  light: ThemeLightSchema,
  pages: z.record(z.string(), ThemePageSchema).default({}),
}).default({ colors: {}, light: { enabled: false, color: '#E8A91F', x: 50, y: 12, size: 70, opacity: 0.1 }, pages: {} })

// ── TypeScript types (derived from schemas - do not manually duplicate) ──
export type Person = z.infer<typeof PersonSchema>
export type Photo = z.infer<typeof PhotoSchema>
export type Video = z.infer<typeof VideoSchema>
export type Collection = z.infer<typeof CollectionSchema>
export type Playlist = z.infer<typeof PlaylistSchema>
export type Audio = z.infer<typeof AudioSchema>
export type Chronicle = z.infer<typeof ChronicleSchema>
export type Hero = z.infer<typeof HeroSchema>
export type HeroImage = z.infer<typeof HeroImageSchema>
export type Visibility = z.infer<typeof VisibilitySchema>
export type Theme = z.infer<typeof ThemeSchema>
export type ThemeColors = z.infer<typeof ThemeColorsSchema>
export type ThemeLight = z.infer<typeof ThemeLightSchema>
