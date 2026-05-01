import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMyTier } from "@/lib/tier"
import { AgencyView } from "./_components/agency-view"
import type { AgencyCode } from "@/types/database"

export const metadata: Metadata = { title: "Agence" }
export const dynamic = "force-dynamic"

export default async function AgencyPage() {
  const tier = await getMyTier()
  if (!tier) redirect("/login")
  if (tier.tier !== "agence") {
    redirect("/dashboard?upgrade=agence")
  }

  const supabase = await createClient()

  // Tous les codes de cette agence
  const { data: codes } = await supabase
    .from("agency_codes")
    .select("*")
    .eq("agency_account_id", tier.userId)
    .order("created_at", { ascending: false })

  // Tous les clients liés
  const { data: clients } = await supabase
    .from("agency_clients")
    .select("client_account_id, code_id, joined_at")
    .eq("agency_account_id", tier.userId)

  // Lookup username de chaque client
  const clientIds = (clients ?? []).map((c) => c.client_account_id)
  const { data: clientAccounts } =
    clientIds.length > 0
      ? await supabase
          .from("accounts")
          .select("id, username")
          .in("id", clientIds)
      : { data: [] as { id: string; username: string }[] }

  const usernameById = new Map(
    (clientAccounts ?? []).map((a) => [a.id, a.username])
  )

  type ClientRow = {
    client_account_id: string
    client_username: string | null
    code_id: string
    joined_at: string
  }
  const clientList: ClientRow[] = (clients ?? []).map((c) => ({
    client_account_id: c.client_account_id,
    client_username: usernameById.get(c.client_account_id) ?? null,
    code_id: c.code_id,
    joined_at: c.joined_at
  }))

  return (
    <AgencyView
      codes={(codes ?? []) as AgencyCode[]}
      clients={clientList}
    />
  )
}
