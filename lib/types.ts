// lib/types.ts
// Zod schemas are the single source of truth.
// TypeScript types are derived from schemas via z.infer<> — never manually written.
// This ensures runtime validation (Zod) and type checking (TypeScript) always agree.
import { z } from 'zod'

// ── Person schema ──
// Person.id is a kebab-case slug (e.g., "william-curry").
// This format is STABLE and used by: family tree nodes, photo peopleIds[], /person/[id] routes.
// NEVER rename an id after content is published — it is the primary key across all content types.
export const PersonSchema = z.object({
  id: z.string().regex(
    /^[a-z][a-z0-9-]*[a-z0-9]$|^[a-z]$/,
    'Person ID must be kebab-case (e.g., william-curry)'
  ),
  name: z.string().min(1, 'Person name cannot be empty'),

  // v2: rich display fields
  relationLabel: z.string().optional(),  // e.g. "PATRIARCH", "SON", "GRANDDAUGHTER" — tree-node eyebrow
  eyebrow: z.string().optional(),        // e.g. "Patriarch of the family", "Son of William"
  spouseLabel: z.string().optional(),    // display name of primary spouse (no separate Person record)

  // Dates — v1 integer year fields (back-compat) + v2 ISO + display label
  birthYear: z.number().int().optional(),
  deathYear: z.number().int().optional(),
  birthDate: z.string().optional(),      // ISO YYYY-MM-DD
  deathDate: z.string().optional(),      // ISO YYYY-MM-DD
  datesLabel: z.string().optional(),     // e.g. "1920 — 2008", "1952 — present"

  // Birthplace — v2 canonical name + v1 back-compat alias
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
})

// ── Photo schema ──
// Photo.filename refers to a file in /public/photos/{filename}.
// dateTaken is the v1 ISO 8601 date string (back-compat alias for `date`).
export const PhotoSchema = z.object({
  id: z.string().min(1),
  filename: z.string().min(1),
  caption: z.string().optional(),

  // Dates — v2 ISO + display label; v1 dateTaken back-compat
  date: z.string().optional(),           // ISO YYYY-MM-DD (v2 canonical)
  dateTaken: z.string().optional(),      // v1 alias — components fall back to this
  dateLabel: z.string().optional(),      // e.g. "December 2005"

  // Tags
  peopleIds: z.array(z.string()).default([]),
  collectionIds: z.array(z.string()).default([]),  // v2 — which collections this photo belongs to

  // Optional metadata
  location: z.string().optional(),
  notes: z.string().optional(),
})

// ── Video schema ──
// source: "youtube" | "vimeo" — switching source is a one-field JSON edit.
// sourceId: the video ID on the platform (YouTube video ID or Vimeo video ID).
export const VideoSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  source: z.enum(['youtube', 'vimeo']),
  sourceId: z.string().min(1),

  // Dates — v2 ISO + display label; v1 dateTaken back-compat
  date: z.string().optional(),           // ISO YYYY-MM-DD (v2 canonical)
  dateTaken: z.string().optional(),      // v1 alias
  dateLabel: z.string().optional(),      // e.g. "April 2000"

  duration: z.string().optional(),       // e.g. "12:34"

  // Tags + featured flag
  peopleIds: z.array(z.string()).default([]),
  playlistIds: z.array(z.string()).default([]),  // v2 — which playlists this video belongs to
  featured: z.boolean().default(false),
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

// ── TypeScript types (derived from schemas — do not manually duplicate) ──
export type Person = z.infer<typeof PersonSchema>
export type Photo = z.infer<typeof PhotoSchema>
export type Video = z.infer<typeof VideoSchema>
export type Collection = z.infer<typeof CollectionSchema>
export type Playlist = z.infer<typeof PlaylistSchema>
