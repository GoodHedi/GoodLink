"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { getMyTier } from "@/lib/tier"
import type { AgencyCode } from "@/types/database"

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

/**
 * Génère un code agence aléatoire opaque, lisible mais non-prédictible.
 * Format : 24 chars hex regroupés en blocs de 4 séparés par "-"
 *   ex: A1B2-C3D4-E5F6-7890-1234-5678
 * 96 bits d'entropie → non brute-forçable.
 */
function generateAgencyCode(): string {
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  const hex = Array.from(bytes, (b) =>
    b.toString(16).padStart(2, "0").toUpperCase()
  ).join("")
  return hex.match(/.{1,4}/g)!.join("-")
}

const createCodeSchema = z.object({
  label: z.string().trim().max(60).default("")
})

// =====================================================================
// AGENCE — création / révocation de codes
// =====================================================================

export async function createAgencyCodeAction(input: {
  label?: string
}): Promise<ActionResult<AgencyCode>> {
  const owner = await getOwner()
  if (!owner) return UN as ActionResult<AgencyCode>

  const tier = await getMyTier()
  if (!tier?.caps.agencyCodes) {
    return {
      ok: false,
      error: "Réservé aux comptes Agence."
    }
  }

  const parsed = createCodeSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "Données invalides." }
  }

  // Re-génère jusqu'à avoir un code unique (collision quasi-impossible
  // avec 96 bits, mais sécu en double).
  let attempts = 0
  while (attempts < 5) {
    const code = generateAgencyCode()
    const { data, error } = await owner.supabase
      .from("agency_codes")
      .insert({
        agency_account_id: owner.userId,
        code,
        label: parsed.data.label
      })
      .select()
      .single()
    if (!error && data) {
      revalidatePath("/dashboard/agency")
      return { ok: true, data }
    }
    // 23505 = unique_violation (code dupliqué) → on retente
    if (error?.code !== "23505") {
      return { ok: false, error: "Impossible de créer le code." }
    }
    attempts++
  }
  return { ok: false, error: "Génération impossible, réessaye." }
}

export async function revokeAgencyCodeAction(
  codeId: string
): Promise<ActionResult<{ downgraded: number }>> {
  const owner = await getOwner()
  if (!owner) return UN as ActionResult<{ downgraded: number }>

  const tier = await getMyTier()
  if (!tier?.caps.agencyCodes) {
    return {
      ok: false,
      error: "Réservé aux comptes Agence."
    }
  }

  const { data, error } = await owner.supabase.rpc("revoke_agency_code", {
    p_code_id: codeId
  })
  if (error) {
    return { ok: false, error: "Impossible de révoquer." }
  }

  revalidatePath("/dashboard/agency")
  return { ok: true, data: { downgraded: data ?? 0 } }
}

// =====================================================================
// CLIENT — activation d'un code agence
// =====================================================================

const activateSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(8, "Code trop court.")
    .max(40, "Code trop long.")
})

export async function activateAgencyCodeAction(input: {
  code: string
}): Promise<ActionResult> {
  const owner = await getOwner()
  if (!owner) return UN

  const parsed = activateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Code invalide." }
  }

  const { error } = await owner.supabase.rpc("activate_agency_code", {
    p_code: parsed.data.code
  })
  if (error) {
    return {
      ok: false,
      error: error.message.includes("invalide")
        ? "Code invalide ou révoqué."
        : "Activation impossible."
    }
  }

  revalidatePath("/dashboard")
  return { ok: true, data: undefined }
}
