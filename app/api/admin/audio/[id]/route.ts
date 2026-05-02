// app/api/admin/audio/[id]/route.ts
// POST  — update an existing audio recording's metadata (no file change; file is immutable).
// DELETE — remove an audio entry from audio.json; deletes from Vercel Blob if it was uploaded.
//
// Flow:
//   1. Auth check (must be in ADMIN_GITHUB_USERNAMES allowlist)
//   2. Read content/audio.json via octokit
//   3. Find the audio entry by id
//   4. POST: merge whitelisted fields into existing record, commit
//   5. DELETE: remove from array; if filename is a Blob URL, delete from Vercel Blob; commit
import { NextResponse } from 'next/server'
import { del } from '@vercel/blob'
import { auth } from '@/auth'
import { getAdminUser } from '@/lib/admin'
import { getFileContent, commitFile } from '@/lib/github'
import { getPeople, getCollections } from '@/lib/content'

// Whitelist of editable metadata fields — filename and id are immutable after upload.
const EDITABLE_FIELDS = new Set([
  'title', 'description', 'date', 'dateLabel', 'duration', 'peopleIds', 'collectionIds',
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

  // Strip non-editable fields (filename and id are read-only)
  const filteredBody: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(body)) {
    if (EDITABLE_FIELDS.has(key)) {
      filteredBody[key] = value
    }
  }

  // Validate title if being updated — must not be empty
  if ('title' in filteredBody) {
    const newTitle = typeof filteredBody.title === 'string' ? filteredBody.title.trim() : ''
    if (!newTitle) {
      return new NextResponse('title cannot be empty', { status: 400 })
    }
    filteredBody.title = newTitle
  }

  // Read audio.json from GitHub
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

  const idx = audioItems.findIndex((a) => a.id === params.id)
  if (idx === -1) {
    return new NextResponse(`Audio not found: ${params.id}`, { status: 404 })
  }

  // Validate cross-references in new values
  const newPeopleIds = (filteredBody.peopleIds as string[] | undefined) ?? (audioItems[idx].peopleIds as string[]) ?? []
  const newCollectionIds = (filteredBody.collectionIds as string[] | undefined) ?? (audioItems[idx].collectionIds as string[]) ?? []
  const crossRefError = validateCrossRefs(newPeopleIds, newCollectionIds)
  if (crossRefError) {
    return new NextResponse(crossRefError, { status: 400 })
  }

  // Merge changed fields into existing record (id, filename preserved from existing)
  const existing = audioItems[idx]
  audioItems[idx] = { ...existing, ...filteredBody }

  const newContent = JSON.stringify(audioItems, null, 2) + '\n'
  const title = typeof audioItems[idx].title === 'string' ? audioItems[idx].title : params.id

  try {
    await commitFile({
      accessToken,
      path: 'content/audio.json',
      newContent,
      sha: jsonFile.sha,
      message: `admin: update audio "${title}"`,
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

  // Read audio.json from GitHub
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

  const idx = audioItems.findIndex((a) => a.id === params.id)
  if (idx === -1) {
    return new NextResponse(`Audio not found: ${params.id}`, { status: 404 })
  }

  const removed = audioItems[idx]
  const filename = typeof removed.filename === 'string' ? removed.filename : ''
  const title = typeof removed.title === 'string' ? removed.title : params.id

  // Delete from Vercel Blob if the filename is a Blob URL (not a legacy /public/audio/ entry)
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
  audioItems.splice(idx, 1)
  const newContent = JSON.stringify(audioItems, null, 2) + '\n'

  try {
    await commitFile({
      accessToken,
      path: 'content/audio.json',
      newContent,
      sha: jsonFile.sha,
      message: `admin: remove audio "${title}"`,
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
