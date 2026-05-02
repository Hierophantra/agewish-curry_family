// auth.ts
// NODE.JS ONLY — imports bcryptjs. NEVER import this file from middleware.ts.
// If middleware.ts imports from here, bcryptjs enters the edge runtime and build fails.
//
// CRITICAL: The `providers` array below is the ONLY providers list at runtime.
// Spreading `...authConfig` and then redefining `providers` REPLACES the array entirely
// (object-spread semantics on same key) — it does NOT merge. So every provider that
// should exist at runtime must be re-listed here, including GitHub.
//
// auth.config.ts holds the GitHub provider for middleware (edge runtime, no bcrypt).
// This file holds BOTH providers for the Node.js runtime (handlers, callbacks).
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import GitHub from 'next-auth/providers/github'
import bcrypt from 'bcryptjs'
import authConfig from './auth.config'

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig, // Spreads pages, callbacks from auth.config.ts
  providers: [
    // Family password provider — REPLACES the auth.config.ts stub (which returns null
    // because bcrypt can't run in the edge). Real password check happens here.
    Credentials({
      credentials: {
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const password = credentials?.password
        if (typeof password !== 'string' || password.length === 0) return null

        const hash = process.env.AUTH_PASSWORD_HASH
        if (!hash) {
          // Fail loudly — missing env var means no one can log in
          throw new Error('AUTH_PASSWORD_HASH env var is not set')
        }

        const isValid = await bcrypt.compare(password, hash)
        if (!isValid) return null

        // Single shared identity for the whole family
        return { id: 'family', name: 'Family Member' }
      },
    }),
    // GitHub provider for /admin — re-listed here because spread-and-override on
    // `providers` discards everything from authConfig.providers. Without this, the
    // GitHub OAuth callback handler has no GitHub provider to consult and falls
    // through to pages.signIn = '/login' (the family password page).
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'read:user repo',
        },
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  },
})
