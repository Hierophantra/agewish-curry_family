// lib/content.ts
// SOLE access point for all family content data.
// Components NEVER read JSON directly or call fs.readFileSync themselves.
// This is the ONLY file that reads from content/*.json.
// server-only: this module uses fs and should only run on the server.
import 'server-only'
import { readFileSync } from 'fs'
import { join } from 'path'
import { z } from 'zod'
import { PersonSchema, PhotoSchema, VideoSchema, CollectionSchema, PlaylistSchema, AudioSchema, ChronicleSchema, HeroSchema, ThemeSchema, TreeLayoutSchema, SiteSchema, ScreensSchema } from './types'
import type { Person, Photo, Video, Collection, Playlist, Audio, Chronicle, Hero, Theme, TreeLayout, Site, Screens } from './types'
import { HeroImageSchema } from './types'
import { showsInGallery, showsOnPersonProfile } from './visibility'
import { getPhotoUrl as photoUrl } from './utils'

// ── Photo URL helper ──
// Re-exported from lib/utils.ts so server-side imports can use a single source.
// Client components should import getPhotoUrl from '@/lib/utils' directly
// (lib/content.ts is server-only and cannot be imported by 'use client' modules).
export { getPhotoUrl } from './utils'

// ── Internal file reader ──
// Uses .parse() (throws ZodError) not .safeParse() - fail loud on bad content.
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
  return readJSON('family.json', z.array(PersonSchema)).map(normalizePerson)
}

// Non-destructive v1/v2 alias normalization (audit Phase 2). The schema keeps
// both names (childIds/childrenIds, spouseId/spouseIds, birthPlace/birthplace)
// and real data stores both, but readers diverged: lib/tree.ts reads childIds +
// spouseIds while PersonPanel reads childrenIds. A person saved with only the v2
// name would silently drop from the tree. Mirroring both here (preferring the v2
// name when present) makes every consumer see consistent data without a risky
// schema/data migration. The on-disk JSON is untouched.
function normalizePerson(p: Person): Person {
  const kids = p.childrenIds.length > 0 ? p.childrenIds : p.childIds
  const spouses = p.spouseIds.length > 0 ? p.spouseIds : (p.spouseId ? [p.spouseId] : [])
  const birthplace = p.birthplace ?? p.birthPlace
  return {
    ...p,
    childrenIds: kids,
    childIds: kids,
    spouseIds: spouses,
    spouseId: p.spouseId ?? spouses[0],
    birthplace,
    birthPlace: birthplace,
  }
}

export function getPhotos(): Photo[] {
  return readJSON('photos.json', z.array(PhotoSchema))
}

export function getPhotoById(id: string): Photo | null {
  return getPhotos().find((p) => p.id === id) ?? null
}

export function getVideos(): Video[] {
  return readJSON('videos.json', z.array(VideoSchema))
}

