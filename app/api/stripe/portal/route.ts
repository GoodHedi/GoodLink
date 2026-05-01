import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { assertStripe } from "@/lib/stripe"

/**
 * POST /api/stripe/portal
 *
 * Crée une session du Customer Portal Stripe et redirige l'utilisateur
 * pour gérer son abonnement (update / cancel / méthodes de paiement).
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Pas connecté." }, { status: 401 })
  }

  const { data: account } = await supabase
    .from("accounts")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle()

  if (!account?.stripe_customer_id) {
    return NextResponse.json(
      { error: "Aucun client Stripe associé." },
      { status: 400 }
    )
  }

  const stripe = assertStripe()
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin

  const session = await stripe.billingPortal.sessions.create({
    customer: account.stripe_customer_id,
    return_url: `${siteUrl}/dashboard/billing`
  })

  return NextResponse.json({ url: session.url })
}
