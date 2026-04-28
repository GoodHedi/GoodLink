import Link from "next/link"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { ResetPasswordForm } from "./_components/reset-password-form"

export const metadata: Metadata = { title: "Nouveau mot de passe" }
export const dynamic = "force-dynamic"

export default async function ResetPasswordPage() {
  // Cette page nécessite une session active (acquise via le lien de
  // recovery → /auth/callback → ici). Sinon, on renvoie vers forgot.
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) redirect("/forgot-password")

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
        <div className="w-full max-w-md animate-fade-in">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Choisis un nouveau mot de passe</CardTitle>
              <CardDescription>
                Tu seras connecté automatiquement après validation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResetPasswordForm />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
