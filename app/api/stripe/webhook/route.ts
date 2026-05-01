import { NextResponse, type NextRequest } from "next/server"
import type Stripe from "stripe"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { assertStripe, planFromStripePriceId, tierFromPlan } from "@/lib/stripe"
import type { Database, AccountTier } from "@/types/database"

/**
 * POST /api/stripe/webhook
 *
 * Reçoit les events Stripe et synchronise accounts.tier /
 * accounts.stripe_subscription_id / accounts.tier_expires_at.
 *
 * Variables requises :
 *   - STRIPE_SECRET_KEY        : assertStripe utilise stripe constructHook
 *   - STRIPE_WEBHOOK_SECRET    : whsec_... (DIFFÉRENT de la clé secrète)
 *   - SUPABASE_SERVICE_ROLE_KEY : pour bypasser la RLS et écrire la
 *     mise à jour côté serveur (le webhook n'a pas de session user).
 *   - NEXT_PUBLIC_SUPABASE_URL : URL projet Supabase
 *
 * Pour tester en local :
 *   stripe listen --forward-to localhost:3000/api/stripe/webhook
 */
export async function POST(request: NextRequest) {
  const stripe = assertStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET manquant." },
      { status: 500 }
    )
  }

  const sig = request.headers.get("stripe-signature")
  if (!sig) {
    return NextResponse.json({ error: "Signature manquante." }, { status: 400 })
  }

  const rawBody = await request.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Signature invalide."
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  // Service-role client pour bypass RLS sur les updates accounts
  const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceUrl || !serviceKey) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY manquant." },
      { status: 500 }
    )
  }
  const supabase = createServiceClient<Database>(serviceUrl, serviceKey, {
    auth: { persistSession: false }
  })

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id ?? null
      if (!subscriptionId) break

      const sub = await stripe.subscriptions.retrieve(subscriptionId)
      await syncSubscription(supabase, sub)
      break
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription
      await syncSubscription(supabase, sub)
      break
    }
    default:
      break
  }

  return NextResponse.json({ received: true })
}

/**
 * Met à jour accounts.tier / stripe_subscription_id / tier_expires_at
 * en fonction du statut de l'abonnement.
 */
async function syncSubscription(
  supabase: ReturnType<typeof createServiceClient<Database>>,
  sub: Stripe.Subscription
) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id

  // Retrouve le compte via stripe_customer_id
  const { data: account } = await supabase
    .from("accounts")
    .select("id, tier")
    .eq("stripe_customer_id", customerId)
    .maybeSingle()
  if (!account) return

  const status = sub.status
  const isActive = status === "active" || status === "trialing"

  // Récupère le price_id du 1er item (on n'a qu'un seul plan par sub)
  const item = sub.items.data[0]
  const priceId = item?.price?.id ?? ""
  const plan = planFromStripePriceId(priceId)

  let nextTier: AccountTier
  if (isActive && plan) {
    nextTier = tierFromPlan(plan)
  } else {
    // Annulé/expiré → revenir à visiteur (sauf si déjà agence_client : on
    // ne touche pas ; agence_client est géré par les codes agence).
    nextTier = account.tier === "agence_client" ? "agence_client" : "visiteur"
  }

  // current_period_end existe sur l'item dans la nouvelle API Stripe.
  const periodEndUnix = item?.current_period_end ?? null
  const expiresAt = periodEndUnix
    ? new Date(periodEndUnix * 1000).toISOString()
    : null

  await supabase
    .from("accounts")
    .update({
      tier: nextTier,
      stripe_subscription_id: sub.id,
      tier_expires_at: expiresAt
    })
    .eq("id", account.id)
}
