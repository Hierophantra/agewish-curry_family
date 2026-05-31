// app/api/admin/restore/route.ts
// POST { path, sha } - admin-only. Reads a config file's contents at a previous
// commit and commits them forward (a non-destructive "restore previous version"
// that preserves full history). Validates the restored content against the
// matching schema so a restore can never publish invalid config.
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getAdminUser } from '@/lib/admin'
import { getFileContent, getFileContentAtRef, commitFile } from '@/lib/github'
import { ThemeSchema, TreeLayoutSchema, SiteSchema, HeroSchema } from '@/lib/types'
import type { ZodTypeAny } from 'zod'

const SCHEMA_FOR: Record<string, ZodTypeAny> = {
  'content/theme.json': ThemeSchema,
  'content/tree-layout.json': TreeLayoutSchema,
  'content/site.json': SiteSchema,
  'content/hero.json': HeroSchema,
}

export async function POST(request: Request) {
  const adminLogin = await getAdminUser()
  if (!adminLogin) return new NextResponse('Forbidden', { status: 403 })

  const session = await auth()
  const accessToken = session?.user?.githubAccessToken
  if (!accessToken) return new NextResponse('No GitHub access token in session', { status: 401 })

  let body: { path?: string; sha?: string }
  try {
    body = await request.json()
  } catch {
    return new NextResponse('Invalid JSON body', { status: 400 })
  }
  const path = body.path ?? ''
  const sha = body.sha ?? ''
  const schema = SCHEMA_FOR[path]
  if (!schema) return new NextResponse('Unknown or non-revertable path', { status: 400 })
  if (!/^[0-9a-f]{7,40}$/.test(sha)) return new NextResponse('Invalid commit sha', { status: 400 })

  // Read the old content, validate it, then commit it forward over the current file.
  const oldContent = await getFileContentAtRef(accessToken, path, sha)
  if (oldContent === null) return new NextResponse('That version of the file could not be read', { status: 404 })

  try {
    schema.parse(JSON.parse(oldContent))
  } catch (err) {
    return new NextResponse(`Refusing to restore invalid content: ${err}`, { status: 400 })
  }

  const current = await getFileContent(accessToken, path)
  try {
    await commitFile({
      accessToken,
      path,
      newContent: oldContent.endsWith('\n') ? oldContent : oldContent + '\n',
      sha: current?.sha,
      message: `admin: restore ${path} to ${sha.slice(0, 7)}`,
      committerName: adminLogin,
      committerEmail: `${adminLogin}@users.noreply.github.com`,
    })
  } catch (err) {
    return new NextResponse(`Restore commit failed: ${err}`, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
