// app/api/admin/playlists/[id]/route.ts
// POST   — update an existing playlist (partial update; omitted fields preserved).
// DELETE — remove a playlist by id.
//
// Flow:
//   1. Auth check (must be in ADMIN_GITHUB_USERNAMES allowlist)
//   2. Read content/playlists.json via octokit
//   3. Find the playlist by id
//
//   POST:
//   4. Merge in changed fields, validate merged result via PlaylistSchema
//   5. Cross-validate coverVideoId against videos.json
//   6. Commit updated playlists.json to GitHub
//
//   DELETE:
//   4. Remove the playlist from the array, commit updated playlists.json
//   5. Cascade: read videos.json, remove the deleted playlistId from every video's
//      playlistIds[] that contains it, commit updated videos.json
//      (Two sequential commits for atomic, readable history.)
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getAdminUser } from '@/lib/admin'
import { getFileContent, commitFile } from '@/lib/github'
import { PlaylistSchema } from '@/lib/types'
import { getVideos } from '@/lib/content'
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

  // Read playlists.json from GitHub
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

  const idx = playlists.findIndex((p) => p.id === params.id)
  if (idx === -1) {
    return new NextResponse(`Playlist not found: ${params.id}`, { status: 404 })
  }

  // Merge changed fields into existing record
  const existing = playlists[idx]
  const merged = { ...existing, ...body }

  // Validate merged result via PlaylistSchema
  let validated: ReturnType<typeof PlaylistSchema.parse>
  try {
    validated = PlaylistSchema.parse(merged)
  } catch (err) {
    if (err instanceof ZodError) {
      const messages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')
      return new NextResponse(`Validation error: ${messages}`, { status: 400 })
    }
    return new NextResponse('Validation failed', { status: 400 })
  }

  // Cross-validate coverVideoId
  const crossRefError = validateCrossRefs(validated)
  if (crossRefError) {
    return new NextResponse(crossRefError, { status: 400 })
  }

  // Replace the record in place (use validated object to strip unknown fields)
  playlists[idx] = validated as unknown as Record<string, unknown>
  const newContent = JSON.stringify(playlists, null, 2) + '\n'

  try {
    await commitFile({
      accessToken,
      path: 'content/playlists.json',
      newContent,
      sha: file.sha,
      message: `admin: update playlist "${validated.title}"`,
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

  // ── Step 1: Remove the playlist from playlists.json ──
  const playlistsFile = await getFileContent(accessToken, 'content/playlists.json')
  if (!playlistsFile) {
    return new NextResponse('content/playlists.json not found in repo', { status: 500 })
  }

  let playlists: Array<Record<string, unknown>>
  try {
    playlists = JSON.parse(playlistsFile.content)
    if (!Array.isArray(playlists)) throw new Error('Not an array')
  } catch (err) {
    return new NextResponse(`Invalid JSON in playlists.json: ${err}`, { status: 500 })
  }

  const idx = playlists.findIndex((p) => p.id === params.id)
  if (idx === -1) {
    return new NextResponse(`Playlist not found: ${params.id}`, { status: 404 })
  }

  const removed = playlists[idx]
  const title = typeof removed.title === 'string' ? removed.title : params.id

  // Remove from array
  playlists.splice(idx, 1)
  const newPlaylistsContent = JSON.stringify(playlists, null, 2) + '\n'

  try {
    await commitFile({
      accessToken,
      path: 'content/playlists.json',
      newContent: newPlaylistsContent,
      sha: playlistsFile.sha,
      message: `admin: remove playlist "${title}"`,
      committerName: adminLogin,
      committerEmail: `${adminLogin}@users.noreply.github.com`,
    })
  } catch (err) {
    return new NextResponse(`Commit failed (playlists.json): ${err}`, { status: 500 })
  }

  // ── Step 2: Cascade — remove the deleted playlistId from videos.json ──
  // Read the updated videos.json. Any video whose playlistIds[] contains params.id
  // must have that id removed. This keeps bidirectional references consistent.
  // Committed as a separate commit for clear audit history.
  const videosFile = await getFileContent(accessToken, 'content/videos.json')
  if (!videosFile) {
    // videos.json missing is unexpected but non-fatal — playlist already removed.
    console.error(
      `[admin/playlists] WARNING: could not read videos.json for cascade removal of "${params.id}".` +
      ` Playlist deleted but videos.json references may be stale.`
    )
    return NextResponse.json({ ok: true, deleted: params.id, cascadeWarning: 'videos.json not found' })
  }

  let videos: Array<Record<string, unknown>>
  try {
    videos = JSON.parse(videosFile.content)
    if (!Array.isArray(videos)) throw new Error('Not an array')
  } catch (err) {
    console.error(`[admin/playlists] WARNING: could not parse videos.json for cascade: ${err}`)
    return NextResponse.json({ ok: true, deleted: params.id, cascadeWarning: 'videos.json parse error' })
  }

  // Remove the deleted playlistId from each video that references it
  let videosChanged = false
  const updatedVideos = videos.map((video) => {
    const playlistIds = video.playlistIds
    if (!Array.isArray(playlistIds)) return video
    if (!playlistIds.includes(params.id)) return video
    videosChanged = true
    return { ...video, playlistIds: playlistIds.filter((pid) => pid !== params.id) }
  })

  if (!videosChanged) {
    // No videos referenced this playlist — nothing to cascade.
    return NextResponse.json({ ok: true, deleted: params.id })
  }

  const newVideosContent = JSON.stringify(updatedVideos, null, 2) + '\n'

  try {
    await commitFile({
      accessToken,
      path: 'content/videos.json',
      newContent: newVideosContent,
      sha: videosFile.sha,
      message: `admin: cascade-remove playlist "${params.id}" refs from videos`,
      committerName: adminLogin,
      committerEmail: `${adminLogin}@users.noreply.github.com`,
    })
  } catch (err) {
    // Cascade commit failed — the playlist is already deleted. Log and return partial success.
    console.error(`[admin/playlists] WARNING: cascade commit to videos.json failed: ${err}`)
    return NextResponse.json({
      ok: true,
      deleted: params.id,
      cascadeWarning: `videos.json cascade commit failed: ${err}`,
    })
  }

  return NextResponse.json({ ok: true, deleted: params.id })
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
