/**
 * Côté serveur uniquement. Initialisation du client Stripe + helpers
 * autour des prix et plans.
 *
 * Variables d'environnement attendues (côté serveur) :
 *   - STRIPE_SECRET_KEY        : clé secrète (sk_test_... ou sk_live_...)
 *   - STRIPE_WEBHOOK_SECRET    : whsec_... pour valider les webhooks
 *   - STRIPE_PRICE_PRO         : price_id du plan Pro mensuel
 *   - STRIPE_PRICE_AGENCY      : price_id du plan Agence mensuel
 *
 * Si STRIPE_SECRET_KEY est absent, le module exporte stripe = null pour
 * permettre au build de passer ; les routes appellent assertStripe() qui
 * renvoie une erreur claire si on essaie de les utiliser.
 */

import Stripe from "stripe"
import type { AccountTier } from "@/types/database"

const stripeKey = process.env.STRIPE_SECRET_KEY

// On laisse Stripe utiliser la version d'API par défaut du SDK installé,
// ce qui évite de devoir maintenir une string de date à jour.
export const stripe: Stripe | null = stripeKey ? new Stripe(stripeKey) : null

export function assertStripe(): Stripe {
  if (!stripe) {
    throw new Error(
      "Stripe non configuré : ajoute STRIPE_SECRET_KEY dans .env.local."
    )
  }
  return stripe
}

export type Plan = "pro" | "agency"

export const PLAN_LABEL: Record<Plan, string> = {
  pro: "Pro",
  agency: "Agence"
}

/** Prix d'affichage publics (en EUR/mois) — éditables ici. */
export const PLAN_PRICE_EUR_MONTH: Record<Plan, number> = {
  pro: 9,
  agency: 49
}

/** Mapping plan → price_id Stripe (depuis env). */
export function getStripePriceId(plan: Plan): string | null {
  return plan === "pro"
    ? (process.env.STRIPE_PRICE_PRO ?? null)
    : (process.env.STRIPE_PRICE_AGENCY ?? null)
}

/** Inverse : à partir du price_id reçu d'un webhook, retrouve le plan. */
export function planFromStripePriceId(priceId: string): Plan | null {
  if (priceId === process.env.STRIPE_PRICE_PRO) return "pro"
  if (priceId === process.env.STRIPE_PRICE_AGENCY) return "agency"
  return null
}

export function tierFromPlan(plan: Plan): AccountTier {
  return plan === "pro" ? "pro" : "agence"
}
