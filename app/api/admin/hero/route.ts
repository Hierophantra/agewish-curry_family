// app/api/admin/hero/route.ts
// POST - replace the entire hero config (rotation/transition timings +
// per-image opacity / objectPosition / enabled flag) and commit to
// content/hero.json.
//
// Body: full Hero object (HeroSchema). Validated server-side via Zod.
//
// Flow:
//   1. Auth check (admin allowlist)
//   2. Parse + validate body via HeroSchema
//   3. Commit content/hero.json to GitHub via octokit
//   4. Vercel auto-rebuilds; live site updates in ~90s
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getAdminUser } from '@/lib/admin'
import { getFileContent, commitFile } from '@/lib/github'
import { HeroSchema } from '@/lib/types'
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

  // Parse + validate body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new NextResponse('Invalid JSON body', { status: 400 })
  }

  let hero
  try {
    hero = HeroSchema.parse(body)
  } catch (err) {
    if (err instanceof ZodError) {
      return new NextResponse(`Validation error: ${err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`, { status: 400 })
    }
    return new NextResponse(`Validation failed: ${err}`, { status: 400 })
  }

  // Read existing file (just for the sha - we replace contents wholesale).
  // If the file doesn't exist yet, commitFile will create it.
  const file = await getFileContent(accessToken, 'content/hero.json')
  const sha = file?.sha

  const newContent = JSON.stringify(hero, null, 2) + '\n'

  try {
    await commitFile({
      accessToken,
      path: 'content/hero.json',
      newContent,
      sha,
      message: `admin: update hero rotator config (${hero.images.length} images)`,
      committerName: adminLogin,
      committerEmail: `${adminLogin}@users.noreply.github.com`,
    })
  } catch (err) {
    return new NextResponse(`Commit failed: ${err}`, { status: 500 })
  }

  return NextResponse.json({ ok: true, imageCount: hero.images.length })
}
