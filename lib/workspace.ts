import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import type { WorkspaceRole } from "@/types/database"

const COOKIE_NAME = "goodlink_workspace_id"

export type WorkspaceSummary = {
  id: string
  name: string
  is_personal: boolean
  role: WorkspaceRole
  /** True si l'utilisateur courant a créé ce workspace. Permet de
   *  distinguer SON Personnel des Personnels d'autres users dans
   *  l'UI (préfixe @username, etc). */
  is_mine: boolean
  /** Username du créateur (pour les workspaces des autres). Null si is_mine. */
  owner_username: string | null
}

/**
 * Liste tous les workspaces dont l'utilisateur courant est membre,
 * enrichis du flag `is_mine` (créé par moi) et du `owner_username`
 * pour les workspaces des autres. C'est l'UI qui décide ensuite
 * comment afficher (ex. switcher préfixe les Personnels des autres
 * avec `Perso · @username`).
 */
export async function listMyWorkspaces(
  userId: string
): Promise<WorkspaceSummary[]> {
  const supabase = await createClient()

  const { data: memberships } = await supabase
    .from("workspace_members")
    .select("workspace_id, role, joined_at")
    .eq("user_id", userId)
    .order("joined_at", { ascending: true })

  if (!memberships || memberships.length === 0) return []

  const ids = memberships.map((m) => m.workspace_id)
  const { data: workspaces } = await supabase
    .from("workspaces")
    .select("id, name, is_personal, created_by")
    .in("id", ids)

  const wsList = workspaces ?? []
  const wsById = new Map<
    string,
    { id: string; name: string; is_personal: boolean; created_by: string }
  >()
  for (const w of wsList) {
    wsById.set(w.id, w)
  }

  // Récupère le username de chaque créateur (pour préfixer les workspaces
  // des autres). On ne fait la query que pour les créateurs ≠ moi.
  const otherCreatorIds = Array.from(
    new Set(
      wsList
        .map((w) => w.created_by)
        .filter((id) => id !== userId)
    )
  )
  const usernameByUserId = new Map<string, string>()
  if (otherCreatorIds.length > 0) {
    const { data: accounts } = await supabase
      .from("accounts")
      .select("id, username")
      .in("id", otherCreatorIds)
    for (const a of accounts ?? []) {
      usernameByUserId.set(a.id, a.username)
    }
  }

  return memberships
    .map((m) => {
      const ws = wsById.get(m.workspace_id)
      if (!ws) return null
      const isMine = ws.created_by === userId
      return {
        id: ws.id,
        name: ws.name,
        is_personal: ws.is_personal,
        role: m.role,
        is_mine: isMine,
        owner_username: isMine ? null : (usernameByUserId.get(ws.created_by) ?? null)
      }
    })
    .filter((w): w is WorkspaceSummary => w !== null)
}

/**
 * Récupère le workspace "actif" :
 *   1. Si cookie pointe sur un workspace dont l'utilisateur est membre → retourne le cookie.
 *   2. Sinon → fallback sur le workspace personnel de l'utilisateur (créé par lui).
 */
export async function getCurrentWorkspaceId(
  userId: string
): Promise<string | null> {
  const cookieStore = await cookies()
  const cookieValue = cookieStore.get(COOKIE_NAME)?.value

  const supabase = await createClient()

  if (cookieValue) {
    const { data: m } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .eq("workspace_id", cookieValue)
      .maybeSingle()
    if (m) return cookieValue
  }

  // Fallback : workspace personnel créé par l'utilisateur.
  // .limit(1) au lieu de .maybeSingle() au cas où l'user a plusieurs
  // workspaces personnels (cas de signup buggé ancien).
  const { data: personalList } = await supabase
    .from("workspaces")
    .select("id")
    .eq("created_by", userId)
    .eq("is_personal", true)
    .order("created_at", { ascending: true })
    .limit(1)
  return personalList?.[0]?.id ?? null
}

/**
 * Vérifie qu'un user a un certain niveau de droit dans un workspace.
 * Renvoie le rôle si membre, null sinon.
 */
export async function getMembershipRole(
  userId: string,
  workspaceId: string
): Promise<WorkspaceRole | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId)
    .maybeSingle()
  return data?.role ?? null
}

export const WORKSPACE_COOKIE_NAME = COOKIE_NAME
