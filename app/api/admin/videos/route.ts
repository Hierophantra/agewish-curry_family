// app/api/admin/videos/route.ts
// POST - create a new video.
// Body: full video object (id, title, source, sourceId are required; all other fields optional).
//
// Flow:
//   1. Auth check (must be in ADMIN_GITHUB_USERNAMES allowlist)
//   2. Parse + validate request body via VideoSchema (Zod)
//   3. Check id uniqueness against existing videos
//   4. Cross-validate peopleIds, playlistIds against content files
//   5. Append to content/videos.json and commit to GitHub via octokit
//   6. Vercel auto-rebuilds; live site updates in ~90s
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getAdminUser } from '@/lib/admin'
import { getFileContent, commitFile } from '@/lib/github'
import { VideoSchema } from '@/lib/types'
import { getPeople, getPlaylists } from '@/lib/content'
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

  // Validate via VideoSchema (Zod)
  let video: ReturnType<typeof VideoSchema.parse>
  try {
    video = VideoSchema.parse(body)
  } catch (err) {
    if (err instanceof ZodError) {
      const messages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')
      return new NextResponse(`Validation error: ${messages}`, { status: 400 })
    }
    return new NextResponse('Validation failed', { status: 400 })
  }

  // Cross-validate peopleIds, playlistIds
  const crossRefError = validateCrossRefs(video)
  if (crossRefError) {
    return new NextResponse(crossRefError, { status: 400 })
  }

  // Read current videos.json from GitHub
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

  // Check id uniqueness
  if (videos.some((v) => v.id === video.id)) {
    return new NextResponse(
      `Video ID "${video.id}" already exists. Choose a different id.`,
      { status: 400 }
    )
  }

  // Append new video
  videos.push(video as Record<string, unknown>)
  const newContent = JSON.stringify(videos, null, 2) + '\n'

  try {
    await commitFile({
      accessToken,
      path: 'content/videos.json',
      newContent,
      sha: file.sha,
      message: `admin: add video "${video.title}"`,
      committerName: adminLogin,
      committerEmail: `${adminLogin}@users.noreply.github.com`,
    })
  } catch (err) {
    return new NextResponse(`Commit failed: ${err}`, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: video.id })
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
