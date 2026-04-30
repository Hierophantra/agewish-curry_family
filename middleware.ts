// middleware.ts
// CRITICAL: Import from './auth.config' ONLY.
// If you import from './auth.ts' directly, the password-hashing library enters the edge runtime
// and the build will fail with: "Module 'crypto' cannot be resolved in edge runtime"
import NextAuth from 'next-auth'
import authConfig from './auth.config'

const { auth } = NextAuth(authConfig)

export default auth

export const config = {
  // Run middleware on all routes EXCEPT:
  // - /api/* — Auth.js route handlers
  // - /_next/static — static file serving
  // - /_next/image — image optimization
  // - /favicon.ico — browser favicon request
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
