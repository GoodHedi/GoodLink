import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function AuthLayout({
  children
}: {
  children: React.ReactNode
}) {
  // Si déjà authentifié, on évite un détour par /login ou /signup
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (user) redirect("/dashboard")

  return (
    <div className="min-h-svh bg-cream flex flex-col">
      <header className="container py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-extrabold text-forest"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-forest text-cream shadow-soft">
            G
          </span>
          <span className="text-lg tracking-tight">GoodLink</span>
        </Link>
      </header>
      <main className="flex-1 grid place-items-center px-4 pb-12">
        <div className="w-full max-w-md animate-fade-in">{children}</div>
      </main>
    </div>
  )
}
