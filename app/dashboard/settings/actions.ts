"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { fieldErrors } from "@/lib/form"
import { WORKSPACE_COOKIE_NAME } from "@/lib/workspace"
import type { WorkspaceInvite, WorkspaceRole } from "@/types/database"

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }

const UN: ActionResult<never> = { ok: false, error: "Tu dois être connecté." }

async function getOwner() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null
  return { supabase, userId: user.id, email: user.email ?? "" }
}

async function isOwnerOf(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  workspaceId: string
) {
  const { data } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle()
  return data?.role === "owner"
}

// --- Schemas ---
const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalide."),
  role: z.enum(["owner", "editor", "viewer"]).default("editor")
})
const renameSchema = z.object({
  name: z.string().trim().min(1, "Nom requis.").max(60, "Trop long.")
})
const createWorkspaceSchema = z.object({
  name: z.string().trim().min(1, "Nom requis.").max(60, "Trop long.")
})

// --- Invitations ---

export async function createInviteAction(
  workspaceId: string,
  input: { email: string; role: WorkspaceRole }
): Promise<ActionResult<WorkspaceInvite>> {
  const owner = await getOwner()
  if (!owner) return UN as ActionResult<WorkspaceInvite>

  if (!(await isOwnerOf(owner.supabase, owner.userId, workspaceId))) {
    return { ok: false, error: "Seul un owner peut inviter." }
  }

  const parsed = inviteSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: "Données invalides.",
      fieldErrors: fieldErrors(parsed.error)
    }
  }

  const { data, error } = await owner.supabase
    .from("workspace_invites")
    .insert({
      workspace_id: workspaceId,
      email: parsed.data.email,
      role: parsed.data.role,
      invited_by: owner.userId
    })
    .select()
    .single()

  if (error || !data) {
    return { ok: false, error: "Impossible de créer l'invitation." }
  }
  revalidatePath("/dashboard/settings")
  return { ok: true, data }
}

export async function revokeInviteAction(
  inviteId: string
): Promise<ActionResult> {
  const owner = await getOwner()
  if (!owner) return UN as ActionResult

  const { error } = await owner.supabase
    .from("workspace_invites")
    .delete()
    .eq("id", inviteId)

  if (error) return { ok: false, error: "Impossible de révoquer." }
  revalidatePath("/dashboard/settings")
  return { ok: true, data: undefined }
}

// --- Membres ---

export async function removeMemberAction(
  workspaceId: string,
  memberUserId: string
): Promise<ActionResult> {
  const owner = await getOwner()
  if (!owner) return UN as ActionResult

  if (!(await isOwnerOf(owner.supabase, owner.userId, workspaceId))) {
    return { ok: false, error: "Seul un owner peut retirer un membre." }
  }
  if (memberUserId === owner.userId) {
    return { ok: false, error: "Utilise « Quitter le workspace »." }
  }

  const { error } = await owner.supabase
    .from("workspace_members")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("user_id", memberUserId)

  if (error) return { ok: false, error: "Impossible de retirer le membre." }
  revalidatePath("/dashboard/settings")
  return { ok: true, data: undefined }
}

export async function leaveWorkspaceAction(
  workspaceId: string
): Promise<ActionResult> {
  const owner = await getOwner()
  if (!owner) return UN as ActionResult

  // Empêche un personnal workspace d'être quitté (= il faudrait le supprimer)
  const { data: ws } = await owner.supabase
    .from("workspaces")
    .select("is_personal")
    .eq("id", workspaceId)
    .maybeSingle()
  if (ws?.is_personal) {
    return {
      ok: false,
      error: "Tu ne peux pas quitter ton workspace personnel."
    }
  }

  const { error } = await owner.supabase
    .from("workspace_members")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("user_id", owner.userId)

  if (error) return { ok: false, error: "Impossible de quitter." }

  // Reset le cookie de workspace courant si c'était celui-là
  const cookieStore = await cookies()
  if (cookieStore.get(WORKSPACE_COOKIE_NAME)?.value === workspaceId) {
    cookieStore.delete(WORKSPACE_COOKIE_NAME)
  }

  revalidatePath("/dashboard")
  return { ok: true, data: undefined }
}

// --- Workspace lui-même ---

export async function renameWorkspaceAction(
  workspaceId: string,
  input: { name: string }
): Promise<ActionResult> {
  const owner = await getOwner()
  if (!owner) return UN as ActionResult

  if (!(await isOwnerOf(owner.supabase, owner.userId, workspaceId))) {
    return { ok: false, error: "Seul un owner peut renommer." }
  }

  const parsed = renameSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: "Nom invalide.",
      fieldErrors: fieldErrors(parsed.error)
    }
  }

  const { error } = await owner.supabase
    .from("workspaces")
    .update({ name: parsed.data.name })
    .eq("id", workspaceId)

  if (error) return { ok: false, error: "Impossible de renommer." }
  revalidatePath("/dashboard")
  return { ok: true, data: undefined }
}

export async function createWorkspaceAction(input: {
  name: string
}): Promise<ActionResult<{ id: string }>> {
  const owner = await getOwner()
  if (!owner) return UN as ActionResult<{ id: string }>

  const parsed = createWorkspaceSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: "Nom invalide.",
      fieldErrors: fieldErrors(parsed.error)
    }
  }

  const { data: ws, error } = await owner.supabase
    .from("workspaces")
    .insert({
      name: parsed.data.name,
      created_by: owner.userId,
      is_personal: false
    })
    .select()
    .single()
  if (error || !ws) return { ok: false, error: "Création impossible." }

  // Ajoute le créateur comme owner
  await owner.supabase
    .from("workspace_members")
    .insert({ workspace_id: ws.id, user_id: owner.userId, role: "owner" })

  revalidatePath("/dashboard")
  return { ok: true, data: { id: ws.id } }
}

export async function switchWorkspaceAction(
  workspaceId: string
): Promise<ActionResult> {
  const owner = await getOwner()
  if (!owner) return UN as ActionResult

  // Vérifie l'appartenance
  const { data } = await owner.supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", owner.userId)
    .maybeSingle()
  if (!data) return { ok: false, error: "Workspace inaccessible." }

  const cookieStore = await cookies()
  cookieStore.set(WORKSPACE_COOKIE_NAME, workspaceId, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365
  })

  revalidatePath("/dashboard")
  return { ok: true, data: undefined }
}
