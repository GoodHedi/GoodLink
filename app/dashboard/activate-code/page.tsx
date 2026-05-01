import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { KeyRound } from "lucide-react"
import { getMyTier } from "@/lib/tier"
import { ActivateForm } from "./_components/activate-form"

export const metadata: Metadata = { title: "Activer un code agence" }
export const dynamic = "force-dynamic"

export default async function ActivateCodePage() {
  const tier = await getMyTier()
  if (!tier) redirect("/login")

  // Une agence ne peut pas activer un code
  if (tier.tier === "agence") {
    redirect("/dashboard/agency")
  }

  return (
    <div className="container max-w-md py-12">
      <div className="space-y-2 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-accent/15 text-accent">
          <KeyRound className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-forest">
          Activer un code agence
        </h1>
        <p className="text-sm text-muted-foreground">
          Si une agence te gère, entre le code qu&apos;elle t&apos;a fourni
          pour activer ton statut « Client agence » et débloquer les
          fonctionnalités Pro.
        </p>
      </div>

      <div className="mt-8">
        <ActivateForm currentTier={tier.tier} />
      </div>
    </div>
  )
}
