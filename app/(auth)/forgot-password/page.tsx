import Link from "next/link"
import type { Metadata } from "next"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { ForgotPasswordForm } from "./_components/forgot-password-form"

export const metadata: Metadata = {
  title: "Mot de passe oublié"
}

export default function ForgotPasswordPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Mot de passe oublié</CardTitle>
        <CardDescription>
          Entre ton email, on t&apos;envoie un lien pour le réinitialiser.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="font-semibold text-forest hover:underline"
          >
            Retour à la connexion
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
