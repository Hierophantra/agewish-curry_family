// lib/content.ts
// SOLE access point for all family content data.
// Components NEVER read JSON directly or call fs.readFileSync themselves.
// This is the ONLY file that reads from content/*.json.
// server-only: this module uses fs and should only run on the server.
import 'server-only'
import { readFileSync } from 'fs'
import { join } from 'path'
import { z } from 'zod'
import { PersonSchema, PhotoSchema, VideoSchema } from './types'
import type { Person, Photo, Video } from './types'

// ── Internal file reader ──
// Uses .parse() (throws ZodError) not .safeParse() — fail loud on bad content.
// z.ZodType<Output, Def, Input> lets TypeScript infer the *output* type (post-default filling),
// not the input type. This ensures fields with .default([]) appear as string[], not string[] | undefined.
function readJSON<Output, Def extends z.ZodTypeDef, Input>(
  filename: string,
  schema: z.ZodType<Output, Def, Input>
): Output {
  const filePath = join(process.cwd(), 'content', filename)
  const raw = readFileSync(filePath, 'utf-8')
  const parsed = JSON.parse(raw)
  // .parse() throws a ZodError with field-level detail if validation fails.
  // This surfaces content mistakes at build/request time, not silently.
  return schema.parse(parsed)
}

// ── Public loaders ──

export function getPeople(): Person[] {
  return readJSON('family.json', z.array(PersonSchema))
}

export function getPhotos(): Photo[] {
  return readJSON('photos.json', z.array(PhotoSchema))
}

export function getVideos(): Video[] {
  return readJSON('videos.json', z.array(VideoSchema))
}

export function getPersonById(id: string): Person | null {
  return getPeople().find((p) => p.id === id) ?? null
}

// ── Bidirectional reference validator ──
// Validates that all cross-references between content types resolve.
// Throws descriptively if a reference is dangling — surfaces data entry errors.
//
// Checks:
// 1. Photo.peopleIds[] → every ID must exist in family.json
// 2. Person.photoIds[] → every ID must exist in photos.json
//
// Call from protected layout in development, or from a build-time script.
export function validateBidirectionalRefs(): void {
  const people = getPeople()
  const photos = getPhotos()

  const personIds = new Set(people.map((p) => p.id))
  const photoIds = new Set(photos.map((p) => p.id))

  // Check photo → person references
  for (const photo of photos) {
    for (const pid of photo.peopleIds) {
      if (!personIds.has(pid)) {
        throw new Error(
          `Content error: Photo "${photo.id}" references unknown person ID "${pid}". ` +
          `Check content/photos.json — "${pid}" must be an id in content/family.json.`
        )
      }
    }
  }

  // Check person → photo references
  for (const person of people) {
    for (const phid of person.photoIds) {
      if (!photoIds.has(phid)) {
        throw new Error(
          `Content error: Person "${person.id}" references unknown photo ID "${phid}". ` +
          `Check content/family.json — "${phid}" must be an id in content/photos.json.`
        )
      }
    }
  }
}
