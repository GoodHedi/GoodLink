"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import {
  createQrSchema,
  deleteQrSchema,
  updateQrSchema,
  type CreateQrInput,
  type UpdateQrInput
} from "@/lib/validations/qr"
import { fieldErrors } from "@/lib/form"
import { QR_LIMIT_FREE } from "@/lib/constants"
import type { QrCode } from "@/types/database"

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }

const UNAUTHENTICATED: ActionResult<never> = {
  ok: false,
  error: "Tu dois être connecté."
}

async function getOwner() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null
  return { supabase, userId: user.id }
}

export async function createQrAction(
  workspaceId: string,
  input: CreateQrInput
): Promise<ActionResult<QrCode>> {
  const owner = await getOwner()
  if (!owner) return UNAUTHENTICATED as ActionResult<QrCode>

  // Membre éditeur ou owner du workspace ?
  const { data: membership } = await owner.supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", owner.userId)
    .maybeSingle()
  if (
    !membership ||
    (membership.role !== "owner" && membership.role !== "editor")
  ) {
    return { ok: false, error: "Pas autorisé sur ce workspace." }
  }

  const parsed = createQrSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: "Données invalides.",
      fieldErrors: fieldErrors(parsed.error)
    }
  }

  // Quota par workspace
  const { count } = await owner.supabase
    .from("qr_codes")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)

  if ((count ?? 0) >= QR_LIMIT_FREE) {
    return {
      ok: false,
      error: `Limite de ${QR_LIMIT_FREE} QR codes atteinte sur ce workspace.`
    }
  }

  const { data, error } = await owner.supabase
    .from("qr_codes")
    .insert({
      owner_id: owner.userId,
      workspace_id: workspaceId,
      label: parsed.data.label,
      target_url: parsed.data.target_url,
      fg_color: parsed.data.fg_color,
      bg_color: parsed.data.bg_color,
      logo_url: parsed.data.logo_url ?? null,
      // Tous les QR créés depuis maintenant sont trackés via /q/<id>.
      // Les anciens (tracked = false par défaut) gardent target_url en direct.
      tracked: true
    })
    .select()
    .single()

  if (error || !data) {
    return { ok: false, error: "Impossible de créer le QR code." }
  }

  revalidatePath("/dashboard/qr")
  return { ok: true, data }
}

export async function updateQrAction(
  input: UpdateQrInput
): Promise<ActionResult> {
  const owner = await getOwner()
  if (!owner) return UNAUTHENTICATED as ActionResult

  const parsed = updateQrSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: "Données invalides.",
      fieldErrors: fieldErrors(parsed.error)
    }
  }

  const { error } = await owner.supabase
    .from("qr_codes")
    .update({
      label: parsed.data.label,
      target_url: parsed.data.target_url,
      fg_color: parsed.data.fg_color,
      bg_color: parsed.data.bg_color,
      logo_url: parsed.data.logo_url ?? null
    })
    .eq("id", parsed.data.id)

  if (error) {
    return { ok: false, error: "Impossible de mettre à jour le QR code." }
  }

  revalidatePath("/dashboard/qr")
  return { ok: true, data: undefined }
}

export async function deleteQrAction(id: string): Promise<ActionResult> {
  const owner = await getOwner()
  if (!owner) return UNAUTHENTICATED as ActionResult

  const parsed = deleteQrSchema.safeParse({ id })
  if (!parsed.success) {
    return { ok: false, error: "Identifiant invalide." }
  }

  const { error } = await owner.supabase
    .from("qr_codes")
    .delete()
    .eq("id", parsed.data.id)

  if (error) {
    return { ok: false, error: "Impossible de supprimer le QR code." }
  }

  revalidatePath("/dashboard/qr")
  return { ok: true, data: undefined }
}