export function getVideoById(id: string): Video | null {
  return getVideos().find((v) => v.id === id) ?? null
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

// Gallery / collection view: photos allowed in the main Photographs section.
// "gallery" (Photos only) and "everywhere" both show here; "profile" and
// "hidden" stay out even if the photo carries a collectionId.
export function getPhotosInCollection(collectionId: string): Photo[] {
  return getPhotos().filter(
    (p) => p.collectionIds?.includes(collectionId) && showsInGallery(p.visibility),
  )
}

// ── Playlist loaders (v2) ──

export function getPlaylists(): Playlist[] {
  return readJSON('playlists.json', z.array(PlaylistSchema))
}

export function getPlaylistById(id: string): Playlist | null {
  return getPlaylists().find((p) => p.id === id) ?? null
}

// Video playlists: videos allowed in the main Videos section. "gallery"
// (Videos only) and "everywhere" both show here; "profile" and "hidden" stay
// out. Existing videos default to "everywhere" so all current playlists are
// unaffected.
export function getVideosInPlaylist(playlistId: string): Video[] {
  return getVideos().filter(
    (v) => v.playlistIds?.includes(playlistId) && showsInGallery(v.visibility),
  )
}

// ── Filtered loaders (v2) ──

export function getFeaturedVideos(): Video[] {
  return getVideos().filter((v) => v.featured === true)
}

// Profile + family-tree view: photos linked to the person and allowed on
// their profile. "profile" and "everywhere" show here; "gallery" (Photos only)
// and "hidden" do not.
export function getPhotosByPersonId(personId: string): Photo[] {
  return getPhotos().filter(
    (p) => p.peopleIds?.includes(personId)
      && showsOnPersonProfile(p.visibility, p.peopleVisibility?.[personId]),
  )
}

export function getVideosByPersonId(personId: string): Video[] {
  return getVideos().filter(
    (v) => v.peopleIds?.includes(personId)
      && showsOnPersonProfile(v.visibility, v.peopleVisibility?.[personId]),
  )
}

// Admin-only: ALL media linked to a person regardless of visibility, so the
// admin can see and re-show hidden items. Used by the person media manager.
export function getAllPhotosByPersonId(personId: string): Photo[] {
  return getPhotos().filter((p) => p.peopleIds?.includes(personId))
}

export function getAllVideosByPersonId(personId: string): Video[] {
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

// ── Hero config loader (v3.2) ──
// Returns the home-page hero rotator settings - rotation interval, transition
// duration, and per-image opacity + objectPosition. Edited via /admin/hero.
// Returns a defaulted-empty config if the file is missing so the site doesn't
// hard-fail; HeroBackdrop handles the empty-images case gracefully.
export function getHero(): Hero {
  try {
    return readJSON('hero.json', HeroSchema)
  } catch {
    return { rotationMs: 8000, transitionMs: 2200, images: [] }
  }
}

// Hero rotation resolved for RENDERING: hero.json images PLUS any photos flagged
// `inHero` (the visibility add-on). The /admin/hero editor still edits only
// hero.json; photo-sourced hero images are managed per-photo via "Also in hero
// rotation". The home page renders getResolvedHero(); the admin editor uses
// getHero().
export function getResolvedHero(): Hero {
  const hero = getHero()
  const inHeroPhotos = getPhotos().filter((p) => p.inHero)
  const photoImages = inHeroPhotos.map((p) =>
    HeroImageSchema.parse({
      src: photoUrl(p),
      ...(typeof p.heroOpacity === 'number' ? { opacity: p.heroOpacity } : {}),
      ...(p.heroObjectPosition ? { objectPosition: p.heroObjectPosition } : {}),
      ...(p.heroFit ? { fit: p.heroFit } : {}),
      enabled: true,
    }),
  )
  // Dedupe by src so an imported hero photo supersedes its hero.json twin
  // (no double in the rotation). If nothing is imported, hero.json is unchanged.
  const photoSrcs = new Set(photoImages.map((i) => i.src))
  const jsonImages = hero.images.filter((i) => !photoSrcs.has(i.src))
  return { ...hero, images: [...photoImages, ...jsonImages] }
}

// ── Theme loader (v3.5) ──
// Runtime theme overrides (colors + ambient light + per-page) from the Shift+E
// editor. Returns a safe empty default if the file is missing/invalid so the
// site renders with the compiled globals.css defaults.
export function getTheme(): Theme {
  try {
    return readJSON('theme.json', ThemeSchema)
  } catch {
    return ThemeSchema.parse({})
  }
}

// ── Tree layout loader ──
// Admin manual arrangement of the family tree (per-node position + color).
// Returns an empty layout if the file is missing/invalid so the tree falls
// back to the pure auto-computed relatives-tree layout.
export function getTreeLayout(): TreeLayout {
  try {
    return readJSON('tree-layout.json', TreeLayoutSchema)
  } catch {
    return TreeLayoutSchema.parse({})
  }
}

// ── Site chrome loader ──
// Editable brand mark + nav labels/visibility + footer CTA. Missing/invalid
// file returns schema defaults (= today's hardcoded chrome), so it is safe to
// ship before content/site.json exists.
export function getSite(): Site {
  try {
    return readJSON('site.json', SiteSchema)
  } catch {
    return SiteSchema.parse({})
  }
}

// ── Screen section config loader ──
// Per-screen section show/hide toggles. Missing/invalid file returns defaults
// (= today's section layout), so it is safe to ship before content/screens.json.
export function getScreens(): Screens {
  try {
    return readJSON('screens.json', ScreensSchema)
  } catch {
    return ScreensSchema.parse({})
  }
}

// ── Bidirectional reference validator ──
// Validates that all cross-references between content types resolve.
// Throws descriptively if a reference is dangling - surfaces data entry errors.
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
          `Check content/photos.json - "${pid}" must be an id in content/family.json.`
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
          `Check content/family.json - "${phid}" must be an id in content/photos.json.`
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
          `Check content/photos.json - "${cid}" must be an id in content/collections.json.`
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
          `Check content/videos.json - "${pid}" must be an id in content/playlists.json.`
        )
      }
    }
  }

  // Check collection → cover photo references
  for (const collection of collections) {
    if (!photoIds.has(collection.coverPhotoId)) {
      throw new Error(
        `Content error: Collection "${collection.id}" has unknown coverPhotoId "${collection.coverPhotoId}". ` +
        `Check content/collections.json - "${collection.coverPhotoId}" must be an id in content/photos.json.`
      )
    }
  }

  // Check playlist → cover video references
  for (const playlist of playlists) {
    if (!videoIds.has(playlist.coverVideoId)) {
      throw new Error(
        `Content error: Playlist "${playlist.id}" has unknown coverVideoId "${playlist.coverVideoId}". ` +
        `Check content/playlists.json - "${playlist.coverVideoId}" must be an id in content/videos.json.`
      )
    }
  }

  // Check audio → person references (Phase 17)
  for (const audio of audioItems) {
    for (const pid of audio.peopleIds) {
      if (!personIds.has(pid)) {
        throw new Error(
          `Content error: Audio "${audio.id}" references unknown person ID "${pid}". ` +
          `Check content/audio.json - "${pid}" must be an id in content/family.json.`
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
          `Check content/audio.json - "${cid}" must be an id in content/collections.json.`
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
      // Support both childIds (v1) and childrenIds (v2) - check either
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
          `Check content/chronicles.json - "${pid}" must be an id in content/family.json.`
        )
      }
    }

    // Check chronicle → cover photo reference (if present)
    if (chronicle.coverPhotoId && !photoIds.has(chronicle.coverPhotoId)) {
      throw new Error(
        `Content error: Chronicle "${chronicle.id}" has unknown coverPhotoId "${chronicle.coverPhotoId}". ` +
        `Check content/chronicles.json - "${chronicle.coverPhotoId}" must be an id in content/photos.json.`
      )
    }

    // Check chronicle → collection references (empty array is valid)
    for (const cid of chronicle.collectionIds) {
      if (!collectionIds.has(cid)) {
        throw new Error(
          `Content error: Chronicle "${chronicle.id}" references unknown collection ID "${cid}". ` +
          `Check content/chronicles.json - "${cid}" must be an id in content/collections.json.`
        )
      }
    }

    // Check chronicle → video references (empty array is valid)
    for (const vid of chronicle.videoIds) {
      if (!videoIds.has(vid)) {
        throw new Error(
          `Content error: Chronicle "${chronicle.id}" references unknown video ID "${vid}". ` +
          `Check content/chronicles.json - "${vid}" must be an id in content/videos.json.`
        )
      }
    }
  }
}
