import { z } from "zod"
import { HEX_COLOR_REGEX } from "@/lib/constants"

const labelSchema = z
  .string({ required_error: "Le libellé est requis." })
  .trim()
  .min(1, "Le libellé est requis.")
  .max(80, "Au maximum 80 caractères.")

const targetUrlSchema = z
  .string({ required_error: "L'URL est requise." })
  .trim()
  .min(1, "L'URL est requise.")
  .max(2048, "URL trop longue.")
  .refine((v) => {
    try {
      const u = new URL(v)
      return u.protocol === "http:" || u.protocol === "https:"
    } catch {
      return false
    }
  }, "URL invalide. Doit commencer par http:// ou https://.")

const colorSchema = z
  .string()
  .regex(HEX_COLOR_REGEX, "Format de couleur invalide (attendu : #RRGGBB).")

export const createQrSchema = z.object({
  label: labelSchema,
  target_url: targetUrlSchema,
  fg_color: colorSchema.default("#0F291E"),
  bg_color: colorSchema.default("#FFFFFF")
})

export const updateQrSchema = createQrSchema.extend({
  id: z.string().uuid("Identifiant invalide.")
})

export const deleteQrSchema = z.object({
  id: z.string().uuid("Identifiant invalide.")
})

export type CreateQrInput = z.infer<typeof createQrSchema>
export type UpdateQrInput = z.infer<typeof updateQrSchema>
