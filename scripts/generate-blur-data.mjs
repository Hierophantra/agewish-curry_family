// scripts/generate-blur-data.mjs
// Build-time / dev-time script to generate BlurHash base64 data URLs from photo files.
// Usage: npm run blur
//
// For each photo in content/photos.json:
//   - Reads the image file from public/photos/{filename}
//   - Generates a base64 blur placeholder via plaiceholder (uses sharp internally)
//   - Writes the result back to content/photos.json as blurDataUrl
//
// Safe to run repeatedly (idempotent). Skips photos where:
//   - The file does not exist
//   - The file is too small to process (< 100 bytes — stub/placeholder JPEGs)
//   - Any other error occurs during processing
//
// After adding real photos: overwrite the placeholder files in public/photos/ then run
// `npm run blur` to populate blurDataUrl in photos.json.
//
// IMPORTANT: This script is NOT imported by any app code. It is devDependency-only tooling.
// Do NOT run this as part of `npm run build`.

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { getPlaiceholder } from 'plaiceholder'

const photosPath = join(process.cwd(), 'content', 'photos.json')
const photos = JSON.parse(readFileSync(photosPath, 'utf8'))

let updated = 0
let skipped = 0

for (const photo of photos) {
  const filePath = join(process.cwd(), 'public', 'photos', photo.filename)

  try {
    const buffer = readFileSync(filePath)

    // Skip placeholder files that are too small to be real images.
    // The Phase 7 stubs are minimal valid JPEGs (a few hundred bytes).
    // Real photos are typically 100KB+. 100 bytes is a safe minimum threshold.
    if (buffer.length < 100) {
      console.log(`skipped ${photo.id}: file too small (${buffer.length} bytes) — replace with a real photo and re-run`)
      skipped++
      continue
    }

    const { base64 } = await getPlaiceholder(buffer, { size: 10 })
    photo.blurDataUrl = base64
    updated++
    console.log(`updated ${photo.id}: blur generated (${base64.length} chars)`)
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log(`skipped ${photo.id}: file not found at ${filePath}`)
    } else {
      console.log(`skipped ${photo.id}: ${err.message}`)
    }
    skipped++
  }
}

writeFileSync(photosPath, JSON.stringify(photos, null, 2) + '\n')
console.log(`\nDone. ${updated} updated, ${skipped} skipped.`)
