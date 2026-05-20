// app/api/admin/people/[id]/route.ts
// POST  - update one or more fields on a person record (extended from Phase 20).
// DELETE - remove a person with full cascade cleanup:
//   - Removes person's id from photos.json, videos.json, audio.json, chronicles.json peopleIds[]
//   - Removes person's id from other people's parentIds[] and childrenIds[]/childIds[]
//   - Removes the person from family.json
//   - Commits each changed file in sequence (cleaner history)
//
// Body shape for POST:
//   Scalar: name?, relationLabel?, eyebrow?, birthDate?, deathDate?, datesLabel?, birthplace?, spouseLabel?
//   Arrays: parentIds?: string[], childrenIds?: string[]
//
// Flow for POST:
//   1. Auth check
//   2. Validate body - scalar fields must be strings; array fields must be string arrays
//   3. Read family.json, find person, merge changes
//   4. Bidirectional sync for parentIds/childrenIds changes
//   5. Commit family.json
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getAdminUser } from '@/lib/admin'
import { getFileContent, commitFile } from '@/lib/github'

// Scalar editable fields - empty string means "remove this field"
const SCALAR_EDITABLE_FIELDS = [
  'name',
  'relationLabel',
  'eyebrow',
  'birthDate',
  'deathDate',
  'datesLabel',
  'birthplace',
  'spouseLabel',
] as const

type ScalarField = (typeof SCALAR_EDITABLE_FIELDS)[number]

