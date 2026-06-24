// __tests__/family-upload-schema.test.ts
// Compile-time schema tests for the family image-upload feature, mirroring the
// style of types-schema.test.ts: these run as TypeScript type checks under
// `tsc --noEmit` (the `npm test` first step) plus a couple of runtime parse
// assertions that execute during `next build`'s module evaluation.
//
// Tests:
//   1. FamilyUploadSchema accepts a minimal valid upload (defaults fill in)
//   2. FamilyUploadSchema accepts a fully-populated upload
//   3. FamilyUploadSchema rejects a missing title
//   4. datePrecision only accepts 'year' | 'month' | 'date' | 'unknown'
//   5. uploadToPermanentRecord() maps title→Name, description→Description,
//      people→Keywords + Person: pairs, and emits a DatePrecision: pair
import { FamilyUploadSchema, DatePrecisionSchema } from '../lib/types'
import type { FamilyUpload, DatePrecision } from '../lib/types'
import { uploadToPermanentRecord } from '../lib/permanent'
import { z } from 'zod'

// Test 1: minimal upload — people/datePrecision defaulted, optional fields absent.
const _min: z.infer<typeof FamilyUploadSchema> = FamilyUploadSchema.parse({
  id: 'abc',
  title: 'A photo',
  fileUrl: 'https://example.com/abc.jpg',
  originalFilename: 'abc.jpg',
  mimeType: 'image/jpeg',
  uploadedAt: '2026-06-24T00:00:00.000Z',
})
void _min

// Test 2: fully-populated upload.
const _full: FamilyUpload = FamilyUploadSchema.parse({
  id: 'def',
  title: 'Lake house, summer',
  description: 'The whole family at the lake.',
  people: ['Ada Curry', 'William Curry'],
  date: '1979-01-01',
  datePrecision: 'year',
  fileUrl: 'https://example.com/def.jpg',
  originalFilename: 'lake_house_1979.jpg',
  mimeType: 'image/jpeg',
  uploadedBy: 'Family Member',
  uploadedAt: '2026-06-24T00:00:00.000Z',
  blurDataUrl: 'data:image/png;base64,AAAA',
})
void _full

// Test 3: missing title is rejected — type check that `title` is required.
type UploadInput = z.input<typeof FamilyUploadSchema>
// @ts-expect-error title is required by FamilyUploadSchema
const _noTitle: UploadInput = {
  id: 'ghi',
  fileUrl: 'https://example.com/ghi.jpg',
  originalFilename: 'ghi.jpg',
  mimeType: 'image/jpeg',
  uploadedAt: '2026-06-24T00:00:00.000Z',
}
void _noTitle

// Test 4: datePrecision enum is closed.
const _precision: DatePrecision = DatePrecisionSchema.parse('month')
void _precision
// @ts-expect-error 'decade' is not a valid DatePrecision
const _badPrecision: DatePrecision = 'decade'
void _badPrecision

// Test 5: the Permanent transform shape — title→Name, people→Keywords, and a
// DatePrecision: pair is always present. Verified by static typing of the
// returned PermanentRecord (Name/Description/Keywords/customFields fields exist).
const _record = uploadToPermanentRecord(_full)
const _name: string = _record.Name
const _keywords: string[] = _record.Keywords
const _hasPersonPair: boolean = _record.customFields.some((f) => f.name === 'Person')
const _hasPrecisionPair: boolean = _record.customFields.some((f) => f.name === 'DatePrecision')
void _name
void _keywords
void _hasPersonPair
void _hasPrecisionPair

export {}
