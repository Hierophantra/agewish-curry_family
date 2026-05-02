// app/api/admin/people/route.ts
// POST — create a new person record and commit it to family.json.
//
// Flow:
//   1. Auth check (must be in ADMIN_GITHUB_USERNAMES allowlist)
//   2. Parse + validate body: id (kebab-case, unique) + name (required) + optional fields
//   3. Validate parentIds + childrenIds resolve to existing people
//   4. Append new Person to family.json
//   5. Bidirectional sync:
//      - For each parentId: add new person's id to that parent's childrenIds + childIds
//      - For each childId: add new person's id to that child's parentIds
//   6. Commit all changes in a single commit to family.json
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getAdminUser } from '@/lib/admin'
import { getFileContent, commitFile } from '@/lib/github'

const KEBAB_CASE_RE = /^[a-z][a-z0-9-]*[a-z0-9]$|^[a-z]$/

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
  let body: Record<string, unknown>
  try {
    body = await request.json()
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return new NextResponse('Body must be a JSON object', { status: 400 })
    }
  } catch {
    return new NextResponse('Invalid JSON body', { status: 400 })
  }

  // Validate id
  const id = typeof body.id === 'string' ? body.id.trim() : ''
  if (!id) {
    return new NextResponse('id is required', { status: 400 })
  }
  if (!KEBAB_CASE_RE.test(id)) {
    return new NextResponse(
      'id must be kebab-case (lowercase letters, digits, hyphens; e.g. emily-walsh)',
      { status: 400 }
    )
  }

  // Validate name
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) {
    return new NextResponse('name is required', { status: 400 })
  }

  // Validate parentIds + childrenIds are arrays of strings (if provided)
  const parentIds: string[] = Array.isArray(body.parentIds)
    ? (body.parentIds as unknown[]).filter((v): v is string => typeof v === 'string')
    : []
  const childrenIds: string[] = Array.isArray(body.childrenIds)
    ? (body.childrenIds as unknown[]).filter((v): v is string => typeof v === 'string')
    : []

  // Read current family.json from GitHub
  const file = await getFileContent(accessToken, 'content/family.json')
  if (!file) {
    return new NextResponse('content/family.json not found in repo', { status: 500 })
  }

  let people: Array<Record<string, unknown>>
  try {
    people = JSON.parse(file.content)
    if (!Array.isArray(people)) throw new Error('Not an array')
  } catch (err) {
    return new NextResponse(`Invalid JSON in family.json: ${err}`, { status: 500 })
  }

  // Check id uniqueness
  if (people.some((p) => p.id === id)) {
    return new NextResponse(
      `Person ID "${id}" already exists. Choose a different id.`,
      { status: 400 }
    )
  }

  // Validate parentIds + childrenIds all resolve to existing people
  const validIds = new Set(people.map((p) => p.id))
  for (const pid of parentIds) {
    if (!validIds.has(pid)) {
      return new NextResponse(
        `Unknown parent ID "${pid}". Check content/family.json.`,
        { status: 400 }
      )
    }
  }
  for (const cid of childrenIds) {
    if (!validIds.has(cid)) {
      return new NextResponse(
        `Unknown child ID "${cid}". Check content/family.json.`,
        { status: 400 }
      )
    }
  }

  // Build the new person entry with all optional scalar fields
  const newPerson: Record<string, unknown> = { id, name }
  const optionalScalars = [
    'relationLabel', 'eyebrow', 'spouseLabel',
    'birthDate', 'deathDate', 'datesLabel', 'birthplace',
    'gender', 'bio',
  ]
  for (const key of optionalScalars) {
    if (typeof body[key] === 'string' && (body[key] as string).trim()) {
      newPerson[key] = (body[key] as string).trim()
    }
  }
  newPerson.parentIds = parentIds
  newPerson.childrenIds = childrenIds
  newPerson.childIds = childrenIds    // v1 alias — keep in sync
  newPerson.photoIds = []
  newPerson.spouseIds = []

  // Append new person
  people.push(newPerson)

  // ── Bidirectional relationship sync ──
  // For each parentId: add new person's id to that parent's childrenIds + childIds
  for (const parentId of parentIds) {
    const parentIdx = people.findIndex((p) => p.id === parentId)
    if (parentIdx === -1) continue
    const parent = people[parentIdx]

    const parentChildren = Array.isArray(parent.childrenIds)
      ? [...(parent.childrenIds as string[])]
      : []
    if (!parentChildren.includes(id)) parentChildren.push(id)
    parent.childrenIds = parentChildren

    const parentChildIds = Array.isArray(parent.childIds)
      ? [...(parent.childIds as string[])]
      : []
    if (!parentChildIds.includes(id)) parentChildIds.push(id)
    parent.childIds = parentChildIds
  }

  // For each childId: add new person's id to that child's parentIds
  for (const childId of childrenIds) {
    const childIdx = people.findIndex((p) => p.id === childId)
    if (childIdx === -1) continue
    const child = people[childIdx]

    const childParents = Array.isArray(child.parentIds)
      ? [...(child.parentIds as string[])]
      : []
    if (!childParents.includes(id)) childParents.push(id)
    child.parentIds = childParents
  }

  const newContent = JSON.stringify(people, null, 2) + '\n'

  try {
    await commitFile({
      accessToken,
      path: 'content/family.json',
      newContent,
      sha: file.sha,
      message: `admin: add person ${name}`,
      committerName: adminLogin,
      committerEmail: `${adminLogin}@users.noreply.github.com`,
    })
  } catch (err) {
    return new NextResponse(`Commit failed: ${err}`, { status: 500 })
  }

  return NextResponse.json({ ok: true, id })
}
