"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { getMyTier } from "@/lib/tier"
import type { ShareRole } from "@/types/database"

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string }

const UN: ActionResult<never> = { ok: false, error: "Tu dois être connecté." }

async function getOwner() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null
  return { supabase, userId: user.id }
}

const shareSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(20)
    .regex(/^[a-z0-9-]+$/, "Pseudo invalide."),
  role: z.enum(["viewer", "editor"]).default("viewer")
})

/**
 * Trouve un utilisateur par username (handle visible publiquement via
 * accounts.username). Retourne son auth.users.id, ou null si introuvable.
 */
async function resolveUsernameToUserId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  username: string
): Promise<string | null> {
  const { data } = await supabase
    .from("accounts")
    .select("id")
    .eq("username", username)
    .maybeSingle()
  return data?.id ?? null
}

// =====================================================================
// PAGE SHARES
// =====================================================================

export async function sharePageAction(
  pageId: string,
  input: { username: string; role?: ShareRole }
): Promise<ActionResult> {
  const owner = await getOwner()
  if (!owner) return UN

  const tier = await getMyTier()
  if (!tier?.caps.sharing) {
    return {
      ok: false,
      error: "Le partage est réservé aux comptes Pro et supérieurs."
    }
  }

  const parsed = shareSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "Données invalides." }
  }

  // Le partageur doit être membre owner/editor du workspace de la page
  const { data: page } = await owner.supabase
    .from("pages")
    .select("workspace_id")
    .eq("id", pageId)
    .maybeSingle()
  if (!page) return { ok: false, error: "Page introuvable." }

  const { data: m } = await owner.supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", page.workspace_id)
    .eq("user_id", owner.userId)
    .maybeSingle()
  if (!m || (m.role !== "owner" && m.role !== "editor")) {
    return { ok: false, error: "Pas autorisé sur cette page." }
  }

  const recipientId = await resolveUsernameToUserId(
    owner.supabase,
    parsed.data.username
  )
  if (!recipientId) {
    return { ok: false, error: "Aucun utilisateur avec ce pseudo." }
  }
  if (recipientId === owner.userId) {
    return { ok: false, error: "Tu ne peux pas te partager une page à toi-même." }
  }

  const { error } = await owner.supabase.from("page_shares").upsert(
    {
      page_id: pageId,
      shared_with_user_id: recipientId,
      shared_by_user_id: owner.userId,
      role: parsed.data.role
    },
    { onConflict: "page_id,shared_with_user_id" }
  )
  if (error) {
    return { ok: false, error: "Impossible de partager." }
  }

  revalidatePath(`/dashboard/pages/${pageId}`)
  revalidatePath("/dashboard/shared")
  return { ok: true, data: undefined }
}

export async function unsharePageAction(
  pageId: string,
  recipientUserId: string
): Promise<ActionResult> {
  const owner = await getOwner()
  if (!owner) return UN

  // Soit c'est l'owner du workspace qui retire le partage, soit le
  // destinataire qui veut s'auto-retirer.
  const { error } = await owner.supabase
    .from("page_shares")
    .delete()
    .eq("page_id", pageId)
    .eq("shared_with_user_id", recipientUserId)

  if (error) return { ok: false, error: "Impossible de retirer le partage." }

  revalidatePath(`/dashboard/pages/${pageId}`)
  revalidatePath("/dashboard/shared")
  return { ok: true, data: undefined }
}

// =====================================================================
// QR SHARES
// =====================================================================

export async function shareQrAction(
  qrId: string,
  input: { username: string; role?: ShareRole }
): Promise<ActionResult> {
  const owner = await getOwner()
  if (!owner) return UN

  const tier = await getMyTier()
  if (!tier?.caps.sharing) {
    return {
      ok: false,
      error: "Le partage est réservé aux comptes Pro et supérieurs."
    }
  }

  const parsed = shareSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "Données invalides." }
  }

  const { data: qr } = await owner.supabase
    .from("qr_codes")
    .select("workspace_id")
    .eq("id", qrId)
    .maybeSingle()
  if (!qr) return { ok: false, error: "QR introuvable." }

  const { data: m } = await owner.supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", qr.workspace_id)
    .eq("user_id", owner.userId)
    .maybeSingle()
  if (!m || (m.role !== "owner" && m.role !== "editor")) {
    return { ok: false, error: "Pas autorisé sur ce QR." }
  }

  const recipientId = await resolveUsernameToUserId(
    owner.supabase,
    parsed.data.username
  )
  if (!recipientId) {
    return { ok: false, error: "Aucun utilisateur avec ce pseudo." }
  }
  if (recipientId === owner.userId) {
    return { ok: false, error: "Tu ne peux pas te partager un QR à toi-même." }
  }

  const { error } = await owner.supabase.from("qr_shares").upsert(
    {
      qr_id: qrId,
      shared_with_user_id: recipientId,
      shared_by_user_id: owner.userId,
      role: parsed.data.role
    },
    { onConflict: "qr_id,shared_with_user_id" }
  )
  if (error) return { ok: false, error: "Impossible de partager." }

  revalidatePath("/dashboard/qr")
  revalidatePath("/dashboard/shared")
  return { ok: true, data: undefined }
}

export async function unshareQrAction(
  qrId: string,
  recipientUserId: string
): Promise<ActionResult> {
  const owner = await getOwner()
  if (!owner) return UN

  const { error } = await owner.supabase
    .from("qr_shares")
    .delete()
    .eq("qr_id", qrId)
    .eq("shared_with_user_id", recipientUserId)

  if (error) return { ok: false, error: "Impossible de retirer le partage." }

  revalidatePath("/dashboard/qr")
  revalidatePath("/dashboard/shared")
  return { ok: true, data: undefined }
}
