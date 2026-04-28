"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

/**
 * Lance le flow OAuth Google.
 * Supabase renvoie une URL d'autorisation Google → on redirige le navigateur
 * dessus. Après accept, Google ramène l'utilisateur sur /auth/callback?code=...
 * qui exchange le code en session puis redirige vers /dashboard.
 */
export async function signInWithGoogleAction() {
  const supabase = await createClient()
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent"
      }
    }
  })

  if (error || !data?.url) {
    redirect(`/login?error=oauth`)
  }

  redirect(data.url)
}
