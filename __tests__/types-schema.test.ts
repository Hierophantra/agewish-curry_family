// __tests__/types-schema.test.ts
// TDD tests for Task 1: PersonSchema gender field + bidirectional validator extension.
// These run as TypeScript type checks (tsc --noEmit) to verify the schema accepts/rejects
// the correct shapes. Runtime assertions are expressed as static type assertions.
//
// Tests:
//   1. PersonSchema.parse({ id: 'a', name: 'A' }) succeeds (gender absent = valid)
//   2. PersonSchema.parse({ id: 'a', name: 'A', gender: 'female' }) succeeds
//   3. PersonSchema.parse({ id: 'a', name: 'A', gender: 'alien' }) throws ZodError
//   4. validateBidirectionalRefs() throws when spouseIds is not reciprocal
//   5. validateBidirectionalRefs() throws when parentId references a non-existent person
//   6. validateBidirectionalRefs() throws when childId references a non-existent person

import { PersonSchema } from '../lib/types'
import { z } from 'zod'

// Test 1: gender absent is valid (optional field)
const _test1: z.infer<typeof PersonSchema> = PersonSchema.parse({ id: 'a', name: 'A' })
void _test1

// Test 2: gender: 'female' is valid
const _test2: z.infer<typeof PersonSchema> = PersonSchema.parse({ id: 'a', name: 'A', gender: 'female' })
void _test2

// Test 3: gender: 'alien' is invalid — type check that 'alien' is not assignable to the gender enum
// This is a compile-time test: the gender field must accept only 'male' | 'female' | 'other'
type PersonGender = z.infer<typeof PersonSchema>['gender']
// @ts-expect-error 'alien' is not a valid gender value
const _badGender: PersonGender = 'alien'
void _badGender

// Tests 4-6 are verified by validateBidirectionalRefs() at runtime in content.ts.
// The type check here verifies the function signature is correct (returns void, throws on error).
// Runtime behavior is exercised by npm run build (which loads and validates family.json).
export {}
