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
    age?: string
    form?: string
  }
  needsConfirmation?: boolean
  email?: string
}

export async function signupAction(
  _prev: SignupActionState | undefined,
  formData: FormData
): Promise<SignupActionState> {
  const parsed = signupSchema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    age: formData.get("age")
  })
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error) }
  }

  const { username, email, password, age } = parsed.data
  const supabase = await createClient()

  // Pré-vérification du pseudo de compte (table accounts).
  // L'unique index DB reste l'arbitre final en cas de race.
  const { data: existing } = await supabase
    .from("accounts")
    .select("id")
    .eq("username", username)
    .maybeSingle()
  if (existing) {
    return { errors: { username: "Ce pseudo est déjà pris." } }
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, age },
      emailRedirectTo: `${siteUrl}/auth/callback`
    }
  })

  if (error) {
    return { errors: { form: humanizeAuthError(error.message) } }
  }

  // Si "Confirm email" est activé dans Supabase, signUp ne renvoie pas de
  // session : l'utilisateur doit cliquer le lien dans l'email. On lui
  // affiche un message dans la même page (aucun redirect).
  // Si désactivé, la session est ouverte tout de suite → /dashboard.
  if (!data.session) {
    return { needsConfirmation: true, email }
  }

  redirect("/dashboard")
}
