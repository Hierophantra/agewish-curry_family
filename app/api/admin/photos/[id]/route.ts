// app/api/admin/photos/[id]/route.ts
// POST  - update an existing photo's metadata (no file change; file is immutable).
// DELETE - remove a photo entry from photos.json; deletes from Vercel Blob if it was uploaded.
//
// Flow:
//   1. Auth check (must be in ADMIN_GITHUB_USERNAMES allowlist)
//   2. Read content/photos.json via octokit
//   3. Find the photo by id
//   4. POST: merge whitelisted fields into existing record, commit
//   5. DELETE: remove from array; if filename is a Blob URL, delete from Vercel Blob; commit
import { NextResponse } from 'next/server'
import { del } from '@vercel/blob'
import { auth } from '@/auth'
import { getAdminUser } from '@/lib/admin'
import { getFileContent, commitFile } from '@/lib/github'
import { getPeople, getCollections } from '@/lib/content'

// Whitelist of editable metadata fields - filename/id/blurDataUrl are immutable after upload.
const EDITABLE_FIELDS = new Set([
  'caption', 'date', 'dateLabel', 'location', 'notes', 'peopleIds', 'collectionIds', 'visibility',
])

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

  // Strip non-editable fields (filename, id, blurDataUrl are read-only)
  const filteredBody: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(body)) {
    if (EDITABLE_FIELDS.has(key)) {
      filteredBody[key] = value
    }
  }

  // Read photos.json from GitHub
  const file = await getFileContent(accessToken, 'content/photos.json')
  if (!file) {
    return new NextResponse('content/photos.json not found in repo', { status: 500 })
  }

  let photos: Array<Record<string, unknown>>
  try {
    photos = JSON.parse(file.content)
    if (!Array.isArray(photos)) throw new Error('Not an array')
  } catch (err) {
    return new NextResponse(`Invalid JSON in photos.json: ${err}`, { status: 500 })
  }

  const idx = photos.findIndex((p) => p.id === params.id)
  if (idx === -1) {
    return new NextResponse(`Photo not found: ${params.id}`, { status: 404 })
  }

  // Validate cross-references in new values
  const newPeopleIds = (filteredBody.peopleIds as string[] | undefined) ?? (photos[idx].peopleIds as string[]) ?? []
  const newCollectionIds = (filteredBody.collectionIds as string[] | undefined) ?? (photos[idx].collectionIds as string[]) ?? []
  const crossRefError = validateCrossRefs(newPeopleIds, newCollectionIds)
  if (crossRefError) {
    return new NextResponse(crossRefError, { status: 400 })
  }

  // Merge changed fields into existing record (id, filename, blurDataUrl preserved from existing)
  const existing = photos[idx]
  photos[idx] = { ...existing, ...filteredBody }

  const newContent = JSON.stringify(photos, null, 2) + '\n'
  const caption = typeof photos[idx].caption === 'string' ? photos[idx].caption : params.id

  try {
    await commitFile({
      accessToken,
      path: 'content/photos.json',
      newContent,
      sha: file.sha,
      message: `admin: update photo "${caption}"`,
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

  // Read photos.json from GitHub
  const file = await getFileContent(accessToken, 'content/photos.json')
  if (!file) {
    return new NextResponse('content/photos.json not found in repo', { status: 500 })
  }

  let photos: Array<Record<string, unknown>>
  try {
    photos = JSON.parse(file.content)
    if (!Array.isArray(photos)) throw new Error('Not an array')
  } catch (err) {
    return new NextResponse(`Invalid JSON in photos.json: ${err}`, { status: 500 })
  }

  const idx = photos.findIndex((p) => p.id === params.id)
  if (idx === -1) {
    return new NextResponse(`Photo not found: ${params.id}`, { status: 404 })
  }

  const removed = photos[idx]
  const filename = typeof removed.filename === 'string' ? removed.filename : ''
  const caption = typeof removed.caption === 'string' ? removed.caption : params.id

  // Delete from Vercel Blob if the filename is a Blob URL (not a legacy /public/photos/ entry)
  if (filename.startsWith('https://')) {
    try {
      await del(filename)
    } catch (err) {
      // Non-fatal: log and continue. Commit proceeds even if Blob delete fails.
      // (Blob may have already been deleted manually, or token may not have delete access)
      console.error(`Blob delete failed for "${filename}":`, err)
    }
  }

  // Remove from array
  photos.splice(idx, 1)
  const newContent = JSON.stringify(photos, null, 2) + '\n'

  try {
    await commitFile({
      accessToken,
      path: 'content/photos.json',
      newContent,
      sha: file.sha,
      message: `admin: remove photo "${caption}"`,
      committerName: adminLogin,
      committerEmail: `${adminLogin}@users.noreply.github.com`,
    })
  } catch (err) {
    return new NextResponse(`Commit failed: ${err}`, { status: 500 })
  }

  return NextResponse.json({ ok: true, deleted: params.id })
}

// Validate that all peopleIds and collectionIds exist in content.
// Returns an error string if invalid, null if all refs are clean.
function validateCrossRefs(peopleIds: string[], collectionIds: string[]): string | null {
  const people = getPeople()
  const collections = getCollections()
  const validPeopleIds = new Set(people.map((p) => p.id))
  const validCollectionIds = new Set(collections.map((c) => c.id))

  for (const pid of peopleIds) {
    if (!validPeopleIds.has(pid)) {
      return `Unknown person ID "${pid}". Check content/family.json.`
    }
  }

  for (const cid of collectionIds) {
    if (!validCollectionIds.has(cid)) {
      return `Unknown collection ID "${cid}". Check content/collections.json.`
    }
  }

  return null
}
