// app/api/admin/videos/[id]/route.ts
// POST  - update an existing video (partial update; omitted fields preserved).
// DELETE - remove a video by id.
//
// Flow:
//   1. Auth check (must be in ADMIN_GITHUB_USERNAMES allowlist)
//   2. Read content/videos.json via octokit
//   3. Find the video by id
//   4. POST: merge in changed fields, validate merged result via VideoSchema, commit
//   5. DELETE: remove from array, commit
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getAdminUser } from '@/lib/admin'
import { getFileContent, commitFile } from '@/lib/github'
import { VideoSchema } from '@/lib/types'
import { getPeople, getPlaylists } from '@/lib/content'
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

  // Read videos.json from GitHub
  const file = await getFileContent(accessToken, 'content/videos.json')
  if (!file) {
    return new NextResponse('content/videos.json not found in repo', { status: 500 })
  }

  let videos: Array<Record<string, unknown>>
  try {
    videos = JSON.parse(file.content)
    if (!Array.isArray(videos)) throw new Error('Not an array')
  } catch (err) {
    return new NextResponse(`Invalid JSON in videos.json: ${err}`, { status: 500 })
  }

  const idx = videos.findIndex((v) => v.id === params.id)
  if (idx === -1) {
    return new NextResponse(`Video not found: ${params.id}`, { status: 404 })
  }

  // Merge changed fields into existing record
  const existing = videos[idx]
  const merged = { ...existing, ...body }

  // Validate merged result via VideoSchema
  let validated: ReturnType<typeof VideoSchema.parse>
  try {
    validated = VideoSchema.parse(merged)
  } catch (err) {
    if (err instanceof ZodError) {
      const messages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')
      return new NextResponse(`Validation error: ${messages}`, { status: 400 })
    }
    return new NextResponse('Validation failed', { status: 400 })
  }

  // Cross-validate references
  const crossRefError = validateCrossRefs(validated)
  if (crossRefError) {
    return new NextResponse(crossRefError, { status: 400 })
  }

  // Replace the record in place (use validated object to strip unknown fields)
  videos[idx] = validated as unknown as Record<string, unknown>
  const newContent = JSON.stringify(videos, null, 2) + '\n'

  try {
    await commitFile({
      accessToken,
      path: 'content/videos.json',
      newContent,
      sha: file.sha,
      message: `admin: update video "${validated.title}"`,
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

  // Read videos.json from GitHub
  const file = await getFileContent(accessToken, 'content/videos.json')
  if (!file) {
    return new NextResponse('content/videos.json not found in repo', { status: 500 })
  }

  let videos: Array<Record<string, unknown>>
  try {
    videos = JSON.parse(file.content)
    if (!Array.isArray(videos)) throw new Error('Not an array')
  } catch (err) {
    return new NextResponse(`Invalid JSON in videos.json: ${err}`, { status: 500 })
  }

  const idx = videos.findIndex((v) => v.id === params.id)
  if (idx === -1) {
    return new NextResponse(`Video not found: ${params.id}`, { status: 404 })
  }

  const removed = videos[idx]
  const title = typeof removed.title === 'string' ? removed.title : params.id

  // Remove from array
  videos.splice(idx, 1)
  const newContent = JSON.stringify(videos, null, 2) + '\n'

  try {
    await commitFile({
      accessToken,
      path: 'content/videos.json',
      newContent,
      sha: file.sha,
      message: `admin: remove video "${title}"`,
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
  video: { peopleIds: string[]; playlistIds: string[] }
): string | null {
  const people = getPeople()
  const playlists = getPlaylists()

  const personIds = new Set(people.map((p) => p.id))
  const playlistIds = new Set(playlists.map((pl) => pl.id))

  for (const pid of video.peopleIds) {
    if (!personIds.has(pid)) {
      return `Unknown person ID "${pid}". Check content/family.json.`
    }
  }

  for (const plid of video.playlistIds) {
    if (!playlistIds.has(plid)) {
      return `Unknown playlist ID "${plid}". Check content/playlists.json.`
    }
  }

  return null
}
