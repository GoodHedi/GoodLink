"use server"

import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { WORKSPACE_COOKIE_NAME } from "@/lib/workspace"

export type AcceptResult =
  | { ok: true }
  | { ok: false; error: string }

export async function acceptInviteAction(
  token: string
): Promise<AcceptResult> {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: "Tu dois être connecté pour accepter." }
  }

  // L'invitation peut être lue par anyone connecté (RLS owner-only ne
  // s'applique qu'aux owners de workspace ; il faut un canal alternatif).
  // On utilise une RPC directe — mais pour simplicité v1 : on met un select
  // public sur la table via une policy simple pour la table invites,
  // OR on crée une policy "select_by_token". Je préfère ne pas relâcher
  // les policies. On passe par une RPC SECURITY DEFINER.
  // Simplification : on fait l'INSERT vers workspace_members en filtrant
  // par token + accepted_at IS NULL + expires_at > now().
  //
  // Approche concrète : on tente l'insert dans members, en lisant l'invite
  // via une fonction RPC `accept_workspace_invite(token)` côté DB qui fait
  // le check + l'insert + le mark accepted. Voir migration.
  const { data, error } = await supabase.rpc("accept_workspace_invite", {
    p_token: token
  })

  if (error) {
    return { ok: false, error: humanizeRpcError(error.message) }
  }

  const workspaceId = data as string | null
  if (!workspaceId) {
    return {
      ok: false,
      error: "Invitation invalide, expirée ou déjà utilisée."
    }
  }

  // Switch sur le nouveau workspace pour que le user voie les pages
  const cookieStore = await cookies()
  cookieStore.set(WORKSPACE_COOKIE_NAME, workspaceId, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365
  })

  redirect("/dashboard")
}

function humanizeRpcError(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes("expired")) return "Cette invitation a expiré."
  if (m.includes("already")) return "Tu es déjà membre de ce workspace."
  if (m.includes("invalid")) return "Invitation invalide."
  return "Impossible d'accepter l'invitation."
}
