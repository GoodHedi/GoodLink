"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import {
  pageUpdateSchema,
  createPageSchema,
  togglePagePublishedSchema,
  type CreatePageInput,
  type PageUpdateInput
} from "@/lib/validations/page"
import {
  createLinkSchema,
  deleteLinkSchema,
  reorderLinksSchema,
  updateLinkSchema,
  type CreateLinkInput,
  type UpdateLinkInput
} from "@/lib/validations/links"
import { fieldErrors } from "@/lib/form"
import { PAGE_LIMIT_FREE, RESERVED_USERNAMES } from "@/lib/constants"
import type { Link, Page, PageUpdate } from "@/types/database"

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

async function ownsPage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  pageId: string
): Promise<{ ok: true; username: string } | { ok: false }> {
  const { data } = await supabase
    .from("pages")
    .select("owner_id, username")
    .eq("id", pageId)
    .maybeSingle()
  if (!data || data.owner_id !== userId) return { ok: false }
  return { ok: true, username: data.username }
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
// PAGES
// =====================================================================

export async function createPageAction(
  input: CreatePageInput
): Promise<ActionResult<Page>> {
  const owner = await getOwner()
  if (!owner) return UNAUTHENTICATED as ActionResult<Page>

  const parsed = createPageSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: "Données invalides.",
      fieldErrors: fieldErrors(parsed.error)
    }
  }

  const { username, display_name } = parsed.data

  if (RESERVED_USERNAMES.has(username)) {
    return {
      ok: false,
      error: "Ce pseudo est réservé.",
      fieldErrors: { username: "Ce pseudo est réservé." }
    }
  }

  // Quota : max PAGE_LIMIT_FREE pages par compte free
  const { count } = await owner.supabase
    .from("pages")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", owner.userId)

  if ((count ?? 0) >= PAGE_LIMIT_FREE) {
    return {
      ok: false,
      error: `Limite de ${PAGE_LIMIT_FREE} pages atteinte sur ce plan.`
    }
  }

  // Pré-check unicité du pseudo (l'index unique reste l'arbitre final)
  const { data: existing } = await owner.supabase
    .from("pages")
    .select("id")
    .eq("username", username)
    .maybeSingle()
  if (existing) {
    return {
      ok: false,
      error: "Ce pseudo est déjà pris.",
      fieldErrors: { username: "Ce pseudo est déjà pris." }
    }
  }

  const { data, error } = await owner.supabase
    .from("pages")
    .insert({
      owner_id: owner.userId,
      username,
      display_name: display_name?.trim() || username
    })
    .select()
    .single()

  if (error || !data) {
    return { ok: false, error: "Impossible de créer la page." }
  }

  revalidatePath("/dashboard")
  return { ok: true, data }
}

export async function deletePageAction(
  pageId: string
): Promise<ActionResult> {
  const owner = await getOwner()
  if (!owner) return UNAUTHENTICATED as ActionResult

  const ownership = await ownsPage(owner.supabase, owner.userId, pageId)
  if (!ownership.ok) {
    return { ok: false, error: "Page introuvable." }
  }

  const { error } = await owner.supabase
    .from("pages")
    .delete()
    .eq("id", pageId)
    .eq("owner_id", owner.userId)

  if (error) return { ok: false, error: "Impossible de supprimer la page." }

  revalidatePath("/dashboard")
  revalidatePath(`/${ownership.username}`)
  return { ok: true, data: undefined }
}

export async function togglePagePublishedAction(
  pageId: string,
  isPublished: boolean
): Promise<ActionResult> {
  const owner = await getOwner()
  if (!owner) return UNAUTHENTICATED as ActionResult

  const parsed = togglePagePublishedSchema.safeParse({
    id: pageId,
    is_published: isPublished
  })
  if (!parsed.success) {
    return { ok: false, error: "Paramètre invalide." }
  }

  const ownership = await ownsPage(owner.supabase, owner.userId, pageId)
  if (!ownership.ok) {
    return { ok: false, error: "Page introuvable." }
  }

  const { error } = await owner.supabase
    .from("pages")
    .update({ is_published: isPublished })
    .eq("id", pageId)
    .eq("owner_id", owner.userId)

  if (error) {
    return { ok: false, error: "Impossible de mettre à jour la page." }
  }

  revalidatePath("/dashboard")
  revalidatePath(`/dashboard/pages/${pageId}`)
  revalidatePath(`/${ownership.username}`)
  return { ok: true, data: undefined }
}

