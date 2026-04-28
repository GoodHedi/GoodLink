import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "./_components/dashboard-nav"
import { UserMenu } from "./_components/user-menu"

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Identité du workspace : on récupère le pseudo de compte (créé au signup
  // par le trigger handle_new_user). Peut être null pour les comptes
  // pré-multi-page ou les comptes OAuth.
  const { data: account } = await supabase
    .from("accounts")
    .select("username")
    .eq("id", user.id)
    .maybeSingle()

  return (
    <div className="min-h-svh bg-cream/50">
      <header className="sticky top-0 z-30 border-b border-border bg-white/80 backdrop-blur">
        <div className="container flex items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 font-extrabold text-forest"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-forest text-cream">
                G
              </span>
              <span className="hidden tracking-tight sm:inline">GoodLink</span>
            </Link>
            <span className="hidden h-5 w-px bg-border md:inline-block" />
            <span className="hidden text-xs font-semibold uppercase tracking-wider text-muted-foreground md:inline">
              Workspace
            </span>
          </div>

          <DashboardNav />

          <UserMenu
            username={account?.username ?? null}
            email={user.email ?? ""}
          />
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
