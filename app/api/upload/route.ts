// app/api/upload/route.ts
// POST — a family member uploads an image. Stored entirely in Vercel Blob (NOT
// committed to GitHub): family members have no GitHub token, so the admin
// commit-JSON path does not apply here.
//
// Two Blobs are written per upload:
//   uploads/files/<id>.<ext>   the UNTOUCHED original image bytes
//   uploads/meta/<id>.json     the FamilyUpload metadata sidecar (Permanent-shaped)
// The gallery lists the uploads/meta/ prefix at request time (lib/uploads.ts).
//
// Flow:
//   1. Auth: ANY logged-in session (family OR admin) via await auth() — NOT getAdminUser()
//   2. Blob guard: 503 if BLOB_READ_WRITE_TOKEN is unset
//   3. Parse multipart: file + metadata JSON
//   4. Validate file (MIME whitelist + 4MB limit)
//   5. put() original bytes → fileUrl
//   6. plaiceholder blur (non-fatal)
//   7. Build + Zod-validate the FamilyUpload record
//   8. put() the sidecar JSON
import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { getPlaiceholder } from 'plaiceholder'
import { auth } from '@/auth'
import { FamilyUploadSchema, DatePrecisionSchema } from '@/lib/types'
import { UPLOADS_FILES_PREFIX, UPLOADS_META_PREFIX } from '@/lib/uploads'

const MAX_SIZE_BYTES = 4 * 1024 * 1024 // 4MB (serverless body limit)
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])

export async function POST(request: Request) {
  // Auth: defence in depth — gate to ANY logged-in session here, independently
  // of middleware (CVE-2025-29927). Family password OR admin both pass.
  const session = await auth()
  if (!session) {
    return new NextResponse('Sign in to upload.', { status: 401 })
  }

  // Blob guard (same pattern as the per-person admin uploader).
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return new NextResponse(
      'Blob storage is not configured. Connect a Vercel Blob store (Storage tab) so BLOB_READ_WRITE_TOKEN is set, then redeploy.',
      { status: 503 },
    )
  }

  // Parse multipart/form-data
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return new NextResponse('Expected multipart/form-data', { status: 400 })
  }

  const file = formData.get('file')
  const metadataRaw = formData.get('metadata')

  if (!(file instanceof Blob)) {
    return new NextResponse('Missing file field', { status: 400 })
  }
  if (typeof metadataRaw !== 'string') {
    return new NextResponse('Missing metadata field', { status: 400 })
  }

  // Validate file type + size (server-side defence; client checks too).
  const mimeType = file.type
  if (!ALLOWED_TYPES.has(mimeType)) {
    return new NextResponse(
      `Unsupported file type: ${mimeType}. Allowed: JPEG, PNG, WebP.`,
      { status: 400 },
    )
  }
  if (file.size > MAX_SIZE_BYTES) {
    return new NextResponse('Image is too large. Please choose an image under 4MB.', { status: 400 })
  }

  // Parse the metadata JSON object.
  let metadata: Record<string, unknown>
  try {
    const parsed = JSON.parse(metadataRaw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return new NextResponse('metadata must be a JSON object', { status: 400 })
    }
    metadata = parsed as Record<string, unknown>
  } catch {
    return new NextResponse('Invalid JSON in metadata field', { status: 400 })
  }

  const title = typeof metadata.title === 'string' ? metadata.title.trim() : ''
  if (!title) {
    return new NextResponse('A title is required.', { status: 400 })
  }

  // Sanitise people: free-text names, trimmed + de-blanked.
  const people = Array.isArray(metadata.people)
    ? (metadata.people as unknown[])
        .filter((n): n is string => typeof n === 'string')
        .map((n) => n.trim())
        .filter(Boolean)
    : []

  // Date precision (defaults to unknown). A date is only kept when precision says so.
  const precisionParse = DatePrecisionSchema.safeParse(metadata.datePrecision)
  const datePrecision = precisionParse.success ? precisionParse.data : 'unknown'
  const date =
    datePrecision !== 'unknown' && typeof metadata.date === 'string' && metadata.date.trim()
      ? metadata.date.trim()
      : undefined

  const description =
    typeof metadata.description === 'string' && metadata.description.trim()
      ? metadata.description.trim()
      : undefined

  // Read bytes once for both Blob upload and the blur placeholder.
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Opaque, collision-resistant id; also the Blob basename for file + sidecar.
  const id = crypto.randomUUID()
  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg'
  const originalFilename =
    file instanceof File && file.name ? file.name : `${id}.${ext}`

  // 1) Upload the UNTOUCHED original bytes.
  let fileUrl: string
  try {
    const blob = await put(`${UPLOADS_FILES_PREFIX}${id}.${ext}`, buffer, {
      access: 'public',
      contentType: mimeType,
      addRandomSuffix: false,
    })
    fileUrl = blob.url
  } catch (err) {
    return new NextResponse(`File upload failed: ${err}`, { status: 500 })
  }

  // 2) Blur placeholder (non-fatal).
  let blurDataUrl: string | undefined
  try {
    const { base64 } = await getPlaiceholder(buffer, { size: 10 })
    blurDataUrl = base64
  } catch {
    blurDataUrl = undefined
  }

  // 3) Build + validate the Permanent-shaped metadata record.
  const record = {
    id,
    title,
    ...(description ? { description } : {}),
    people,
    ...(date ? { date } : {}),
    datePrecision,
    fileUrl,
    originalFilename,
    mimeType,
    uploadedBy: session.user?.name ?? undefined,
    uploadedAt: new Date().toISOString(),
    ...(blurDataUrl ? { blurDataUrl } : {}),
  }

  const validated = FamilyUploadSchema.safeParse(record)
  if (!validated.success) {
    return new NextResponse(`Invalid upload metadata: ${validated.error.message}`, { status: 400 })
  }

  // 4) Write the metadata sidecar. addRandomSuffix:false keeps the path
  // deterministic (uploads/meta/<id>.json) so it pairs 1:1 with the file.
  try {
    await put(`${UPLOADS_META_PREFIX}${id}.json`, JSON.stringify(validated.data, null, 2), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
    })
  } catch (err) {
    return new NextResponse(`Metadata write failed: ${err}`, { status: 500 })
  }

  return NextResponse.json({ ok: true, id, fileUrl })
}
