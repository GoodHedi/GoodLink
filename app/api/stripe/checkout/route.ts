import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  assertStripe,
  getStripePriceId,
  type Plan
} from "@/lib/stripe"

/**
 * POST /api/stripe/checkout
 * Body : { plan: 'pro' | 'agency' }
 *
 * Crée une session Stripe Checkout et redirige l'utilisateur vers la
 * page de paiement Stripe. À la complétion, Stripe renvoie l'utilisateur
 * vers /dashboard/billing?success=1 et envoie un webhook checkout.session.completed
 * qui mettra à jour accounts.tier.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Pas connecté." }, { status: 401 })
  }

  let body: { plan?: Plan } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Payload invalide." }, { status: 400 })
  }
  const plan = body.plan
  if (plan !== "pro" && plan !== "agency") {
    return NextResponse.json({ error: "Plan invalide." }, { status: 400 })
  }

  const priceId = getStripePriceId(plan)
  if (!priceId) {
    return NextResponse.json(
      { error: "Plan non configuré côté Stripe." },
      { status: 500 }
    )
  }

  const stripe = assertStripe()

  // Récupère / crée le customer Stripe lié au compte
  const { data: account } = await supabase
    .from("accounts")
    .select("stripe_customer_id, username")
    .eq("id", user.id)
    .maybeSingle()

  let customerId = account?.stripe_customer_id ?? null
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      name: account?.username ?? undefined,
      metadata: { user_id: user.id }
    })
    customerId = customer.id
    await supabase
      .from("accounts")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id)
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/dashboard/billing?success=1`,
    cancel_url: `${siteUrl}/pricing?canceled=1`,
    allow_promotion_codes: true,
    metadata: { user_id: user.id, plan }
  })

  if (!session.url) {
    return NextResponse.json(
      { error: "Pas d'URL Stripe retournée." },
      { status: 500 }
    )
  }

  return NextResponse.json({ url: session.url })
}
