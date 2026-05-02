// auth.config.ts
// EDGE-SAFE — imported by middleware.ts which runs in the Edge Runtime.
// Do NOT add password-hashing libs, fs, path, crypto, or any Node.js-only imports here.
// GitHub provider is fetch-based (Auth.js v5 standard) — safe for edge.
import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import GitHub from 'next-auth/providers/github'

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
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      authorization: {
        params: {
          // Request 'repo' scope so the admin can commit JSON edits back to the repo.
          // Even if the repo is public, write operations require 'repo' scope.
          scope: 'read:user repo',
        },
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
    // Capture GitHub access token + login (username) on initial sign-in.
    jwt({ token, account, profile }) {
      if (account?.provider === 'github' && account.access_token) {
        token.githubAccessToken = account.access_token
      }
      // profile.login is the GitHub username (e.g. 'Hierophantra')
      if (profile && 'login' in profile && typeof profile.login === 'string') {
        token.githubLogin = profile.login
      }
      return token
    },
    // Surface githubLogin and githubAccessToken on session.user for server components.
    session({ session, token }) {
      if (token.githubLogin) {
        session.user.githubLogin = token.githubLogin as string
      }
      if (token.githubAccessToken) {
        session.user.githubAccessToken = token.githubAccessToken as string
      }
      return session
    },
  },
} satisfies NextAuthConfig
