import { z } from "zod"
import { LINK_TITLE_MAX, LINK_URL_MAX } from "@/lib/constants"

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

export const createLinkSchema = z.object({
  title: titleSchema,
  url: urlSchema
})

export const updateLinkSchema = z.object({
  id: z.string().uuid("Identifiant invalide."),
  title: titleSchema,
  url: urlSchema
})

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
