import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import {
  ArrowUpRight,
  Eye,
  MousePointerClick,
  ScanLine,
  TrendingUp
} from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getCurrentWorkspaceId } from "@/lib/workspace"

export const metadata: Metadata = { title: "Statistiques" }
export const dynamic = "force-dynamic"

export default async function StatsPage() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const workspaceId = await getCurrentWorkspaceId(user.id)
  if (!workspaceId) {
    return (
      <div className="container py-12 text-center">
        <p className="text-muted-foreground">Aucun workspace trouvé.</p>
      </div>
    )
  }

  // ----- Pages du workspace -----
  const { data: pages } = await supabase
    .from("pages")
    .select("id, username, display_name, avatar_url")
    .eq("workspace_id", workspaceId)

  const pageList = pages ?? []
  const pageIds = pageList.map((p) => p.id)

  // ----- QR codes du workspace -----
  const { data: qrs } = await supabase
    .from("qr_codes")
    .select("id, label, target_url, tracked")
    .eq("workspace_id", workspaceId)

  const qrList = qrs ?? []
  const trackedQrIds = qrList.filter((q) => q.tracked).map((q) => q.id)

  // ----- Liens de toutes les pages du workspace -----
  const { data: links } =
    pageIds.length > 0
      ? await supabase
          .from("links")
          .select("id, page_id, title, type, url")
          .in("page_id", pageIds)
      : { data: [] as Array<{ id: string; page_id: string; title: string; type: string; url: string }> }

  const linkList = links ?? []
  const linkIds = linkList.map((l) => l.id)

  // ----- Compteurs en parallèle -----
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()

  const [
    pageViewsRes,
    pageViews7Res,
    linkClicksRes,
    linkClicks7Res,
    qrScansRes,
    qrScans7Res
  ] = await Promise.all([
    pageIds.length > 0
      ? supabase
          .from("page_views")
          .select("page_id")
          .in("page_id", pageIds)
      : Promise.resolve({ data: [] as { page_id: string }[] }),
    pageIds.length > 0
      ? supabase
          .from("page_views")
          .select("id", { count: "exact", head: true })
          .in("page_id", pageIds)
          .gte("viewed_at", sevenDaysAgo)
      : Promise.resolve({ count: 0 }),
    linkIds.length > 0
      ? supabase
          .from("link_clicks")
          .select("link_id")
          .in("link_id", linkIds)
      : Promise.resolve({ data: [] as { link_id: string }[] }),
    linkIds.length > 0
      ? supabase
          .from("link_clicks")
          .select("id", { count: "exact", head: true })
          .in("link_id", linkIds)
          .gte("clicked_at", sevenDaysAgo)
      : Promise.resolve({ count: 0 }),
    trackedQrIds.length > 0
      ? supabase
          .from("qr_scans")
          .select("qr_id")
          .in("qr_id", trackedQrIds)
      : Promise.resolve({ data: [] as { qr_id: string }[] }),
    trackedQrIds.length > 0
      ? supabase
          .from("qr_scans")
          .select("id", { count: "exact", head: true })
          .in("qr_id", trackedQrIds)
          .gte("scanned_at", sevenDaysAgo)
      : Promise.resolve({ count: 0 })
  ])

  // Agrégations par id
  const viewsByPageId: Record<string, number> = {}
  for (const row of pageViewsRes.data ?? []) {
    viewsByPageId[row.page_id] = (viewsByPageId[row.page_id] ?? 0) + 1
  }
  const clicksByLinkId: Record<string, number> = {}
  for (const row of linkClicksRes.data ?? []) {
    clicksByLinkId[row.link_id] = (clicksByLinkId[row.link_id] ?? 0) + 1
  }
  const scansByQrId: Record<string, number> = {}
  for (const row of qrScansRes.data ?? []) {
    scansByQrId[row.qr_id] = (scansByQrId[row.qr_id] ?? 0) + 1
  }

  const totalViews = Object.values(viewsByPageId).reduce((s, n) => s + n, 0)
  const totalClicks = Object.values(clicksByLinkId).reduce((s, n) => s + n, 0)
  const totalScans = Object.values(scansByQrId).reduce((s, n) => s + n, 0)

  const views7 = pageViews7Res.count ?? 0
  const clicks7 = linkClicks7Res.count ?? 0
  const scans7 = qrScans7Res.count ?? 0

  // Top 5
  const topPages = [...pageList]
    .map((p) => ({ ...p, count: viewsByPageId[p.id] ?? 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const topLinks = [...linkList]
    .filter((l) => l.type !== "header")
    .map((l) => ({
      ...l,
      page: pageList.find((p) => p.id === l.page_id),
      count: clicksByLinkId[l.id] ?? 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const topQrs = [...qrList]
    .filter((q) => q.tracked)
    .map((q) => ({ ...q, count: scansByQrId[q.id] ?? 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return (
    <div className="container space-y-8 py-8 lg:py-12">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-forest sm:text-3xl">
          Statistiques
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vue d&apos;ensemble du workspace courant.
        </p>
      </div>

      {/* Cards globales */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Eye className="h-4 w-4" />}
          label="Vues de pages"
          total={totalViews}
          last7={views7}
        />
        <StatCard
          icon={<MousePointerClick className="h-4 w-4" />}
          label="Clics sur liens"
          total={totalClicks}
          last7={clicks7}
        />
        <StatCard
          icon={<ScanLine className="h-4 w-4" />}
          label="Scans QR"
          total={totalScans}
          last7={scans7}
          hint={
            qrList.length > 0 && trackedQrIds.length === 0
              ? "Aucun QR tracké encore — recrée tes QR pour activer le suivi."
              : undefined
          }
        />
      </div>

      {/* Top 5 */}
      <div className="grid gap-6 lg:grid-cols-3">
        <TopList
          title="Top pages"
          icon={<Eye className="h-4 w-4" />}
          empty="Aucune vue pour l'instant."
          items={topPages.map((p) => ({
            id: p.id,
            primary: p.display_name || `@${p.username}`,
            secondary: `agoodlink.net/${p.username}`,
            count: p.count,
            href: `/dashboard/pages/${p.id}`
          }))}
        />
        <TopList
          title="Top liens"
          icon={<MousePointerClick className="h-4 w-4" />}
          empty="Aucun clic pour l'instant."
          items={topLinks.map((l) => ({
            id: l.id,
            primary: l.title,
            secondary:
              l.page?.display_name ||
              (l.page ? `@${l.page.username}` : "—"),
            count: l.count,
            href: l.page ? `/dashboard/pages/${l.page.id}` : undefined
          }))}
        />
        <TopList
          title="Top QR codes"
          icon={<ScanLine className="h-4 w-4" />}
          empty={
            trackedQrIds.length === 0
              ? "Aucun QR tracké."
              : "Aucun scan pour l'instant."
          }
          items={topQrs.map((q) => ({
            id: q.id,
            primary: q.label,
            secondary: q.target_url,
            count: q.count,
            href: "/dashboard/qr"
          }))}
        />
      </div>
    </div>
  )
}

// ----- Sous-composants -----

function StatCard({
  icon,
  label,
  total,
  last7,
  hint
}: {
  icon: React.ReactNode
  label: string
  total: number
  last7: number
  hint?: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent/15 text-accent">
          {icon}
        </span>
        {label}
      </div>
      <p className="mt-3 text-3xl font-extrabold tabular-nums text-forest">
        {total.toLocaleString("fr-FR")}
      </p>
      <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <TrendingUp className="h-3 w-3" />
        <span className="tabular-nums">{last7.toLocaleString("fr-FR")}</span>{" "}
        sur 7 jours
      </p>
      {hint && (
        <p className="mt-2 text-[10px] italic text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  )
}

function TopList({
  title,
  icon,
  empty,
  items
}: {
  title: string
  icon: React.ReactNode
  empty: string
  items: Array<{
    id: string
    primary: string
    secondary: string
    count: number
    href?: string
  }>
}) {
  const hasItems = items.some((it) => it.count > 0) || items.length > 0

  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3 text-sm font-bold text-forest">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-forest/5 text-forest">
          {icon}
        </span>
        {title}
      </div>
      {!hasItems ? (
        <div className="px-5 py-8 text-center text-xs text-muted-foreground">
          {empty}
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item) => {
            const content = (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-forest">
                    {item.primary}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {item.secondary}
                  </p>
                </div>
                <span className="ml-3 shrink-0 rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-bold tabular-nums text-accent">
                  {item.count.toLocaleString("fr-FR")}
                </span>
                {item.href && (
                  <ArrowUpRight className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                )}
              </>
            )
            return (
              <li key={item.id}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="group flex items-center gap-2 px-5 py-3 transition-colors hover:bg-muted/40"
                  >
                    {content}
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 px-5 py-3">
                    {content}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
