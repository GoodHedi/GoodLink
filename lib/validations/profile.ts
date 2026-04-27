import { z } from "zod"
import {
  BIO_MAX,
  DISPLAY_NAME_MAX,
  HEX_COLOR_REGEX
} from "@/lib/constants"

export const profileUpdateSchema = z.object({
  display_name: z
    .string({ required_error: "Le nom affiché est requis." })
    .trim()
    .min(1, "Le nom affiché est requis.")
    .max(DISPLAY_NAME_MAX, `Au maximum ${DISPLAY_NAME_MAX} caractères.`),

  bio: z
    .string()
    .trim()
    .max(BIO_MAX, `Au maximum ${BIO_MAX} caractères.`)
    .default(""),

  background_color: z
    .string()
    .regex(HEX_COLOR_REGEX, "Format de couleur invalide (attendu : #RRGGBB)."),

  background_overlay: z.coerce
    .number({ invalid_type_error: "Opacité invalide." })
    .min(0, "L'opacité doit être supérieure ou égale à 0.")
    .max(1, "L'opacité doit être inférieure ou égale à 1.")
})

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
