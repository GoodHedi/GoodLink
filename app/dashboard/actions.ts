"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { profileUpdateSchema } from "@/lib/validations/profile"
import {
  createLinkSchema,
  deleteLinkSchema,
  reorderLinksSchema,
  updateLinkSchema,
  type CreateLinkInput,
  type UpdateLinkInput
} from "@/lib/validations/links"
import { fieldErrors } from "@/lib/form"
import type { Link, ProfileUpdate } from "@/types/database"

// ---------- Envelope de retour standardisée ----------

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }

const UNAUTHENTICATED: ActionResult<never> = {
  ok: false,
  error: "Tu dois être connecté."
}

// ---------- Helpers ----------

async function getOwner() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null
  return { supabase, userId: user.id }
}

async function getUsername(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle()
  return data?.username ?? null
}

function isAllowedStorageUrl(url: string): boolean {
  try {
    const u = new URL(url)
    if (u.protocol !== "https:") return false
    return (
      u.hostname.endsWith(".supabase.co") ||
      u.hostname.endsWith(".supabase.in")
    )
  } catch {
    return false
  }
}

// =====================================================================
// PROFILE
// =====================================================================

export async function updateProfileAction(
  input: unknown
): Promise<ActionResult> {
  const owner = await getOwner()
  if (!owner) return UNAUTHENTICATED as ActionResult

  const parsed = profileUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: "Données invalides.",
      fieldErrors: fieldErrors(parsed.error)
    }
  }

  const update: ProfileUpdate = {
    display_name: parsed.data.display_name,
    bio: parsed.data.bio.trim() === "" ? null : parsed.data.bio,
    background_color: parsed.data.background_color,
    background_overlay: parsed.data.background_overlay
  }

  const { error } = await owner.supabase
    .from("profiles")
    .update(update)
    .eq("id", owner.userId)

  if (error) {
    return { ok: false, error: "Impossible de mettre à jour le profil." }
  }

  const username = await getUsername(owner.supabase, owner.userId)
  if (username) revalidatePath(`/${username}`)

  return { ok: true, data: undefined }
}

export async function setAvatarUrlAction(
  url: string | null
): Promise<ActionResult> {
  const owner = await getOwner()
  if (!owner) return UNAUTHENTICATED as ActionResult

  if (url !== null && !isAllowedStorageUrl(url)) {
    return { ok: false, error: "URL d'image invalide." }
  }

  const { error } = await owner.supabase
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", owner.userId)

  if (error) {
    return { ok: false, error: "Impossible de mettre à jour l'avatar." }
  }

  const username = await getUsername(owner.supabase, owner.userId)
  if (username) revalidatePath(`/${username}`)

  return { ok: true, data: undefined }
}

export async function setBackgroundUrlAction(
  url: string | null
): Promise<ActionResult> {
  const owner = await getOwner()
  if (!owner) return UNAUTHENTICATED as ActionResult

  if (url !== null && !isAllowedStorageUrl(url)) {
    return { ok: false, error: "URL d'image invalide." }
  }

  const { error } = await owner.supabase
    .from("profiles")
    .update({ background_url: url })
    .eq("id", owner.userId)

  if (error) {
    return { ok: false, error: "Impossible de mettre à jour le fond." }
  }

  const username = await getUsername(owner.supabase, owner.userId)
  if (username) revalidatePath(`/${username}`)

  return { ok: true, data: undefined }
}

// =====================================================================
// LINKS
// =====================================================================

export async function createLinkAction(
  input: CreateLinkInput
): Promise<ActionResult<Link>> {
  const owner = await getOwner()
  if (!owner) return UNAUTHENTICATED as ActionResult<Link>

  const parsed = createLinkSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: "Lien invalide.",
      fieldErrors: fieldErrors(parsed.error)
    }
  }

  // Position = max + 1
  const { data: top } = await owner.supabase
    .from("links")
    .select("position")
    .eq("profile_id", owner.userId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle()
  const nextPosition = (top?.position ?? -1) + 1

  const { data, error } = await owner.supabase
    .from("links")
    .insert({
      profile_id: owner.userId,
      title: parsed.data.title,
      url: parsed.data.url,
      position: nextPosition
    })
    .select()
    .single()

  if (error || !data) {
    return { ok: false, error: "Impossible d'ajouter le lien." }
  }

  const username = await getUsername(owner.supabase, owner.userId)
  if (username) revalidatePath(`/${username}`)

  return { ok: true, data }
}

export async function updateLinkAction(
  input: UpdateLinkInput
): Promise<ActionResult> {
  const owner = await getOwner()
  if (!owner) return UNAUTHENTICATED as ActionResult

  const parsed = updateLinkSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: "Lien invalide.",
      fieldErrors: fieldErrors(parsed.error)
    }
  }

  const { error } = await owner.supabase
    .from("links")
    .update({ title: parsed.data.title, url: parsed.data.url })
    .eq("id", parsed.data.id)
    .eq("profile_id", owner.userId)

  if (error) {
    return { ok: false, error: "Impossible de mettre à jour le lien." }
  }

  const username = await getUsername(owner.supabase, owner.userId)
  if (username) revalidatePath(`/${username}`)

  return { ok: true, data: undefined }
}

export async function deleteLinkAction(id: string): Promise<ActionResult> {
  const owner = await getOwner()
  if (!owner) return UNAUTHENTICATED as ActionResult

  const parsed = deleteLinkSchema.safeParse({ id })
  if (!parsed.success) {
    return { ok: false, error: "Identifiant invalide." }
  }

  const { error } = await owner.supabase
    .from("links")
    .delete()
    .eq("id", parsed.data.id)
    .eq("profile_id", owner.userId)

  if (error) {
    return { ok: false, error: "Impossible de supprimer le lien." }
  }

  const username = await getUsername(owner.supabase, owner.userId)
  if (username) revalidatePath(`/${username}`)

  return { ok: true, data: undefined }
}

export async function reorderLinksAction(
  ids: string[]
): Promise<ActionResult> {
  const owner = await getOwner()
  if (!owner) return UNAUTHENTICATED as ActionResult

  const parsed = reorderLinksSchema.safeParse({ ids })
  if (!parsed.success) {
    return { ok: false, error: "Liste invalide." }
  }

  // Vérifie que toutes les ids appartiennent bien à l'utilisateur
  const { data: ownLinks } = await owner.supabase
    .from("links")
    .select("id")
    .eq("profile_id", owner.userId)

  const ownIds = new Set(ownLinks?.map((l) => l.id) ?? [])
  for (const id of parsed.data.ids) {
    if (!ownIds.has(id)) {
      return { ok: false, error: "Liste invalide." }
    }
  }

  // Mises à jour individuelles. Pour des listes typiquement <50, c'est très rapide.
  const updates = parsed.data.ids.map((id, index) =>
    owner.supabase
      .from("links")
      .update({ position: index })
      .eq("id", id)
      .eq("profile_id", owner.userId)
  )

  const results = await Promise.all(updates)
  if (results.some((r) => r.error)) {
    return { ok: false, error: "Impossible de réordonner les liens." }
  }

  const username = await getUsername(owner.supabase, owner.userId)
  if (username) revalidatePath(`/${username}`)

  return { ok: true, data: undefined }
}
