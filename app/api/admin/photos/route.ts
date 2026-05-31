// app/api/admin/photos/route.ts
// POST - upload a new photograph and commit its JSON entry to GitHub.
//
// Flow:
//   1. Auth check (must be in ADMIN_GITHUB_USERNAMES allowlist)
//   2. Parse multipart/form-data: file + metadata (JSON string)
//   3. Validate file: MIME type whitelist + 4MB size limit
//   4. Upload to Vercel Blob (public access) → get Blob URL
//   5. Generate BlurHash data URL from file buffer via plaiceholder
//   6. Validate id uniqueness + cross-references (peopleIds, collectionIds)
//   7. Append new Photo entry to content/photos.json, commit via GitHub API
//   8. Return { ok: true, id } - Vercel rebuilds; live site updates in ~90s
import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { getPlaiceholder } from 'plaiceholder'
import { auth } from '@/auth'
import { getAdminUser } from '@/lib/admin'
import { getFileContent, commitFile } from '@/lib/github'
import { getPeople, getCollections } from '@/lib/content'

const MAX_SIZE_BYTES = 4 * 1024 * 1024 // 4MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])

export async function POST(request: Request) {
  const adminLogin = await getAdminUser()
  if (!adminLogin) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const session = await auth()
  const accessToken = session?.user?.githubAccessToken
  if (!accessToken) {
    return new NextResponse('No GitHub access token in session', { status: 401 })
  }

  // Parse multipart/form-data
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return new NextResponse('Failed to parse form data', { status: 400 })
  }

  const file = formData.get('file')
  const metadataRaw = formData.get('metadata')

  if (!file || !(file instanceof Blob)) {
    return new NextResponse('Missing file field in form data', { status: 400 })
  }
  if (!metadataRaw || typeof metadataRaw !== 'string') {
    return new NextResponse('Missing metadata field in form data', { status: 400 })
  }

  // Parse metadata JSON
  let metadata: {
    id?: unknown
    caption?: unknown
    date?: unknown
    dateLabel?: unknown
    location?: unknown
    notes?: unknown
    visibility?: unknown
    inHero?: unknown
    peopleIds?: unknown
    collectionIds?: unknown
  }
  try {
    metadata = JSON.parse(metadataRaw)
    if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) {
      return new NextResponse('metadata must be a JSON object', { status: 400 })
    }
  } catch {
    return new NextResponse('Invalid JSON in metadata field', { status: 400 })
  }

  // Validate id
  const id = typeof metadata.id === 'string' ? metadata.id.trim() : ''
  if (!id) {
    return new NextResponse('metadata.id is required', { status: 400 })
  }
  if (!/^[a-z][a-z0-9-]*[a-z0-9]$|^[a-z]$/.test(id)) {
    return new NextResponse(
      'metadata.id must be kebab-case (lowercase letters, digits, hyphens)',
      { status: 400 }
    )
  }

  // Validate MIME type
  const mimeType = file.type
  if (!ALLOWED_TYPES.has(mimeType)) {
    return new NextResponse(
      `Unsupported file type: ${mimeType}. Allowed types: JPEG, PNG, WebP.`,
      { status: 400 }
    )
  }

  // Validate file size (server-side defence; client-side already checks)
  if (file.size > MAX_SIZE_BYTES) {
    return new NextResponse(
      'Image is too large. Compress to under 4MB or contact the developer.',
      { status: 400 }
    )
  }

  // Read file as Buffer for plaiceholder + Blob upload
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Determine a safe storage filename for Vercel Blob.
  // Use the photo id to ensure stable, predictable Blob paths.
  // Derive extension from MIME type.
  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg'
  const blobFilename = `photos/${id}.${ext}`

  // Upload to Vercel Blob
  let blobUrl: string
  try {
    const blob = await put(blobFilename, buffer, {
      access: 'public',
      contentType: mimeType,
    })
    blobUrl = blob.url
  } catch (err) {
    return new NextResponse(`Blob upload failed: ${err}`, { status: 500 })
  }

  // Generate BlurHash via plaiceholder
  let blurDataUrl: string | undefined
  try {
    const { base64 } = await getPlaiceholder(buffer, { size: 10 })
    blurDataUrl = base64
  } catch {
    // Non-fatal: photo still works without blur placeholder
    blurDataUrl = undefined
  }

  // Validate cross-references
  const crossRefError = validateCrossRefs(
    (metadata.peopleIds as string[] | undefined) ?? [],
    (metadata.collectionIds as string[] | undefined) ?? []
  )
  if (crossRefError) {
    return new NextResponse(crossRefError, { status: 400 })
  }

  // Read current photos.json from GitHub
  const file2 = await getFileContent(accessToken, 'content/photos.json')
  if (!file2) {
    return new NextResponse('content/photos.json not found in repo', { status: 500 })
  }

  let photos: Array<Record<string, unknown>>
  try {
    photos = JSON.parse(file2.content)
    if (!Array.isArray(photos)) throw new Error('Not an array')
  } catch (err) {
    return new NextResponse(`Invalid JSON in photos.json: ${err}`, { status: 500 })
  }

  // Check id uniqueness
  if (photos.some((p) => p.id === id)) {
    return new NextResponse(
      `Photo ID "${id}" already exists. Choose a different id.`,
      { status: 400 }
    )
  }

  // Build new photo entry - filename is the Blob URL (hybrid storage pattern)
  const newPhoto: Record<string, unknown> = {
    id,
    filename: blobUrl,  // full Vercel Blob URL; getPhotoUrl() handles both URL + legacy paths
  }
  if (typeof metadata.caption === 'string' && metadata.caption.trim()) {
    newPhoto.caption = metadata.caption.trim()
  }
  if (typeof metadata.date === 'string' && metadata.date.trim()) {
    newPhoto.date = metadata.date.trim()
  }
  if (typeof metadata.dateLabel === 'string' && metadata.dateLabel.trim()) {
    newPhoto.dateLabel = metadata.dateLabel.trim()
  }
  if (typeof metadata.location === 'string' && metadata.location.trim()) {
    newPhoto.location = metadata.location.trim()
  }
  if (typeof metadata.notes === 'string' && metadata.notes.trim()) {
    newPhoto.notes = metadata.notes.trim()
  }
  newPhoto.peopleIds = Array.isArray(metadata.peopleIds) ? metadata.peopleIds : []
  newPhoto.collectionIds = Array.isArray(metadata.collectionIds) ? metadata.collectionIds : []
  // Visibility (v3.6): accept the base enum; map legacy 'profile' → 'profile-tree';
  // default to everywhere if absent/invalid so the photo behaves like legacy data.
  if (typeof metadata.visibility === 'string') {
    const v = metadata.visibility === 'profile' ? 'profile-tree' : metadata.visibility
    if (['hidden', 'profile-tree', 'gallery', 'gallery-profile', 'everywhere'].includes(v)) {
      newPhoto.visibility = v
    }
  }
  // Hero add-on (independent of base visibility)
  if (metadata.inHero === true) {
    newPhoto.inHero = true
  }
  if (blurDataUrl) {
    newPhoto.blurDataUrl = blurDataUrl
  }

  // Append and commit
  photos.push(newPhoto)
  const newContent = JSON.stringify(photos, null, 2) + '\n'

  const caption = typeof metadata.caption === 'string' && metadata.caption.trim()
    ? metadata.caption.trim()
    : id

  try {
    await commitFile({
      accessToken,
      path: 'content/photos.json',
      newContent,
      sha: file2.sha,
      message: `admin: add photo "${caption}"`,
      committerName: adminLogin,
      committerEmail: `${adminLogin}@users.noreply.github.com`,
    })
  } catch (err) {
    return new NextResponse(`Commit failed: ${err}`, { status: 500 })
  }

  return NextResponse.json({ ok: true, id, blobUrl })
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

