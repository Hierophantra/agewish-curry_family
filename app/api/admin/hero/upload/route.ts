// app/api/admin/hero/upload/route.ts
// POST - upload a single hero image to Vercel Blob and return its public URL.
// The admin form then sets that URL as a hero image's src (new or replacement).
//
// Why Blob instead of writing to public/images/hero/: in production the
// filesystem is read-only, so uploads must go to Blob. The Hero schema's
// `src` field accepts any URL, and next/image already whitelists
// *.public.blob.vercel-storage.com in next.config.mjs, so a Blob URL renders
// the same as a local /images/hero/ path.
//
// Requires BLOB_READ_WRITE_TOKEN (auto-set on Vercel when a Blob store is
// connected to the project). Returns a clear error if it's missing.
import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { getAdminUser } from '@/lib/admin'

const MAX_BYTES = 25 * 1024 * 1024 // 25 MB ceiling for a hero image
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])

export async function POST(request: Request) {
  const adminLogin = await getAdminUser()
  if (!adminLogin) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return new NextResponse(
      'Blob storage is not configured. Connect a Vercel Blob store to the project (Storage tab) so BLOB_READ_WRITE_TOKEN is set, then redeploy.',
      { status: 503 },
    )
  }

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

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Stable-ish Blob path: hero/<timestamp>-<sanitized original name>.
  // Timestamp prevents collisions when replacing; the old Blob is left in
  // place (Blob has no auto-cleanup, but stale hero images are cheap).
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(-80)
  const blobPath = `hero/${Date.now()}-${safeName}`

  try {
    const blob = await put(blobPath, buffer, {
      access: 'public',
      contentType: file.type,
    })
    return NextResponse.json({ ok: true, url: blob.url })
  } catch (err) {
    return new NextResponse(`Blob upload failed: ${err}`, { status: 500 })
  }
}
