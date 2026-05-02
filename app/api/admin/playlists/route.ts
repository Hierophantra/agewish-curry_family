// app/api/admin/playlists/route.ts
// POST — create a new playlist.
// Body: full playlist object (id, title, coverVideoId are required; all other fields optional).
//
// Flow:
//   1. Auth check (must be in ADMIN_GITHUB_USERNAMES allowlist)
//   2. Parse + validate request body via PlaylistSchema (Zod)
//   3. Check id uniqueness against existing playlists
//   4. Cross-validate coverVideoId against videos.json
//   5. Append to content/playlists.json and commit to GitHub via octokit
//   6. Vercel auto-rebuilds; live site updates in ~90s
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getAdminUser } from '@/lib/admin'
import { getFileContent, commitFile } from '@/lib/github'
import { PlaylistSchema } from '@/lib/types'
import { getVideos } from '@/lib/content'
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

  // Validate via PlaylistSchema (Zod)
  let playlist: ReturnType<typeof PlaylistSchema.parse>
  try {
    playlist = PlaylistSchema.parse(body)
  } catch (err) {
    if (err instanceof ZodError) {
      const messages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')
      return new NextResponse(`Validation error: ${messages}`, { status: 400 })
    }
    return new NextResponse('Validation failed', { status: 400 })
  }

  // Cross-validate coverVideoId against videos.json
  const crossRefError = validateCrossRefs(playlist)
  if (crossRefError) {
    return new NextResponse(crossRefError, { status: 400 })
  }

  // Read current playlists.json from GitHub
  const file = await getFileContent(accessToken, 'content/playlists.json')
  if (!file) {
    return new NextResponse('content/playlists.json not found in repo', { status: 500 })
  }

  let playlists: Array<Record<string, unknown>>
  try {
    playlists = JSON.parse(file.content)
    if (!Array.isArray(playlists)) throw new Error('Not an array')
  } catch (err) {
    return new NextResponse(`Invalid JSON in playlists.json: ${err}`, { status: 500 })
  }

  // Check id uniqueness
  if (playlists.some((p) => p.id === playlist.id)) {
    return new NextResponse(
      `Playlist ID "${playlist.id}" already exists. Choose a different id.`,
      { status: 400 }
    )
  }

  // Append new playlist
  playlists.push(playlist as Record<string, unknown>)
  const newContent = JSON.stringify(playlists, null, 2) + '\n'

  try {
    await commitFile({
      accessToken,
      path: 'content/playlists.json',
      newContent,
      sha: file.sha,
      message: `admin: add playlist "${playlist.title}"`,
      committerName: adminLogin,
      committerEmail: `${adminLogin}@users.noreply.github.com`,
    })
  } catch (err) {
    return new NextResponse(`Commit failed: ${err}`, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: playlist.id })
}

// Validate cross-references to other content types.
// Returns an error string if invalid, null if all refs are clean.
function validateCrossRefs(
  playlist: { coverVideoId: string }
): string | null {
  const videos = getVideos()
  const videoIds = new Set(videos.map((v) => v.id))

  if (!videoIds.has(playlist.coverVideoId)) {
    return `Unknown video ID "${playlist.coverVideoId}". Check content/videos.json.`
  }

  return null
}
