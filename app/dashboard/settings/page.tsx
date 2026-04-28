import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCurrentWorkspaceId } from "@/lib/workspace"
import { SettingsView } from "./_components/settings-view"
import type { Workspace, WorkspaceInvite, WorkspaceRole } from "@/types/database"

export const metadata: Metadata = { title: "Paramètres workspace" }
export const dynamic = "force-dynamic"

export type MemberRow = {
  user_id: string
  role: WorkspaceRole
  username: string | null
  email: string | null
  joined_at: string
  is_self: boolean
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const workspaceId = await getCurrentWorkspaceId(user.id)
  if (!workspaceId) {
    return (
      <div className="container py-12 text-center">
        <p className="text-muted-foreground">Workspace introuvable.</p>
      </div>
    )
  }

  // Workspace info
  const { data: workspace } = (await supabase
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .maybeSingle()) as { data: Workspace | null }

  if (!workspace) {
    return (
      <div className="container py-12 text-center">
        <p className="text-muted-foreground">Workspace inaccessible.</p>
      </div>
    )
  }

  // Membres + leur account.username
  const { data: memberRows } = await supabase
    .from("workspace_members")
    .select("user_id, role, joined_at")
    .eq("workspace_id", workspaceId)
    .order("joined_at", { ascending: true })

  const memberIds = (memberRows ?? []).map((m) => m.user_id)
  const { data: accountRows } = await supabase
    .from("accounts")
    .select("id, username")
    .in("id", memberIds.length > 0 ? memberIds : [user.id])

  const usernameById = new Map<string, string>()
  for (const a of accountRows ?? []) {
    usernameById.set(a.id, a.username)
  }

  // Pour les emails, l'auth.users n'est pas accessible côté anon, donc on
  // affiche seulement notre propre email (l'utilisateur courant).
  const members: MemberRow[] = (memberRows ?? []).map((m) => ({
    user_id: m.user_id,
    role: m.role,
    username: usernameById.get(m.user_id) ?? null,
    email: m.user_id === user.id ? user.email ?? null : null,
    joined_at: m.joined_at,
    is_self: m.user_id === user.id
  }))

  // Invitations en attente (visibles uniquement par le owner via RLS)
  const { data: invites } = (await supabase
    .from("workspace_invites")
    .select("*")
    .eq("workspace_id", workspaceId)
    .is("accepted_at", null)
    .order("created_at", { ascending: false })) as {
    data: WorkspaceInvite[] | null
  }

  const myRole = members.find((m) => m.is_self)?.role ?? "viewer"

  return (
    <div className="container py-8 lg:py-12">
      <SettingsView
        workspace={workspace}
        members={members}
        invites={invites ?? []}
        myRole={myRole}
      />
    </div>
  )
}
