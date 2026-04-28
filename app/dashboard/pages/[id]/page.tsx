import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { DashboardEditor } from "../../_components/dashboard-editor"

export const metadata: Metadata = { title: "Éditeur" }
export const dynamic = "force-dynamic"

type Params = Promise<{ id: string }>

export default async function PageEditorRoute({
  params
}: {
  params: Params
}) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: page } = await supabase
    .from("pages")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (!page) notFound()

  // Vérifie que l'utilisateur est membre (owner ou editor) du workspace de la page.
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", page.workspace_id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (
    !membership ||
    (membership.role !== "owner" && membership.role !== "editor")
  ) {
    notFound()
  }

  const { data: links } = await supabase
    .from("links")
    .select("*")
    .eq("page_id", page.id)
    .order("position", { ascending: true })

  const linkRows = links ?? []
  const linkIds = linkRows.map((l) => l.id)

  // Fetch stats en parallèle (compte vues + récupère clics par lien)
  const [viewsCountResult, clicksDataResult] = await Promise.all([
    supabase
      .from("page_views")
      .select("id", { count: "exact", head: true })
      .eq("page_id", page.id),
    linkIds.length > 0
      ? supabase.from("link_clicks").select("link_id").in("link_id", linkIds)
      : Promise.resolve({ data: [] as { link_id: string }[], error: null })
  ])

  const totalViews = viewsCountResult.count ?? 0
  const clicksByLinkId: Record<string, number> = {}
  for (const row of clicksDataResult.data ?? []) {
    clicksByLinkId[row.link_id] = (clicksByLinkId[row.link_id] ?? 0) + 1
  }
  const totalClicks = Object.values(clicksByLinkId).reduce(
    (sum, n) => sum + n,
    0
  )

  return (
    <>
      <div className="container pt-6">
        <div className="flex items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Mes pages
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link
              href={`/${page.username}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              Voir cette page
            </Link>
          </Button>
        </div>
      </div>
      <DashboardEditor
        page={page}
        links={linkRows}
        stats={{ totalViews, totalClicks, clicksByLinkId }}
      />
    </>
  )
}
