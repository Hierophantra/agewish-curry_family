// app/(auth)/layout.tsx
// Minimal layout for the login page.
// No TopNav, no Footer, no StarMark - login page has its own centered layout.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
