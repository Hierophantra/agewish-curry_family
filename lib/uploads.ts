// lib/uploads.ts
// SERVER-ONLY data access for family-uploaded images (Vercel Blob storage).
//
// Unlike content/*.json (committed via GitHub), family uploads are NOT in the
// repo — family members have no GitHub token. Instead each upload is two Blobs:
//   uploads/files/<id>.<ext>   the untouched original image bytes
//   uploads/meta/<id>.json     a FamilyUpload metadata sidecar (Permanent-shaped)
// The gallery lists the uploads/meta/ prefix at REQUEST time and fetches each
// sidecar, so a new upload appears without a rebuild.
//
// All reads are guarded: if BLOB_READ_WRITE_TOKEN is unset, listing returns an
// empty list rather than throwing, so the gallery renders an empty state and the
// upload API returns 503 (see app/api/upload/route.ts).
import 'server-only'
import { list } from '@vercel/blob'
import { FamilyUploadSchema, type FamilyUpload } from './types'
import { getPeople } from './content'

// Blob key prefixes. Files and metadata are siblings under uploads/.
export const UPLOADS_FILES_PREFIX = 'uploads/files/'
export const UPLOADS_META_PREFIX = 'uploads/meta/'

// True when Blob storage is wired up. The API route uses this for the 503 guard;
// the loaders use it to short-circuit to an empty result.
export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

// Read every upload metadata sidecar from the uploads/meta/ prefix, newest first.
// Invalid sidecars are skipped (defensive: one bad file must not break the gallery).
export async function getUploads(): Promise<FamilyUpload[]> {
  if (!isBlobConfigured()) return []

  const { blobs } = await list({ prefix: UPLOADS_META_PREFIX, limit: 1000 })

  const results = await Promise.all(
    blobs
      .filter((b) => b.pathname.endsWith('.json'))
      .map(async (b) => {
        try {
          const res = await fetch(b.url, { cache: 'no-store' })
          if (!res.ok) return null
          const raw = await res.json()
          const parsed = FamilyUploadSchema.safeParse(raw)
          return parsed.success ? parsed.data : null
        } catch {
          return null
        }
      }),
  )

  return (results.filter(Boolean) as FamilyUpload[]).sort((a, b) =>
    b.uploadedAt.localeCompare(a.uploadedAt),
  )
}

// Distinct, sorted people-name suggestions for the free-text people picker:
// every name previously entered on an upload, UNIONed with every family-tree
// person's display name. Case-insensitive de-dupe, keeping first-seen casing.
export async function getPeopleNameSuggestions(): Promise<string[]> {
  const seen = new Map<string, string>() // lowercased → original casing
  const add = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const key = trimmed.toLowerCase()
    if (!seen.has(key)) seen.set(key, trimmed)
  }

  // Family-tree names are always available (read from committed JSON).
  for (const p of getPeople()) add(p.name)

  // Prior upload names (only when Blob is configured).
  if (isBlobConfigured()) {
    const uploads = await getUploads()
    for (const u of uploads) for (const name of u.people) add(name)
  }

  return [...seen.values()].sort((a, b) => a.localeCompare(b))
}
