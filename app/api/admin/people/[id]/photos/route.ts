// app/api/admin/people/[id]/photos/route.ts
// POST - upload a photo and link it to a specific person in one step.
//
// This is the per-person upload flow: from a person's admin page, choose an
// image and it's uploaded to Blob, linked to that person via peopleIds, and
// created with visibility "profile" (shows on their page + tree snippet, not
// the general gallery). The archivist can change visibility afterward.
//
// Flow:
//   1. Auth check
//   2. Verify the person exists
//   3. Parse multipart: file (+ optional caption, date)
//   4. Validate file (type + size)
//   5. Upload to Blob under people/<personId>/<timestamp>-<name>
//   6. Generate a blur placeholder (non-fatal if it fails)
//   7. Append a Photo record to photos.json, commit
import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { getPlaiceholder } from 'plaiceholder'
import { auth } from '@/auth'
import { getAdminUser } from '@/lib/admin'
import { getFileContent, commitFile } from '@/lib/github'
import { getPersonById } from '@/lib/content'

const MAX_BYTES = 25 * 1024 * 1024 // 25 MB
const ALLOWED = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'])

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

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

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return new NextResponse(
      'Blob storage is not configured. Connect a Vercel Blob store (Storage tab) so BLOB_READ_WRITE_TOKEN is set, then redeploy.',
      { status: 503 },
    )
  }

  const person = getPersonById(params.id)
  if (!person) {
    return new NextResponse(`Person not found: ${params.id}`, { status: 404 })
  }

  // Parse multipart
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return new NextResponse('Expected multipart/form-data', { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return new NextResponse('No file provided', { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return new NextResponse(`File too large (max ${MAX_BYTES / 1024 / 1024} MB)`, { status: 400 })
  }
  if (!ALLOWED.has(file.type)) {
    return new NextResponse(`Unsupported type "${file.type}". Use JPEG, PNG, WebP, or AVIF.`, { status: 400 })
  }

  const caption = (formData.get('caption') as string | null)?.trim() || undefined
  const date = (formData.get('date') as string | null)?.trim() || undefined

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Blob path namespaced by person for tidiness.
  const safeName = slugify(file.name.replace(/\.[^.]+$/, '')).slice(0, 60) || 'photo'
  const ext = file.type === 'image/png' ? 'png'
    : file.type === 'image/webp' ? 'webp'
    : file.type === 'image/avif' ? 'avif' : 'jpg'
  const blobPath = `people/${params.id}/${Date.now()}-${safeName}.${ext}`

  let blobUrl: string
  try {
    const blob = await put(blobPath, buffer, { access: 'public', contentType: file.type })
    blobUrl = blob.url
  } catch (err) {
    return new NextResponse(`Blob upload failed: ${err}`, { status: 500 })
  }

  // Blur placeholder (non-fatal)
  let blurDataUrl: string | undefined
  try {
    const { base64 } = await getPlaiceholder(buffer, { size: 10 })
    blurDataUrl = base64
  } catch {
    blurDataUrl = undefined
  }

  // Read photos.json, generate a unique id, append the record.
  const fileData = await getFileContent(accessToken, 'content/photos.json')
  if (!fileData) {
    return new NextResponse('content/photos.json not found in repo', { status: 500 })
  }
  let photos: Array<Record<string, unknown>>
  try {
    photos = JSON.parse(fileData.content)
    if (!Array.isArray(photos)) throw new Error('Not an array')
  } catch (err) {
    return new NextResponse(`Invalid JSON in photos.json: ${err}`, { status: 500 })
  }

  // id: person-photo-N, incrementing until unique
  const existingIds = new Set(photos.map((p) => p.id))
  let n = 1
  let id = `${params.id}-photo-${n}`
  while (existingIds.has(id)) { n++; id = `${params.id}-photo-${n}` }

  const record: Record<string, unknown> = {
    id,
    filename: blobUrl,
    ...(caption ? { caption } : {}),
    ...(date ? { date } : {}),
    peopleIds: [params.id],
    collectionIds: [],
    visibility: 'profile', // default: show on profile + tree, not the gallery
    ...(blurDataUrl ? { blurDataUrl } : {}),
  }
  photos.push(record)

  const newContent = JSON.stringify(photos, null, 2) + '\n'
  try {
    await commitFile({
      accessToken,
      path: 'content/photos.json',
      newContent,
      sha: fileData.sha,
      message: `admin: add photo for ${person.name} (${id})`,
      committerName: adminLogin,
      committerEmail: `${adminLogin}@users.noreply.github.com`,
    })
  } catch (err) {
    return new NextResponse(`Commit failed: ${err}`, { status: 500 })
  }

  return NextResponse.json({ ok: true, id, url: blobUrl })
}
