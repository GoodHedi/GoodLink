import { createClient } from "@/lib/supabase/server"
import {
  PAGE_LIMIT_BY_TIER,
  QR_LIMIT_BY_TIER,
  TIER_CAPS,
  type TierCapabilities
} from "@/lib/constants"
import type { AccountTier } from "@/types/database"

/**
 * Tier + capacités du compte courant (côté serveur uniquement).
 * Si pas connecté → null.
 */
export type TierContext = {
  userId: string
  tier: AccountTier
  caps: TierCapabilities
  pageLimit: number
  qrLimit: number
}

export async function getMyTier(): Promise<TierContext | null> {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: account } = await supabase
    .from("accounts")
    .select("tier")
    .eq("id", user.id)
    .maybeSingle()

  const tier: AccountTier = (account?.tier ?? "visiteur") as AccountTier

  return {
    userId: user.id,
    tier,
    caps: TIER_CAPS[tier],
    pageLimit: PAGE_LIMIT_BY_TIER[tier],
    qrLimit: QR_LIMIT_BY_TIER[tier]
  }
}
