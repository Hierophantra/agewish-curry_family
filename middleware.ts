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
  // - /api/* — Auth.js route handlers (and the /api/archive download endpoint, which does its own auth check)
  // - /_next/static — static file serving
  // - /_next/image — image optimization
  // - /favicon.ico — browser favicon request
  // - /images, /photos, /audio — static media in /public/. These MUST be excluded:
  //   Next.js's image optimizer fetches the underlying URL server-side after rewriting it
  //   through /_next/image. If the underlying URL goes through middleware and gets redirected
  //   to /login, the optimizer receives non-image content and renders broken images.
  //   These are publicly accessible if the exact URL is known, but the slugs are not enumerable.
  matcher: ['/((?!api|_next/static|_next/image|images|photos|audio|favicon.ico).*)'],
}
