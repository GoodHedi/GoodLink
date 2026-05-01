import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Check, CreditCard, ExternalLink, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { tierLabel } from "@/lib/constants"
import { PLAN_PRICE_EUR_MONTH } from "@/lib/stripe"
import { PortalButton } from "./_components/portal-button"
import { CheckoutButton } from "../../pricing/_components/checkout-button"

export const metadata: Metadata = { title: "Abonnement" }
export const dynamic = "force-dynamic"

export default async function BillingPage({
  searchParams
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: account } = await supabase
    .from("accounts")
    .select(
      "tier, stripe_customer_id, stripe_subscription_id, tier_expires_at"
    )
    .eq("id", user.id)
    .maybeSingle()

  if (!account) redirect("/login")

  const hasActiveSub = !!account.stripe_subscription_id

  return (
    <div className="container max-w-3xl space-y-8 py-8 lg:py-12">
      <div>
        <h1 className="inline-flex items-center gap-2 text-2xl font-extrabold tracking-tight text-forest sm:text-3xl">
          <CreditCard className="h-6 w-6" />
          Abonnement
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gère ton plan et ton mode de paiement.
        </p>
      </div>

      {sp.success === "1" && (
        <div className="rounded-xl border border-accent/40 bg-accent/10 p-4 text-sm text-forest">
          <div className="font-bold">Paiement validé.</div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Ton plan sera activé dans quelques secondes (le temps que Stripe
            nous notifie). Rafraîchis si besoin.
          </p>
        </div>
      )}

      {/* Plan actuel */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Ton plan actuel
            </p>
            <p className="mt-1 text-2xl font-extrabold text-forest">
              {tierLabel(account.tier)}
            </p>
            {account.tier_expires_at && hasActiveSub && (
              <p className="mt-1 text-xs text-muted-foreground">
                Renouvellement le{" "}
                <span className="font-semibold tabular-nums">
                  {new Date(account.tier_expires_at).toLocaleDateString(
                    "fr-FR"
                  )}
                </span>
              </p>
            )}
            {account.tier === "agence_client" && (
              <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 text-[11px] font-semibold text-accent">
                <Sparkles className="h-3 w-3" />
                Géré par une agence
              </p>
            )}
          </div>
          {hasActiveSub ? (
            <PortalButton />
          ) : (
            <Button asChild variant="accent" size="sm">
              <Link href="/pricing">Voir les plans</Link>
            </Button>
          )}
        </div>
      </section>

      {/* Upgrade vers tiers supérieurs */}
      {account.tier !== "agence" && account.tier !== "agence_client" && (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="text-sm font-bold text-forest">Changer de plan</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {account.tier !== "pro" && (
              <PlanQuickCard
                name="Pro"
                price={PLAN_PRICE_EUR_MONTH.pro}
                bullets={[
                  "20 pages",
                  "50 QR codes",
                  "Toutes les personnalisations"
                ]}
                cta={<CheckoutButton plan="pro" />}
              />
            )}
            <PlanQuickCard
              name="Agence"
              price={PLAN_PRICE_EUR_MONTH.agency}
              bullets={[
                "Tout Pro",
                "100 pages, 200 QR",
                "Codes pour tes clients"
              ]}
              cta={<CheckoutButton plan="agency" />}
            />
          </div>
        </section>
      )}

      {/* Lien activer code agence */}
      {account.tier !== "agence" && (
        <section className="rounded-2xl border border-dashed border-border bg-muted/20 p-5">
          <h3 className="text-sm font-bold text-forest">
            Tu es géré par une agence ?
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Active le code que ton agence t&apos;a fourni pour bénéficier des
            fonctionnalités Pro sans paiement direct.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-3">
            <Link href="/dashboard/activate-code">
              <ExternalLink className="h-3.5 w-3.5" />
              Activer un code agence
            </Link>
          </Button>
        </section>
      )}
    </div>
  )
}

function PlanQuickCard({
  name,
  price,
  bullets,
  cta
}: {
  name: string
  price: number
  bullets: string[]
  cta: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-base font-bold text-forest">{name}</h3>
        <span className="text-sm text-muted-foreground">
          <span className="text-xl font-extrabold text-forest">
            {price} €
          </span>
          /mois
        </span>
      </div>
      <ul className="mt-3 space-y-1.5">
        {bullets.map((b) => (
          <li
            key={b}
            className="flex items-start gap-1.5 text-xs text-foreground"
          >
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4">{cta}</div>
    </div>
  )
}
