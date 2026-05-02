// lib/content.ts
// SOLE access point for all family content data.
// Components NEVER read JSON directly or call fs.readFileSync themselves.
// This is the ONLY file that reads from content/*.json.
// server-only: this module uses fs and should only run on the server.
import 'server-only'
import { readFileSync } from 'fs'
import { join } from 'path'
import { z } from 'zod'
import { PersonSchema, PhotoSchema, VideoSchema, CollectionSchema, PlaylistSchema, AudioSchema, ChronicleSchema } from './types'
import type { Person, Photo, Video, Collection, Playlist, Audio, Chronicle } from './types'

// ── Photo URL helper ──
// Re-exported from lib/utils.ts so server-side imports can use a single source.
// Client components should import getPhotoUrl from '@/lib/utils' directly
// (lib/content.ts is server-only and cannot be imported by 'use client' modules).
export { getPhotoUrl } from './utils'

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

// ── Collection loaders (v2) ──

export function getCollections(): Collection[] {
  return readJSON('collections.json', z.array(CollectionSchema))
}

export function getCollectionById(id: string): Collection | null {
  return getCollections().find((c) => c.id === id) ?? null
}

export function getPhotosInCollection(collectionId: string): Photo[] {
  return getPhotos().filter((p) => p.collectionIds?.includes(collectionId))
}

// ── Playlist loaders (v2) ──

export function getPlaylists(): Playlist[] {
  return readJSON('playlists.json', z.array(PlaylistSchema))
}

export function getPlaylistById(id: string): Playlist | null {
  return getPlaylists().find((p) => p.id === id) ?? null
}

export function getVideosInPlaylist(playlistId: string): Video[] {
  return getVideos().filter((v) => v.playlistIds?.includes(playlistId))
}

// ── Filtered loaders (v2) ──

export function getFeaturedVideos(): Video[] {
  return getVideos().filter((v) => v.featured === true)
}

export function getPhotosByPersonId(personId: string): Photo[] {
  return getPhotos().filter((p) => p.peopleIds?.includes(personId))
}

export function getVideosByPersonId(personId: string): Video[] {
  return getVideos().filter((v) => v.peopleIds?.includes(personId))
}

// ── Audio loaders (Phase 17) ──

export function getAudio(): Audio[] {
  return readJSON('audio.json', z.array(AudioSchema))
}

export function getAudioById(id: string): Audio | null {
  return getAudio().find((a) => a.id === id) ?? null
}

export function getAudioByPersonId(personId: string): Audio[] {
  return getAudio().filter((a) => a.peopleIds?.includes(personId))
}

export function getAudioInCollection(collectionId: string): Audio[] {
  return getAudio().filter((a) => a.collectionIds?.includes(collectionId))
}

// ── Chronicle loaders (Phase 19) ──

export function getChronicles(): Chronicle[] {
  return readJSON('chronicles.json', z.array(ChronicleSchema))
}

export function getChronicleById(id: string): Chronicle | null {
  return getChronicles().find((c) => c.id === id) ?? null
}

export function getChroniclesByPersonId(personId: string): Chronicle[] {
  return getChronicles().filter((c) => c.peopleIds.includes(personId))
}

export function getChroniclesInCollection(collectionId: string): Chronicle[] {
  return getChronicles().filter((c) => c.collectionIds.includes(collectionId))
}

