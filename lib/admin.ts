// lib/admin.ts
// Server-only admin permission helpers.
// NEVER import this file from client components — it calls auth() which requires Node.js runtime.
import 'server-only'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'

/**
 * Returns the GitHub login of the authenticated admin user, or null.
 * An admin is a user who:
 *   1. Has signed in via GitHub OAuth (session.user.githubLogin is set)
 *   2. Their githubLogin appears in the comma-separated ADMIN_GITHUB_USERNAMES env var
 *
 * The allowlist is checked server-side only — ADMIN_GITHUB_USERNAMES is never exposed to the client.
 */
export async function getAdminUser(): Promise<string | null> {
  const session = await auth()
  if (!session?.user?.githubLogin) return null

  const allowlist = (process.env.ADMIN_GITHUB_USERNAMES ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  return allowlist.includes(session.user.githubLogin) ? session.user.githubLogin : null
}

/**
 * Throws if the current user is not an admin.
 * For use in admin API route handlers that should hard-fail.
 */
export async function requireAdmin(): Promise<string> {
  const adminLogin = await getAdminUser()
  if (!adminLogin) {
    throw new Error('Forbidden: admin access required')
  }
  return adminLogin
}

/**
 * Redirects to /admin/login if the current user is not an admin.
 * For use at the top of admin Server Component pages that need protection.
 *
 * IMPORTANT: This belongs in PAGES, not in app/admin/layout.tsx — the layout wraps
 * the login page itself, so a layout-level redirect would create an infinite loop.
 */
export async function requireAdminOrRedirect(): Promise<string> {
  const adminLogin = await getAdminUser()
  if (!adminLogin) {
    redirect('/admin/login')
  }
  return adminLogin
}