export async function updatePageAction(
  pageId: string,
  input: unknown
): Promise<ActionResult> {
  const owner = await getOwner()
  if (!owner) return UNAUTHENTICATED as ActionResult

  const ownership = await ownsPage(owner.supabase, owner.userId, pageId)
  if (!ownership.ok) {
    return { ok: false, error: "Page introuvable." }
  }

  const parsed = pageUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: "Données invalides.",
      fieldErrors: fieldErrors(parsed.error)
    }
  }

  const update: PageUpdate = {
    display_name: parsed.data.display_name,
    bio: parsed.data.bio.trim() === "" ? null : parsed.data.bio,
    background_color: parsed.data.background_color,
    background_overlay: parsed.data.background_overlay
  }

  const { error } = await owner.supabase
    .from("pages")
    .update(update)
    .eq("id", pageId)
    .eq("owner_id", owner.userId)

  if (error) {
    return { ok: false, error: "Impossible de mettre à jour la page." }
  }

  revalidatePath(`/${ownership.username}`)
  return { ok: true, data: undefined }
}

export async function setPageAvatarUrlAction(
  pageId: string,
  url: string | null
): Promise<ActionResult> {
  const owner = await getOwner()
  if (!owner) return UNAUTHENTICATED as ActionResult

  const ownership = await ownsPage(owner.supabase, owner.userId, pageId)
  if (!ownership.ok) {
    return { ok: false, error: "Page introuvable." }
  }

  if (url !== null && !isAllowedStorageUrl(url)) {
    return { ok: false, error: "URL d'image invalide." }
  }

  const { error } = await owner.supabase
    .from("pages")
    .update({ avatar_url: url })
    .eq("id", pageId)
    .eq("owner_id", owner.userId)

  if (error) {
    return { ok: false, error: "Impossible de mettre à jour l'avatar." }
  }

  revalidatePath(`/${ownership.username}`)
  return { ok: true, data: undefined }
}

export async function setPageBackgroundUrlAction(
  pageId: string,
  url: string | null
): Promise<ActionResult> {
  const owner = await getOwner()
  if (!owner) return UNAUTHENTICATED as ActionResult

  const ownership = await ownsPage(owner.supabase, owner.userId, pageId)
  if (!ownership.ok) {
    return { ok: false, error: "Page introuvable." }
  }

  if (url !== null && !isAllowedStorageUrl(url)) {
    return { ok: false, error: "URL d'image invalide." }
  }

  const { error } = await owner.supabase
    .from("pages")
    .update({ background_url: url })
    .eq("id", pageId)
    .eq("owner_id", owner.userId)

  if (error) {
    return { ok: false, error: "Impossible de mettre à jour le fond." }
  }

  revalidatePath(`/${ownership.username}`)
  return { ok: true, data: undefined }
}

// =====================================================================
// LINKS (scopés par page_id)
// =====================================================================

export async function createLinkAction(
  pageId: string,
  input: CreateLinkInput
): Promise<ActionResult<Link>> {
  const owner = await getOwner()
  if (!owner) return UNAUTHENTICATED as ActionResult<Link>

  const ownership = await ownsPage(owner.supabase, owner.userId, pageId)
  if (!ownership.ok) {
    return { ok: false, error: "Page introuvable." }
  }

  const parsed = createLinkSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: "Lien invalide.",
      fieldErrors: fieldErrors(parsed.error)
    }
  }

  const { data: top } = await owner.supabase
    .from("links")
    .select("position")
    .eq("page_id", pageId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle()
  const nextPosition = (top?.position ?? -1) + 1

  // Construit l'insert selon le type (discriminated union)
  const insertPayload =
    parsed.data.type === "header"
      ? {
          page_id: pageId,
          type: "header" as const,
          title: parsed.data.title,
          url: "",
          platform: null,
          position: nextPosition
        }
      : parsed.data.type === "social"
        ? {
            page_id: pageId,
            type: "social" as const,
            title: parsed.data.title,
            url: parsed.data.url,
            platform: parsed.data.platform,
            position: nextPosition
          }
        : {
            page_id: pageId,
            type: "link" as const,
            title: parsed.data.title,
            url: parsed.data.url,
            platform: null,
            position: nextPosition
          }

  const { data, error } = await owner.supabase
    .from("links")
    .insert(insertPayload)
    .select()
    .single()

  if (error || !data) {
    return { ok: false, error: "Impossible d'ajouter le lien." }
  }

  revalidatePath(`/${ownership.username}`)
  return { ok: true, data }
}

