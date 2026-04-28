import Link from "next/link"
import type { Metadata } from "next"
import { Users } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { AcceptForm } from "./_components/accept-form"

export const metadata: Metadata = { title: "Invitation workspace" }
export const dynamic = "force-dynamic"

export default async function InvitePage({
  params
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  // Si pas connecté → on demande de se connecter d'abord, redirect ici après
  if (!user) {
    return (
      <Shell>
        <div className="space-y-3 text-center">
          <p className="text-sm text-muted-foreground">
            Pour accepter cette invitation, connecte-toi (ou crée un compte
            avec l&apos;email invité).
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href={`/login?next=/invite/${token}`}>Connexion</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/signup?next=/invite/${token}`}>Inscription</Link>
            </Button>
          </div>
        </div>
      </Shell>
    )
  }

  // L'utilisateur est connecté : on affiche un bouton "Accepter".
  // Le détail de l'invitation est révélé après acceptation (RLS empêche le
  // SELECT direct par non-owner). On reste minimaliste sur ce que l'on
  // affiche avant l'accept.
  return (
    <Shell>
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">
          Tu as reçu une invitation à rejoindre un workspace GoodLink.
          Clique pour accepter et accéder à ses pages.
        </p>
        <AcceptForm token={token} />
      </div>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
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
        <div className="w-full max-w-md animate-fade-in rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-soft">
            <Users className="h-5 w-5" />
          </div>
          <h1 className="mb-2 text-center text-2xl font-extrabold tracking-tight text-forest">
            Invitation à un workspace
          </h1>
          {children}
        </div>
      </main>
    </div>
  )
}
