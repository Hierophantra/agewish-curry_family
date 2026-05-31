// app/api/admin/history/route.ts
// GET ?path=content/theme.json - admin-only, read-only list of recent commits
// that touched a config file, for the in-app "restore a previous version" UI.
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getAdminUser } from '@/lib/admin'
import { getFileHistory } from '@/lib/github'

// Only config files are revertable in-app (small, self-contained, low-risk).
const ALLOWED = new Set([
  'content/theme.json',
  'content/tree-layout.json',
  'content/site.json',
  'content/hero.json',
])

export async function GET(request: Request) {
  const adminLogin = await getAdminUser()
  if (!adminLogin) return new NextResponse('Forbidden', { status: 403 })

  const session = await auth()
  const accessToken = session?.user?.githubAccessToken
  if (!accessToken) return new NextResponse('No GitHub access token in session', { status: 401 })

  const path = new URL(request.url).searchParams.get('path') ?? ''
  if (!ALLOWED.has(path)) return new NextResponse('Unknown or non-revertable path', { status: 400 })

  try {
    const history = await getFileHistory(accessToken, path, 15)
    return NextResponse.json({ ok: true, path, history })
  } catch (err) {
    return new NextResponse(`History fetch failed: ${err}`, { status: 500 })
  }
}
