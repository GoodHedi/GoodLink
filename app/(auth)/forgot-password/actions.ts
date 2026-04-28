"use server"

import { createClient } from "@/lib/supabase/server"
import { forgotPasswordSchema } from "@/lib/validations/auth"
import { fieldErrors, humanizeAuthError } from "@/lib/form"

export type ForgotPasswordActionState = {
  errors?: { email?: string; form?: string }
  sent?: boolean
}

export async function forgotPasswordAction(
  _prev: ForgotPasswordActionState | undefined,
  formData: FormData
): Promise<ForgotPasswordActionState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email")
  })
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error) }
  }

  const supabase = await createClient()
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: `${siteUrl}/auth/callback?next=/auth/reset-password`
    }
  )

  if (error) {
    return { errors: { form: humanizeAuthError(error.message) } }
  }

  // On retourne success même si l'email n'existe pas — ne pas leak l'existence
  // d'un compte (Supabase fait pareil par défaut).
  return { sent: true }
}
