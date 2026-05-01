import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PagesGrid } from "./_components/pages-grid"
import { PAGE_LIMIT_FREE, TIER_CAPS } from "@/lib/constants"
import { getCurrentWorkspaceId, listMyWorkspaces } from "@/lib/workspace"
import { getMyTier } from "@/lib/tier"

export const metadata: Metadata = { title: "Mes pages" }
export const dynamic = "force-dynamic"

export default async function DashboardPage() {
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
          Aucun workspace trouvé. Contacte le support.
        </p>
      </div>
    )
  }

  const { data: pages, error: pagesErr } = await supabase
    .from("pages")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true })

  if (pagesErr) {
    // Log côté Vercel (visible dans les logs functions). Aide à
    // diagnostiquer les RLS / network issues quand le dashboard est
    // mystérieusement vide.
    console.error(
      "[dashboard] pages query failed",
      "userId=", user.id,
      "workspaceId=", workspaceId,
      "error=", pagesErr.message
    )
  }

  const list = pages ?? []

  // Workspaces où l'utilisateur peut déplacer ses pages (owner ou editor).
  const allWorkspaces = await listMyWorkspaces(user.id)
  const moveTargets = allWorkspaces
    .filter((w) => w.id !== workspaceId && w.role !== "viewer")
    .map((w) => ({
      id: w.id,
      name: w.name,
      is_personal: w.is_personal
    }))

  // Vues par page (count head:true → 1 query par page mais payload léger).
  const viewCountsEntries = await Promise.all(
    list.map(async (p) => {
      const { count } = await supabase
        .from("page_views")
        .select("id", { count: "exact", head: true })
        .eq("page_id", p.id)
      return [p.id, count ?? 0] as const
    })
  )
  const viewCounts: Record<string, number> = Object.fromEntries(viewCountsEntries)

  return (
    <div className="container py-8 lg:py-12">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-forest sm:text-3xl">
            Pages du workspace
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {list.length} / {PAGE_LIMIT_FREE} pages utilisées
          </p>
        </div>
      </div>

      <PagesGrid
        workspaceId={workspaceId}
        pages={list}
        viewCounts={viewCounts}
        moveTargets={moveTargets}
        canShare={(await getMyTier())?.caps.sharing ?? TIER_CAPS.visiteur.sharing}
      />
    </div>
  )
}
