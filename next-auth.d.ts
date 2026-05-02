// next-auth.d.ts
// Extends the default next-auth Session and JWT types to include GitHub OAuth fields.
// These fields are populated by the jwt + session callbacks in auth.config.ts.
import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      name?: string | null
      email?: string | null
      image?: string | null
      /** GitHub username (e.g. 'Hierophantra') — set when signed in via GitHub OAuth */
      githubLogin?: string
      /** GitHub OAuth access token — used by lib/github.ts to commit on the user's behalf */
      githubAccessToken?: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    githubLogin?: string
    githubAccessToken?: string
  }
}
