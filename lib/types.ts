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
  birthYear: z.number().int().optional(),
  deathYear: z.number().int().optional(),
  birthPlace: z.string().optional(),
  bio: z.string().optional(),
  photoIds: z.array(z.string()).default([]),
  parentIds: z.array(z.string()).default([]),
  childIds: z.array(z.string()).default([]),
  spouseIds: z.array(z.string()).default([]),
  gender: z.enum(['male', 'female', 'other']).optional(),
})

// ── Photo schema ──
// Photo.filename refers to a file in /public/photos/{filename} (v1).
// dateTaken is an ISO 8601 date string (YYYY-MM-DD) — loosely validated as string.
export const PhotoSchema = z.object({
  id: z.string().min(1),
  filename: z.string().min(1),
  caption: z.string().optional(),
  dateTaken: z.string().optional(),
  peopleIds: z.array(z.string()).default([]),
})

// ── Video schema ──
// source: "youtube" | "vimeo" — switching source is a one-field JSON edit (Phase 3).
// sourceId: the video ID on the platform (YouTube video ID or Vimeo video ID).
export const VideoSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  source: z.enum(['youtube', 'vimeo']),
  sourceId: z.string().min(1),
  dateTaken: z.string().optional(),
  peopleIds: z.array(z.string()).default([]),
})

// ── TypeScript types (derived from schemas — do not manually duplicate) ──
export type Person = z.infer<typeof PersonSchema>
export type Photo = z.infer<typeof PhotoSchema>
export type Video = z.infer<typeof VideoSchema>
