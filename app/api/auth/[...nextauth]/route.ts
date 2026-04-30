// app/api/auth/[...nextauth]/route.ts
// Auth.js v5 route handler — handles all /api/auth/* requests
// (sign-in POST, sign-out POST, CSRF token GET, session GET, etc.)
// Runs in Node.js runtime (not edge) — importing from @/auth is correct here.
import { handlers } from '@/auth'
export const { GET, POST } = handlers
