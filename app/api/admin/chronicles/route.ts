// app/api/admin/chronicles/route.ts
// POST - create a new chronicle.
// Body: full chronicle object (id, title, body are required; all other fields optional).
//
// Flow:
//   1. Auth check (must be in ADMIN_GITHUB_USERNAMES allowlist)
//   2. Parse + validate request body via ChronicleSchema (Zod)
//   3. Check id uniqueness against existing chronicles
//   4. Cross-validate peopleIds, collectionIds, coverPhotoId against content files
//   5. Append to content/chronicles.json and commit to GitHub via octokit
//   6. Vercel auto-rebuilds; live site updates in ~90s
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getAdminUser } from '@/lib/admin'
import { getFileContent, commitFile } from '@/lib/github'
import { ChronicleSchema } from '@/lib/types'
import { getPeople, getCollections, getPhotos } from '@/lib/content'
import { ZodError } from 'zod'

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

  // Parse request body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new NextResponse('Invalid JSON body', { status: 400 })
  }

  // Validate via ChronicleSchema (Zod)
  let chronicle: ReturnType<typeof ChronicleSchema.parse>
  try {
    chronicle = ChronicleSchema.parse(body)
  } catch (err) {
    if (err instanceof ZodError) {
      const messages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')
      return new NextResponse(`Validation error: ${messages}`, { status: 400 })
    }
    return new NextResponse('Validation failed', { status: 400 })
  }

  // Cross-validate peopleIds, collectionIds, coverPhotoId
  const validationError = validateCrossRefs(chronicle)
  if (validationError) {
    return new NextResponse(validationError, { status: 400 })
  }

  // Read current chronicles.json from GitHub
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

  // Check id uniqueness
  if (chronicles.some((c) => c.id === chronicle.id)) {
    return new NextResponse(
      `Chronicle ID "${chronicle.id}" already exists. Choose a different id.`,
      { status: 400 }
    )
  }

  // Append new chronicle
  chronicles.push(chronicle as Record<string, unknown>)
  const newContent = JSON.stringify(chronicles, null, 2) + '\n'

  try {
    await commitFile({
      accessToken,
      path: 'content/chronicles.json',
      newContent,
      sha: file.sha,
      message: `admin: add chronicle "${chronicle.title}"`,
      committerName: adminLogin,
      committerEmail: `${adminLogin}@users.noreply.github.com`,
    })
  } catch (err) {
    return new NextResponse(`Commit failed: ${err}`, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: chronicle.id })
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
