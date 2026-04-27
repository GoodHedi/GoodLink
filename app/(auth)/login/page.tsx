import Link from "next/link"
import type { Metadata } from "next"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { LoginForm } from "./_components/login-form"

export const metadata: Metadata = {
  title: "Connexion"
}

type Props = {
  searchParams?: Promise<{ error?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams
  const callbackError = params?.error === "callback"

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Bon retour</CardTitle>
        <CardDescription>
          Connecte-toi pour gérer ton GoodLink.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {callbackError && (
          <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            Le lien de confirmation est invalide ou expiré. Connecte-toi ou
            recommence l&apos;inscription.
          </div>
        )}
        <LoginForm />
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
