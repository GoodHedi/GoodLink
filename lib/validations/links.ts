import { z } from "zod"
import { LINK_TITLE_MAX, LINK_URL_MAX, SOCIAL_PLATFORMS } from "@/lib/constants"

const titleSchema = z
  .string({ required_error: "Le titre est requis." })
  .trim()
  .min(1, "Le titre est requis.")
  .max(LINK_TITLE_MAX, `Au maximum ${LINK_TITLE_MAX} caractères.`)

const urlSchema = z
  .string({ required_error: "L'URL est requise." })
  .trim()
  .min(1, "L'URL est requise.")
  .max(LINK_URL_MAX, `URL trop longue (max ${LINK_URL_MAX} caractères).`)
  .refine(isHttpUrl, "URL invalide. Doit commencer par http:// ou https://.")

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value)
    return u.protocol === "http:" || u.protocol === "https:"
  } catch {
    return false
  }
}

const socialPlatformSchema = z.enum(SOCIAL_PLATFORMS, {
  errorMap: () => ({ message: "Plateforme inconnue." })
})

// ---------- Création (discriminated union) ----------

const linkVariant = z.object({
  type: z.literal("link"),
  title: titleSchema,
  url: urlSchema
})

const headerVariant = z.object({
  type: z.literal("header"),
  title: titleSchema
})

const socialVariant = z.object({
  type: z.literal("social"),
  title: titleSchema,
  url: urlSchema,
  platform: socialPlatformSchema
})

export const createLinkSchema = z.discriminatedUnion("type", [
  linkVariant,
  headerVariant,
  socialVariant
])

// ---------- Mise à jour (id + variant) ----------

export const updateLinkSchema = z.discriminatedUnion("type", [
  linkVariant.extend({ id: z.string().uuid("Identifiant invalide.") }),
  headerVariant.extend({ id: z.string().uuid("Identifiant invalide.") }),
  socialVariant.extend({ id: z.string().uuid("Identifiant invalide.") })
])

// ---------- Suppression / réordre (inchangé) ----------

export const deleteLinkSchema = z.object({
  id: z.string().uuid("Identifiant invalide.")
})

export const reorderLinksSchema = z.object({
  ids: z
    .array(z.string().uuid("Identifiant invalide."))
    .min(1, "Liste vide.")
})

export type CreateLinkInput = z.infer<typeof createLinkSchema>
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>
export type ReorderLinksInput = z.infer<typeof reorderLinksSchema>
