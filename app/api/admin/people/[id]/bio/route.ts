// app/api/admin/people/[id]/bio/route.ts
// POST /api/admin/people/[id]/bio — commits a bio update to content/family.json via GitHub API.
// Auth: requires GitHub OAuth session + admin allowlist. Returns 403 if not admin.
// Body: { bio: string }
// On success: returns { ok: true }
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getAdminUser } from '@/lib/admin'
import { getFileContent, commitFile } from '@/lib/github'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  // 1. Check admin permission (GitHub OAuth + allowlist)
  const adminLogin = await getAdminUser()
  if (!adminLogin) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  // 2. Get the GitHub access token from the session (used by octokit for the commit)
  const session = await auth()
  const accessToken = session?.user?.githubAccessToken
  if (!accessToken) {
    return new NextResponse('No GitHub access token in session — please sign in again', { status: 401 })
  }

  // 3. Parse and validate the request body
  let bio: string
  try {
    const body = await request.json()
    if (typeof body?.bio !== 'string') {
      return new NextResponse('Body must be { bio: string }', { status: 400 })
    }
    bio = body.bio
  } catch {
    return new NextResponse('Invalid JSON body', { status: 400 })
  }

  // 4. Read the current content/family.json from GitHub (need the SHA for the update)
  let file: { content: string; sha: string } | null
  try {
    file = await getFileContent(accessToken, 'content/family.json')
  } catch (err) {
    return new NextResponse(`Failed to read family.json from GitHub: ${err}`, { status: 502 })
  }
  if (!file) {
    return new NextResponse('content/family.json not found in repo', { status: 500 })
  }

  // 5. Parse the JSON, find the person, update the bio field
  let people: Array<Record<string, unknown>>
  try {
    people = JSON.parse(file.content)
  } catch (err) {
    return new NextResponse(`Invalid JSON in family.json: ${err}`, { status: 500 })
  }

  const personIndex = people.findIndex((p) => p.id === params.id)
  if (personIndex === -1) {
    return new NextResponse(`Person not found: ${params.id}`, { status: 404 })
  }

  const person = people[personIndex]

  // Update the bio field (remove entirely if blank — keeps JSON clean)
  if (bio.trim() === '') {
    delete person.bio
  } else {
    person.bio = bio
  }

  // Serialize with 2-space indent + trailing newline (matches existing file format)
  const newContent = JSON.stringify(people, null, 2) + '\n'

  // 6. Commit the updated file to GitHub
  try {
    await commitFile({
      accessToken,
      path: 'content/family.json',
      newContent,
      sha: file.sha,
      message: `admin: update bio for ${person.name ?? params.id}`,
      committerName: adminLogin,
      committerEmail: `${adminLogin}@users.noreply.github.com`,
    })
  } catch (err) {
    return new NextResponse(`GitHub commit failed: ${err}`, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
