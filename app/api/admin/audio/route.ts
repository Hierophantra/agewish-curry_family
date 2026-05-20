// app/api/admin/audio/route.ts
// POST - upload a new audio recording and commit its JSON entry to GitHub.
//
// Flow:
//   1. Auth check (must be in ADMIN_GITHUB_USERNAMES allowlist)
//   2. Parse multipart/form-data: file + metadata (JSON string)
//   3. Validate file: MIME type / extension whitelist + 4MB size limit
//   4. Upload to Vercel Blob (public access) → get Blob URL
//   5. Validate id uniqueness + cross-references (peopleIds, collectionIds)
//   6. Append new Audio entry to content/audio.json, commit via GitHub API
//   7. Return { ok: true, id } - Vercel rebuilds; live site updates in ~90s
//
// Size limit note: serverless function bodies are limited to ~4MB by default.
// For files larger than 4MB, the client-upload (Blob direct upload) pattern would be needed.
// That is a future enhancement (Phase 27+). Until then, the 4MB limit is documented.
import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { auth } from '@/auth'
import { getAdminUser } from '@/lib/admin'
import { getFileContent, commitFile } from '@/lib/github'
import { getPeople, getCollections } from '@/lib/content'

const MAX_SIZE_BYTES = 4 * 1024 * 1024 // 4MB
// MIME types accepted for audio uploads.
// Browsers vary in how they report audio MIME types (especially for M4A),
// so both the MIME type and file extension are checked.
const ALLOWED_MIME_TYPES = new Set([
  'audio/mpeg',    // MP3
  'audio/mp3',     // MP3 (some browsers)
  'audio/m4a',     // M4A
  'audio/x-m4a',   // M4A (Safari)
  'audio/mp4',     // M4A/AAC in MP4 container
  'audio/aac',     // AAC
  'audio/wav',     // WAV
  'audio/x-wav',   // WAV (alternative MIME)
  'audio/vnd.wav', // WAV (RFC)
])
const ALLOWED_EXTENSIONS = new Set(['mp3', 'm4a', 'aac', 'wav'])

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
    title?: unknown
    description?: unknown
    date?: unknown
    dateLabel?: unknown
    duration?: unknown
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

  // Validate title
  const title = typeof metadata.title === 'string' ? metadata.title.trim() : ''
  if (!title) {
    return new NextResponse('metadata.title is required', { status: 400 })
  }

  // Validate MIME type and extension
  const mimeType = file.type
  // Extract filename from the file object (Blob may have a name property via File)
  const fileName = (file as File).name ?? ''
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''

  if (!ALLOWED_MIME_TYPES.has(mimeType) && !ALLOWED_EXTENSIONS.has(ext)) {
    return new NextResponse(
      `Unsupported file type: "${mimeType}" (.${ext}). Allowed: MP3, M4A, AAC, WAV.`,
      { status: 400 }
    )
  }

  // Validate file size (server-side defence; client-side already checks)
  if (file.size > MAX_SIZE_BYTES) {
    return new NextResponse(
      'Audio file is too large (maximum 4MB). Compress the audio or contact the developer for larger files.',
      { status: 400 }
    )
  }

  // Read file as Buffer for Blob upload
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Determine a safe storage filename for Vercel Blob.
  // Use audio id + original extension to ensure stable, predictable paths.
  const safeExt = ALLOWED_EXTENSIONS.has(ext) ? ext : 'mp3'
  const blobFilename = `audio/${id}.${safeExt}`

  // Upload to Vercel Blob
  let blobUrl: string
  try {
    const blob = await put(blobFilename, buffer, {
      access: 'public',
      contentType: mimeType || `audio/${safeExt}`,
    })
    blobUrl = blob.url
  } catch (err) {
    return new NextResponse(`Blob upload failed: ${err}`, { status: 500 })
  }

  // Validate cross-references
  const crossRefError = validateCrossRefs(
    (metadata.peopleIds as string[] | undefined) ?? [],
    (metadata.collectionIds as string[] | undefined) ?? []
  )
  if (crossRefError) {
    return new NextResponse(crossRefError, { status: 400 })
  }

  // Read current audio.json from GitHub
  const jsonFile = await getFileContent(accessToken, 'content/audio.json')
  if (!jsonFile) {
    return new NextResponse('content/audio.json not found in repo', { status: 500 })
  }

  let audioItems: Array<Record<string, unknown>>
  try {
    audioItems = JSON.parse(jsonFile.content)
    if (!Array.isArray(audioItems)) throw new Error('Not an array')
  } catch (err) {
    return new NextResponse(`Invalid JSON in audio.json: ${err}`, { status: 500 })
  }

  // Check id uniqueness
  if (audioItems.some((a) => a.id === id)) {
    return new NextResponse(
      `Audio ID "${id}" already exists. Choose a different id.`,
      { status: 400 }
    )
  }

  // Build new audio entry - filename is the Blob URL (hybrid storage pattern)
  const newAudio: Record<string, unknown> = {
    id,
    filename: blobUrl,  // full Vercel Blob URL; getAudioUrl() handles both URL + legacy paths
    title,
  }
  if (typeof metadata.description === 'string' && metadata.description.trim()) {
    newAudio.description = metadata.description.trim()
  }
  if (typeof metadata.date === 'string' && metadata.date.trim()) {
    newAudio.date = metadata.date.trim()
  }
  if (typeof metadata.dateLabel === 'string' && metadata.dateLabel.trim()) {
    newAudio.dateLabel = metadata.dateLabel.trim()
  }
  if (typeof metadata.duration === 'string' && metadata.duration.trim()) {
    newAudio.duration = metadata.duration.trim()
  }
  newAudio.peopleIds = Array.isArray(metadata.peopleIds) ? metadata.peopleIds : []
  newAudio.collectionIds = Array.isArray(metadata.collectionIds) ? metadata.collectionIds : []

  // Append and commit
  audioItems.push(newAudio)
  const newContent = JSON.stringify(audioItems, null, 2) + '\n'

  try {
    await commitFile({
      accessToken,
      path: 'content/audio.json',
      newContent,
      sha: jsonFile.sha,
      message: `admin: add audio "${title}"`,
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
