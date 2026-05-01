import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { QR_LIMIT_FREE, TIER_CAPS } from "@/lib/constants"
import { getCurrentWorkspaceId } from "@/lib/workspace"
import { getMyTier } from "@/lib/tier"
import { QrList } from "./_components/qr-list"

export const metadata: Metadata = { title: "QR codes" }
export const dynamic = "force-dynamic"

export default async function QrPage() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const workspaceId = await getCurrentWorkspaceId(user.id)
  if (!workspaceId) {
    return (
      <div className="container py-12 text-center">
        <p className="text-muted-foreground">
          Aucun workspace trouvé.
        </p>
      </div>
    )
  }

  const { data: qrs } = await supabase
    .from("qr_codes")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })

  const list = qrs ?? []

  // Compteurs de scans par QR (1 query par QR, count head)
  const scanEntries = await Promise.all(
    list
      .filter((q) => q.tracked)
      .map(async (q) => {
        const { count } = await supabase
          .from("qr_scans")
          .select("id", { count: "exact", head: true })
          .eq("qr_id", q.id)
        return [q.id, count ?? 0] as const
      })
  )
  const scanCounts: Record<string, number> = Object.fromEntries(scanEntries)

  return (
    <div className="container py-8 lg:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-forest sm:text-3xl">
          QR codes
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {list.length} / {QR_LIMIT_FREE} QR codes utilisés.
        </p>
      </div>

      <QrList
        workspaceId={workspaceId}
        ownerId={user.id}
        initialQrs={list}
        scanCounts={scanCounts}
        canShare={(await getMyTier())?.caps.sharing ?? TIER_CAPS.visiteur.sharing}
      />
    </div>
  )
}
