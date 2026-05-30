// app/api/admin/tree-layout/route.ts
// POST - replace content/tree-layout.json with a new manual tree arrangement
// (per-node position + color overrides). Validated via TreeLayoutSchema,
// committed to GitHub. Mirrors the theme route.
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getAdminUser } from '@/lib/admin'
import { getFileContent, commitFile } from '@/lib/github'
import { TreeLayoutSchema } from '@/lib/types'
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

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new NextResponse('Invalid JSON body', { status: 400 })
  }

  let layout
  try {
    layout = TreeLayoutSchema.parse(body)
  } catch (err) {
    if (err instanceof ZodError) {
      return new NextResponse(
        `Validation error: ${err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')}`,
        { status: 400 },
      )
    }
    return new NextResponse(`Validation failed: ${err}`, { status: 400 })
  }

  const file = await getFileContent(accessToken, 'content/tree-layout.json')
  const sha = file?.sha
  const newContent = JSON.stringify(layout, null, 2) + '\n'

  try {
    await commitFile({
      accessToken,
      path: 'content/tree-layout.json',
      newContent,
      sha,
      message: 'admin: update family tree arrangement',
      committerName: adminLogin,
      committerEmail: `${adminLogin}@users.noreply.github.com`,
    })
  } catch (err) {
    return new NextResponse(`Commit failed: ${err}`, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
