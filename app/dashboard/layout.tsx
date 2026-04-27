import Link from "next/link"
import { redirect } from "next/navigation"
import { LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"

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

  return (
    <div className="min-h-svh bg-cream/50">
      <header className="sticky top-0 z-30 border-b border-border bg-white/80 backdrop-blur">
        <div className="container flex items-center justify-between py-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 font-extrabold text-forest"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-forest text-cream">
              G
            </span>
            <span className="hidden tracking-tight sm:inline">GoodLink</span>
          </Link>

          <nav className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard">Pages</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/qr">QR codes</Link>
            </Button>
          </nav>

          <form action="/auth/signout" method="post">
            <Button variant="outline" size="sm" type="submit">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </Button>
          </form>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
