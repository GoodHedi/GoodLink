import Link from "next/link"
import { redirect } from "next/navigation"
import { ExternalLink, LogOut } from "lucide-react"
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single()

  // Edge case : utilisateur dans auth.users sans ligne profiles. Ne devrait pas
  // arriver grâce au trigger, mais on protège l'accès au dashboard.
  if (!profile) {
    return (
      <div className="min-h-svh grid place-items-center bg-cream px-6">
        <div className="max-w-sm text-center space-y-3">
          <h1 className="text-2xl font-extrabold text-forest">
            Profil introuvable
          </h1>
          <p className="text-sm text-muted-foreground">
            Ton compte existe mais aucun profil n&apos;y est associé. Recommence
            l&apos;inscription ou contacte le support.
          </p>
          <form action="/auth/signout" method="post">
            <Button variant="outline" size="sm" type="submit">
              Se déconnecter
            </Button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-cream/50">
      <header className="sticky top-0 z-30 border-b border-border bg-white/80 backdrop-blur">
        <div className="container flex items-center justify-between py-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-extrabold text-forest"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-forest text-cream">
              G
            </span>
            <span className="hidden tracking-tight sm:inline">GoodLink</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link
                href={`/${profile.username}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="hidden sm:inline">Voir ma page</span>
                <span className="sm:hidden">Aperçu</span>
              </Link>
            </Button>
            <form action="/auth/signout" method="post">
              <Button variant="outline" size="sm" type="submit">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Déconnexion</span>
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
