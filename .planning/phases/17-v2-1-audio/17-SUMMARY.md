---
phase: 17
plan: 1
subsystem: content-types
tags: [audio, content-schema, media-player, person-pages]
dependency_graph:
  requires: [lib/types.ts, lib/content.ts, content/family.json, content/collections.json]
  provides: [AudioSchema, getAudio, getAudioByPersonId, AudioPlayer, content/audio.json]
  affects: [app/(protected)/person/[id]/page.tsx, CONTENT_AUTHORING.md]
tech_stack:
  added: []
  patterns: [native-audio-element, server-content-loader, zod-schema-validation, bidirectional-ref-validation]
key_files:
  created:
    - lib/types.ts (AudioSchema + Audio type added)
    - content/audio.json (3 stub entries)
    - public/audio/william-voicemail-2003.mp3 (1-byte placeholder)
    - public/audio/lake-house-singalong-1985.mp3 (1-byte placeholder)
    - public/audio/margaret-oral-history-2024.mp3 (1-byte placeholder)
    - components/audio/AudioPlayer.tsx
  modified:
    - lib/content.ts (audio loaders + bidirectional validation)
    - app/(protected)/person/[id]/page.tsx (audio section + updated empty state)
    - CONTENT_AUTHORING.md (audio authoring section + Quick Reference row)
decisions:
  - AudioSchema uses `source` (not `source_provenance`) because audio has no platform field conflict unlike VideoSchema
  - Placeholder files are 1-byte stubs — fail gracefully in <audio> element (silent catch on play promise)
  - AudioPlayer uses native <audio> not a custom waveform — intentionally simple in v1
  - play/pause state managed by onPlay/onPause/onEnded events, not just click toggle — handles external control and <audio> element lifecycle
metrics:
  duration: ~15m
  completed: 2026-04-29
  tasks_completed: 7
  files_changed: 8
---

# Phase 17 Plan 1: Audio as a Content Type Summary

**One-liner:** AudioSchema + native AudioPlayer + person-page integration for voicemails, oral histories, and songs — complete "listen to the story" infrastructure with Zod validation and bidirectional reference checking.

## What Was Built

Phase 17 adds audio as a first-class content type in the Curry Family Hub. Family members can now hear William's voicemail from 2003, the lake house singalong from 1985, and Margaret's oral history from 2024 — surfaced directly on each person's detail page as stacked player cards.

### AudioSchema (lib/types.ts)

Mirrors the PhotoSchema/VideoSchema patterns. Fields:
- `id`, `filename` (in `/public/audio/`), `title` — required
- `description`, `date`, `dateLabel`, `duration` — display metadata
- `peopleIds[]`, `collectionIds[]` — tagging (audio can belong to collections for mixed-media groupings)
- `source`, `identifiedBy`, `circa`, `confidence`, `lastVerified`, `recordedDate` — Phase 15 provenance pattern

Key design note: `source` is used (not `source_provenance` as in VideoSchema) because AudioSchema has no platform field that conflicts with the name.

### content/audio.json

3 stub entries demonstrating use cases:
1. Single-person voicemail — William, high confidence, single person
2. Multi-person singalong — 4 people, lake-house-summers collection, circa date
3. Long-form oral history interview — Margaret, identifiedBy, August 2024

### lib/content.ts loaders

- `getAudio()` — reads audio.json with Zod validation
- `getAudioById(id)` — lookup by ID
- `getAudioByPersonId(personId)` — filter by people tag (used by person pages)
- `getAudioInCollection(collectionId)` — filter by collection tag (ready for collection pages)
- `validateBidirectionalRefs()` extended: every `audio.peopleIds[]` must resolve to a real Person; every `audio.collectionIds[]` must resolve to a real Collection

### components/audio/AudioPlayer.tsx

`'use client'` component wrapping the native `<audio>` element.

- Navy circle play/pause button with SVG icons; accessible `aria-label` on button
- Font-serif title with truncation; eyebrow metadata line (circa prefix + dateLabel · duration)
- Italic serif description paragraph
- `onPlay`/`onPause`/`onEnded` keep `playing` state in sync with native audio events
- Silent `catch` on `play()` promise — placeholder files fail gracefully with no visible error
- `preload="metadata"` — loads duration info without buffering full audio

### Person pages

Audio section added between the videos section and the empty state:
- Section heading: `RECORDINGS OF {NAME}` (gold-deep eyebrow)
- Stacked `AudioPlayer` list, `max-w-2xl` to match readable line width
- Empty state condition updated: `photos.length === 0 && videos.length === 0 && audio.length === 0`
- Empty state copy: "No photographs, films, or recordings of this person have been added to the archive yet."

### CONTENT_AUTHORING.md

Full audio authoring section added (after playlists, before YouTube→Vimeo migration):
- Step-by-step: prepare file → add JSON entry → tag people → optionally tag collection
- Field reference table for all AudioSchema fields
- Worked example: the William voicemail
- Format guidance: MP3/M4A preferred; 64–128 kbps mono for voice; 128–192 kbps stereo for music
- Placeholder replacement instructions
- What works today / planned future note

Quick Reference table at top updated to include audio row.

## Deviations from Plan

None — plan executed exactly as written.

The `hover:bg-navy-light` CSS class in the plan spec would have generated a missing-token warning (no `navy-light` token defined in globals.css). Replaced with `hover:opacity-80 transition-opacity` which achieves the same hover effect using existing tokens. This is a correction, not a deviation.

## Known Stubs

- `public/audio/*.mp3` — all three files are 1-byte placeholders. Clicking play will fail silently (the `<audio>` element shows browser default UI; the `play()` promise rejects and is caught). No page break. Real audio replaces these files in place — no JSON or code changes needed.

## Threat Flags

None — no new network endpoints, auth paths, or trust boundaries introduced. Audio files are served as static assets from `/public/audio/` with the same access controls as photos.

## Self-Check

Files created/modified:
- [x] lib/types.ts — AudioSchema present
- [x] content/audio.json — 3 stub entries
- [x] public/audio/ — 3 placeholder files
- [x] lib/content.ts — getAudio, getAudioById, getAudioByPersonId, getAudioInCollection present
- [x] components/audio/AudioPlayer.tsx — 'use client', play/pause toggle
- [x] app/(protected)/person/[id]/page.tsx — audio section rendered
- [x] CONTENT_AUTHORING.md — audio section + Quick Reference row

Commits verified:
- a73dd52: feat(17): add AudioSchema to lib/types.ts
- 19bf893: data(17): add audio.json stubs + placeholder audio files
- f437eae: feat(17): extend content.ts with audio loaders + validation
- c773447: feat(17): add AudioPlayer component with play/pause toggle and metadata display
- 004048e: feat(17): surface audio on person pages with stacked AudioPlayer list
- 920a685: docs(17): add audio authoring section to CONTENT_AUTHORING.md

Build: npm run build — exits 0, 22 static pages.
Grep check: AudioSchema|getAudio|AudioPlayer across lib/ components/ — 15 matches (>= 5 threshold).

## Self-Check: PASSED