// Array editable fields - handled separately (type differs from scalars)
const ARRAY_EDITABLE_FIELDS = ['parentIds', 'childrenIds'] as const

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
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return new NextResponse('Body must be a JSON object', { status: 400 })
    }
  } catch {
    return new NextResponse('Invalid JSON body', { status: 400 })
  }

  // Extract and validate scalar changes
  const scalarChanges: Partial<Record<ScalarField, string | undefined>> = {}
  for (const key of SCALAR_EDITABLE_FIELDS) {
    if (key in body) {
      const value = body[key]
      if (typeof value !== 'string') {
        return new NextResponse(`Field '${key}' must be a string (use empty string to clear)`, { status: 400 })
      }
      scalarChanges[key] = value
    }
  }

  // Extract and validate array changes
  const arrayChanges: { parentIds?: string[]; childrenIds?: string[] } = {}
  for (const key of ARRAY_EDITABLE_FIELDS) {
    if (key in body) {
      const value = body[key]
      if (!Array.isArray(value) || !(value as unknown[]).every((v) => typeof v === 'string')) {
        return new NextResponse(`Field '${key}' must be an array of strings`, { status: 400 })
      }
      arrayChanges[key] = value as string[]
    }
  }

  const hasChanges = Object.keys(scalarChanges).length > 0 || Object.keys(arrayChanges).length > 0
  if (!hasChanges) {
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
    if (!Array.isArray(people)) throw new Error('Not an array')
  } catch (err) {
    return new NextResponse(`Invalid JSON in family.json: ${err}`, { status: 500 })
  }

  const person = people.find((p) => p.id === params.id)
  if (!person) {
    return new NextResponse(`Person not found: ${params.id}`, { status: 404 })
  }

  // Validate parentIds/childrenIds resolve to existing people
  const validIds = new Set(people.map((p) => p.id))
  if (arrayChanges.parentIds) {
    for (const pid of arrayChanges.parentIds) {
      if (pid === params.id) {
        return new NextResponse('A person cannot be their own parent', { status: 400 })
      }
      if (!validIds.has(pid)) {
        return new NextResponse(`Unknown parent ID "${pid}". Check content/family.json.`, { status: 400 })
      }
    }
  }
  if (arrayChanges.childrenIds) {
    for (const cid of arrayChanges.childrenIds) {
      if (cid === params.id) {
        return new NextResponse('A person cannot be their own child', { status: 400 })
      }
      if (!validIds.has(cid)) {
        return new NextResponse(`Unknown child ID "${cid}". Check content/family.json.`, { status: 400 })
      }
    }
  }

  // Apply scalar changes - empty strings delete the field; non-empty strings set it.
  // 'name' is special: cannot be cleared.
  for (const [key, value] of Object.entries(scalarChanges)) {
    if (key === 'name' && (!value || value.trim() === '')) {
      return new NextResponse('Name cannot be empty', { status: 400 })
    }
    if (value === '' || value === undefined) {
      delete person[key]
    } else {
      person[key] = value
    }
  }

  // Apply array changes with bidirectional sync
  if (arrayChanges.parentIds !== undefined) {
    const oldParentIds = Array.isArray(person.parentIds) ? (person.parentIds as string[]) : []
    const newParentIds = arrayChanges.parentIds

    // Removed parents: remove this person from their childrenIds + childIds
    for (const removedParentId of oldParentIds.filter((id) => !newParentIds.includes(id))) {
      const removedParent = people.find((p) => p.id === removedParentId)
      if (removedParent) {
        if (Array.isArray(removedParent.childrenIds)) {
          removedParent.childrenIds = (removedParent.childrenIds as string[]).filter((id) => id !== params.id)
        }
        if (Array.isArray(removedParent.childIds)) {
          removedParent.childIds = (removedParent.childIds as string[]).filter((id) => id !== params.id)
        }
      }
    }

    // Added parents: add this person to their childrenIds + childIds
    for (const addedParentId of newParentIds.filter((id) => !oldParentIds.includes(id))) {
      const addedParent = people.find((p) => p.id === addedParentId)
      if (addedParent) {
        const children = Array.isArray(addedParent.childrenIds) ? [...(addedParent.childrenIds as string[])] : []
        if (!children.includes(params.id)) children.push(params.id)
        addedParent.childrenIds = children

        const childIds = Array.isArray(addedParent.childIds) ? [...(addedParent.childIds as string[])] : []
        if (!childIds.includes(params.id)) childIds.push(params.id)
        addedParent.childIds = childIds
      }
    }

    person.parentIds = newParentIds
  }

  if (arrayChanges.childrenIds !== undefined) {
    const oldChildrenIds = Array.isArray(person.childrenIds) ? (person.childrenIds as string[]) : []
    const newChildrenIds = arrayChanges.childrenIds

    // Removed children: remove this person from their parentIds
    for (const removedChildId of oldChildrenIds.filter((id) => !newChildrenIds.includes(id))) {
      const removedChild = people.find((p) => p.id === removedChildId)
      if (removedChild && Array.isArray(removedChild.parentIds)) {
        removedChild.parentIds = (removedChild.parentIds as string[]).filter((id) => id !== params.id)
      }
    }

    // Added children: add this person to their parentIds
    for (const addedChildId of newChildrenIds.filter((id) => !oldChildrenIds.includes(id))) {
      const addedChild = people.find((p) => p.id === addedChildId)
      if (addedChild) {
        const parents = Array.isArray(addedChild.parentIds) ? [...(addedChild.parentIds as string[])] : []
        if (!parents.includes(params.id)) parents.push(params.id)
        addedChild.parentIds = parents
      }
    }

    person.childrenIds = newChildrenIds
    // Also sync the v1 alias childIds
    person.childIds = newChildrenIds
  }

  const newContent = JSON.stringify(people, null, 2) + '\n'

  try {
    const changedFieldList = [
      ...Object.keys(scalarChanges),
      ...Object.keys(arrayChanges),
    ].join(', ')
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

  return NextResponse.json({ ok: true, changed: [...Object.keys(scalarChanges), ...Object.keys(arrayChanges)] })
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

  // ── Read family.json - confirm person exists ──
  const familyFile = await getFileContent(accessToken, 'content/family.json')
  if (!familyFile) {
    return new NextResponse('content/family.json not found in repo', { status: 500 })
  }

  let people: Array<Record<string, unknown>>
  try {
    people = JSON.parse(familyFile.content)
    if (!Array.isArray(people)) throw new Error('Not an array')
  } catch (err) {
    return new NextResponse(`Invalid JSON in family.json: ${err}`, { status: 500 })
  }

  const personIdx = people.findIndex((p) => p.id === params.id)
  if (personIdx === -1) {
    return new NextResponse(`Person not found: ${params.id}`, { status: 404 })
  }

  const person = people[personIdx]
  const personName = typeof person.name === 'string' ? person.name : params.id

  // ── Cascade: clean up family.json (other people's parentIds, childrenIds, childIds) ──
  for (const p of people) {
    if (Array.isArray(p.parentIds)) {
      p.parentIds = (p.parentIds as string[]).filter((id) => id !== params.id)
    }
    if (Array.isArray(p.childrenIds)) {
      p.childrenIds = (p.childrenIds as string[]).filter((id) => id !== params.id)
    }
    if (Array.isArray(p.childIds)) {
      p.childIds = (p.childIds as string[]).filter((id) => id !== params.id)
    }
    if (Array.isArray(p.spouseIds)) {
      p.spouseIds = (p.spouseIds as string[]).filter((id) => id !== params.id)
    }
  }

  // Remove the person from the array
  people.splice(personIdx, 1)

  const newFamilyContent = JSON.stringify(people, null, 2) + '\n'

  try {
    await commitFile({
      accessToken,
      path: 'content/family.json',
      newContent: newFamilyContent,
      sha: familyFile.sha,
      message: `admin: delete person ${personName}`,
      committerName: adminLogin,
      committerEmail: `${adminLogin}@users.noreply.github.com`,
    })
  } catch (err) {
    return new NextResponse(`Commit failed (family.json): ${err}`, { status: 500 })
  }

  // ── Cascade: clean up photos.json ──
  const photosResult = await cleanupPeopleIds(
    accessToken, adminLogin, 'content/photos.json', params.id, personName
  )
  if (photosResult instanceof NextResponse) return photosResult

  // ── Cascade: clean up videos.json ──
  const videosResult = await cleanupPeopleIds(
    accessToken, adminLogin, 'content/videos.json', params.id, personName
  )
  if (videosResult instanceof NextResponse) return videosResult

  // ── Cascade: clean up audio.json ──
  const audioResult = await cleanupPeopleIds(
    accessToken, adminLogin, 'content/audio.json', params.id, personName
  )
  if (audioResult instanceof NextResponse) return audioResult

  // ── Cascade: clean up chronicles.json ──
  const chroniclesResult = await cleanupPeopleIds(
    accessToken, adminLogin, 'content/chronicles.json', params.id, personName
  )
  if (chroniclesResult instanceof NextResponse) return chroniclesResult

  return NextResponse.json({ ok: true, deleted: params.id })
}

