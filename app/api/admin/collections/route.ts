// app/api/admin/collections/route.ts
// POST — create a new collection.
// Body: full collection object (id, title, coverPhotoId are required; all other fields optional).
//
// Flow:
//   1. Auth check (must be in ADMIN_GITHUB_USERNAMES allowlist)
//   2. Parse + validate request body via CollectionSchema (Zod)
//   3. Check id uniqueness against existing collections
//   4. Cross-validate coverPhotoId against photos.json
//   5. Append to content/collections.json and commit to GitHub via octokit
//   6. Vercel auto-rebuilds; live site updates in ~90s
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getAdminUser } from '@/lib/admin'
import { getFileContent, commitFile } from '@/lib/github'
import { CollectionSchema } from '@/lib/types'
import { getPhotos } from '@/lib/content'
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

  // Validate via CollectionSchema (Zod)
  let collection: ReturnType<typeof CollectionSchema.parse>
  try {
    collection = CollectionSchema.parse(body)
  } catch (err) {
    if (err instanceof ZodError) {
      const messages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')
      return new NextResponse(`Validation error: ${messages}`, { status: 400 })
    }
    return new NextResponse('Validation failed', { status: 400 })
  }

  // Cross-validate coverPhotoId against photos.json
  const crossRefError = validateCrossRefs(collection)
  if (crossRefError) {
    return new NextResponse(crossRefError, { status: 400 })
  }

  // Read current collections.json from GitHub
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

  // Check id uniqueness
  if (collections.some((c) => c.id === collection.id)) {
    return new NextResponse(
      `Collection ID "${collection.id}" already exists. Choose a different id.`,
      { status: 400 }
    )
  }

  // Append new collection
  collections.push(collection as Record<string, unknown>)
  const newContent = JSON.stringify(collections, null, 2) + '\n'

  try {
    await commitFile({
      accessToken,
      path: 'content/collections.json',
      newContent,
      sha: file.sha,
      message: `admin: add collection "${collection.title}"`,
      committerName: adminLogin,
      committerEmail: `${adminLogin}@users.noreply.github.com`,
    })
  } catch (err) {
    return new NextResponse(`Commit failed: ${err}`, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: collection.id })
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
