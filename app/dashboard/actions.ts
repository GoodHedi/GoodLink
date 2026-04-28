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
): Promise<
  { ok: true; username: string; workspaceId: string } | { ok: false }
> {
  const { data: page } = await supabase
    .from("pages")
    .select("username, workspace_id")
    .eq("id", pageId)
    .maybeSingle()
  if (!page) return { ok: false }

  // Membre éditeur ou owner du workspace ?
  const { data: m } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", page.workspace_id)
    .eq("user_id", userId)
    .maybeSingle()
  if (!m || (m.role !== "owner" && m.role !== "editor")) {
    return { ok: false }
  }

  return {
    ok: true,
    username: page.username,
    workspaceId: page.workspace_id
  }
}

async function canEditWorkspace(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  workspaceId: string
): Promise<boolean> {
  const { data: m } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle()
  return Boolean(m && (m.role === "owner" || m.role === "editor"))
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
  workspaceId: string,
  input: CreatePageInput
): Promise<ActionResult<Page>> {
  const owner = await getOwner()
  if (!owner) return UNAUTHENTICATED as ActionResult<Page>

  // Édit-droits dans CE workspace ?
  if (!(await canEditWorkspace(owner.supabase, owner.userId, workspaceId))) {
    return { ok: false, error: "Pas autorisé sur ce workspace." }
  }

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

  // Quota : max PAGE_LIMIT_FREE pages PAR WORKSPACE
  const { count } = await owner.supabase
    .from("pages")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)

  if ((count ?? 0) >= PAGE_LIMIT_FREE) {
    return {
      ok: false,
      error: `Limite de ${PAGE_LIMIT_FREE} pages atteinte sur ce workspace.`
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
      workspace_id: workspaceId,
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

export async function duplicatePageAction(
  pageId: string
): Promise<ActionResult<Page>> {
  const owner = await getOwner()
  if (!owner) return UNAUTHENTICATED as ActionResult<Page>

  const ownership = await ownsPage(owner.supabase, owner.userId, pageId)
  if (!ownership.ok) {
    return { ok: false, error: "Page introuvable." }
  }

  // Quota par workspace
  const { count } = await owner.supabase
    .from("pages")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", ownership.workspaceId)
  if ((count ?? 0) >= PAGE_LIMIT_FREE) {
    return {
      ok: false,
      error: `Limite de ${PAGE_LIMIT_FREE} pages atteinte sur ce workspace.`
    }
  }

  // Source page + ses liens
  const [sourceResult, linksResult] = await Promise.all([
    owner.supabase.from("pages").select("*").eq("id", pageId).maybeSingle(),
    owner.supabase
      .from("links")
      .select("*")
      .eq("page_id", pageId)
      .order("position", { ascending: true })
  ])
  const source = sourceResult.data
  if (!source) return { ok: false, error: "Page introuvable." }
  const sourceUsername = source.username

  // Génère un username unique : <original>-copie, -copie-2, -copie-3, ...
  // Limité à 20 chars pour respecter le check format DB.
  function buildCandidate(suffix: string): string {
    const total = `${sourceUsername}-copie${suffix}`
    if (total.length <= 20) return total
    const room = 20 - `-copie${suffix}`.length
    return `${sourceUsername.slice(0, Math.max(1, room))}-copie${suffix}`
  }

  let newUsername = ""
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = buildCandidate(attempt === 0 ? "" : `-${attempt + 1}`)
    if (!/^[a-z0-9-]{3,20}$/.test(candidate)) continue
    if (RESERVED_USERNAMES.has(candidate)) continue
    const { data: existing } = await owner.supabase
      .from("pages")
      .select("id")
      .eq("username", candidate)
      .maybeSingle()
    if (!existing) {
      newUsername = candidate
      break
    }
  }
  if (!newUsername) {
    return {
      ok: false,
      error: "Impossible de générer un pseudo unique pour la copie."
    }
  }

  // Insert nouvelle page (en brouillon par défaut, même workspace)
  const { data: newPage, error: insertErr } = await owner.supabase
    .from("pages")
    .insert({
      owner_id: owner.userId,
      workspace_id: ownership.workspaceId,
      username: newUsername,
      display_name: source.display_name,
      bio: source.bio,
      avatar_url: source.avatar_url,
      background_url: source.background_url,
      background_desktop_url: source.background_desktop_url,
      background_color: source.background_color,
      background_overlay: source.background_overlay,
      link_color: source.link_color,
      link_shape: source.link_shape,
      font_family: source.font_family,
      is_published: false
    })
    .select()
    .single()

  if (insertErr || !newPage) {
    return { ok: false, error: "Impossible de dupliquer la page." }
  }

  // Duplique les liens
  const sourceLinks = linksResult.data ?? []
  if (sourceLinks.length > 0) {
    await owner.supabase.from("links").insert(
      sourceLinks.map((l) => ({
        page_id: newPage.id,
        type: l.type,
        title: l.title,
        url: l.url,
        platform: l.platform,
        position: l.position
      }))
    )
  }

  revalidatePath("/dashboard")
  return { ok: true, data: newPage }
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
    background_overlay: parsed.data.background_overlay,
    link_color: parsed.data.link_color,
    link_shape: parsed.data.link_shape,
    font_family: parsed.data.font_family
  }

  // .select() pour vérifier qu'au moins une ligne a été mise à jour.
  // Sans ça, RLS qui bloque silencieusement renvoie 0 ligne sans erreur.
  const { data: updated, error } = await owner.supabase
    .from("pages")
    .update(update)
    .eq("id", pageId)
    .select("id")

  if (error) {
    return { ok: false, error: "Impossible de mettre à jour la page." }
  }
  if (!updated || updated.length === 0) {
    return {
      ok: false,
      error: "Mise à jour bloquée (droits insuffisants ?)."
    }
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

  if (error) {
    return { ok: false, error: "Impossible de mettre à jour le fond." }
  }

  revalidatePath(`/${ownership.username}`)
  return { ok: true, data: undefined }
}

export async function setPageBackgroundDesktopUrlAction(
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
    .update({ background_desktop_url: url })
    .eq("id", pageId)

  if (error) {
    return { ok: false, error: "Impossible de mettre à jour le fond desktop." }
  }

  revalidatePath(`/${ownership.username}`)
  return { ok: true, data: undefined }
}

export async function setPageAudioUrlAction(
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
    return { ok: false, error: "URL d'audio invalide." }
  }

  const { error } = await owner.supabase
    .from("pages")
    .update({ audio_url: url })
    .eq("id", pageId)

  if (error) {
    return { ok: false, error: "Impossible de mettre à jour l'audio." }
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
