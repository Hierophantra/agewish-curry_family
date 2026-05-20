// app/api/archive/route.ts
// Auth-gated route that generates and returns a manifest.zip containing all
// content/*.json files plus a self-contained index.html archive viewer.
//
// The archive is designed to outlive the framework: open index.html in any
// browser, offline, without Vercel or Next.js, and browse the full archive.
//
// Binary assets (photos, audio) are NOT included - they are referenced by
// filename only. To get the binaries, clone the source repository.
import { NextResponse } from 'next/server'
import JSZip from 'jszip'
import { auth } from '@/auth'
import { getPeople, getPhotos, getVideos, getAudio, getCollections, getPlaylists, getChronicles } from '@/lib/content'
import { generateArchiveHtml } from '@/lib/archive-template'

export async function GET() {
  const session = await auth()
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const family = getPeople()
  const photos = getPhotos()
  const videos = getVideos()
  const audio = getAudio()
  const collections = getCollections()
  const playlists = getPlaylists()
  const chronicles = getChronicles()
  const exportedDate = new Date().toISOString().split('T')[0]

  const zip = new JSZip()

  // ── Content JSON files ──
  zip.file('content/family.json', JSON.stringify(family, null, 2))
  zip.file('content/photos.json', JSON.stringify(photos, null, 2))
  zip.file('content/videos.json', JSON.stringify(videos, null, 2))
  zip.file('content/audio.json', JSON.stringify(audio, null, 2))
  zip.file('content/collections.json', JSON.stringify(collections, null, 2))
  zip.file('content/playlists.json', JSON.stringify(playlists, null, 2))
  zip.file('content/chronicles.json', JSON.stringify(chronicles, null, 2))

  // ── Self-contained viewer ──
  zip.file(
    'index.html',
    generateArchiveHtml({ family, photos, videos, audio, collections, playlists, chronicles, exportedDate })
  )

  // ── README ──
  zip.file(
    'README.txt',
    `The Curry Family Archive
Exported ${exportedDate}

This archive contains the full content of the Curry Family Hub as JSON files
plus a self-contained index.html viewer that requires no internet connection
or framework to read.

Files:
  content/family.json       - Family members (people)
  content/photos.json       - Photographs metadata
  content/videos.json       - Films and recordings
  content/audio.json        - Voice recordings, oral histories, songs
  content/collections.json  - Photo collection definitions
  content/playlists.json    - Video playlist definitions
  content/chronicles.json   - Written family stories and chronicles
  index.html                - Open in any browser to browse the archive
  README.txt                - This file

This export does not include the actual photo, video, or audio files.
Those live at /public/photos/, /public/audio/ in the source repository.
To get the binary assets, clone the source repository or contact the
archive maintainer.

Held in trust for those who come after.
`
  )

  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="curry-family-archive-${exportedDate}.zip"`,
    },
  })
}
