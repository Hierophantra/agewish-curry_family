// lib/permanent.ts
// Pure (no-network) transform marking the seam to a future Permanent.org export.
//
// FamilyUploadSchema was designed Permanent-shaped on purpose, so exporting a
// family upload to Permanent is a thin, lossless mapping — NOT a re-modelling.
// uploadToPermanentRecord() is that mapping, as a stub: it returns the
// Permanent-shaped record object and performs no I/O. When the real Permanent
// integration lands, the network call wraps this function; the shape stays put.
//
// Mapping (per the upload brief):
//   title       → Name
//   description → Description
//   each person → BOTH a Keyword AND a custom pair "Person:<name>"
//   date        → Date + a custom pair "DatePrecision:<precision>"
// The original file bytes are referenced (fileUrl), never mutated.
import type { FamilyUpload } from './types'

// A single Permanent custom-metadata key/value pair, e.g. { name: 'Person', value: 'Ada' }.
export interface PermanentCustomField {
  name: string
  value: string
}

// The Permanent-shaped record produced from a FamilyUpload. This is a plain data
// object — the exact field names mirror Permanent's archive-record vocabulary so
// the eventual API client can hand it over with minimal adaptation.
export interface PermanentRecord {
  // Permanent "Name" — the human title of the record.
  Name: string
  // Permanent "Description" — long-form context. Empty string when none given.
  Description: string
  // Permanent "Date" — ISO date string, or empty when the date is unknown.
  Date: string
  // Flat keyword list. Each tagged person becomes a keyword (Permanent surfaces
  // keywords for search/browse).
  Keywords: string[]
  // Custom key/value metadata. Holds the structured "Person:<name>" pairs and the
  // single "DatePrecision:<precision>" pair, preserving the data a flat keyword
  // would lose.
  customFields: PermanentCustomField[]
  // Pointer to the untouched original file bytes (Vercel Blob URL today).
  fileUrl: string
  // Original on-disk filename, preserved as provenance.
  originalFilename: string
}

/**
 * Transform a FamilyUpload into a Permanent-shaped record. Pure: no network, no
 * mutation of the input or of the stored file. Marks the export seam.
 */
export function uploadToPermanentRecord(u: FamilyUpload): PermanentRecord {
  const people = u.people.map((name) => name.trim()).filter(Boolean)

  const customFields: PermanentCustomField[] = [
    // Each person is exportable as BOTH a Keyword (below) and a structured pair.
    ...people.map((name) => ({ name: 'Person', value: name })),
    // Date precision rides along so a year-only "1979-01-01" is not mistaken for
    // a known calendar day on the Permanent side.
    { name: 'DatePrecision', value: u.datePrecision },
  ]

  return {
    Name: u.title,
    Description: u.description ?? '',
    // An "unknown" precision means we hold no real date — export it as empty
    // rather than a misleading placeholder day.
    Date: u.datePrecision === 'unknown' ? '' : (u.date ?? ''),
    Keywords: people,
    customFields,
    fileUrl: u.fileUrl,
    originalFilename: u.originalFilename,
  }
}
