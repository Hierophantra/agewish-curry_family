// app/api/admin/validate/route.ts
// GET - admin-only, read-only "content health" check. Runs the existing
// cross-reference integrity validator (lib/content.ts validateBidirectionalRefs,
// previously dead at runtime) plus a few cheap scans, and returns a structured
// report for the DebugOverlay. Never mutates anything.
import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'
import {
  validateBidirectionalRefs,
  getPeople, getPhotos, getVideos, getCollections, getPlaylists, getChronicles,
} from '@/lib/content'

export async function GET() {
  const adminLogin = await getAdminUser()
  if (!adminLogin) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const issues: string[] = []
  const warnings: string[] = []

  // 1. The comprehensive bidirectional reference check (fail-loud: throws on the
  //    first broken reference with a descriptive message).
  try {
    validateBidirectionalRefs()
  } catch (err) {
    issues.push(err instanceof Error ? err.message : String(err))
  }

  // 2. Cheap advisory scans (non-fatal).
  let counts = { people: 0, photos: 0, videos: 0, collections: 0, playlists: 0, chronicles: 0 }
  try {
    const people = getPeople()
    const photos = getPhotos()
    const videos = getVideos()
    const collections = getCollections()
    const playlists = getPlaylists()
    const chronicles = getChronicles()
    counts = {
      people: people.length, photos: photos.length, videos: videos.length,
      collections: collections.length, playlists: playlists.length, chronicles: chronicles.length,
    }

    // Photos referencing a local file that isn't an http(s) URL and isn't a
    // rooted /path — likely a broken/relative path. (We don't hit disk here.)
    for (const p of photos) {
      const f = p.filename ?? ''
      if (f && !f.startsWith('http') && !f.startsWith('/') && !f.includes('/')) {
        warnings.push(`Photo "${p.id}" filename looks suspicious: "${f}"`)
      }
    }
    // Empty galleries / sections worth surfacing.
    if (photos.length === 0) warnings.push('No photos in content/photos.json')
    if (videos.length === 0) warnings.push('No videos in content/videos.json')
  } catch (err) {
    issues.push(`Content load error: ${err instanceof Error ? err.message : String(err)}`)
  }

  return NextResponse.json({
    ok: issues.length === 0,
    issues,
    warnings,
    counts,
  })
}