/**
 * Read a content JSON file, strip the deleted person's id from all peopleIds[] arrays,
 * and commit the result if anything changed.
 * Returns a NextResponse on error, or null on success.
 */
async function cleanupPeopleIds(
  accessToken: string,
  adminLogin: string,
  path: string,
  deletedId: string,
  personName: string
): Promise<NextResponse | null> {
  const file = await getFileContent(accessToken, path)
  if (!file) return null  // file missing is non-fatal for cascade (skip silently)

  let items: Array<Record<string, unknown>>
  try {
    items = JSON.parse(file.content)
    if (!Array.isArray(items)) return null
  } catch {
    return null  // non-fatal - skip this file
  }

  let changed = false
  for (const item of items) {
    if (Array.isArray(item.peopleIds)) {
      const before = item.peopleIds as string[]
      const after = before.filter((id) => id !== deletedId)
      if (after.length !== before.length) {
        item.peopleIds = after
        changed = true
      }
    }
  }

  if (!changed) return null  // nothing to commit for this file

  const newContent = JSON.stringify(items, null, 2) + '\n'

  try {
    await commitFile({
      accessToken,
      path,
      newContent,
      sha: file.sha,
      message: `admin: clean up peopleIds references for deleted person ${personName}`,
      committerName: adminLogin,
      committerEmail: `${adminLogin}@users.noreply.github.com`,
    })
  } catch (err) {
    return new NextResponse(`Commit failed (${path}): ${err}`, { status: 500 })
  }

  return null
}
