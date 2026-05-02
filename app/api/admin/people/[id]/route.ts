// app/api/admin/people/[id]/route.ts
// Admin POST handler — updates one or more fields on a person record.
// Body shape: { name?, relationLabel?, eyebrow?, birthDate?, deathDate?, datesLabel?, birthplace?, spouseLabel? }
// Only fields present in the body are written; omitted fields are preserved.
//
// Bio is INTENTIONALLY not in the editable allowlist — bios are not displayed
// anywhere on the site (long-form prose belongs in Chronicles).
//
// Flow:
//   1. Auth check (must be in ADMIN_GITHUB_USERNAMES allowlist)
//   2. Read content/family.json from GitHub via octokit
//   3. Find the person by id; merge in the changed fields
//   4. Commit the updated JSON back to the repo
//   5. Vercel auto-rebuilds; live site updates in ~90s
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getAdminUser } from '@/lib/admin'
import { getFileContent, commitFile } from '@/lib/github'

// Whitelist of fields the admin form is allowed to update.
// Anything not on this list is silently ignored (defence against accidentally
// allowing edits to things like spouseIds, parentIds, photoIds via the bio form).
const EDITABLE_FIELDS = [
  'name',
  'relationLabel',
  'eyebrow',
  'birthDate',
  'deathDate',
  'datesLabel',
  'birthplace',
  'spouseLabel',
] as const

type EditableField = (typeof EDITABLE_FIELDS)[number]

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

  // Parse + validate body
  let body: Record<string, unknown>
  try {
    body = await request.json()
    if (typeof body !== 'object' || body === null) {
      return new NextResponse('Body must be a JSON object', { status: 400 })
    }
  } catch {
    return new NextResponse('Invalid JSON body', { status: 400 })
  }

  // Build the changes object from whitelisted fields only.
  // Empty string values mean "remove this field" (sets it to undefined / deletes it).
  const changes: Partial<Record<EditableField, string | undefined>> = {}
  for (const key of EDITABLE_FIELDS) {
    if (key in body) {
      const value = body[key]
      if (typeof value !== 'string') {
        return new NextResponse(`Field '${key}' must be a string (use empty string to clear)`, { status: 400 })
      }
      changes[key] = value
    }
  }

  if (Object.keys(changes).length === 0) {
    return new NextResponse('No editable fields in body', { status: 400 })
  }

  // Read current family.json from GitHub
  const file = await getFileContent(accessToken, 'content/family.json')
  if (!file) {
    return new NextResponse('content/family.json not found in repo', { status: 500 })
  }

  let people: Array<Record<string, unknown>>
  try {
    people = JSON.parse(file.content)
  } catch (err) {
    return new NextResponse(`Invalid JSON in family.json: ${err}`, { status: 500 })
  }

  const person = people.find((p) => p.id === params.id)
  if (!person) {
    return new NextResponse(`Person not found: ${params.id}`, { status: 404 })
  }

  // Apply changes — empty strings delete the field, non-empty strings set it.
  // The 'name' field is special: if cleared, refuse (a person must have a name).
  for (const [key, value] of Object.entries(changes)) {
    if (key === 'name' && (!value || value.trim() === '')) {
      return new NextResponse('Name cannot be empty', { status: 400 })
    }
    if (value === '' || value === undefined) {
      delete person[key]
    } else {
      person[key] = value
    }
  }

  const newContent = JSON.stringify(people, null, 2) + '\n'

  // Commit
  try {
    const changedFieldList = Object.keys(changes).join(', ')
    await commitFile({
      accessToken,
      path: 'content/family.json',
      newContent,
      sha: file.sha,
      message: `admin: update ${changedFieldList} for ${person.name ?? params.id}`,
      committerName: adminLogin,
      committerEmail: `${adminLogin}@users.noreply.github.com`,
    })
  } catch (err) {
    return new NextResponse(`Commit failed: ${err}`, { status: 500 })
  }

  return NextResponse.json({ ok: true, changed: Object.keys(changes) })
}
