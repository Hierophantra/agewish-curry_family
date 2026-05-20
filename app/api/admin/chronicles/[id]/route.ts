// app/api/admin/chronicles/[id]/route.ts
// POST  - update an existing chronicle (partial update; omitted fields preserved).
// DELETE - remove a chronicle by id.
//
// Flow:
//   1. Auth check (must be in ADMIN_GITHUB_USERNAMES allowlist)
//   2. Read content/chronicles.json via octokit
//   3. Find the chronicle by id
//   4. POST: merge in changed fields, validate merged result via ChronicleSchema, commit
//   5. DELETE: remove from array, commit
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getAdminUser } from '@/lib/admin'
import { getFileContent, commitFile } from '@/lib/github'
import { ChronicleSchema } from '@/lib/types'
import { getPeople, getCollections, getPhotos } from '@/lib/content'
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

  // Read chronicles.json from GitHub
  const file = await getFileContent(accessToken, 'content/chronicles.json')
  if (!file) {
    return new NextResponse('content/chronicles.json not found in repo', { status: 500 })
  }

  let chronicles: Array<Record<string, unknown>>
  try {
    chronicles = JSON.parse(file.content)
    if (!Array.isArray(chronicles)) throw new Error('Not an array')
  } catch (err) {
    return new NextResponse(`Invalid JSON in chronicles.json: ${err}`, { status: 500 })
  }

  const idx = chronicles.findIndex((c) => c.id === params.id)
  if (idx === -1) {
    return new NextResponse(`Chronicle not found: ${params.id}`, { status: 404 })
  }

  // Merge changed fields into existing record
  const existing = chronicles[idx]
  const merged = { ...existing, ...body }

  // Validate merged result via ChronicleSchema
  let validated: ReturnType<typeof ChronicleSchema.parse>
  try {
    validated = ChronicleSchema.parse(merged)
  } catch (err) {
    if (err instanceof ZodError) {
      const messages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')
      return new NextResponse(`Validation error: ${messages}`, { status: 400 })
    }
    return new NextResponse('Validation failed', { status: 400 })
  }

  // Cross-validate references
  const validationError = validateCrossRefs(validated)
  if (validationError) {
    return new NextResponse(validationError, { status: 400 })
  }

  // Replace the record in place (use validated object to strip unknown fields)
  chronicles[idx] = validated as unknown as Record<string, unknown>
  const newContent = JSON.stringify(chronicles, null, 2) + '\n'

  try {
    await commitFile({
      accessToken,
      path: 'content/chronicles.json',
      newContent,
      sha: file.sha,
      message: `admin: update chronicle "${validated.title}"`,
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

  // Read chronicles.json from GitHub
  const file = await getFileContent(accessToken, 'content/chronicles.json')
  if (!file) {
    return new NextResponse('content/chronicles.json not found in repo', { status: 500 })
  }

  let chronicles: Array<Record<string, unknown>>
  try {
    chronicles = JSON.parse(file.content)
    if (!Array.isArray(chronicles)) throw new Error('Not an array')
  } catch (err) {
    return new NextResponse(`Invalid JSON in chronicles.json: ${err}`, { status: 500 })
  }

  const idx = chronicles.findIndex((c) => c.id === params.id)
  if (idx === -1) {
    return new NextResponse(`Chronicle not found: ${params.id}`, { status: 404 })
  }

  const removed = chronicles[idx]
  const title = typeof removed.title === 'string' ? removed.title : params.id

  // Remove from array
  chronicles.splice(idx, 1)
  const newContent = JSON.stringify(chronicles, null, 2) + '\n'

  try {
    await commitFile({
      accessToken,
      path: 'content/chronicles.json',
      newContent,
      sha: file.sha,
      message: `admin: remove chronicle "${title}"`,
      committerName: adminLogin,
      committerEmail: `${adminLogin}@users.noreply.github.com`,
    })
  } catch (err) {
    return new NextResponse(`Commit failed: ${err}`, { status: 500 })
  }

  return NextResponse.json({ ok: true, deleted: params.id })
}

// Validate cross-references to other content types.
// Returns an error string if invalid, null if all refs are clean.
function validateCrossRefs(
  chronicle: { peopleIds: string[]; collectionIds: string[]; coverPhotoId?: string }
): string | null {
  const people = getPeople()
  const collections = getCollections()
  const photos = getPhotos()

  const personIds = new Set(people.map((p) => p.id))
  const collectionIds = new Set(collections.map((c) => c.id))
  const photoIds = new Set(photos.map((p) => p.id))

  for (const pid of chronicle.peopleIds) {
    if (!personIds.has(pid)) {
      return `Unknown person ID "${pid}". Check content/family.json.`
    }
  }

  for (const cid of chronicle.collectionIds) {
    if (!collectionIds.has(cid)) {
      return `Unknown collection ID "${cid}". Check content/collections.json.`
    }
  }

  if (chronicle.coverPhotoId && !photoIds.has(chronicle.coverPhotoId)) {
    return `Unknown coverPhotoId "${chronicle.coverPhotoId}". Check content/photos.json.`
  }

  return null
}
