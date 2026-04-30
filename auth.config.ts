// auth.config.ts
// EDGE-SAFE — imported by middleware.ts which runs in the Edge Runtime.
// Do NOT add password-hashing libs, fs, path, crypto, or any Node.js-only imports here.
// The authorize() stub returns null; the real password check is in auth.ts.
import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

export default {
  providers: [
    Credentials({
      credentials: {
        password: { label: 'Password', type: 'password' },
      },
      // authorize() here is a stub — the real password hash check is in auth.ts.
      // auth.ts overrides this provider with the full version.
      // Returning null from here means "not authorized" — auth.ts replaces this behavior.
      async authorize() {
        return null
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    // Controls whether middleware allows the request or redirects to /login.
    // Called on every request matched by middleware.ts matcher.
    // Does NOT re-run authorize() — that only runs on sign-in form submission.
    authorized({ auth }) {
      return !!auth?.user
    },
  },
} satisfies NextAuthConfig
