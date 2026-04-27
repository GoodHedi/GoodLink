"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { loginSchema } from "@/lib/validations/auth"
import { fieldErrors, humanizeAuthError } from "@/lib/form"

export type LoginActionState = {
  errors?: {
    email?: string
    password?: string
    form?: string
  }
}

export async function loginAction(
  _prev: LoginActionState | undefined,
  formData: FormData
): Promise<LoginActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  })
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error) }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return { errors: { form: humanizeAuthError(error.message) } }
  }

  redirect("/dashboard")
}
