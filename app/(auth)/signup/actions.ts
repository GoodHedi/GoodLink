"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { signupSchema } from "@/lib/validations/auth"
import { fieldErrors, humanizeAuthError } from "@/lib/form"

export type SignupActionState = {
  errors?: {
    username?: string
    email?: string
    password?: string
    form?: string
  }
}

export async function signupAction(
  _prev: SignupActionState | undefined,
  formData: FormData
): Promise<SignupActionState> {
  const parsed = signupSchema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password")
  })
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error) }
  }

  const { username, email, password } = parsed.data
  const supabase = await createClient()

  // Pré-vérification du pseudo : permet de retourner un message clair.
  // L'unique index DB reste l'arbitre final en cas de race.
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle()
  if (existing) {
    return { errors: { username: "Ce pseudo est déjà pris." } }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, display_name: username }
    }
  })

  if (error) {
    return { errors: { form: humanizeAuthError(error.message) } }
  }

  // La confirmation email est désactivée dans Supabase Auth → la session
  // est ouverte immédiatement par signUp.
  redirect("/dashboard")
}
