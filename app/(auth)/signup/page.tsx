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
import { SignupForm } from "./_components/signup-form"

export const metadata: Metadata = {
  title: "Inscription"
}

type Props = {
  searchParams?: Promise<{ username?: string }>
}

export default async function SignupPage({ searchParams }: Props) {
  // Auth gate
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (user) redirect("/dashboard")

  const params = await searchParams
  const prefilledUsername = params?.username ?? ""

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Crée ton compte</CardTitle>
        <CardDescription>
          Quelques infos rapides, et c&apos;est parti.
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
