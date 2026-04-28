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
import { LoginForm } from "./_components/login-form"

export const metadata: Metadata = {
  title: "Connexion"
}

type Props = {
  searchParams?: Promise<{ error?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  // Auth gate : si déjà connecté, retour au dashboard.
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (user) redirect("/dashboard")

  const params = await searchParams
  const callbackError = params?.error === "callback"

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Bon retour</CardTitle>
        <CardDescription>
          Connecte-toi pour gérer tes pages et tes QR codes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {callbackError && (
          <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            Le lien est invalide ou expiré. Recommence ou utilise mot de passe oublié.
          </div>
        )}
        <LoginForm />
        <div className="mt-4 text-center">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-forest hover:underline"
          >
            Mot de passe oublié ?
          </Link>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link
            href="/signup"
            className="font-semibold text-forest hover:underline"
          >
            Inscription
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
