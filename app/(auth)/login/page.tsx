// app/(auth)/login/page.tsx
// Server Component. Login form with server action for authentication.
// D-01: Single password field, centered white background, star above, navy button.
// D-02: Inline error below input - generic copy "That password isn't right"
// D-03: autoFocus on password input (HTML attribute - no client JS needed)
import { signIn } from '@/auth'
import { AuthError } from 'next-auth'
import { redirect } from 'next/navigation'
import StarMark from '@/components/ui/StarMark'

interface LoginPageProps {
  searchParams: {
    error?: string
    callbackUrl?: string
  }
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const hasError = !!searchParams.error
  const callbackUrl = searchParams.callbackUrl ?? '/'

  // Server action - submits the login form
  async function handleLogin(formData: FormData) {
    'use server'
    try {
      await signIn('credentials', {
        password: formData.get('password'),
        redirectTo: callbackUrl,
      })
    } catch (err) {
      if (err instanceof AuthError) {
        // Redirect back to login with error param - the error searchParam triggers the error UI
        redirect(
          `/login?error=CredentialsSignin&callbackUrl=${encodeURIComponent(callbackUrl)}`
        )
      }
      // CRITICAL: Re-throw all non-AuthError exceptions.
      // On successful login, signIn() throws NEXT_REDIRECT - if we catch and don't re-throw,
      // the user stays on the login page and appears stuck.
      throw err
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Star motif - 36px for hero position per D-16/D-32 */}
        <div className="flex justify-center mb-6">
          <StarMark size={36} />
        </div>

        {/* Serif heading - sentence case per D-13 */}
        <h1 className="font-serif text-navy text-3xl text-center mb-8">
          The Curry Family
        </h1>

        <form action={handleLogin} className="space-y-4">
          {/* Password input - autoFocus per D-03 (HTML attribute, no JS needed) */}
          <input
            type="password"
            name="password"
            id="password"
            placeholder="Family password"
            autoFocus
            required
            className="w-full border hairline rounded px-4 py-3 text-sm focus:outline-none focus:border-navy transition-colors"
          />

          {/* Inline error - D-02: generic copy, no specific failure modes */}
          {hasError && (
            <p className="text-sm text-red-600" role="alert">
              That password isn&apos;t right.
            </p>
          )}

          {/* Navy submit button - D-01 */}
          <button
            type="submit"
            className="w-full bg-navy text-white py-3 text-sm font-medium hover:bg-navy/90 transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  )
}