export async function updateLinkAction(
  pageId: string,
  input: UpdateLinkInput
): Promise<ActionResult> {
  const owner = await getOwner()
  if (!owner) return UNAUTHENTICATED as ActionResult

  const ownership = await ownsPage(owner.supabase, owner.userId, pageId)
  if (!ownership.ok) {
    return { ok: false, error: "Page introuvable." }
  }

  const parsed = updateLinkSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: "Lien invalide.",
      fieldErrors: fieldErrors(parsed.error)
    }
  }

  // Update construit selon le type
  const updatePayload =
    parsed.data.type === "header"
      ? { title: parsed.data.title, url: "", platform: null }
      : parsed.data.type === "social"
        ? {
            title: parsed.data.title,
            url: parsed.data.url,
            platform: parsed.data.platform
          }
        : { title: parsed.data.title, url: parsed.data.url, platform: null }

  const { error } = await owner.supabase
    .from("links")
    .update(updatePayload)
    .eq("id", parsed.data.id)
    .eq("page_id", pageId)

  if (error) {
    return { ok: false, error: "Impossible de mettre à jour le lien." }
  }

  revalidatePath(`/${ownership.username}`)
  return { ok: true, data: undefined }
}

export async function deleteLinkAction(
  pageId: string,
  id: string
): Promise<ActionResult> {
  const owner = await getOwner()
  if (!owner) return UNAUTHENTICATED as ActionResult

  const ownership = await ownsPage(owner.supabase, owner.userId, pageId)
  if (!ownership.ok) {
    return { ok: false, error: "Page introuvable." }
  }

  const parsed = deleteLinkSchema.safeParse({ id })
  if (!parsed.success) {
    return { ok: false, error: "Identifiant invalide." }
  }

  const { error } = await owner.supabase
    .from("links")
    .delete()
    .eq("id", parsed.data.id)
    .eq("page_id", pageId)

  if (error) {
    return { ok: false, error: "Impossible de supprimer le lien." }
  }

  revalidatePath(`/${ownership.username}`)
  return { ok: true, data: undefined }
}

export async function reorderLinksAction(
  pageId: string,
  ids: string[]
): Promise<ActionResult> {
  const owner = await getOwner()
  if (!owner) return UNAUTHENTICATED as ActionResult

  const ownership = await ownsPage(owner.supabase, owner.userId, pageId)
  if (!ownership.ok) {
    return { ok: false, error: "Page introuvable." }
  }

  const parsed = reorderLinksSchema.safeParse({ ids })
  if (!parsed.success) {
    return { ok: false, error: "Liste invalide." }
  }

  const { data: own } = await owner.supabase
    .from("links")
    .select("id")
    .eq("page_id", pageId)

  const ownIds = new Set(own?.map((l) => l.id) ?? [])
  for (const id of parsed.data.ids) {
    if (!ownIds.has(id)) return { ok: false, error: "Liste invalide." }
  }

  const updates = parsed.data.ids.map((id, index) =>
    owner.supabase
      .from("links")
      .update({ position: index })
      .eq("id", id)
      .eq("page_id", pageId)
  )

  const results = await Promise.all(updates)
  if (results.some((r) => r.error)) {
    return { ok: false, error: "Impossible de réordonner les liens." }
  }

  revalidatePath(`/${ownership.username}`)
  return { ok: true, data: undefined }
}
