// app/api/admin/collections/[id]/route.ts
// POST   — update an existing collection (partial update; omitted fields preserved).
// DELETE — remove a collection by id.
//
// Flow:
//   1. Auth check (must be in ADMIN_GITHUB_USERNAMES allowlist)
//   2. Read content/collections.json via octokit
//   3. Find the collection by id
//
//   POST:
//   4. Merge in changed fields, validate merged result via CollectionSchema
//   5. Cross-validate coverPhotoId against photos.json
//   6. Commit updated collections.json to GitHub
//
//   DELETE:
//   4. Remove the collection from the array, commit updated collections.json
//   5. Cascade: read photos.json, remove the deleted collectionId from every photo's
//      collectionIds[] that contains it, commit updated photos.json
//      (Two sequential commits for atomic, readable history.)
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getAdminUser } from '@/lib/admin'
import { getFileContent, commitFile } from '@/lib/github'
import { CollectionSchema } from '@/lib/types'
import { getPhotos } from '@/lib/content'
import { ZodError } from 'zod'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const adminLogin = await getAdminUser()
  if (!adminLogin) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const session = await auth()
  const accessToken = session?.user?.githubAccessToken
  if (!accessToken) {
    return new NextResponse('No GitHub access token in session', { status: 401 })
  }

  // Parse request body
  let body: Record<string, unknown>
  try {
    body = await request.json()
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return new NextResponse('Body must be a JSON object', { status: 400 })
    }
  } catch {
    return new NextResponse('Invalid JSON body', { status: 400 })
  }

  // Read collections.json from GitHub
  const file = await getFileContent(accessToken, 'content/collections.json')
  if (!file) {
    return new NextResponse('content/collections.json not found in repo', { status: 500 })
  }

  let collections: Array<Record<string, unknown>>
  try {
    collections = JSON.parse(file.content)
    if (!Array.isArray(collections)) throw new Error('Not an array')
  } catch (err) {
    return new NextResponse(`Invalid JSON in collections.json: ${err}`, { status: 500 })
  }

  const idx = collections.findIndex((c) => c.id === params.id)
  if (idx === -1) {
    return new NextResponse(`Collection not found: ${params.id}`, { status: 404 })
  }

  // Merge changed fields into existing record
  const existing = collections[idx]
  const merged = { ...existing, ...body }

  // Validate merged result via CollectionSchema
  let validated: ReturnType<typeof CollectionSchema.parse>
  try {
    validated = CollectionSchema.parse(merged)
  } catch (err) {
    if (err instanceof ZodError) {
      const messages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')
      return new NextResponse(`Validation error: ${messages}`, { status: 400 })
    }
    return new NextResponse('Validation failed', { status: 400 })
  }

  // Cross-validate coverPhotoId
  const crossRefError = validateCrossRefs(validated)
  if (crossRefError) {
    return new NextResponse(crossRefError, { status: 400 })
  }

  // Replace the record in place (use validated object to strip unknown fields)
  collections[idx] = validated as unknown as Record<string, unknown>
  const newContent = JSON.stringify(collections, null, 2) + '\n'

  try {
    await commitFile({
      accessToken,
      path: 'content/collections.json',
      newContent,
      sha: file.sha,
      message: `admin: update collection "${validated.title}"`,
      committerName: adminLogin,
      committerEmail: `${adminLogin}@users.noreply.github.com`,
    })
  } catch (err) {
    return new NextResponse(`Commit failed: ${err}`, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: params.id })
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const adminLogin = await getAdminUser()
  if (!adminLogin) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const session = await auth()
  const accessToken = session?.user?.githubAccessToken
  if (!accessToken) {
    return new NextResponse('No GitHub access token in session', { status: 401 })
  }

  // ── Step 1: Remove the collection from collections.json ──
  const collectionsFile = await getFileContent(accessToken, 'content/collections.json')
  if (!collectionsFile) {
    return new NextResponse('content/collections.json not found in repo', { status: 500 })
  }

  let collections: Array<Record<string, unknown>>
  try {
    collections = JSON.parse(collectionsFile.content)
    if (!Array.isArray(collections)) throw new Error('Not an array')
  } catch (err) {
    return new NextResponse(`Invalid JSON in collections.json: ${err}`, { status: 500 })
  }

  const idx = collections.findIndex((c) => c.id === params.id)
  if (idx === -1) {
    return new NextResponse(`Collection not found: ${params.id}`, { status: 404 })
  }

  const removed = collections[idx]
  const title = typeof removed.title === 'string' ? removed.title : params.id

  // Remove from array
  collections.splice(idx, 1)
  const newCollectionsContent = JSON.stringify(collections, null, 2) + '\n'

  try {
    await commitFile({
      accessToken,
      path: 'content/collections.json',
      newContent: newCollectionsContent,
      sha: collectionsFile.sha,
      message: `admin: remove collection "${title}"`,
      committerName: adminLogin,
      committerEmail: `${adminLogin}@users.noreply.github.com`,
    })
  } catch (err) {
    return new NextResponse(`Commit failed (collections.json): ${err}`, { status: 500 })
  }

  // ── Step 2: Cascade — remove the deleted collectionId from photos.json ──
  // Read the updated photos.json. Any photo whose collectionIds[] contains params.id
  // must have that id removed. This keeps bidirectional references consistent.
  // Committed as a separate commit for clear audit history.
  const photosFile = await getFileContent(accessToken, 'content/photos.json')
  if (!photosFile) {
    // photos.json missing is unexpected but non-fatal — collection already removed.
    // Return success; log the incomplete cascade.
    console.error(
      `[admin/collections] WARNING: could not read photos.json for cascade removal of "${params.id}".` +
      ` Collection deleted but photos.json references may be stale.`
    )
    return NextResponse.json({ ok: true, deleted: params.id, cascadeWarning: 'photos.json not found' })
  }

  let photos: Array<Record<string, unknown>>
  try {
    photos = JSON.parse(photosFile.content)
    if (!Array.isArray(photos)) throw new Error('Not an array')
  } catch (err) {
    console.error(`[admin/collections] WARNING: could not parse photos.json for cascade: ${err}`)
    return NextResponse.json({ ok: true, deleted: params.id, cascadeWarning: 'photos.json parse error' })
  }

  // Remove the deleted collectionId from each photo that references it
  let photosChanged = false
  const updatedPhotos = photos.map((photo) => {
    const collectionIds = photo.collectionIds
    if (!Array.isArray(collectionIds)) return photo
    if (!collectionIds.includes(params.id)) return photo
    photosChanged = true
    return { ...photo, collectionIds: collectionIds.filter((cid) => cid !== params.id) }
  })

  if (!photosChanged) {
    // No photos referenced this collection — nothing to cascade.
    return NextResponse.json({ ok: true, deleted: params.id })
  }

  const newPhotosContent = JSON.stringify(updatedPhotos, null, 2) + '\n'

  try {
    await commitFile({
      accessToken,
      path: 'content/photos.json',
      newContent: newPhotosContent,
      sha: photosFile.sha,
      message: `admin: cascade-remove collection "${params.id}" refs from photos`,
      committerName: adminLogin,
      committerEmail: `${adminLogin}@users.noreply.github.com`,
    })
  } catch (err) {
    // Cascade commit failed — the collection is already deleted. Log and return partial success.
    console.error(`[admin/collections] WARNING: cascade commit to photos.json failed: ${err}`)
    return NextResponse.json({
      ok: true,
      deleted: params.id,
      cascadeWarning: `photos.json cascade commit failed: ${err}`,
    })
  }

  return NextResponse.json({ ok: true, deleted: params.id })
}

// Validate cross-references to other content types.
// Returns an error string if invalid, null if all refs are clean.
function validateCrossRefs(
  collection: { coverPhotoId: string }
): string | null {
  const photos = getPhotos()
  const photoIds = new Set(photos.map((p) => p.id))

  if (!photoIds.has(collection.coverPhotoId)) {
    return `Unknown photo ID "${collection.coverPhotoId}". Check content/photos.json.`
  }

  return null
}
