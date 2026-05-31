// app/api/admin/photos/import-hero/route.ts
// POST - one-click import of the hero.json rotation images into photos.json as
// Photo records, so they become croppable/taggable like any photo. Each becomes
// visibility 'hidden' (never in the public gallery) + inHero (still in the
// rotation; getResolvedHero dedupes by src so there's no double). Hero display
// tuning (opacity / objectPosition / fit) is copied so the rotation looks the
// same. Idempotent: skips images already imported (matched by filename).
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getAdminUser } from '@/lib/admin'
import { getFileContent, commitFile } from '@/lib/github'

function heroIdFromSrc(src: string): string {
  const base = src.split('/').pop() ?? src
  const stem = base.replace(/\.[^.]+$/, '')
  const slug = stem.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return `hero-${slug || 'image'}`
}

export async function POST() {
  const adminLogin = await getAdminUser()
  if (!adminLogin) return new NextResponse('Forbidden', { status: 403 })

  const session = await auth()
  const accessToken = session?.user?.githubAccessToken
  if (!accessToken) return new NextResponse('No GitHub access token in session', { status: 401 })

  const heroFile = await getFileContent(accessToken, 'content/hero.json')
  const photosFile = await getFileContent(accessToken, 'content/photos.json')
  if (!heroFile || !photosFile) return new NextResponse('Content files not found', { status: 500 })

  let hero: { images?: Array<Record<string, unknown>> }
  let photos: Array<Record<string, unknown>>
  try {
    hero = JSON.parse(heroFile.content)
    photos = JSON.parse(photosFile.content)
    if (!Array.isArray(photos)) throw new Error('photos.json is not an array')
  } catch (err) {
    return new NextResponse(`Invalid JSON: ${err}`, { status: 500 })
  }

  const existingFilenames = new Set(photos.map((p) => p.filename))
  const existingIds = new Set(photos.map((p) => p.id as string))
  const heroImages = Array.isArray(hero.images) ? hero.images : []
  let imported = 0

  for (const img of heroImages) {
    const src = typeof img.src === 'string' ? img.src : ''
    if (!src || existingFilenames.has(src)) continue
    let id = heroIdFromSrc(src)
    let n = 2
    while (existingIds.has(id)) id = `${heroIdFromSrc(src)}-${n++}`
    existingIds.add(id)
    existingFilenames.add(src)

    const stem = (src.split('/').pop() ?? src).replace(/\.[^.]+$/, '')
    const photo: Record<string, unknown> = {
      id,
      filename: src,
      caption: `Hero — ${stem}`,
      visibility: 'hidden',
      inHero: true,
      peopleIds: [],
      collectionIds: [],
      regions: [],
    }
    if (typeof img.opacity === 'number') photo.heroOpacity = img.opacity
    if (typeof img.objectPosition === 'string') photo.heroObjectPosition = img.objectPosition
    if (img.fit === 'cover' || img.fit === 'contain') photo.heroFit = img.fit
    photos.push(photo)
    imported++
  }

  if (imported === 0) return NextResponse.json({ ok: true, imported: 0 })

  const newContent = JSON.stringify(photos, null, 2) + '\n'
  try {
    await commitFile({
      accessToken,
      path: 'content/photos.json',
      newContent,
      sha: photosFile.sha,
      message: `admin: import ${imported} hero image(s) into Photographs`,
      committerName: adminLogin,
      committerEmail: `${adminLogin}@users.noreply.github.com`,
    })
  } catch (err) {
    return new NextResponse(`Commit failed: ${err}`, { status: 500 })
  }

  return NextResponse.json({ ok: true, imported })
}
