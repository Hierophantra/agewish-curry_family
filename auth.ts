// auth.ts
// NODE.JS ONLY — imports bcryptjs. NEVER import this file from middleware.ts.
// If middleware.ts imports from here, bcryptjs enters the edge runtime and build fails.
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import authConfig from './auth.config'

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig, // Spreads pages, callbacks from auth.config.ts
  providers: [
    // This provider REPLACES the stub in auth.config.ts
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
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  },
})
