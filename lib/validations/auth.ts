import { z } from "zod"
import {
  PASSWORD_MAX,
  PASSWORD_MIN,
  RESERVED_USERNAMES,
  USERNAME_MAX,
  USERNAME_MIN,
  USERNAME_REGEX
} from "@/lib/constants"

export const usernameSchema = z
  .string({ required_error: "Le pseudo est requis." })
  .trim()
  .toLowerCase()
  .min(USERNAME_MIN, `Au moins ${USERNAME_MIN} caractères.`)
  .max(USERNAME_MAX, `Au maximum ${USERNAME_MAX} caractères.`)
  .regex(
    USERNAME_REGEX,
    "Lettres minuscules, chiffres ou tirets uniquement."
  )
  .refine(
    (u) => !RESERVED_USERNAMES.has(u),
    "Ce pseudo est réservé. Choisis-en un autre."
  )

export const emailSchema = z
  .string({ required_error: "L'email est requis." })
  .trim()
  .toLowerCase()
  .email("Email invalide.")

export const passwordSchema = z
  .string({ required_error: "Le mot de passe est requis." })
  .min(PASSWORD_MIN, `Au moins ${PASSWORD_MIN} caractères.`)
  .max(PASSWORD_MAX, `Au maximum ${PASSWORD_MAX} caractères.`)

export const signupSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string({ required_error: "Le mot de passe est requis." })
    .min(1, "Le mot de passe est requis.")
})

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
