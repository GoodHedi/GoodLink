import Link from "next/link"
import type { Metadata } from "next"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { SignupForm } from "./_components/signup-form"

export const metadata: Metadata = {
  title: "Inscription"
}

type Props = {
  searchParams?: Promise<{ username?: string }>
}

export default async function SignupPage({ searchParams }: Props) {
  const params = await searchParams
  const prefilledUsername = params?.username ?? ""

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Crée ton GoodLink</CardTitle>
        <CardDescription>
          Réclame ton pseudo en moins de 30 secondes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignupForm defaultUsername={prefilledUsername} />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Déjà inscrit ?{" "}
          <Link
            href="/login"
            className="font-semibold text-forest hover:underline"
          >
            Connexion
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
