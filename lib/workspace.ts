import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import type { WorkspaceRole } from "@/types/database"

const COOKIE_NAME = "goodlink_workspace_id"

export type WorkspaceSummary = {
  id: string
  name: string
  is_personal: boolean
  role: WorkspaceRole
}

/**
 * Liste tous les workspaces dont l'utilisateur courant est membre,
 * avec son rôle. Utilisé par le switcher du layout dashboard.
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
    .select("id, name, is_personal")
    .in("id", ids)

  const wsById = new Map<
    string,
    { id: string; name: string; is_personal: boolean }
  >()
  for (const w of workspaces ?? []) {
    wsById.set(w.id, w)
  }

  return memberships
    .map((m) => {
      const ws = wsById.get(m.workspace_id)
      if (!ws) return null
      return {
        id: ws.id,
        name: ws.name,
        is_personal: ws.is_personal,
        role: m.role
      }
    })
    .filter((w): w is WorkspaceSummary => w !== null)
}

/**
 * Récupère le workspace "actif" : depuis cookie si valide, sinon
 * fallback sur le workspace personnel de l'utilisateur.
 */
export async function getCurrentWorkspaceId(
  userId: string
): Promise<string | null> {
  const cookieStore = await cookies()
  const cookieValue = cookieStore.get(COOKIE_NAME)?.value

  const supabase = await createClient()

  // Vérifie que le cookie pointe vers un workspace dont l'utilisateur est
  // toujours membre.
  if (cookieValue) {
    const { data } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .eq("workspace_id", cookieValue)
      .maybeSingle()
    if (data) return cookieValue
  }

  // Fallback : workspace personnel
  const { data: personal } = await supabase
    .from("workspaces")
    .select("id")
    .eq("created_by", userId)
    .eq("is_personal", true)
    .maybeSingle()
  return personal?.id ?? null
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