// ── Bidirectional reference validator ──
// Validates that all cross-references between content types resolve.
// Throws descriptively if a reference is dangling — surfaces data entry errors.
//
// Checks:
// 1. Photo.peopleIds[] → every ID must exist in family.json
// 2. Person.photoIds[] → every ID must exist in photos.json
// 3. Photo.collectionIds[] → every ID must exist in collections.json (empty array is valid)
// 4. Video.playlistIds[] → every ID must exist in playlists.json (empty array is valid)
// 5. Collection.coverPhotoId → must exist in photos.json
// 6. Playlist.coverVideoId → must exist in videos.json
// 7. Family tree: spouseIds, parentIds, childIds reciprocity
//
// Call from protected layout in development, or from a build-time script.
export function validateBidirectionalRefs(): void {
  const people = getPeople()
  const photos = getPhotos()
  const videos = getVideos()
  const collections = getCollections()
  const playlists = getPlaylists()
  const audioItems = getAudio()
  const chronicles = getChronicles()

  const personIds = new Set(people.map((p) => p.id))
  const photoIds = new Set(photos.map((p) => p.id))
  const videoIds = new Set(videos.map((v) => v.id))
  const collectionIds = new Set(collections.map((c) => c.id))
  const playlistIds = new Set(playlists.map((p) => p.id))

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

  // Check photo → collection references (empty collectionIds[] is valid)
  for (const photo of photos) {
    for (const cid of photo.collectionIds) {
      if (!collectionIds.has(cid)) {
        throw new Error(
          `Content error: Photo "${photo.id}" references unknown collection ID "${cid}". ` +
          `Check content/photos.json — "${cid}" must be an id in content/collections.json.`
        )
      }
    }
  }

  // Check video → playlist references (empty playlistIds[] is valid)
  for (const video of videos) {
    for (const pid of video.playlistIds) {
      if (!playlistIds.has(pid)) {
        throw new Error(
          `Content error: Video "${video.id}" references unknown playlist ID "${pid}". ` +
          `Check content/videos.json — "${pid}" must be an id in content/playlists.json.`
        )
      }
    }
  }

  // Check collection → cover photo references
  for (const collection of collections) {
    if (!photoIds.has(collection.coverPhotoId)) {
      throw new Error(
        `Content error: Collection "${collection.id}" has unknown coverPhotoId "${collection.coverPhotoId}". ` +
        `Check content/collections.json — "${collection.coverPhotoId}" must be an id in content/photos.json.`
      )
    }
  }

  // Check playlist → cover video references
  for (const playlist of playlists) {
    if (!videoIds.has(playlist.coverVideoId)) {
      throw new Error(
        `Content error: Playlist "${playlist.id}" has unknown coverVideoId "${playlist.coverVideoId}". ` +
        `Check content/playlists.json — "${playlist.coverVideoId}" must be an id in content/videos.json.`
      )
    }
  }

  // Check audio → person references (Phase 17)
  for (const audio of audioItems) {
    for (const pid of audio.peopleIds) {
      if (!personIds.has(pid)) {
        throw new Error(
          `Content error: Audio "${audio.id}" references unknown person ID "${pid}". ` +
          `Check content/audio.json — "${pid}" must be an id in content/family.json.`
        )
      }
    }
  }

  // Check audio → collection references (empty collectionIds[] is valid)
  for (const audio of audioItems) {
    for (const cid of audio.collectionIds) {
      if (!collectionIds.has(cid)) {
        throw new Error(
          `Content error: Audio "${audio.id}" references unknown collection ID "${cid}". ` +
          `Check content/audio.json — "${cid}" must be an id in content/collections.json.`
        )
      }
    }
  }

  // --- Family tree cross-reference validation (Phase 4) ---
  // Validates spouseIds, parentIds, childIds within family.json
  // Catches dangling refs and reciprocity violations before calcTree sees them.
  const treePersons = getPeople()
  const treePersonIds = new Set(treePersons.map((p) => p.id))

  for (const person of treePersons) {
    // spouseIds: must exist AND be reciprocal (spouse relationships must be bidirectional)
    for (const sid of person.spouseIds) {
      if (!treePersonIds.has(sid)) {
        throw new Error(
          `Content error: Person "${person.id}" has unknown spouseId "${sid}". ` +
          `Check content/family.json.`
        )
      }
      const spouse = treePersons.find((p) => p.id === sid)!
      if (!spouse.spouseIds.includes(person.id)) {
        throw new Error(
          `Content error: "${person.id}" lists "${sid}" as a spouse, but "${sid}" ` +
          `does not list "${person.id}" in return. Spouse relationships must be bidirectional.`
        )
      }
    }

    // parentIds: must exist AND parent must claim this person as a child
    for (const pid of person.parentIds) {
      if (!treePersonIds.has(pid)) {
        throw new Error(
          `Content error: Person "${person.id}" has unknown parentId "${pid}". ` +
          `Check content/family.json.`
        )
      }
      const parent = treePersons.find((p) => p.id === pid)!
      // Support both childIds (v1) and childrenIds (v2) — check either
      const parentChildren = parent.childIds.length > 0 ? parent.childIds : parent.childrenIds
      if (!parentChildren.includes(person.id)) {
        throw new Error(
          `Content error: "${person.id}" lists "${pid}" as a parent, but "${pid}" ` +
          `does not list "${person.id}" in childIds/childrenIds. Parent↔child refs must be bidirectional.`
        )
      }
    }

    // childIds: existence only (reciprocity covered by parentIds check above)
    for (const cid of person.childIds) {
      if (!treePersonIds.has(cid)) {
        throw new Error(
          `Content error: Person "${person.id}" has unknown childId "${cid}". ` +
          `Check content/family.json.`
        )
      }
    }

    // childrenIds (v2): existence only
    for (const cid of person.childrenIds) {
      if (!treePersonIds.has(cid)) {
        throw new Error(
          `Content error: Person "${person.id}" has unknown childrenId "${cid}". ` +
          `Check content/family.json.`
        )
      }
    }
  }

  // --- Chronicle cross-reference validation (Phase 19) ---
  // D-18: peopleIds → family.json, coverPhotoId → photos.json, collectionIds → collections.json
  for (const chronicle of chronicles) {
    // Check chronicle → person references
    for (const pid of chronicle.peopleIds) {
      if (!personIds.has(pid)) {
        throw new Error(
          `Content error: Chronicle "${chronicle.id}" references unknown person ID "${pid}". ` +
          `Check content/chronicles.json — "${pid}" must be an id in content/family.json.`
        )
      }
    }

    // Check chronicle → cover photo reference (if present)
    if (chronicle.coverPhotoId && !photoIds.has(chronicle.coverPhotoId)) {
      throw new Error(
        `Content error: Chronicle "${chronicle.id}" has unknown coverPhotoId "${chronicle.coverPhotoId}". ` +
        `Check content/chronicles.json — "${chronicle.coverPhotoId}" must be an id in content/photos.json.`
      )
    }

    // Check chronicle → collection references (empty array is valid)
    for (const cid of chronicle.collectionIds) {
      if (!collectionIds.has(cid)) {
        throw new Error(
          `Content error: Chronicle "${chronicle.id}" references unknown collection ID "${cid}". ` +
          `Check content/chronicles.json — "${cid}" must be an id in content/collections.json.`
        )
      }
    }
  }
}
