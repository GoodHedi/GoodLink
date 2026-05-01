import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import {
  getCurrentWorkspaceId,
  listMyWorkspaces,
  WORKSPACE_COOKIE_NAME
} from "@/lib/workspace"
import { getMyTier } from "@/lib/tier"

export const metadata: Metadata = { title: "Debug" }
export const dynamic = "force-dynamic"

/**
 * Page de diagnostic complète. Affiche tout ce que voit le serveur :
 *   - identité du user
 *   - cookie workspace courant
 *   - workspace_id résolu
 *   - tous les workspaces dont le user est membre
 *   - toutes les pages que le user voit (RLS appliquée par Supabase)
 *   - pages filtrées par workspace_id courant
 *
 * À supprimer une fois le bug fixé.
 */
export default async function DebugPage() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const cookieStore = await cookies()
  const cookieValue = cookieStore.get(WORKSPACE_COOKIE_NAME)?.value ?? null

  const workspaceId = await getCurrentWorkspaceId(user.id)
  const workspaces = await listMyWorkspaces(user.id)
  const tier = await getMyTier()

  // Account row
  const { data: account } = await supabase
    .from("accounts")
    .select("id, username, tier, created_at")
    .eq("id", user.id)
    .maybeSingle()

  // Toutes les pages que la session courante peut voir (RLS appliquée)
  const { data: visiblePages, error: visibleErr } = await supabase
    .from("pages")
    .select("id, username, workspace_id, owner_id, is_published, created_at")
    .order("created_at", { ascending: false })

  // Pages filtrées par workspace courant (= ce que le dashboard fait)
  const { data: scopedPages, error: scopedErr } = workspaceId
    ? await supabase
        .from("pages")
        .select("id, username, workspace_id, is_published, created_at")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: true })
    : { data: null, error: null }

  // Memberships row directs
  const { data: memberships } = await supabase
    .from("workspace_members")
    .select("workspace_id, role, joined_at")
    .eq("user_id", user.id)

  return (
    <div className="container max-w-4xl space-y-6 py-8 font-mono text-xs">
      <h1 className="text-2xl font-extrabold tracking-tight text-forest">
        Debug — état serveur
      </h1>

      <Block title="🔑 Auth">
        <KV k="auth.user.id" v={user.id} />
        <KV k="auth.user.email" v={user.email ?? "—"} />
      </Block>

      <Block title="📒 Account row">
        {account ? (
          <>
            <KV k="username" v={account.username} />
            <KV k="tier" v={account.tier} highlight />
            <KV k="created_at" v={account.created_at} />
          </>
        ) : (
          <p className="text-destructive">
            Aucune ligne dans public.accounts pour cet user — UserMenu et
            quotas vont casser. Lance la migration 12.
          </p>
        )}
      </Block>

      <Block title="🎯 Tier (helper getMyTier())">
        {tier ? (
          <>
            <KV k="tier" v={tier.tier} highlight />
            <KV k="pageLimit" v={tier.pageLimit.toString()} />
            <KV k="qrLimit" v={tier.qrLimit.toString()} />
            <KV k="caps.sharing" v={String(tier.caps.sharing)} />
          </>
        ) : (
          <p className="text-destructive">getMyTier a renvoyé null.</p>
        )}
      </Block>

      <Block title="🍪 Cookie + workspace courant">
        <KV k={`cookie ${WORKSPACE_COOKIE_NAME}`} v={cookieValue ?? "(absent)"} />
        <KV k="getCurrentWorkspaceId" v={workspaceId ?? "(null)"} highlight />
      </Block>

      <Block title="🏢 Workspaces dont je suis membre (memberships brut)">
        {memberships && memberships.length > 0 ? (
          <Table
            rows={memberships.map((m) => ({
              workspace_id: m.workspace_id,
              role: m.role,
              joined_at: m.joined_at
            }))}
          />
        ) : (
          <p className="text-destructive">
            Aucune membership trouvée. Le dashboard ne pourra pas afficher
            de pages tant que tu n&apos;es pas dans un workspace.
          </p>
        )}
      </Block>

      <Block title="🏢 listMyWorkspaces (ce que voit le switcher)">
        {workspaces.length > 0 ? (
          <Table
            rows={workspaces.map((w) => ({
              id: w.id,
              name: w.name,
              is_personal: String(w.is_personal),
              is_mine: String(w.is_mine),
              role: w.role
            }))}
          />
        ) : (
          <p className="text-destructive">listMyWorkspaces renvoie [].</p>
        )}
      </Block>

      <Block title="📄 Pages visibles via RLS (toutes, sans filtre workspace)">
        {visibleErr && (
          <p className="text-destructive">Erreur RLS : {visibleErr.message}</p>
        )}
        {visiblePages && visiblePages.length > 0 ? (
          <Table
            rows={visiblePages.map((p) => ({
              id: p.id.slice(0, 8) + "…",
              username: p.username,
              workspace_id: p.workspace_id?.slice(0, 8) + "…",
              owner_id: p.owner_id.slice(0, 8) + "…",
              is_published: String(p.is_published)
            }))}
          />
        ) : (
          <p className="text-destructive">
            0 page visible via RLS. C&apos;est ÇA le bug si tu en attendais.
          </p>
        )}
      </Block>

      <Block title="🎯 Pages dans le workspace COURANT (ce qu'affiche /dashboard)">
        <KV k="workspace_id filtré" v={workspaceId ?? "(null)"} highlight />
        {scopedErr && (
          <p className="text-destructive">Erreur RLS : {scopedErr.message}</p>
        )}
        {scopedPages && scopedPages.length > 0 ? (
          <Table
            rows={scopedPages.map((p) => ({
              id: p.id.slice(0, 8) + "…",
              username: p.username,
              is_published: String(p.is_published)
            }))}
          />
        ) : (
          <p className="text-destructive">
            0 page dans ce workspace. Switche vers un workspace qui en
            contient (cf. tableau « Pages visibles via RLS » au-dessus).
          </p>
        )}
      </Block>

      <Block title="🔧 Actions rapides">
        <p className="text-foreground">
          Pour forcer un workspace différent (ex. ton Personnel),
          colle ça dans la console (F12) du navigateur :
        </p>
        <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-3 text-[10px]">
{`document.cookie = "${WORKSPACE_COOKIE_NAME}=<UUID>; path=/; max-age=31536000; samesite=lax"
location.assign("/dashboard")`}
        </pre>
      </Block>
    </div>
  )
}

// ----- Helpers UI -----

function Block({
  title,
  children
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-3 text-sm font-bold text-forest">{title}</h2>
      <div className="space-y-1.5">{children}</div>
    </section>
  )
}

function KV({
  k,
  v,
  highlight = false
}: {
  k: string
  v: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="shrink-0 text-muted-foreground">{k}</span>
      <span
        className={
          highlight
            ? "rounded bg-accent/15 px-1.5 font-bold text-accent"
            : "text-foreground"
        }
      >
        {v}
      </span>
    </div>
  )
}

function Table({ rows }: { rows: Array<Record<string, string>> }) {
  if (rows.length === 0) return null
  const headers = Object.keys(rows[0]!)
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-[11px]">
        <thead>
          <tr className="border-b border-border">
            {headers.map((h) => (
              <th key={h} className="px-2 py-1 text-left font-bold text-forest">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border/50">
              {headers.map((h) => (
                <td key={h} className="px-2 py-1 text-foreground">
                  {r[h]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
