"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { resetPasswordSchema } from "@/lib/validations/auth"
import { fieldErrors, humanizeAuthError } from "@/lib/form"

export type ResetPasswordActionState = {
  errors?: { password?: string; form?: string }
}

export async function resetPasswordAction(
  _prev: ResetPasswordActionState | undefined,
  formData: FormData
): Promise<ResetPasswordActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password")
  })
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error) }
  }

  const supabase = await createClient()

  // updateUser nécessite une session active (acquise via le lien de
  // recovery qui a transité par /auth/callback).
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) {
    return {
      errors: {
        form: "Session expirée. Recommence depuis « Mot de passe oublié »."
      }
    }
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password
  })

  if (error) {
    return { errors: { form: humanizeAuthError(error.message) } }
  }

  redirect("/dashboard")
}
