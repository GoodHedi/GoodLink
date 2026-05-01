import type { Metadata } from "next"
import Link from "next/link"
import { Check, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { PLAN_PRICE_EUR_MONTH } from "@/lib/stripe"
import { CheckoutButton } from "./_components/checkout-button"

export const metadata: Metadata = {
  title: "Tarifs",
  description:
    "Choisis ton plan GoodLink : Visiteur (gratuit), Pro ou Agence."
}
export const dynamic = "force-dynamic"

const VISITEUR_FEATURES = [
  "1 page GoodLink",
  "1 QR code basique",
  "Liens illimités sur la page",
  "Couleur de fond personnalisable"
]

const PRO_FEATURES = [
  "20 pages GoodLink",
  "50 QR codes trackés (avec scans)",
  "Avatar et fonds image (mobile + desktop)",
  "Audio attaché à la page",
  "Templates, polices, couleurs et formes",
  "Workspaces partagés (collaboration)",
  "Partage de cartes par pseudo",
  "Statistiques détaillées"
]

const AGENCE_FEATURES = [
  "Tout le plan Pro",
  "100 pages, 200 QR codes",
  "Codes d'activation pour gérer tes clients",
  "Tableau de bord clients",
  "Personnalisation à la demande via support"
]

export default async function PricingPage() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  return (
    <main className="min-h-svh bg-cream/40 py-12">
      <div className="container max-w-5xl space-y-10">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent">
            <Sparkles className="h-3 w-3" />
            Tarifs
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-forest sm:text-4xl">
            Choisis ton plan
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Commence gratuit. Passe Pro quand tu en as besoin. Annule
            à tout moment.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Visiteur */}
          <PlanCard
            tier="visiteur"
            name="Visiteur"
            price={0}
            tagline="Pour découvrir"
            features={VISITEUR_FEATURES}
            cta={
              user ? (
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard">Aller au dashboard</Link>
                </Button>
              ) : (
                <Button asChild variant="outline" className="w-full">
                  <Link href="/signup">Créer un compte</Link>
                </Button>
              )
            }
          />

          {/* Pro */}
          <PlanCard
            tier="pro"
            name="Pro"
            price={PLAN_PRICE_EUR_MONTH.pro}
            tagline="Pour les créateurs et indépendants"
            features={PRO_FEATURES}
            highlighted
            cta={
              user ? (
                <CheckoutButton plan="pro" />
              ) : (
                <Button asChild variant="accent" className="w-full">
                  <Link href="/signup?plan=pro">Commencer</Link>
                </Button>
              )
            }
          />

          {/* Agence */}
          <PlanCard
            tier="agence"
            name="Agence"
            price={PLAN_PRICE_EUR_MONTH.agency}
            tagline="Pour gérer plusieurs clients"
            features={AGENCE_FEATURES}
            cta={
              user ? (
                <CheckoutButton plan="agency" />
              ) : (
                <Button asChild variant="default" className="w-full">
                  <Link href="/signup?plan=agency">Commencer</Link>
                </Button>
              )
            }
          />
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Tu peux résilier à tout moment depuis ton dashboard. Aucun engagement.
        </p>
      </div>
    </main>
  )
}

function PlanCard({
  name,
  price,
  tagline,
  features,
  cta,
  highlighted = false
}: {
  tier: "visiteur" | "pro" | "agence"
  name: string
  price: number
  tagline: string
  features: string[]
  cta: React.ReactNode
  highlighted?: boolean
}) {
  return (
    <div
      className={`relative rounded-2xl border bg-card p-6 shadow-soft ${
        highlighted
          ? "border-accent ring-2 ring-accent/30"
          : "border-border"
      }`}
    >
      {highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
          Recommandé
        </span>
      )}
      <h2 className="text-lg font-bold text-forest">{name}</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">{tagline}</p>
      <p className="mt-4">
        <span className="text-3xl font-extrabold text-forest">
          {price === 0 ? "0 €" : `${price} €`}
        </span>
        <span className="ml-1 text-sm text-muted-foreground">/ mois</span>
      </p>
      <ul className="mt-5 space-y-2">
        {features.map((f) => (
          <li
            key={f}
            className="flex items-start gap-2 text-sm text-foreground"
          >
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6">{cta}</div>
    </div>
  )
}
